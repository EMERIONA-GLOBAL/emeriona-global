import { BillingCustomer, BillingCustomerId, BillingSummary, Invoice, InvoiceAdjustment, InvoiceId } from './types';
export interface BillingCustomerRepository { get(id: BillingCustomerId): Promise<BillingCustomer | null>; save(customer: BillingCustomer): Promise<void>; }
export interface InvoiceRepository { get(id: InvoiceId): Promise<Invoice | null>; save(invoice: Invoice): Promise<void>; listByCustomer(customerId: BillingCustomerId): Promise<Invoice[]>; }
export interface InvoiceNumberPort { next(tenantId?: string): Promise<string>; }
export interface InvoiceIssuancePort { issue(invoice: Invoice): Promise<Invoice>; void(invoice: InvoiceId, reason: string): Promise<Invoice>; cancel(invoice: InvoiceId, reason: string): Promise<Invoice>; }
export interface BillingPaymentPort { applyPayment(invoiceId: InvoiceId, amount: number, currency: string, reference?: string): Promise<Invoice>; }
export interface BillingCalculationPort { calculate(invoice: Invoice): Promise<Invoice>; }
export interface BillingValidationPort { validate(invoice: Invoice): Promise<void>; }
export interface BillingQueryPort { summary(customerId: BillingCustomerId, asOf?: string): Promise<BillingSummary>; }
export interface BillingAdjustmentPort { apply(adjustment: InvoiceAdjustment): Promise<Invoice>; }
export interface BillingAuditPort { record(action: string, entityId: string, context?: Record<string, string>): Promise<void>; }
export interface BillingTelemetryPort { record(name: string, value?: number, context?: Record<string, string>): Promise<void>; }
export interface BillingActivationPolicy { isEnabled(tenantId?: string): Promise<boolean>; }