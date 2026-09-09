export type InvoiceId = string & { readonly __invoiceId: unique symbol };
export type InvoiceLineId = string & { readonly __invoiceLineId: unique symbol };
export type BillingCustomerId = string & { readonly __billingCustomerId: unique symbol };
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOIDED' | 'OVERDUE' | 'CANCELLED';
export type BillingSource = 'ORDER' | 'SUBSCRIPTION' | 'SERVICE' | 'PROJECT' | 'EVENT' | 'MANUAL' | 'ADJUSTMENT' | 'SYSTEM';
export type PaymentState = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type Money = { amount: number; currency: string };
export interface BillingCustomer { id: BillingCustomerId; tenantId?: string; accountReference: string; displayName: string; email?: string; }
export interface InvoiceLine { id: InvoiceLineId; description: string; quantity: number; unitPrice: Money; subtotal: Money; taxAmount: Money; total: Money; offeringReference?: string; }
export interface Invoice { id: InvoiceId; tenantId?: string; customerId: BillingCustomerId; invoiceNumber: string; source: BillingSource; sourceReference?: string; status: InvoiceStatus; paymentState: PaymentState; currency: string; lines: InvoiceLine[]; subtotal: Money; tax: Money; total: Money; amountPaid: Money; amountDue: Money; issuedAt?: string; dueAt?: string; voidedAt?: string; correlationId?: string; createdAt: string; }
export interface InvoiceAdjustment { invoiceId: InvoiceId; reason: string; amount: Money; type: 'CREDIT' | 'DEBIT'; reference?: string; }
export interface BillingSummary { invoiceCount: number; subtotal: Money; tax: Money; total: Money; amountPaid: Money; amountDue: Money; asOf: string; }