/**
 * EMERIONA GLOBAL — Step 61
 * Experimentation & Optimization Foundation v1.0
 * Provider-neutral architecture. No provider SDKs, credentials, secrets or payment data.
 */

export type ID = string;
export type ISODateTime = string;

export type ExperimentStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
export type ExperimentKind = 'AB_TEST' | 'MULTIVARIATE' | 'HOLDOUT' | 'ROLLOUT' | 'OPTIMIZATION' | 'CUSTOM';
export type VariantStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type AssignmentStatus = 'ASSIGNED' | 'EXCLUDED' | 'REASSIGNED' | 'EXPIRED';
export type MetricKind = 'CONVERSION' | 'ENGAGEMENT' | 'RETENTION' | 'REVENUE_REFERENCE' | 'USAGE' | 'QUALITY' | 'CUSTOM';
export type ExperimentAction = 'CREATE' | 'SCHEDULE' | 'START' | 'PAUSE' | 'RESUME' | 'COMPLETE' | 'CANCEL' | 'ARCHIVE';
export type FeedbackKind = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'OUTCOME' | 'ERROR';

export interface ExperimentContext {
  tenantId: ID;
  environment: 'development' | 'staging' | 'production';
  locale?: string;
  region?: string;
  timezone?: string;
  actorId?: ID;
  correlationId?: ID;
}

export interface ExperimentRecord {
  id: ID;
  key: string;
  name: string;
  kind: ExperimentKind;
  status: ExperimentStatus;
  context: ExperimentContext;
  hypothesis?: string;
  audienceReference?: ID;
  activationPolicyReference?: ID;
  startAt?: ISODateTime;
  endAt?: ISODateTime;
  primaryMetricId?: ID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ExperimentVariant {
  id: ID;
  experimentId: ID;
  key: string;
  name: string;
  status: VariantStatus;
  allocationBasisPoints: number;
  payloadReference?: ID;
}

export interface ExperimentAssignment {
  id: ID;
  experimentId: ID;
  variantId: ID;
  subjectReference: ID;
  status: AssignmentStatus;
  assignedAt: ISODateTime;
  expiresAt?: ISODateTime;
  reason?: string;
}

export interface ExperimentMetric {
  id: ID;
  experimentId: ID;
  key: string;
  name: string;
  kind: MetricKind;
  direction: 'INCREASE' | 'DECREASE' | 'TARGET';
  unit?: string;
  sourceReference?: ID;
}

export interface ExperimentOutcome {
  id: ID;
  experimentId: ID;
  variantId: ID;
  metricId: ID;
  subjectReference?: ID;
  value: number;
  observedAt: ISODateTime;
  sourceReference?: ID;
}

export interface ExperimentFeedback {
  id: ID;
  experimentId: ID;
  variantId?: ID;
  subjectReference?: ID;
  kind: FeedbackKind;
  signal: string;
  value?: number;
  observedAt: ISODateTime;
}

export interface ExperimentDecision {
  experimentId: ID;
  status: 'NO_DECISION' | 'CONTINUE' | 'PROMOTE' | 'STOP' | 'ROLLBACK' | 'REVIEW';
  winningVariantId?: ID;
  confidenceReference?: string;
  rationaleReference?: string;
  decidedAt: ISODateTime;
}

export interface ExperimentQuery { context: ExperimentContext; experimentId?: ID; key?: string; status?: ExperimentStatus; }
export interface ExperimentResult<T> { ok: boolean; value?: T; errorCode?: string; message?: string; }

export interface ExperimentRepository {
  create(record: ExperimentRecord): Promise<ExperimentResult<ExperimentRecord>>;
  update(record: ExperimentRecord): Promise<ExperimentResult<ExperimentRecord>>;
  get(id: ID, context: ExperimentContext): Promise<ExperimentResult<ExperimentRecord | null>>;
  query(query: ExperimentQuery): Promise<ExperimentResult<ExperimentRecord[]>>;
}
export interface VariantRepository { save(variant: ExperimentVariant): Promise<ExperimentResult<ExperimentVariant>>; list(experimentId: ID, context: ExperimentContext): Promise<ExperimentResult<ExperimentVariant[]>>; }
export interface AssignmentRepository { save(assignment: ExperimentAssignment): Promise<ExperimentResult<ExperimentAssignment>>; getForSubject(experimentId: ID, subjectReference: ID, context: ExperimentContext): Promise<ExperimentResult<ExperimentAssignment | null>>; }
export interface MetricRepository { save(metric: ExperimentMetric): Promise<ExperimentResult<ExperimentMetric>>; list(experimentId: ID, context: ExperimentContext): Promise<ExperimentResult<ExperimentMetric[]>>; }
export interface OutcomeRepository { record(outcome: ExperimentOutcome): Promise<ExperimentResult<ExperimentOutcome>>; }
export interface FeedbackRepository { record(feedback: ExperimentFeedback): Promise<ExperimentResult<ExperimentFeedback>>; }
export interface AssignmentPort { assign(input: {experiment: ExperimentRecord; subjectReference: ID; context: ExperimentContext}): Promise<ExperimentResult<ExperimentAssignment>>; }
export interface EvaluationPort { evaluate(input: {experiment: ExperimentRecord; variants: ExperimentVariant[]; metrics: ExperimentMetric[]; context: ExperimentContext}): Promise<ExperimentResult<ExperimentDecision>>; }
export interface ExperimentActivationPolicy { isEnabled(experiment: ExperimentRecord, context: ExperimentContext): boolean; }
export interface ExperimentValidationPort { validateExperiment(record: ExperimentRecord): Promise<ExperimentResult<true>>; validateVariant(variant: ExperimentVariant): Promise<ExperimentResult<true>>; validateMetric(metric: ExperimentMetric): Promise<ExperimentResult<true>>; }
export interface ExperimentAuditPort { record(event: {action: ExperimentAction; experimentId: ID; context: ExperimentContext; at: ISODateTime}): Promise<void>; }
export interface ExperimentTelemetryPort { metric(name: string, value: number, context: ExperimentContext): void; error(name: string, context: ExperimentContext): void; }
export interface ExperimentEventRepository { append(event: {type: string; experimentId: ID; context: ExperimentContext; at: ISODateTime}): Promise<void>; }
export interface ExperimentContentPort { resolveVariantPayload(variant: ExperimentVariant, context: ExperimentContext): Promise<ExperimentResult<ID | undefined>>; }
export interface ExperimentPersonalizationPort { requestCandidate(input: {subjectReference: ID; context: ExperimentContext}): Promise<ExperimentResult<ID[]>>; }

const SENSITIVE = /(password|secret|private[_ -]?key|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|authorization|bearer|cvv|cvc|pan|card[_ -]?number)/i;
export function containsSensitiveKey(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  return Object.keys(value as Record<string, unknown>).some(k => SENSITIVE.test(k));
}

export function validateAllocation(variants: ExperimentVariant[]): ExperimentResult<true> {
  if (variants.length < 2) return {ok:false, errorCode:'MIN_VARIANTS', message:'An experiment requires at least two variants.'};
  const total = variants.reduce((sum, v) => sum + v.allocationBasisPoints, 0);
  return total === 10000 ? {ok:true, value:true} : {ok:false, errorCode:'INVALID_ALLOCATION', message:'Variant allocation must total 10000 basis points.'};
}

export function transition(status: ExperimentStatus, action: ExperimentAction): ExperimentStatus {
  const map: Record<ExperimentStatus, Partial<Record<ExperimentAction, ExperimentStatus>>> = {
    DRAFT:{SCHEDULE:'SCHEDULED',START:'RUNNING',CANCEL:'CANCELLED',ARCHIVE:'ARCHIVED'},
    SCHEDULED:{START:'RUNNING',CANCEL:'CANCELLED',ARCHIVE:'ARCHIVED'},
    RUNNING:{PAUSE:'PAUSED',COMPLETE:'COMPLETED',CANCEL:'CANCELLED'},
    PAUSED:{RESUME:'RUNNING',CANCEL:'CANCELLED',ARCHIVE:'ARCHIVED'},
    COMPLETED:{ARCHIVE:'ARCHIVED'},
    CANCELLED:{ARCHIVE:'ARCHIVED'},
    ARCHIVED:{}
  };
  const next = map[status][action];
  if (!next) throw new Error(`Invalid experiment transition: ${status} -> ${action}`);
  return next;
}

export function validateNoSensitiveMetadata(metadata: Record<string, unknown>): ExperimentResult<true> {
  return containsSensitiveKey(metadata) ? {ok:false,errorCode:'SENSITIVE_DATA',message:'Sensitive credential/payment fields are not allowed.'} : {ok:true,value:true};
}

export const STEP_61 = {
  name: 'Experimentation & Optimization Foundation',
  version: '1.0.0',
  flow: 'Experiment Definition → Audience → Assignment → Variant Exposure → Outcome/Feedback → Evaluation → Decision → Audit/Telemetry',
  ownership: 'Owns experimentation lifecycle, variants, assignment, metrics/outcomes and optimization decisions; does not own CRM, campaigns, content, payments, accounting, analytics source-of-truth or customer identity.',
  providerNeutral: true
} as const;
