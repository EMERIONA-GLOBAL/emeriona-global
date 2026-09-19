import type { D1DatabaseLike } from "../d1.js";
import type { PaymentIntent, PaymentProviderPort } from "../../../domains/src/index.js";
import type { OrderId, PaymentId, Money } from "../../../domains/src/index.js";
import { assertPaymentAmountMatchesOrder, assertPaymentTransition } from "../../../domains/src/payments-foundation.js";

async function one<T>(db: D1DatabaseLike, sql: string, values: readonly unknown[]): Promise<T | null> {
  const statement = db.prepare(sql);
  const result = await (values.length ? statement.bind(...values) : statement).all<T & Record<string, unknown>>();
  return (result.results[0] as T | undefined) ?? null;
}

/** Provider-neutral persistence adapter. It creates intents only; it never moves real money. */
export class D1ProviderNeutralPaymentAdapter implements PaymentProviderPort {
  constructor(private readonly db: D1DatabaseLike, private readonly tenantId: string, private readonly correlationId: string) {}

  async create(input: { orderId: OrderId; amount: Money }): Promise<PaymentIntent> {
    const order = await one<{ id: string; total_amount: number; currency: string; status: string }>(
      this.db,
      "SELECT id,total_amount,currency,status FROM orders WHERE id=? AND tenant_id=?",
      [input.orderId, this.tenantId],
    );
    if (!order) throw new Error("Order not found for tenant");
    if (order.status === "CANCELLED") throw new Error("Cancelled order cannot be paid");
    assertPaymentAmountMatchesOrder(input.amount, { amount: Number(order.total_amount), currency: order.currency });

    const existing = await one<{ id: string; status: PaymentIntent["status"]; amount: number; currency: string; provider_reference: string | null }>(
      this.db,
      "SELECT id,status,amount,currency,provider_reference FROM payment_intents WHERE order_id=? AND tenant_id=? AND status='CREATED' LIMIT 1",
      [input.orderId, this.tenantId],
    );
    if (existing) return { id: existing.id as PaymentId, orderId: input.orderId, amount: { amount: Number(existing.amount), currency: existing.currency }, status: existing.status, providerReference: existing.provider_reference ?? undefined };

    const id = `pay_${crypto.randomUUID()}`;
    const eventId = `pev_${crypto.randomUUID()}`;
    const revenueId = `rev_${crypto.randomUUID()}`;
    const inserted = await one<{ id: string; status: PaymentIntent["status"]; amount: number; currency: string; provider_reference: string | null }>(
      this.db,
      "INSERT INTO payment_intents (id,tenant_id,order_id,status,amount,currency) VALUES (?,?,?,?,?,?) RETURNING id,status,amount,currency,provider_reference",
      [id, this.tenantId, input.orderId, "CREATED", input.amount.amount, input.amount.currency],
    );
    if (!inserted) throw new Error("Payment intent persistence returned no row");

    await this.db.prepare("INSERT INTO payment_events (id,tenant_id,payment_intent_id,from_status,to_status,provider,correlation_id) VALUES (?,?,?,?,?,?,?)").bind(eventId, this.tenantId, id, null, "CREATED", "provider-neutral", this.correlationId).all();
    await this.db.prepare("INSERT INTO revenue_entries (id,tenant_id,order_id,payment_intent_id,amount,currency,status) VALUES (?,?,?,?,?,?,?)").bind(revenueId, this.tenantId, input.orderId, id, input.amount.amount, input.amount.currency, "PENDING").all();

    return { id: inserted.id as PaymentId, orderId: input.orderId, amount: { amount: Number(inserted.amount), currency: inserted.currency }, status: inserted.status, providerReference: undefined };
  }

  async authorize(paymentId: PaymentId): Promise<PaymentIntent> {
    const existing = await one<{ id: string; order_id: string; status: PaymentIntent["status"]; amount: number; currency: string; provider_reference: string | null }>(
      this.db,
      "SELECT id,order_id,status,amount,currency,provider_reference FROM payment_intents WHERE id=? AND tenant_id=?",
      [paymentId, this.tenantId],
    );
    if (!existing) throw new Error("Payment intent not found for tenant");
    if (existing.status === "AUTHORIZED") {
      return { id: existing.id as PaymentId, orderId: existing.order_id as OrderId, amount: { amount: Number(existing.amount), currency: existing.currency }, status: "AUTHORIZED", providerReference: existing.provider_reference ?? undefined };
    }
    if (existing.status !== "CREATED") throw new Error(`Payment intent cannot be authorized from status ${existing.status}`);

    const eventId = `pev_${crypto.randomUUID()}`;
    await this.db.prepare(
      "UPDATE payment_intents SET status='AUTHORIZED' WHERE id=? AND tenant_id=? AND status='CREATED'",
    ).bind(paymentId, this.tenantId).all();
    const updated = await one<{ id: string; order_id: string; status: PaymentIntent["status"]; amount: number; currency: string; provider_reference: string | null }>(
      this.db,
      "SELECT id,order_id,status,amount,currency,provider_reference FROM payment_intents WHERE id=? AND tenant_id=?",
      [paymentId, this.tenantId],
    );
    if (!updated || updated.status !== "AUTHORIZED") throw new Error("Payment authorization persistence failed");

    await this.db.prepare(
      "INSERT INTO payment_events (id,tenant_id,payment_intent_id,from_status,to_status,provider,correlation_id) VALUES (?,?,?,?,?,?,?)",
    ).bind(eventId, this.tenantId, paymentId, "CREATED", "AUTHORIZED", "provider-neutral", this.correlationId).all();

    return {
      id: updated.id as PaymentId,
      orderId: updated.order_id as OrderId,
      amount: { amount: Number(updated.amount), currency: updated.currency },
      status: updated.status,
      providerReference: updated.provider_reference ?? undefined,
    };
  }
  async capture(paymentId: PaymentId): Promise<PaymentIntent> {
    const existing = await one<{ id:string; order_id:string; status:PaymentIntent["status"]; amount:number; currency:string; provider_reference:string|null }>(
      this.db,"SELECT id,order_id,status,amount,currency,provider_reference FROM payment_intents WHERE id=? AND tenant_id=?",[paymentId,this.tenantId]);
    if (!existing) throw new Error("Payment intent not found for tenant");
    if (existing.status === "CAPTURED") return { id:existing.id as PaymentId, orderId:existing.order_id as OrderId, amount:{amount:Number(existing.amount),currency:existing.currency}, status:"CAPTURED", providerReference:existing.provider_reference ?? undefined };
    assertPaymentTransition(existing.status,"CAPTURED");
    const eventId=`pev_${crypto.randomUUID()}`;
    const updated=await one<{id:string;order_id:string;status:PaymentIntent["status"];amount:number;currency:string;provider_reference:string|null}>(
      this.db,
      "UPDATE payment_intents SET status='CAPTURED' WHERE id=? AND tenant_id=? AND status='AUTHORIZED' RETURNING id,order_id,status,amount,currency,provider_reference",
      [paymentId,this.tenantId]);
    if(!updated) throw new Error("Payment capture persistence failed");
    await this.db.prepare("UPDATE revenue_entries SET status='RECOGNIZED' WHERE tenant_id=? AND payment_intent_id=? AND status='PENDING'").bind(this.tenantId,paymentId).all();
    await this.db.prepare("INSERT INTO payment_events (id,tenant_id,payment_intent_id,from_status,to_status,provider,correlation_id) VALUES (?,?,?,?,?,?,?)").bind(eventId,this.tenantId,paymentId,"AUTHORIZED","CAPTURED","provider-neutral",this.correlationId).all();
    return { id:updated.id as PaymentId, orderId:updated.order_id as OrderId, amount:{amount:Number(updated.amount),currency:updated.currency}, status:updated.status, providerReference:updated.provider_reference ?? undefined };
  }
  async refund(paymentId: PaymentId): Promise<PaymentIntent> {
    const existing = await one<{ id:string; order_id:string; status:PaymentIntent["status"]; amount:number; currency:string; provider_reference:string|null }>(
      this.db,
      "SELECT id,order_id,status,amount,currency,provider_reference FROM payment_intents WHERE id=? AND tenant_id=?",
      [paymentId,this.tenantId],
    );
    if (!existing) throw new Error("Payment intent not found for tenant");
    if (existing.status === "REFUNDED") {
      return { id:existing.id as PaymentId, orderId:existing.order_id as OrderId, amount:{amount:Number(existing.amount),currency:existing.currency}, status:"REFUNDED", providerReference:existing.provider_reference ?? undefined };
    }
    assertPaymentTransition(existing.status,"REFUNDED");
    const eventId = `pev_${crypto.randomUUID()}`;
    const updated = await one<{id:string;order_id:string;status:PaymentIntent["status"];amount:number;currency:string;provider_reference:string|null}>(
      this.db,
      "UPDATE payment_intents SET status='REFUNDED',updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=? AND status='CAPTURED' RETURNING id,order_id,status,amount,currency,provider_reference",
      [paymentId,this.tenantId],
    );
    if (!updated) throw new Error("Payment refund persistence failed");
    await this.db.prepare(
      "UPDATE revenue_entries SET status='REVERSED',reversed_at=CURRENT_TIMESTAMP WHERE tenant_id=? AND payment_intent_id=? AND status='RECOGNIZED'",
    ).bind(this.tenantId,paymentId).all();
    await this.db.prepare(
      "INSERT INTO payment_events (id,tenant_id,payment_intent_id,from_status,to_status,provider,correlation_id) VALUES (?,?,?,?,?,?,?)",
    ).bind(eventId,this.tenantId,paymentId,"CAPTURED","REFUNDED","provider-neutral",this.correlationId).all();
    return { id:updated.id as PaymentId, orderId:updated.order_id as OrderId, amount:{amount:Number(updated.amount),currency:updated.currency}, status:updated.status, providerReference:updated.provider_reference ?? undefined };
  }
}

export const D1_PROVIDER_NEUTRAL_PAYMENT_VERSION = "1.0.0" as const;
