export type SettlementId = string;
export type PaymentId = string;
export type SettlementReference = string;

export type SettlementStatus =
  | 'PENDING' | 'PROCESSING' | 'PARTIALLY_SETTLED' | 'SETTLED'
  | 'FAILED' | 'DISPUTED' | 'REVERSED' | 'CANCELLED';

export type SettlementKind =
  | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT' | 'PAYOUT' | 'CHARGEBACK';

export type SettlementSource =
  | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT' | 'MANUAL' | 'EXTERNAL' | 'SYSTEM';

export interface Money { amount: number; currency: string; }
export interface SettlementParty { accountId?: string; customerAccountId?: string; merchantAccountId?: string; }
export interface SettlementContext { tenantId?: string; regionCode?: string; environment: 'development'|'staging'|'production'; correlationId?: string; requestId?: string; }
export interface SettlementRecord {
  id: SettlementId; paymentId?: PaymentId; reference: SettlementReference;
  kind: SettlementKind; source: SettlementSource; status: SettlementStatus;
  gross: Money; fees?: Money; net: Money; settledAt?: string; createdAt: string;
  party?: SettlementParty; context?: SettlementContext; externalReference?: string;
}
export interface SettlementBatch { id: string; currency: string; records: SettlementId[]; status: 'OPEN'|'PROCESSING'|'SETTLED'|'FAILED'; createdAt: string; }
export interface SettlementQuery { paymentId?: PaymentId; reference?: string; status?: SettlementStatus; from?: string; to?: string; limit?: number; }
export interface SettlementResult { settlement: SettlementRecord; status: SettlementStatus; }
