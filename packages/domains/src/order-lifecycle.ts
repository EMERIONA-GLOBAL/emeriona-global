import type { Order } from "./commerce.js";

export const ORDER_LIFECYCLE_VERSION = "1.0.0" as const;

const ALLOWED: Readonly<Record<Order["status"], readonly Order["status"][]>> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["FULFILLING", "CANCELLED"],
  FULFILLING: ["FULFILLED", "CANCELLED"],
  FULFILLED: [],
  CANCELLED: [],
};

export function assertOrderStatusTransition(from: Order["status"], to: Order["status"]): void {
  if (!ALLOWED[from].includes(to)) throw new Error(`invalid order status transition: ${from} -> ${to}`);
}

export const ORDER_LIFECYCLE = ALLOWED;
