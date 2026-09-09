export type ID = string;
export type ISODateTime = string;

export type Currency = string;
export interface Money { amount: number; currency: Currency; }

export enum RefundStatus { REQUESTED='REQUESTED', APPROVED='APPROVED', PROCESSING='PROCESSING', COMPLETED='COMPLETED', FAILED='FAILED', CANCELLED='CANCELLED', PARTIALLY_REFUNDED='PARTIALLY_REFUNDED', ON_HOLD='ON_HOLD' }
export enum AdjustmentStatus { DRAFT='DRAFT', PENDING='PENDING', APPROVED='APPROVED', APPLIED='APPLIED', FAILED='FAILED', REVERSED='REVERSED', CANCELLED='CANCELLED' }
export enum RefundKind { FULL='FULL', PARTIAL='PARTIAL', GOODWILL='GOODWILL', DISPUTE_RELATED='DISPUTE_RELATED', OTHER='OTHER' }
export enum AdjustmentKind { CREDIT='CREDIT', DEBIT='DEBIT', FEE='FEE', CORRECTION='CORRECTION', ROUNDING='ROUNDING', OTHER='OTHER' }
export enum RefundSource { CUSTOMER='CUSTOMER', ADMIN='ADMIN', API='API', DISPUTE='DISPUTE', SYSTEM='SYSTEM', EXTERNAL='EXTERNAL' }
export enum AdjustmentSource { ADMIN='ADMIN', API='API', SYSTEM='SYSTEM', RECONCILIATION='RECONCILIATION', EXTERNAL='EXTERNAL' }

export interface RefundContext { tenantId: ID; paymentId?: ID; orderId?: ID; invoiceId?: ID; settlementId?: ID; disputeId?: ID; reason?: string; metadata?: Record<string,string>; }
export interface AdjustmentContext { tenantId: ID; paymentId?: ID; orderId?: ID; invoiceId?: ID; settlementId?: ID; reason?: string; metadata?: Record<string,string>; }

export interface RefundRecord { id: ID; amount: Money; status: RefundStatus; kind: RefundKind; source: RefundSource; context: RefundContext; requestedAt: ISODateTime; updatedAt: ISODateTime; paymentReference?: ID; reconciliationReference?: ID; ledgerReference?: ID; }
export interface AdjustmentRecord { id: ID; amount: Money; status: AdjustmentStatus; kind: AdjustmentKind; source: AdjustmentSource; context: AdjustmentContext; createdAt: ISODateTime; updatedAt: ISODateTime; reconciliationReference?: ID; ledgerReference?: ID; }

export interface RefundRepository { save(record: RefundRecord): Promise<void>; get(id: ID): Promise<RefundRecord | null>; }
export interface AdjustmentRepository { save(record: AdjustmentRecord): Promise<void>; get(id: ID): Promise<AdjustmentRecord | null>; }
export interface RefundPort { process(refund: RefundRecord): Promise<{success:boolean; reference?:ID; message?:string}>; }
export interface AdjustmentPort { apply(adjustment: AdjustmentRecord): Promise<{success:boolean; reference?:ID; message?:string}>; }
export interface EligibilityPort { refund(refund: RefundRecord): Promise<boolean>; adjustment(adjustment: AdjustmentRecord): Promise<boolean>; }
export interface ApprovalPort { refund(refund: RefundRecord): Promise<boolean>; adjustment(adjustment: AdjustmentRecord): Promise<boolean>; }
export interface ReconciliationPort { referenceRefund(refundId: ID, reference: ID): Promise<void>; referenceAdjustment(adjustmentId: ID, reference: ID): Promise<void>; }
export interface ValidationPort { validateRefund(refund: RefundRecord): void; validateAdjustment(adjustment: AdjustmentRecord): void; }
export interface AuditPort { record(event: string, entityId: ID, data?: Record<string,string>): Promise<void>; }
export interface TelemetryPort { metric(name: string, value?: number): void; }
export interface ActivationPolicy { refundsEnabled(tenantId: ID): boolean; adjustmentsEnabled(tenantId: ID): boolean; }

const SECRET_PATTERNS = /(password|passwd|secret|private[_ -]?key|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|cvv|cvc|pan|card[_ -]?number)/i;
export function assertSafeMetadata(metadata?: Record<string,string>): void {
  if (!metadata) return;
  for (const [key,value] of Object.entries(metadata)) {
    if (SECRET_PATTERNS.test(key) || SECRET_PATTERNS.test(value)) throw new Error('Sensitive payment/security data is not allowed in metadata');
  }
}

export function validateMoney(m: Money): void {
  if (!Number.isFinite(m.amount) || m.amount <= 0) throw new Error('Amount must be a positive finite number');
  if (!/^[A-Z]{3}$/.test(m.currency)) throw new Error('Currency must be an ISO 4217-style 3-letter code');
}

export async function requestRefund(record: RefundRecord, deps: {activation:ActivationPolicy; validation:ValidationPort; eligibility:EligibilityPort; audit:AuditPort; telemetry:TelemetryPort; repository:RefundRepository}): Promise<RefundRecord> {
  if (!deps.activation.refundsEnabled(record.context.tenantId)) throw new Error('Refunds are not activated for this tenant');
  validateMoney(record.amount); assertSafeMetadata(record.context.metadata); deps.validation.validateRefund(record);
  if (!(await deps.eligibility.refund(record))) throw new Error('Refund is not eligible');
  await deps.repository.save(record); await deps.audit.record('REFUND_REQUESTED', record.id); deps.telemetry.metric('refund.requested',1); return record;
}

export async function approveRefund(record: RefundRecord, deps:{approval:ApprovalPort; audit:AuditPort; telemetry:TelemetryPort; repository:RefundRepository}):Promise<RefundRecord>{
  if (record.status!==RefundStatus.REQUESTED && record.status!==RefundStatus.ON_HOLD) throw new Error('Refund is not awaiting approval');
  if (!(await deps.approval.refund(record))) throw new Error('Refund approval denied');
  record.status=RefundStatus.APPROVED; record.updatedAt=new Date().toISOString(); await deps.repository.save(record); await deps.audit.record('REFUND_APPROVED',record.id); deps.telemetry.metric('refund.approved',1); return record;
}

export async function processRefund(record: RefundRecord, deps:{port:RefundPort; reconciliation:ReconciliationPort; audit:AuditPort; telemetry:TelemetryPort; repository:RefundRepository}):Promise<RefundRecord>{
  if (record.status!==RefundStatus.APPROVED && record.status!==RefundStatus.PARTIALLY_REFUNDED) throw new Error('Refund is not ready for processing');
  record.status=RefundStatus.PROCESSING; record.updatedAt=new Date().toISOString(); await deps.repository.save(record);
  const result=await deps.port.process(record);
  if(!result.success){record.status=RefundStatus.FAILED; await deps.repository.save(record); await deps.audit.record('REFUND_FAILED',record.id); deps.telemetry.metric('refund.failed',1); return record;}
  record.status=RefundStatus.COMPLETED; record.paymentReference=result.reference; record.updatedAt=new Date().toISOString(); if(result.reference) await deps.reconciliation.referenceRefund(record.id,result.reference); await deps.repository.save(record); await deps.audit.record('REFUND_COMPLETED',record.id); deps.telemetry.metric('refund.completed',1); return record;
}

export async function createAdjustment(record: AdjustmentRecord, deps:{activation:ActivationPolicy; validation:ValidationPort; audit:AuditPort; telemetry:TelemetryPort; repository:AdjustmentRepository}):Promise<AdjustmentRecord>{
  if(!deps.activation.adjustmentsEnabled(record.context.tenantId)) throw new Error('Adjustments are not activated for this tenant');
  validateMoney(record.amount); assertSafeMetadata(record.context.metadata); deps.validation.validateAdjustment(record); await deps.repository.save(record); await deps.audit.record('ADJUSTMENT_CREATED',record.id); deps.telemetry.metric('adjustment.created',1); return record;
}

export async function approveAdjustment(record:AdjustmentRecord,deps:{approval:ApprovalPort;audit:AuditPort;telemetry:TelemetryPort;repository:AdjustmentRepository}):Promise<AdjustmentRecord>{
  if(record.status!==AdjustmentStatus.PENDING && record.status!==AdjustmentStatus.DRAFT) throw new Error('Adjustment is not awaiting approval');
  if(!(await deps.approval.adjustment(record))) throw new Error('Adjustment approval denied');
  record.status=AdjustmentStatus.APPROVED; record.updatedAt=new Date().toISOString(); await deps.repository.save(record); await deps.audit.record('ADJUSTMENT_APPROVED',record.id); deps.telemetry.metric('adjustment.approved',1); return record;
}

export async function applyAdjustment(record:AdjustmentRecord,deps:{port:AdjustmentPort;reconciliation:ReconciliationPort;audit:AuditPort;telemetry:TelemetryPort;repository:AdjustmentRepository}):Promise<AdjustmentRecord>{
  if(record.status!==AdjustmentStatus.APPROVED) throw new Error('Adjustment is not ready to apply');
  const result=await deps.port.apply(record);
  if(!result.success){record.status=AdjustmentStatus.FAILED; await deps.repository.save(record); await deps.audit.record('ADJUSTMENT_FAILED',record.id); deps.telemetry.metric('adjustment.failed',1); return record;}
  record.status=AdjustmentStatus.APPLIED; record.reconciliationReference=result.reference; record.updatedAt=new Date().toISOString(); if(result.reference) await deps.reconciliation.referenceAdjustment(record.id,result.reference); await deps.repository.save(record); await deps.audit.record('ADJUSTMENT_APPLIED',record.id); deps.telemetry.metric('adjustment.applied',1); return record;
}

export function cancelRefund(record:RefundRecord):RefundRecord{ if([RefundStatus.COMPLETED,RefundStatus.CANCELLED].includes(record.status)) throw new Error('Refund cannot be cancelled in its current state'); record.status=RefundStatus.CANCELLED; record.updatedAt=new Date().toISOString(); return record; }
export function reverseAdjustment(record:AdjustmentRecord):AdjustmentRecord{ if(record.status!==AdjustmentStatus.APPLIED) throw new Error('Only applied adjustments can be reversed'); record.status=AdjustmentStatus.REVERSED; record.updatedAt=new Date().toISOString(); return record; }
