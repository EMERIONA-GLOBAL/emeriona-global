export type BillingDocumentId = string;
export type PaymentId = string;
export type CustomerAccountId = string;
export type Money = { amount: number; currency: string };

export type PaymentStatus = 'PENDING'|'AUTHORIZED'|'PARTIALLY_PAID'|'PAID'|'FAILED'|'REFUNDED'|'CANCELLED';
export type PaymentMethodKind = 'CARD'|'BANK_TRANSFER'|'CASH'|'WALLET'|'PAYMENT_LINK'|'OTHER';
export type PaymentSource = 'CUSTOMER'|'ADMIN'|'API'|'SYSTEM'|'EXTERNAL';
export type RefundStatus = 'REQUESTED'|'APPROVED'|'PROCESSING'|'COMPLETED'|'FAILED'|'CANCELLED';

export interface PaymentMethodReference { id: string; kind: PaymentMethodKind; label?: string; }
export interface PaymentRecord {
  id: PaymentId; customerAccountId: CustomerAccountId; billingDocumentId?: BillingDocumentId;
  amount: Money; status: PaymentStatus; source: PaymentSource; method?: PaymentMethodReference;
  providerReference?: string; externalReference?: string; occurredAt: string; createdAt: string; metadata?: Record<string, unknown>;
}
export interface PaymentApplication { paymentId: PaymentId; billingDocumentId: BillingDocumentId; amount: Money; appliedAt: string; }
export interface RefundRecord { id: string; paymentId: PaymentId; amount: Money; status: RefundStatus; reason: string; externalReference?: string; createdAt: string; }
export interface PaymentContext { customerAccountId?: CustomerAccountId; tenantId?: string; currency?: string; }
export interface PaymentRequest { customerAccountId: CustomerAccountId; billingDocumentId?: BillingDocumentId; amount: Money; method?: PaymentMethodReference; source: PaymentSource; idempotencyKey?: string; metadata?: Record<string, unknown>; }
