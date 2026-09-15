/** C3 payment and revenue invariants: provider-neutral, idempotent, auditable and safe for future real providers. */
import type { Money, OrderId, PaymentId } from "./commerce.js";

export const PAYMENTS_FOUNDATION_VERSION = "1.1.0" as const;
export const PAYMENT_USE_CASE_IDS = { intentCreate: "payment.intent.create" } as const;
export type PaymentUseCaseId = (typeof PAYMENT_USE_CASE_IDS)[keyof typeof PAYMENT_USE_CASE_IDS];
export type PaymentIntentStatus = "CREATED" | "AUTHORIZED" | "CAPTURED" | "REFUNDED" | "FAILED";
export interface PaymentIntentRecord { readonly id: PaymentId; readonly orderId: OrderId; readonly amount: Money; readonly status: PaymentIntentStatus; readonly providerReference?: string; }
export interface RevenueEntry { readonly id: string; readonly orderId: OrderId; readonly paymentId: PaymentId; readonly amount: Money; readonly status: "PENDING" | "RECOGNIZED" | "REVERSED"; }
export function assertPaymentAmountMatchesOrder(paymentAmount: Money, orderTotal: Money): void { if (!Number.isFinite(paymentAmount.amount) || paymentAmount.amount < 0) throw new Error("payment amount must be finite and non-negative"); if (!/^[A-Z]{3}$/.test(paymentAmount.currency)) throw new Error("payment currency must be a 3-letter uppercase code"); if (paymentAmount.currency !== orderTotal.currency) throw new Error("payment currency mismatch"); if (paymentAmount.amount !== orderTotal.amount) throw new Error("payment amount does not match order total"); }
export function assertPaymentTransition(from: PaymentIntentStatus, to: PaymentIntentStatus): void { const allowed: Record<PaymentIntentStatus, readonly PaymentIntentStatus[]> = { CREATED: ["AUTHORIZED", "FAILED"], AUTHORIZED: ["CAPTURED", "FAILED"], CAPTURED: ["REFUNDED"], REFUNDED: [], FAILED: [] }; if (!allowed[from].includes(to)) throw new Error(`invalid payment transition: ${from} -> ${to}`); }
export const PAYMENT_LIFECYCLE = { intent: ["CREATED", "AUTHORIZED", "CAPTURED", "REFUNDED", "FAILED"] as const, revenue: ["PENDING", "RECOGNIZED", "REVERSED"] as const } as const;
