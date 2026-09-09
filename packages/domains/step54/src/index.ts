/** EMERIONA GLOBAL — Step 54: Customer Support & Case Management Foundation */

export type CaseStatus = 'NEW'|'OPEN'|'PENDING_CUSTOMER'|'PENDING_INTERNAL'|'ESCALATED'|'RESOLVED'|'CLOSED'|'CANCELLED';
export type CasePriority = 'LOW'|'NORMAL'|'HIGH'|'URGENT';
export type CaseKind = 'QUESTION'|'REQUEST'|'INCIDENT'|'COMPLAINT'|'REFUND_HELP'|'PAYMENT_HELP'|'ACCOUNT_HELP'|'TECHNICAL'|'OTHER';
export type CaseSource = 'CUSTOMER'|'ADMIN'|'API'|'SYSTEM'|'EMAIL'|'CHAT'|'FORM'|'INTEGRATION';
export type CaseAction = 'CREATE'|'ASSIGN'|'REASSIGN'|'REPLY'|'ADD_NOTE'|'ESCALATE'|'RESOLVE'|'REOPEN'|'CLOSE'|'CANCEL';
export type AssignmentStatus = 'UNASSIGNED'|'ASSIGNED'|'QUEUED'|'ESCALATED';
export type SlaStatus = 'NOT_STARTED'|'RUNNING'|'AT_RISK'|'BREACHED'|'PAUSED'|'MET';
export type MessageVisibility = 'CUSTOMER'|'INTERNAL';
export type CaseResolution = 'ANSWERED'|'FIXED'|'REFUNDED'|'ESCALATED'|'DUPLICATE'|'NOT_REPRODUCIBLE'|'NO_ACTION'|'OTHER';

export interface CaseMoney { amount: number; currency: string; }
export interface SupportActorRef { actorId: string; actorType: 'CUSTOMER'|'AGENT'|'ADMIN'|'SYSTEM'|'INTEGRATION'; }
export interface SupportReference { type: 'ORDER'|'PAYMENT'|'INVOICE'|'SUBSCRIPTION'|'REFUND'|'DISPUTE'|'PAYOUT'|'REFERRAL'|'LOYALTY'|'ACCOUNT'|'OTHER'; id: string; }
export interface CaseRecord {
  id: string; tenantId: string; customerId?: string; subject: string; description: string;
  kind: CaseKind; source: CaseSource; status: CaseStatus; priority: CasePriority;
  assignment: AssignmentStatus; assignedTo?: string; queueId?: string;
  references: SupportReference[]; sla?: { policyId: string; status: SlaStatus; dueAt?: string };
  resolution?: CaseResolution; createdAt: string; updatedAt: string;
}
export interface CaseMessage { id: string; caseId: string; author: SupportActorRef; visibility: MessageVisibility; body: string; createdAt: string; }
export interface CaseEvent { id: string; caseId: string; action: CaseAction; actor: SupportActorRef; at: string; }
export interface CaseQuery { tenantId: string; customerId?: string; status?: CaseStatus; priority?: CasePriority; assignedTo?: string; limit?: number; }
export interface CaseResult { case: CaseRecord; messages: CaseMessage[]; events: CaseEvent[]; }

export interface CaseRepository { create(record: CaseRecord): Promise<void>; update(record: CaseRecord): Promise<void>; get(id: string, tenantId: string): Promise<CaseRecord|null>; query(query: CaseQuery): Promise<CaseRecord[]>; }
export interface CaseMessageRepository { add(message: CaseMessage): Promise<void>; list(caseId: string, tenantId: string): Promise<CaseMessage[]>; }
export interface CaseEventRepository { append(event: CaseEvent): Promise<void>; list(caseId: string, tenantId: string): Promise<CaseEvent[]>; }
export interface CaseAssignmentPort { assign(caseId: string, assigneeId: string, tenantId: string): Promise<void>; unassign(caseId: string, tenantId: string): Promise<void>; }
export interface CaseRoutingPort { route(record: CaseRecord): Promise<{queueId: string}>; }
export interface CaseSlaPort { start(caseId: string, tenantId: string): Promise<void>; pause(caseId: string, tenantId: string): Promise<void>; resume(caseId: string, tenantId: string): Promise<void>; }
export interface CaseResolutionPort { resolve(caseId: string, resolution: CaseResolution, tenantId: string): Promise<void>; reopen(caseId: string, tenantId: string): Promise<void>; }
export interface CaseValidationPort { validateCreate(record: CaseRecord): void; validateMessage(message: CaseMessage): void; }
export interface CaseAuditPort { record(event: CaseEvent): Promise<void>; }
export interface CaseTelemetryPort { record(name: string, attributes?: Record<string,string|number|boolean>): Promise<void>; }
export interface CaseActivationPolicy { isEnabled(tenantId: string, environment: 'development'|'staging'|'production'): boolean; }

const SECRET_PATTERNS = /(password|passwd|secret|private[ _-]?key|access[ _-]?token|refresh[ _-]?token|api[ _-]?key|authorization|bearer|cvv|cvc|pan|card[ _-]?number)/i;
export function assertSafeText(value: string): void { if (SECRET_PATTERNS.test(value)) throw new Error('Support data contains prohibited secret-like content'); }
export function validateCase(record: CaseRecord): void {
  if (!record.id || !record.tenantId || !record.subject.trim() || !record.description.trim()) throw new Error('Invalid case');
  if (!Number.isFinite(record.subject.length) || record.subject.length > 500) throw new Error('Invalid subject length');
  assertSafeText(record.description); assertSafeText(record.subject);
  if (record.references.some(r => !r.id || SECRET_PATTERNS.test(r.id))) throw new Error('Invalid reference');
}
export function validateMessage(message: CaseMessage): void { if (!message.id || !message.caseId || !message.body.trim()) throw new Error('Invalid message'); assertSafeText(message.body); }

export async function createCase(repo: CaseRepository, audit: CaseAuditPort, telemetry: CaseTelemetryPort, record: CaseRecord): Promise<CaseRecord> {
  validateCase(record); await repo.create(record);
  const event: CaseEvent = { id: `${record.id}:created`, caseId: record.id, action: 'CREATE', actor: {actorId:'system',actorType:'SYSTEM'}, at: record.createdAt };
  await audit.record(event); await telemetry.record('support.case.created', {kind: record.kind, priority: record.priority}); return record;
}
export async function addMessage(messages: CaseMessageRepository, audit: CaseAuditPort, telemetry: CaseTelemetryPort, message: CaseMessage): Promise<void> {
  validateMessage(message); await messages.add(message);
  const event: CaseEvent = { id: `${message.id}:reply`, caseId: message.caseId, action: message.visibility === 'INTERNAL' ? 'ADD_NOTE' : 'REPLY', actor: message.author, at: message.createdAt };
  await audit.record(event); await telemetry.record('support.case.message_added', {visibility: message.visibility});
}

export const OWNERSHIP = Object.freeze({
  step54: ['support cases','assignment/routing boundary','SLA boundary','case messages','resolution lifecycle'],
  commerce: ['orders'], payment: ['payment state'], billing: ['invoices'], settlement: ['settlement/reconciliation'],
  payout: ['payout/disbursement'], refunds: ['refund lifecycle'], disputes: ['dispute lifecycle'],
  subscriptions: ['subscription lifecycle'], usage: ['usage/entitlements'], loyalty: ['loyalty balances'], referral: ['referral/commission'], ledger: ['accounting source of truth']
});
