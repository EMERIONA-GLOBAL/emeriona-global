/** C4 billing and settlement invariants: auditable, tenant-scoped and provider-neutral. */
import type { Money, OrderId, PaymentId } from "./commerce.js";

export const BILLING_FOUNDATION_VERSION = "1.0.0" as const;
export const BILLING_USE_CASE_IDS = {
  invoiceCreate: "invoice.create",
  settlementCreate: "settlement.create",
} as const;
export type BillingUseCaseId = (typeof BILLING_USE_CASE_IDS)[keyof typeof BILLING_USE_CASE_IDS];

export type InvoiceStatus = "ISSUED" | "VOID";
export type SettlementStatus = "PENDING" | "SETTLED" | "REVERSED";

export interface InvoiceRecord {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly orderId: OrderId;
  readonly amount: Money;
  readonly status: InvoiceStatus;
  readonly paymentId?: PaymentId;
}

export interface SettlementRecord {
  readonly id: string;
  readonly partnerId: string;
  readonly orderId: OrderId;
  readonly grossAmount: Money;
  readonly commissionAmount: Money;
  readonly netAmount: Money;
  readonly status: SettlementStatus;
}

export function assertInvoiceMatchesOrder(invoiceAmount: Money, orderTotal: Money): void {
  if (!Number.isFinite(invoiceAmount.amount) || invoiceAmount.amount < 0) throw new Error("invoice amount must be finite and non-negative");
  if (!/^[A-Z]{3}$/.test(invoiceAmount.currency)) throw new Error("invoice currency must be a 3-letter uppercase code");
  if (invoiceAmount.currency !== orderTotal.currency) throw new Error("invoice currency mismatch");
  if (invoiceAmount.amount !== orderTotal.amount) throw new Error("invoice amount does not match order total");
}

export function assertSettlementTotals(gross: Money, commission: Money, net: Money): void {
  if (gross.currency !== commission.currency || gross.currency !== net.currency) throw new Error("settlement currency mismatch");
  if (![gross.amount, commission.amount, net.amount].every(Number.isFinite) || gross.amount < 0 || commission.amount < 0 || net.amount < 0) throw new Error("settlement amounts must be finite and non-negative");
  if (commission.amount > gross.amount) throw new Error("settlement commission exceeds gross amount");
  if (Math.round((gross.amount - commission.amount) * 100) !== Math.round(net.amount * 100)) throw new Error("settlement net amount mismatch");
}

export function assertSettlementAllowed(status: string, orderStatus: string, paymentStatus: string): void {
  if (status !== "PENDING") throw new Error("settlement must start as pending");
  if (!["CONFIRMED", "FULFILLING", "FULFILLED"].includes(orderStatus)) throw new Error("order is not settlement-eligible");
  if (!["CREATED", "AUTHORIZED", "CAPTURED"].includes(paymentStatus)) throw new Error("payment is not settlement-eligible");
}

export const BILLING_LIFECYCLE = {
  invoice: ["ISSUED", "VOID"] as const,
  settlement: ["PENDING", "SETTLED", "REVERSED"] as const,
} as const;
