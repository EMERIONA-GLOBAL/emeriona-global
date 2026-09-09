export const STEP_62 = {
  name: 'Intelligent Search & Discovery Foundation',
  version: '1.0.0',
  flow: 'Query → Context → Search → Filtering → Eligibility → Ranking → Personalization → Results → Feedback → Analytics',
  providerNeutral: true,
} as const;

export type SearchStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type SearchResourceKind = 'PRODUCT' | 'SERVICE' | 'CONTENT' | 'COURSE' | 'EVENT' | 'PROJECT' | 'IDEA' | 'PAGE' | 'DOCUMENT' | 'CUSTOM';
export type SearchSource = 'INTERNAL' | 'API' | 'INTEGRATION' | 'ADMIN' | 'IMPORT';
export type FilterKind = 'TERM' | 'RANGE' | 'SET' | 'BOOLEAN' | 'DATE' | 'GEO' | 'CUSTOM';
export type RankingSource = 'TEXT' | 'POPULARITY' | 'RECENCY' | 'BUSINESS_RULE' | 'PERSONALIZATION' | 'EXPERIMENT' | 'AI' | 'HYBRID' | 'MANUAL';
export type DiscoveryResultStatus = 'ELIGIBLE' | 'RANKED' | 'SELECTED' | 'EXCLUDED' | 'EXPIRED';
export type FeedbackKind = 'VIEWED' | 'CLICKED' | 'OPENED' | 'SAVED' | 'DISMISSED' | 'CONVERTED' | 'RATED' | 'IGNORED';

export interface DiscoveryContext {
  requestId: string;
  tenantId?: string;
  customerId?: string;
  locale?: string;
  region?: string;
  channel?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface SearchQuery {
  queryId: string;
  text: string;
  context: DiscoveryContext;
  limit?: number;
  offset?: number;
  filters?: SearchFilter[];
  facets?: string[];
  resourceKinds?: SearchResourceKind[];
  personalized?: boolean;
  rankingProfile?: string;
}

export interface SearchFilter {
  field: string;
  kind: FilterKind;
  value: string | number | boolean | string[] | { min?: number; max?: number };
}

export interface SearchableResource {
  resourceId: string;
  kind: SearchResourceKind;
  title: string;
  summary?: string;
  status: SearchStatus;
  source: SearchSource;
  locale?: string;
  region?: string;
  tags?: string[];
  searchableFields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export interface SearchCandidate {
  candidateId: string;
  resourceId: string;
  textScore?: number;
  relevanceScore?: number;
  personalizationScore?: number;
  finalScore?: number;
  rankingSources?: RankingSource[];
  explainability?: string[];
  status: DiscoveryResultStatus;
}

export interface SearchResult {
  queryId: string;
  candidateId: string;
  resourceId: string;
  position: number;
  score: number;
  status: DiscoveryResultStatus;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

export interface SearchSuggestion {
  suggestionId: string;
  text: string;
  score?: number;
  source: 'HISTORY' | 'POPULAR' | 'CONTENT' | 'AI' | 'CUSTOM';
}

export interface DiscoveryFeedback {
  feedbackId: string;
  queryId: string;
  candidateId?: string;
  resourceId?: string;
  kind: FeedbackKind;
  timestamp: string;
  context: DiscoveryContext;
  metadata?: Record<string, unknown>;
}

export interface RankingRequest { query: SearchQuery; candidates: SearchCandidate[]; }
export interface EligibilityRequest { query: SearchQuery; candidates: SearchCandidate[]; }
export interface SuggestionRequest { prefix: string; context: DiscoveryContext; limit?: number; }
export interface SearchResponse { results: SearchResult[]; suggestions?: SearchSuggestion[]; total?: number; facets?: SearchResult['facets']; }

export interface SearchRepository {
  getResources(query: SearchQuery): Promise<SearchableResource[]>;
}
export interface SearchIndexPort {
  search(query: SearchQuery): Promise<SearchCandidate[]>;
  index(resource: SearchableResource): Promise<void>;
  remove(resourceId: string): Promise<void>;
}
export interface EligibilityPort { evaluate(input: EligibilityRequest): Promise<SearchCandidate[]>; }
export interface RankingPort { rank(input: RankingRequest): Promise<SearchCandidate[]>; }
export interface PersonalizationPort { personalize(query: SearchQuery, candidates: SearchCandidate[]): Promise<SearchCandidate[]>; }
export interface SuggestionPort { suggest(input: SuggestionRequest): Promise<SearchSuggestion[]>; }
export interface SearchValidationPort { validate(query: SearchQuery): Promise<void>; }
export interface DiscoveryFeedbackRepository { save(feedback: DiscoveryFeedback): Promise<void>; }
export interface DiscoveryAuditPort { record(event: Record<string, unknown>): Promise<void>; }
export interface DiscoveryTelemetryPort { emit(event: Record<string, unknown>): Promise<void>; }
export interface DiscoveryExperimentPort { resolveRankingProfile(query: SearchQuery): Promise<string | undefined>; }

const SENSITIVE = [
  'password', 'secret', 'private key', 'access token', 'refresh token', 'api key',
  'authorization', 'bearer', 'cvv', 'cvc', 'pan', 'card number'
];

export function containsSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[_-]+/g, ' ');
  return SENSITIVE.some((term) => normalized.includes(term));
}

export function validateMetadata(metadata?: Record<string, unknown>): void {
  if (!metadata) return;
  for (const key of Object.keys(metadata)) {
    if (containsSensitiveKey(key)) throw new Error(`Sensitive metadata key is not allowed: ${key}`);
  }
}

export function validateQuery(query: SearchQuery): void {
  if (!query.queryId.trim()) throw new Error('queryId is required');
  if (!query.text.trim()) throw new Error('Search text is required');
  if (query.text.length > 500) throw new Error('Search text exceeds maximum length');
  if (query.limit !== undefined && (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100)) throw new Error('limit must be an integer from 1 to 100');
  if (query.offset !== undefined && (!Number.isInteger(query.offset) || query.offset < 0)) throw new Error('offset must be a non-negative integer');
  validateMetadata(query.context.metadata);
}

export function rankCandidates(candidates: SearchCandidate[], limit = 20): SearchCandidate[] {
  return [...candidates]
    .filter((candidate) => candidate.status !== 'EXCLUDED' && candidate.status !== 'EXPIRED')
    .sort((a, b) => (b.finalScore ?? b.relevanceScore ?? b.textScore ?? 0) - (a.finalScore ?? a.relevanceScore ?? a.textScore ?? 0))
    .slice(0, limit)
    .map((candidate) => ({ ...candidate, status: 'RANKED' }));
}

export async function executeDiscovery(
  query: SearchQuery,
  deps: { index: SearchIndexPort; eligibility: EligibilityPort; ranking: RankingPort; personalization?: PersonalizationPort; suggestions?: SuggestionPort; experiment?: DiscoveryExperimentPort }
): Promise<SearchResponse> {
  validateQuery(query);
  const raw = await deps.index.search(query);
  let eligible = await deps.eligibility.evaluate({ query, candidates: raw });
  if (query.personalized && deps.personalization) eligible = await deps.personalization.personalize(query, eligible);
  const profile = deps.experiment ? await deps.experiment.resolveRankingProfile(query) : undefined;
  const ranked = profile ? await deps.ranking.rank({ query: { ...query, rankingProfile: profile }, candidates: eligible }) : await deps.ranking.rank({ query, candidates: eligible });
  const selected = rankCandidates(ranked, query.limit ?? 20);
  const results = selected.map((candidate, index) => ({
    queryId: query.queryId,
    candidateId: candidate.candidateId,
    resourceId: candidate.resourceId,
    position: index + 1,
    score: candidate.finalScore ?? candidate.relevanceScore ?? candidate.textScore ?? 0,
    status: 'SELECTED' as const,
  }));
  const suggestions = deps.suggestions ? await deps.suggestions.suggest({ prefix: query.text, context: query.context, limit: 5 }) : undefined;
  return { results, suggestions, total: results.length };
}
