export type PayoutId = string & { readonly __brand: 'PayoutId' };
export type PayoutBatchId = string & { readonly __brand: 'PayoutBatchId' };
export type PayoutStatus = 'DRAFT'|'PENDING'|'APPROVED'|'PROCESSING'|'PAID'|'FAILED'|'REVERSED'|'CANCELLED'|'ON_HOLD';
export type PayoutKind = 'MERCHANT'|'PARTNER'|'VENDOR'|'REFERRAL'|'REFUND'|'ADJUSTMENT'|'CUSTOM';
export type PayoutSource = 'SETTLEMENT'|'MANUAL'|'ADJUSTMENT'|'EXTERNAL'|'SYSTEM';
export interface Money { amount:number; currency:string; }
export interface BeneficiaryReference { accountId:string; providerReference?:string; }
export interface PayoutContext { tenantId?:string; actorId?:string; correlationId?:string; requestId?:string; environment?:string; }
export interface PayoutRecord { id:PayoutId; kind:PayoutKind; source:PayoutSource; beneficiary:BeneficiaryReference; amount:Money; status:PayoutStatus; settlementReference?:string; externalReference?:string; scheduledAt?:string; processedAt?:string; failureReason?:string; context?:PayoutContext; createdAt:string; updatedAt:string; }
export interface PayoutInstruction { payoutId:PayoutId; idempotencyKey:string; requestedAt:string; }
export interface PayoutBatch { id:PayoutBatchId; payoutIds:PayoutId[]; status:PayoutStatus; total:Money; createdAt:string; processedAt?:string; }
export interface PayoutQuery { tenantId?:string; beneficiaryAccountId?:string; status?:PayoutStatus; from?:string; to?:string; limit?:number; }
export interface PayoutResult { payout:PayoutRecord; accepted:boolean; message?:string; }