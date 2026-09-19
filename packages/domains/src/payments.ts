/** Provider-neutral payment boundary. No real provider or money movement is activated here. */
import type { Money, OrderId, PaymentId } from "./commerce.js";

export interface PaymentIntent {
  readonly id: PaymentId;
  readonly orderId: OrderId;
  readonly amount: Money;
  readonly status: "CREATED" | "AUTHORIZED" | "CAPTURED" | "REFUNDED" | "FAILED";
  readonly providerReference?: string;
}

export interface PaymentProviderPort {
  create(input: { orderId: OrderId; amount: Money }): Promise<PaymentIntent>;
  authorize(paymentId: PaymentId): Promise<PaymentIntent>;
  capture(paymentId: PaymentId): Promise<PaymentIntent>;
  refund(paymentId: PaymentId, amount?: Money): Promise<PaymentIntent>;
  status(paymentId: PaymentId): Promise<PaymentIntent>;
}

export interface BillingPort {
  createInvoice(input: { orderId: OrderId; amount: Money }): Promise<{ invoiceId: string; status: "ISSUED" | "VOID" }>;
}

export const PAYMENTS_DOMAIN_VERSION = "1.0.0" as const;
