import type { DisputeEvidence, DisputeId, DisputeQuery, DisputeRecord, DisputeResponse, DisputeResult, PaymentId } from './types';
export interface DisputeRepository { save(dispute: DisputeRecord): Promise<void>; get(id: DisputeId): Promise<DisputeRecord | undefined>; }
export interface DisputeEvidenceRepository { save(evidence: DisputeEvidence): Promise<void>; list(disputeId: DisputeId): Promise<DisputeEvidence[]>; }
export interface DisputePort { open(dispute: DisputeRecord): Promise<DisputeResult>; respond(response: DisputeResponse): Promise<DisputeResult>; }
export interface DisputeReviewPort { review(disputeId: DisputeId): Promise<DisputeResult>; }
export interface DisputeResolutionPort { resolve(disputeId: DisputeId, status: DisputeRecord['status']): Promise<DisputeResult>; }
export interface DisputeQueryPort { query(query: DisputeQuery): Promise<DisputeRecord[]>; byPayment(paymentId: PaymentId): Promise<DisputeRecord[]>; }
export interface DisputeValidationPort { validate(dispute: DisputeRecord): void; validateResponse(response: DisputeResponse): void; }
export interface DisputeAuditPort { record(action: string, dispute: DisputeRecord | DisputeResponse): Promise<void>; }
export interface DisputeTelemetryPort { record(name: string, data: Record<string, unknown>): Promise<void>; }
export interface DisputeActivationPolicy { isEnabled(context?: { tenantId?: string }): Promise<boolean>; }