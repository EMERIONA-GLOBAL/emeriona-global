export type DisputeId = string;
export type PaymentId = string;
export type SettlementReference = string;
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESPONDED' | 'WON' | 'LOST' | 'PARTIALLY_WON' | 'CLOSED' | 'CANCELLED';
export type DisputeKind = 'CHARGEBACK' | 'PAYMENT_DISPUTE' | 'REFUND_DISPUTE' | 'SERVICE_DISPUTE' | 'OTHER';
export type DisputeSource = 'PAYMENT_PROVIDER' | 'CUSTOMER' | 'ADMIN' | 'API' | 'EXTERNAL' | 'SYSTEM';
export type DisputeAction = 'OPEN' | 'RESPOND' | 'ACCEPT' | 'CONTEST' | 'WITHDRAW' | 'CLOSE' | 'CANCEL';
export interface Money { amount: number; currency: string; }
export interface DisputeParty { id: string; role: 'CUSTOMER' | 'MERCHANT' | 'PARTNER' | 'PROVIDER' | 'OTHER'; }
export interface DisputeContext { tenantId?: string; correlationId?: string; requestId?: string; source: DisputeSource; }
export interface DisputeRecord { id: DisputeId; paymentId: PaymentId; kind: DisputeKind; status: DisputeStatus; amount: Money; reasonCode: string; source: DisputeSource; parties: DisputeParty[]; settlementReference?: SettlementReference; externalReference?: string; openedAt: string; updatedAt: string; closedAt?: string; metadata?: Record<string, unknown>; }
export interface DisputeEvidence { id: string; disputeId: DisputeId; kind: 'DOCUMENT' | 'MESSAGE' | 'TRANSACTION' | 'SERVICE' | 'OTHER'; reference: string; submittedAt: string; }
export interface DisputeResponse { disputeId: DisputeId; action: DisputeAction; note?: string; evidenceIds?: string[]; actorId?: string; occurredAt: string; }
export interface DisputeQuery { tenantId?: string; paymentId?: PaymentId; status?: DisputeStatus; kind?: DisputeKind; limit?: number; }
export interface DisputeResult { dispute?: DisputeRecord; accepted: boolean; reason?: string; }