import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
import type { InvoiceRecord, SettlementRecord } from "../../domains/src/billing-foundation.js";

export interface CreateInvoiceInput { orderId: string; paymentIntentId: string; amount: { amount: number; currency: string }; }
export interface CreateSettlementInput { orderId: string; partnerId: string; grossAmount: { amount: number; currency: string }; commissionAmount: { amount: number; currency: string }; netAmount: { amount: number; currency: string }; }
export interface BillingPort { createInvoice(input: CreateInvoiceInput): Promise<InvoiceRecord>; createSettlement(input: CreateSettlementInput): Promise<SettlementRecord>; }
function response<T>(request: UseCaseRequest<unknown>, output: T): UseCaseResponse<T> { return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output }; }
function required(value: string, field: string): string { if (!value?.trim()) throw new Error(`${field} is required`); return value.trim(); }

export class CreateInvoiceHandler implements UseCaseHandler<CreateInvoiceInput, InvoiceRecord> {
  constructor(private readonly billing: BillingPort) {}
  async handle(request: UseCaseRequest<CreateInvoiceInput>): Promise<UseCaseResponse<InvoiceRecord>> {
    const input = { ...request.input, orderId: required(request.input.orderId, "orderId"), paymentIntentId: required(request.input.paymentIntentId, "paymentIntentId") };
    return response(request, await this.billing.createInvoice(input));
  }
}
export class CreateSettlementHandler implements UseCaseHandler<CreateSettlementInput, SettlementRecord> {
  constructor(private readonly billing: BillingPort) {}
  async handle(request: UseCaseRequest<CreateSettlementInput>): Promise<UseCaseResponse<SettlementRecord>> {
    const input = { ...request.input, orderId: required(request.input.orderId, "orderId"), partnerId: required(request.input.partnerId, "partnerId") };
    return response(request, await this.billing.createSettlement(input));
  }
}
export const BILLING_APPLICATION_VERSION = "1.0.0" as const;
