export type UUID = string;
export type ISODateTime = string;

export enum CampaignStatus { DRAFT='DRAFT', SCHEDULED='SCHEDULED', ACTIVE='ACTIVE', PAUSED='PAUSED', COMPLETED='COMPLETED', CANCELLED='CANCELLED', ARCHIVED='ARCHIVED' }
export enum CampaignKind { BROADCAST='BROADCAST', LIFECYCLE='LIFECYCLE', TRANSACTIONAL_REFERENCE='TRANSACTIONAL_REFERENCE', REENGAGEMENT='REENGAGEMENT', EDUCATIONAL='EDUCATIONAL', PROMOTIONAL='PROMOTIONAL', CUSTOM='CUSTOM' }
export enum AudienceStatus { DRAFT='DRAFT', READY='READY', ACTIVE='ACTIVE', PAUSED='PAUSED', ARCHIVED='ARCHIVED' }
export enum AudienceSource { SEGMENT='SEGMENT', CRM='CRM', IMPORT='IMPORT', RULE='RULE', MANUAL='MANUAL', SYSTEM='SYSTEM' }
export enum CampaignAction { CREATE='CREATE', SCHEDULE='SCHEDULE', ACTIVATE='ACTIVATE', PAUSE='PAUSE', RESUME='RESUME', COMPLETE='COMPLETE', CANCEL='CANCEL', ARCHIVE='ARCHIVE' }
export enum AudienceAction { CREATE='CREATE', ACTIVATE='ACTIVATE', PAUSE='PAUSE', ARCHIVE='ARCHIVE', REFRESH='REFRESH' }

export interface CampaignRecord { id: UUID; tenantId: UUID; name: string; kind: CampaignKind; status: CampaignStatus; audienceId?: UUID; startAt?: ISODateTime; endAt?: ISODateTime; channelRefs: UUID[]; metadata?: Record<string, string>; createdAt: ISODateTime; updatedAt: ISODateTime; }
export interface AudienceRecord { id: UUID; tenantId: UUID; name: string; source: AudienceSource; status: AudienceStatus; segmentRef?: UUID; memberCount?: number; createdAt: ISODateTime; updatedAt: ISODateTime; }
export interface CampaignContext { tenantId: UUID; actorId?: UUID; campaignId: UUID; action: CampaignAction; occurredAt: ISODateTime; correlationId: UUID; }
export interface CampaignQuery { tenantId: UUID; status?: CampaignStatus; kind?: CampaignKind; audienceId?: UUID; limit?: number; }
export interface CampaignResult { accepted: boolean; campaign?: CampaignRecord; reason?: string; }
export interface AudienceQuery { tenantId: UUID; status?: AudienceStatus; source?: AudienceSource; limit?: number; }

export interface CampaignRepository { get(id: UUID, tenantId: UUID): Promise<CampaignRecord | undefined>; save(record: CampaignRecord): Promise<void>; query(query: CampaignQuery): Promise<CampaignRecord[]>; }
export interface AudienceRepository { get(id: UUID, tenantId: UUID): Promise<AudienceRecord | undefined>; save(record: AudienceRecord): Promise<void>; query(query: AudienceQuery): Promise<AudienceRecord[]>; }
export interface CampaignAudiencePort { resolve(audienceId: UUID, tenantId: UUID): Promise<AudienceRecord | undefined>; }
export interface CampaignContentPort { validateContent(campaign: CampaignRecord): Promise<{ valid: boolean; reason?: string }>; }
export interface CampaignSchedulingPort { schedule(campaign: CampaignRecord): Promise<void>; cancel(campaignId: UUID, tenantId: UUID): Promise<void>; }
export interface CampaignActivationPolicy { isEnabled(tenantId: UUID): Promise<boolean>; }
export interface CampaignValidationPort { validate(campaign: CampaignRecord): Promise<void>; validateAudience(audience: AudienceRecord): Promise<void>; }
export interface CampaignAuditPort { record(event: string, context: CampaignContext): Promise<void>; }
export interface CampaignTelemetryPort { track(event: string, data: Record<string, string | number | boolean>): Promise<void>; }
export interface CampaignEventRepository { append(event: CampaignContext): Promise<void>; }
export interface CampaignEngagementPort { start(campaign: CampaignRecord): Promise<void>; stop(campaign: CampaignRecord): Promise<void>; }

const SECRET_PATTERN = /(password|passwd|secret|private[_-]?key|access[_-]?token|refresh[_-]?token|api[_-]?key|authorization|bearer|cvv|cvc|\bpan\b|card[_-]?number)/i;
export function rejectSensitiveMetadata(metadata?: Record<string, string>): void {
  if (!metadata) return;
  for (const [key, value] of Object.entries(metadata)) {
    if (SECRET_PATTERN.test(key) || SECRET_PATTERN.test(value)) throw new Error('Sensitive credential/payment data is not allowed.');
  }
}

export function validateCampaignShape(c: CampaignRecord): void {
  if (!c.id || !c.tenantId || !c.name.trim()) throw new Error('Campaign id, tenantId and name are required.');
  if (c.channelRefs.length === 0) throw new Error('At least one communication channel reference is required.');
  if (c.startAt && c.endAt && new Date(c.endAt).getTime() < new Date(c.startAt).getTime()) throw new Error('Campaign endAt cannot precede startAt.');
  rejectSensitiveMetadata(c.metadata);
}

export function canTransition(from: CampaignStatus, action: CampaignAction): CampaignStatus | undefined {
  const map: Record<CampaignStatus, Partial<Record<CampaignAction, CampaignStatus>>> = {
    [CampaignStatus.DRAFT]: { [CampaignAction.SCHEDULE]: CampaignStatus.SCHEDULED, [CampaignAction.ACTIVATE]: CampaignStatus.ACTIVE, [CampaignAction.CANCEL]: CampaignStatus.CANCELLED, [CampaignAction.ARCHIVE]: CampaignStatus.ARCHIVED },
    [CampaignStatus.SCHEDULED]: { [CampaignAction.ACTIVATE]: CampaignStatus.ACTIVE, [CampaignAction.CANCEL]: CampaignStatus.CANCELLED, [CampaignAction.PAUSE]: CampaignStatus.PAUSED },
    [CampaignStatus.ACTIVE]: { [CampaignAction.PAUSE]: CampaignStatus.PAUSED, [CampaignAction.COMPLETE]: CampaignStatus.COMPLETED, [CampaignAction.CANCEL]: CampaignStatus.CANCELLED },
    [CampaignStatus.PAUSED]: { [CampaignAction.RESUME]: CampaignStatus.ACTIVE, [CampaignAction.CANCEL]: CampaignStatus.CANCELLED, [CampaignAction.COMPLETE]: CampaignStatus.COMPLETED },
    [CampaignStatus.COMPLETED]: { [CampaignAction.ARCHIVE]: CampaignStatus.ARCHIVED },
    [CampaignStatus.CANCELLED]: { [CampaignAction.ARCHIVE]: CampaignStatus.ARCHIVED },
    [CampaignStatus.ARCHIVED]: {}
  };
  return map[from][action];
}

export async function transitionCampaign(campaign: CampaignRecord, context: CampaignContext, deps: { validation: CampaignValidationPort; activation: CampaignActivationPolicy; audit: CampaignAuditPort; telemetry: CampaignTelemetryPort; events: CampaignEventRepository; scheduling?: CampaignSchedulingPort; engagement?: CampaignEngagementPort; }): Promise<CampaignRecord> {
  const next = canTransition(campaign.status, context.action);
  if (!next) throw new Error(`Invalid campaign transition: ${campaign.status} -> ${context.action}`);
  validateCampaignShape(campaign);
  await deps.validation.validate(campaign);
  if (context.action === CampaignAction.ACTIVATE || context.action === CampaignAction.SCHEDULE) {
    if (!(await deps.activation.isEnabled(campaign.tenantId))) throw new Error('Campaign activation is disabled for this tenant.');
  }
  const updated: CampaignRecord = { ...campaign, status: next, updatedAt: context.occurredAt };
  if (context.action === CampaignAction.ACTIVATE && deps.engagement) await deps.engagement.start(updated);
  if (context.action === CampaignAction.PAUSE && deps.engagement) await deps.engagement.stop(updated);
  if (context.action === CampaignAction.SCHEDULE && deps.scheduling) await deps.scheduling.schedule(updated);
  if (context.action === CampaignAction.CANCEL && deps.scheduling) await deps.scheduling.cancel(updated.id, updated.tenantId);
  await deps.events.append(context); await deps.audit.record('campaign.lifecycle', context); await deps.telemetry.track('campaign.lifecycle', { action: context.action, status: next, tenantId: campaign.tenantId });
  return updated;
}

export function describeBoundary(): string { return 'Step 57 owns campaign lifecycle, audience orchestration references, scheduling/activation boundaries and campaign engagement coordination; it does not own identity, support cases, loyalty, promotions, notifications delivery, message transport, analytics, consent, orders, billing, payment, settlement, payout, disputes, refunds, subscriptions, usage or accounting.'; }
