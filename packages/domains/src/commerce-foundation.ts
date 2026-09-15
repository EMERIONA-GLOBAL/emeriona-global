/** C1 commercial domain invariants: one provider-neutral contract for the commerce lifecycle. */
import type { Money, Order, PaymentTransaction, Cart, Fulfillment } from "./commerce.js";

export const COMMERCE_FOUNDATION_VERSION = "1.0.0" as const;

export const COMMERCE_USE_CASE_IDS = {
  catalogCreate: "catalog.create",
  productCreate: "product.create",
  serviceCreate: "service.create",
  cartCreate: "cart.create",
  cartItemAdd: "cart.item.add",
  checkoutExecute: "checkout.execute",
  orderCreate: "order.create",
  paymentIntentCreate: "payment.intent.create",
} as const;

export type CommerceUseCaseId = (typeof COMMERCE_USE_CASE_IDS)[keyof typeof COMMERCE_USE_CASE_IDS];

export function assertMoney(value: Money): void {
  if (!Number.isFinite(value.amount) || value.amount < 0) {
    throw new Error("money amount must be finite and non-negative");
  }
  if (!/^[A-Z]{3}$/.test(value.currency)) {
    throw new Error("money currency must be a 3-letter uppercase code");
  }
}

export function assertSameCurrency(left: Money, right: Money): void {
  assertMoney(left);
  assertMoney(right);
  if (left.currency !== right.currency) {
    throw new Error("currency mismatch");
  }
}

export function assertOrderTotal(order: Order): void {
  assertMoney(order.total);
}

export function assertPaymentMatchesOrder(payment: PaymentTransaction, order: Order): void {
  if (payment.orderId !== order.id) throw new Error("payment order mismatch");
  assertSameCurrency(payment.amount, order.total);
}

export function assertCheckoutableCart(cart: Cart): void {
  if (cart.status !== "OPEN") throw new Error("cart is not checkoutable");
}

export function assertFulfillmentAllowed(order: Order, fulfillment: Fulfillment): void {
  if (fulfillment.orderId !== order.id) throw new Error("fulfillment order mismatch");
  if (order.status === "CANCELLED") throw new Error("cancelled order cannot be fulfilled");
}

export const COMMERCE_LIFECYCLE = {
  cart: ["OPEN", "CHECKED_OUT", "ABANDONED"] as const,
  order: ["PENDING", "CONFIRMED", "FULFILLING", "FULFILLED", "CANCELLED"] as const,
  payment: ["CREATED", "AUTHORIZED", "CAPTURED", "REFUNDED", "FAILED"] as const,
  fulfillment: ["PENDING", "IN_PROGRESS", "FULFILLED", "CANCELLED"] as const,
} as const;
