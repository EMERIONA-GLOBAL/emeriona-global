export type ID = string;
export type ISODate = string;

export type CustomerLifecycleStatus = 'LEAD' | 'PROSPECT' | 'CUSTOMER' | 'ACTIVE' | 'AT_RISK' | 'DORMANT' | 'CHURNED' | 'ARCHIVED';
export type RelationshipStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type SegmentStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type InteractionChannel = 'EMAIL' | 'SMS' | 'PHONE' | 'CHAT' | 'SOCIAL' | 'WEB' | 'APP' | 'IN_PERSON' | 'OTHER';
export type InteractionKind = 'INQUIRY' | 'SUPPORT' | 'PURCHASE' | 'FEEDBACK' | 'CAMPAIGN' | 'REFERRAL' | 'SUBSCRIPTION' | 'SYSTEM' | 'OTHER';
export type EngagementStatus = 'PLANNED' | 'SCHEDULED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'RESPONDED' | 'FAILED' | 'CANCELLED';
export type EngagementAction = 'CREATE' | 'SCHEDULE' | 'SEND' | 'CANCEL' | 'RETRY' | 'COMPLETE';
export type RelationshipAction = 'CREATE' | 'UPDATE' | 'PAUSE' | 'RESUME' | 'CLOSE' | 'ARCHIVE';
export type SegmentAction = 'CREATE' | 'ACTIVATE' | 'PAUSE' | 'ARCHIVE';
export type CustomerSource = 'DIRECT' | 'REFERRAL' | 'AFFILIATE' | 'CAMPAIGN' | 'IMPORT' | 'API' | 'SYSTEM' | 'OTHER';

export interface Money { amount: number; currency: string; }
export interface CustomerReference { customerId: ID; tenantId: ID; }
export interface RelationshipContext { relationshipId: ID; customer: CustomerReference; status: RelationshipStatus; lifecycle: CustomerLifecycleStatus; createdAt: ISODate; updatedAt: ISODate; }
export interface CustomerRelationship { id: ID; context: RelationshipContext; source: CustomerSource; ownerReference?: ID; segmentIds: ID[]; tags: string[]; attributes: Record<string, string | number | boolean>; }
export interface SegmentRule { field: string; operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'IN' | 'EXISTS' | 'GT' | 'GTE' | 'LT' | 'LTE'; value?: string | number | boolean | string[]; }
export interface CustomerSegment { id: ID; tenantId: ID; name: string; status: SegmentStatus; rules: SegmentRule[]; createdAt: ISODate; updatedAt: ISODate; }
export interface Interaction { id: ID; tenantId: ID; customerId: ID; channel: InteractionChannel; kind: InteractionKind; occurredAt: ISODate; subject?: string; referenceType?: string; referenceId?: ID; metadata?: Record<string, string | number | boolean>; }
export interface Engagement { id: ID; tenantId: ID; customerId: ID; channel: InteractionChannel; status: EngagementStatus; action: EngagementAction; templateReference?: ID; campaignReference?: ID; scheduledAt?: ISODate; completedAt?: ISODate; }
export interface CustomerPreference { id: ID; tenantId: ID; customerId: ID; key: string; value: string | number | boolean; source: 'CUSTOMER' | 'ADMIN' | 'SYSTEM' | 'IMPORT'; updatedAt: ISODate; }

export interface CustomerRelationshipRepository { get(id: ID): Promise<CustomerRelationship | null>; save(record: CustomerRelationship): Promise<void>; }
export interface SegmentRepository { get(id: ID): Promise<CustomerSegment | null>; save(record: CustomerSegment): Promise<void>; }
export interface InteractionRepository { save(record: Interaction): Promise<void>; list(customerId: ID): Promise<Interaction[]>; }
export interface EngagementRepository { get(id: ID): Promise<Engagement | null>; save(record: Engagement): Promise<void>; }
export interface PreferenceRepository { save(record: CustomerPreference): Promise<void>; list(customerId: ID): Promise<CustomerPreference[]>; }
export interface CustomerSegmentationPort { evaluate(customer: CustomerRelationship, segment: CustomerSegment): Promise<boolean>; }
export interface EngagementEligibilityPort { canEngage(customer: CustomerRelationship, channel: InteractionChannel): Promise<boolean>; }
export interface EngagementPort { execute(engagement: Engagement): Promise<Engagement>; }
export interface RelationshipValidationPort { validate(record: CustomerRelationship): Promise<void>; }
export interface EngagementValidationPort { validate(record: Engagement): Promise<void>; }
export interface CustomerAuditPort { record(event: { action: string; entityId: ID; tenantId: ID; at: ISODate; reference?: string }): Promise<void>; }
export interface CustomerTelemetryPort { metric(name: string, value: number, dimensions?: Record<string, string>): Promise<void>; }
export interface CustomerActivationPolicy { enabled(tenantId: ID, environment: 'development' | 'staging' | 'production'): Promise<boolean>; }
export interface EngagementEventRepository { append(event: { id: ID; engagementId: ID; action: EngagementAction; at: ISODate }): Promise<void>; }
export interface InteractionEventRepository { append(event: { id: ID; interactionId: ID; at: ISODate }): Promise<void>; }

const forbidden = /password|passwd|secret|private[_ -]?key|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|bearer|authorization|cvv|cvc|pan|card[_ -]?number/i;
export function assertSafeMetadata(metadata: Record<string, unknown> | undefined): void {
  if (!metadata) return;
  for (const key of Object.keys(metadata)) if (forbidden.test(key)) throw new Error(`Forbidden sensitive field: ${key}`);
}

export function createRelationship(input: Omit<CustomerRelationship, 'id'> & { id?: ID }): CustomerRelationship {
  if (!input.context.customer.tenantId || !input.context.customer.customerId) throw new Error('tenantId and customerId are required');
  assertSafeMetadata(input.attributes);
  return { ...input, id: input.id ?? crypto.randomUUID() };
}

export function createSegment(input: Omit<CustomerSegment, 'id' | 'createdAt' | 'updatedAt'> & { id?: ID; createdAt?: ISODate; updatedAt?: ISODate }): CustomerSegment {
  if (!input.name.trim()) throw new Error('segment name is required');
  const now = new Date().toISOString();
  return { ...input, id: input.id ?? crypto.randomUUID(), createdAt: input.createdAt ?? now, updatedAt: input.updatedAt ?? now };
}

export function createEngagement(input: Omit<Engagement, 'id'> & { id?: ID }): Engagement {
  if (!input.tenantId || !input.customerId) throw new Error('tenantId and customerId are required');
  return { ...input, id: input.id ?? crypto.randomUUID() };
}

export function transitionEngagement(record: Engagement, action: EngagementAction): Engagement {
  const next: Record<EngagementAction, EngagementStatus> = { CREATE: 'PLANNED', SCHEDULE: 'SCHEDULED', SEND: 'SENT', CANCEL: 'CANCELLED', RETRY: 'PLANNED', COMPLETE: 'RESPONDED' };
  return { ...record, action, status: next[action], completedAt: action === 'COMPLETE' ? new Date().toISOString() : record.completedAt };
}

export function isSegmentRuleMatch(value: unknown, rule: SegmentRule): boolean {
  switch (rule.operator) {
    case 'EQUALS': return value === rule.value;
    case 'NOT_EQUALS': return value !== rule.value;
    case 'CONTAINS': return typeof value === 'string' && typeof rule.value === 'string' && value.includes(rule.value);
    case 'IN': return Array.isArray(rule.value) && rule.value.includes(String(value));
    case 'EXISTS': return value !== undefined && value !== null;
    case 'GT': return typeof value === 'number' && typeof rule.value === 'number' && value > rule.value;
    case 'GTE': return typeof value === 'number' && typeof rule.value === 'number' && value >= rule.value;
    case 'LT': return typeof value === 'number' && typeof rule.value === 'number' && value < rule.value;
    case 'LTE': return typeof value === 'number' && typeof rule.value === 'number' && value <= rule.value;
  }
}
