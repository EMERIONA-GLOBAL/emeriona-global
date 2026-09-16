/** C4 billing, invoicing and settlement invariants: provider-neutral and audit-ready. */
import type { Money, OrderId, PaymentId } from "./commerce.js";

export const BILLING_FOUNDATION_VERSION = "1.0.1" as const;
export const BILLING_USE_CASE_IDS = { invoiceCreate: "billing.invoice.create", settlementCreate: "billing.settlement.create" } as const;
export type BillingUseCaseId = (typeof BILLING_USE_CASE_IDS)[keyof typeof BILLING_USE_CASE_IDS];
export type InvoiceStatus = "ISSUED" | "VOID";
export type SettlementStatus = "PENDING" | "SETTLED" | "REVERSED";
export interface InvoiceRecord { readonly id: string; readonly orderId: OrderId; readonly paymentIntentId: PaymentId; readonly number: string; readonly amount: Money; readonly status: InvoiceStatus; }
export interface SettlementRecord { readonly id: string; readonly orderId: OrderId; readonly partnerId: string; readonly revenueEntryId: string; readonly grossAmount: Money; readonly commissionAmount: Money; readonly netAmount: Money; readonly status: SettlementStatus; }
export function assertInvoiceAmountMatchesPayment(invoiceAmount: Money, paymentAmount: Money): void { if (!Number.isFinite(invoiceAmount.amount) || invoiceAmount.amount < 0) throw new Error("invoice amount must be finite and non-negative"); if (!/^[A-Z]{3}$/.test(invoiceAmount.currency)) throw new Error("invoice currency must be a 3-letter uppercase code"); if (invoiceAmount.currency !== paymentAmount.currency || invoiceAmount.amount !== paymentAmount.amount) throw new Error("invoice amount does not match payment intent"); }
export function assertSettlementAmounts(gross: Money, commission: Money, net: Money): void { if (![gross, commission, net].every((value) => Number.isFinite(value.amount) && value.amount >= 0)) throw new Error("settlement amounts must be finite and non-negative"); if (![gross.currency, commission.currency, net.currency].every((currency) => /^[A-Z]{3}$/.test(currency))) throw new Error("settlement currency must be a 3-letter uppercase code"); if (gross.currency !== commission.currency || gross.currency !== net.currency) throw new Error("settlement currency mismatch"); if (commission.amount > gross.amount) throw new Error("settlement commission exceeds gross amount"); if (gross.amount !== commission.amount + net.amount) throw new Error("settlement amounts do not balance"); }
export function assertSettlementOrderOwnership(orderId: OrderId, settlementOrderId: OrderId): void { if (orderId !== settlementOrderId) throw new Error("settlement order mismatch"); }
export const BILLING_LIFECYCLE = { invoice: ["ISSUED", "VOID"] as const, settlement: ["PENDING", "SETTLED", "REVERSED"] as const } as const;
