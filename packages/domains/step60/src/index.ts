export type Id = string;
export type ISODateTime = string;

export type PersonalizationStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type RecommendationStatus = 'PENDING' | 'ELIGIBLE' | 'RANKED' | 'SELECTED' | 'REJECTED' | 'EXPIRED';
export type SignalKind = 'INTEREST' | 'PREFERENCE' | 'BEHAVIOR' | 'CONTEXT' | 'ENGAGEMENT' | 'LIFECYCLE' | 'USAGE' | 'OTHER';
export type SignalSource = 'CUSTOMER' | 'SYSTEM' | 'API' | 'DEVICE' | 'INTEGRATION' | 'ADMIN';
export type RecommendationKind = 'CONTENT' | 'PRODUCT' | 'SERVICE' | 'COURSE' | 'EVENT' | 'ACTION' | 'CUSTOM';
export type RecommendationSource = 'RULE' | 'SIGNAL' | 'COLLABORATIVE' | 'CONTENT' | 'AI' | 'HYBRID' | 'MANUAL';
export type FeedbackKind = 'VIEWED' | 'CLICKED' | 'ACCEPTED' | 'DISMISSED' | 'COMPLETED' | 'CONVERTED' | 'RATED' | 'IGNORED';

export interface Money { amount: number; currency: string; }
export interface TenantContext { tenantId: Id; environment: 'development'|'staging'|'production'; locale?: string; region?: string; timezone?: string; currency?: string; }
export interface PersonalizationContext { context: TenantContext; subjectId: Id; sessionId?: Id; journeyId?: Id; campaignId?: Id; channel?: string; timestamp: ISODateTime; }
export interface PersonalizationSignal { id: Id; subjectId: Id; kind: SignalKind; source: SignalSource; key: string; value: string|number|boolean; weight?: number; occurredAt: ISODateTime; metadata?: Record<string, string|number|boolean>; }
export interface RecommendationCandidate { id: Id; subjectId: Id; kind: RecommendationKind; itemId: Id; source: RecommendationSource; baseScore?: number; eligibilityStatus?: 'PENDING'|'ELIGIBLE'|'INELIGIBLE'; expiresAt?: ISODateTime; metadata?: Record<string, string|number|boolean>; }
export interface RecommendationDecision { id: Id; candidateId: Id; subjectId: Id; status: RecommendationStatus; score: number; rank: number; reason?: string; explainability?: ExplainabilityReference; createdAt: ISODateTime; }
export interface ExplainabilityReference { code: string; factors?: string[]; policyVersion?: string; }
export interface FeedbackSignal { id: Id; subjectId: Id; recommendationId: Id; kind: FeedbackKind; value?: number; occurredAt: ISODateTime; }
export interface PersonalizationPolicy { id: Id; status: PersonalizationStatus; tenantId: Id; version: string; minScore?: number; maxResults?: number; allowedKinds?: RecommendationKind[]; }
export interface RecommendationRequest { id: Id; context: PersonalizationContext; signals: PersonalizationSignal[]; candidates: RecommendationCandidate[]; policyId?: Id; limit?: number; }

export interface PersonalizationRepository {
  savePolicy(policy: PersonalizationPolicy): Promise<void>;
  getPolicy(id: Id): Promise<PersonalizationPolicy | undefined>;
}
export interface SignalRepository {
  record(signal: PersonalizationSignal): Promise<void>;
  list(subjectId: Id, context: PersonalizationContext): Promise<PersonalizationSignal[]>;
}
export interface CandidateRepository {
  save(candidate: RecommendationCandidate): Promise<void>;
  list(request: RecommendationRequest): Promise<RecommendationCandidate[]>;
}
export interface RecommendationRepository {
  save(decision: RecommendationDecision): Promise<void>;
  list(subjectId: Id): Promise<RecommendationDecision[]>;
}
export interface EligibilityPort { evaluate(candidate: RecommendationCandidate, context: PersonalizationContext): Promise<boolean>; }
export interface ScoringPort { score(candidate: RecommendationCandidate, signals: PersonalizationSignal[], context: PersonalizationContext): Promise<number>; }
export interface RankingPort { rank(candidates: RecommendationDecision[], context: PersonalizationContext): Promise<RecommendationDecision[]>; }
export interface FeedbackPort { record(feedback: FeedbackSignal): Promise<void>; }
export interface PersonalizationModelPort { recommend(input: RecommendationRequest): Promise<RecommendationCandidate[]>; }
export interface PersonalizationValidationPort { validateRequest(request: RecommendationRequest): void; validateMetadata(metadata?: Record<string, unknown>): void; }
export interface PersonalizationActivationPolicy { isEnabled(context: TenantContext): boolean; }
export interface PersonalizationAuditPort { record(event: { action: string; subjectId?: Id; tenantId: Id; entityId?: Id }): Promise<void>; }
export interface PersonalizationTelemetryPort { metric(name: string, value: number, tags?: Record<string,string>): void; }

const forbidden = /password|secret|private.?key|access.?token|refresh.?token|api.?key|authorization|bearer|cvv|cvc|pan|card.?number/i;

export function validateMetadata(metadata?: Record<string, unknown>): void {
  if (!metadata) return;
  const walk = (value: unknown, path = ''): void => {
    if (typeof value === 'string') {
      if (forbidden.test(path) || forbidden.test(value)) throw new Error('Sensitive data is not permitted in personalization metadata');
      return;
    }
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (value && typeof value === 'object') Object.entries(value as Record<string, unknown>).forEach(([k,v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(metadata);
}

export function validateRequest(request: RecommendationRequest): void {
  if (!request.id || !request.context.context.tenantId || !request.context.subjectId) throw new Error('Request identity/context is required');
  if (!request.context.timestamp) throw new Error('Context timestamp is required');
  if (request.limit !== undefined && (!Number.isInteger(request.limit) || request.limit < 1 || request.limit > 100)) throw new Error('limit must be an integer between 1 and 100');
  request.signals.forEach(s => validateMetadata(s.metadata));
  request.candidates.forEach(c => validateMetadata(c.metadata));
}

export async function evaluateRecommendations(request: RecommendationRequest, deps: {
  eligibility: EligibilityPort; scoring: ScoringPort; ranking: RankingPort; repository: RecommendationRepository;
}): Promise<RecommendationDecision[]> {
  validateRequest(request);
  const eligible: RecommendationDecision[] = [];
  for (const candidate of request.candidates) {
    if (!(await deps.eligibility.evaluate(candidate, request.context))) continue;
    const score = await deps.scoring.score(candidate, request.signals, request.context);
    if (!Number.isFinite(score)) continue;
    eligible.push({ id: `${request.id}:${candidate.id}`, candidateId: candidate.id, subjectId: request.context.subjectId, status: 'RANKED', score, rank: 0, createdAt: request.context.timestamp });
  }
  const ranked = await deps.ranking.rank(eligible, request.context);
  const limit = request.limit ?? 10;
  const selected = ranked.slice(0, limit).map((d, i) => ({ ...d, rank: i + 1, status: 'SELECTED' as RecommendationStatus }));
  for (const decision of selected) await deps.repository.save(decision);
  return selected;
}
