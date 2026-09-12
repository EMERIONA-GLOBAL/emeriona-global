import type { CartItemInput, CartItemResult, CheckoutInput, CheckoutResult, OperationalCommercePort } from "../../../application/src/operational-commerce.js";
import type { D1DatabaseLike } from "../d1.js";

interface Row { [key: string]: unknown; }
async function all<T extends Row>(db: D1DatabaseLike, sql: string, values: readonly unknown[] = []): Promise<T[]> {
  const statement = db.prepare(sql);
  const bound = values.length ? statement.bind(...values) : statement;
  const result = await bound.all<T>();
  return result.results;
}

export class D1OperationalCommerceAdapter implements OperationalCommercePort {
  constructor(private readonly db: D1DatabaseLike) {}

  async addCartItem(input: CartItemInput & { id: string; tenantId: string }): Promise<CartItemResult> {
    const cartRows = await all<Row>(this.db, "SELECT id,currency,status FROM carts WHERE id=? AND tenant_id=?", [input.cartId, input.tenantId]);
    const cart = cartRows[0];
    if (!cart) throw new Error("Cart not found for tenant");
    if (cart.status !== "OPEN") throw new Error("Cart is not open");
    if (String(cart.currency) !== input.unitAmount.currency) throw new Error("Cart item currency must match cart currency");
    if ((input.productId ? 1 : 0) + (input.serviceId ? 1 : 0) !== 1) throw new Error("Exactly one catalog item is required");
    const catalogId = input.productId ?? input.serviceId;
    const table = input.productId ? "products" : "services";
    const exists = await all<Row>(this.db, `SELECT id FROM ${table} WHERE id=? AND tenant_id=? AND status IN ('DRAFT','PUBLISHED')`, [catalogId, input.tenantId]);
    if (!exists[0]) throw new Error("Catalog item not found for tenant");
    await all(this.db, "INSERT INTO cart_items (id,cart_id,product_id,service_id,quantity,unit_amount,currency) VALUES (?,?,?,?,?,?,?)", [input.id, input.cartId, input.productId ?? null, input.serviceId ?? null, input.quantity, input.unitAmount.amount, input.unitAmount.currency]);
    return { ...input };
  }

  async checkout(input: CheckoutInput & { orderId: string; tenantId: string }): Promise<CheckoutResult> {
    const carts = await all<Row>(this.db, "SELECT id,customer_id,status,currency FROM carts WHERE id=? AND tenant_id=?", [input.cartId, input.tenantId]);
    const cart = carts[0];
    if (!cart) throw new Error("Cart not found for tenant");
    if (cart.status !== "OPEN") throw new Error("Cart is not open");
    const items = await all<Row>(this.db, "SELECT id,product_id,service_id,quantity,unit_amount,currency FROM cart_items WHERE cart_id=? ORDER BY rowid", [input.cartId]);
    if (!items.length) throw new Error("Cannot checkout an empty cart");
    const currency = String(cart.currency);
    let total = 0;
    for (const item of items) {
      if (String(item.currency) !== currency) throw new Error("Cart contains mixed currencies");
      total += Number(item.quantity) * Number(item.unit_amount);
    }
    await all(this.db, "INSERT INTO orders (id,tenant_id,customer_id,status,total_amount,currency) VALUES (?,?,?,?,?,?)", [input.orderId, input.tenantId, String(cart.customer_id), "PENDING", total, currency]);
    for (const item of items) {
      const orderItemId = `${input.orderId}_item_${String(item.id)}`;
      await all(this.db, "INSERT INTO order_items (id,order_id,product_id,service_id,quantity,unit_amount,currency) VALUES (?,?,?,?,?,?,?)", [orderItemId, input.orderId, item.product_id ?? null, item.service_id ?? null, Number(item.quantity), Number(item.unit_amount), currency]);
    }
    await all(this.db, "UPDATE carts SET status='CHECKED_OUT',updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=? AND status='OPEN'", [input.cartId, input.tenantId]);
    return { orderId: input.orderId, cartId: input.cartId, customerId: String(cart.customer_id), total: { amount: total, currency }, itemCount: items.length };
  }
}

export const D1_OPERATIONAL_COMMERCE_VERSION = "1.0.0" as const;
