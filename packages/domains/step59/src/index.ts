/**
 * EMERIONA GLOBAL — Step 59
 * Customer Journey & Lifecycle Automation Foundation
 * Provider-neutral architectural contracts; no vendor SDKs or secrets.
 */

export type ID = string;
export type ISODateTime = string;

export type JourneyStatus = 'DRAFT'|'SCHEDULED'|'ACTIVE'|'PAUSED'|'COMPLETED'|'CANCELLED'|'ARCHIVED';
export type JourneyKind = 'LIFECYCLE'|'ONBOARDING'|'RETENTION'|'REACTIVATION'|'EDUCATIONAL'|'EVENT'|'TRANSACTIONAL_REFERENCE'|'CUSTOM';
export type StageStatus = 'DRAFT'|'ACTIVE'|'PAUSED'|'COMPLETED'|'ARCHIVED';
export type StepKind = 'TRIGGER'|'ACTION'|'DELAY'|'CONDITION'|'BRANCH'|'GOAL'|'EXIT'|'END';
export type StepStatus = 'PENDING'|'READY'|'RUNNING'|'WAITING'|'COMPLETED'|'SKIPPED'|'FAILED'|'CANCELLED';
export type ExecutionStatus = 'PENDING'|'RUNNING'|'WAITING'|'COMPLETED'|'FAILED'|'CANCELLED'|'PAUSED'|'EXPIRED';
export type TriggerKind = 'EVENT'|'SCHEDULE'|'AUDIENCE'|'MANUAL'|'SYSTEM'|'API'|'LIFECYCLE';
export type ActionKind = 'SEND_MESSAGE'|'START_CAMPAIGN'|'UPDATE_LIFECYCLE'|'GRANT_ENTITLEMENT'|'APPLY_PROMOTION'|'AWARD_REWARD'|'CREATE_CASE'|'EMIT_EVENT'|'WEBHOOK_REFERENCE'|'CUSTOM';
export type JourneyAction = 'CREATE'|'SCHEDULE'|'ACTIVATE'|'PAUSE'|'RESUME'|'COMPLETE'|'CANCEL'|'ARCHIVE';

export interface JourneyContext { tenantId: ID; actorId?: ID; customerId?: ID; locale?: string; region?: string; timezone?: string; correlationId?: ID; }
export interface Journey { id: ID; tenantId: ID; name: string; kind: JourneyKind; status: JourneyStatus; version: number; entryStepId?: ID; goalStepIds: ID[]; createdAt: ISODateTime; updatedAt: ISODateTime; metadata?: Record<string, unknown>; }
export interface JourneyStage { id: ID; journeyId: ID; name: string; status: StageStatus; order: number; stepIds: ID[]; }
export interface JourneyStep { id: ID; journeyId: ID; stageId?: ID; name: string; kind: StepKind; status: StepStatus; nextStepId?: ID; yesStepId?: ID; noStepId?: ID; delaySeconds?: number; actionKind?: ActionKind; triggerKind?: TriggerKind; referenceId?: ID; metadata?: Record<string, unknown>; }
export interface JourneyTrigger { id: ID; journeyId: ID; kind: TriggerKind; eventType?: string; schedule?: string; audienceReference?: ID; active: boolean; }
export interface JourneyExecution { id: ID; journeyId: ID; journeyVersion: number; context: JourneyContext; status: ExecutionStatus; currentStepId?: ID; startedAt: ISODateTime; updatedAt: ISODateTime; completedAt?: ISODateTime; failureCode?: string; }
export interface JourneyGoal { id: ID; journeyId: ID; stepId: ID; name: string; targetEvent?: string; active: boolean; }

export interface JourneyRepository { create(input: Journey): Promise<Journey>; get(id: ID, context: JourneyContext): Promise<Journey|undefined>; update(input: Journey): Promise<Journey>; list(context: JourneyContext): Promise<Journey[]>; }
export interface JourneyStageRepository { save(stage: JourneyStage): Promise<JourneyStage>; list(journeyId: ID, context: JourneyContext): Promise<JourneyStage[]>; }
export interface JourneyStepRepository { save(step: JourneyStep): Promise<JourneyStep>; get(id: ID, context: JourneyContext): Promise<JourneyStep|undefined>; list(journeyId: ID, context: JourneyContext): Promise<JourneyStep[]>; }
export interface JourneyExecutionRepository { save(execution: JourneyExecution): Promise<JourneyExecution>; get(id: ID, context: JourneyContext): Promise<JourneyExecution|undefined>; list(journeyId: ID, context: JourneyContext): Promise<JourneyExecution[]>; }
export interface JourneyTriggerRepository { save(trigger: JourneyTrigger): Promise<JourneyTrigger>; list(journeyId: ID, context: JourneyContext): Promise<JourneyTrigger[]>; }
export interface JourneyGoalRepository { save(goal: JourneyGoal): Promise<JourneyGoal>; list(journeyId: ID, context: JourneyContext): Promise<JourneyGoal[]>; }

export interface JourneyEligibilityPort { canEnter(input: {journey: Journey; context: JourneyContext}): Promise<{eligible:boolean; reason?:string}>; }
export interface JourneyTriggerPort { register(trigger: JourneyTrigger, context: JourneyContext): Promise<void>; match(input: {trigger: JourneyTrigger; event: unknown; context: JourneyContext}): Promise<boolean>; }
export interface JourneyExecutionPort { start(journey: Journey, context: JourneyContext): Promise<JourneyExecution>; resume(execution: JourneyExecution): Promise<JourneyExecution>; pause(execution: JourneyExecution): Promise<JourneyExecution>; cancel(execution: JourneyExecution): Promise<JourneyExecution>; }
export interface JourneyActionPort { execute(input: {step: JourneyStep; execution: JourneyExecution; context: JourneyContext}): Promise<{success:boolean; referenceId?:ID; failureCode?:string}>; }
export interface JourneyConditionPort { evaluate(input: {step: JourneyStep; execution: JourneyExecution; context: JourneyContext}): Promise<{matched:boolean; reason?:string}>; }
export interface JourneySchedulingPort { schedule(execution: JourneyExecution, at: ISODateTime): Promise<void>; cancel(executionId: ID, context: JourneyContext): Promise<void>; }
export interface JourneyGoalPort { evaluate(input: {goal: JourneyGoal; execution: JourneyExecution; event?:unknown}): Promise<boolean>; }
export interface JourneyValidationPort { validateJourney(journey: Journey): Promise<void>; validateStep(step: JourneyStep): Promise<void>; }
export interface JourneyActivationPolicy { isEnabled(context: JourneyContext): Promise<boolean>; }
export interface JourneyAuditPort { record(event: {type:string; journeyId:ID; executionId?:ID; context:JourneyContext; timestamp:ISODateTime}): Promise<void>; }
export interface JourneyTelemetryPort { track(event: {type:string; journeyId:ID; executionId?:ID; context:JourneyContext; timestamp:ISODateTime}): Promise<void>; }

const SECRET_PATTERNS = [/password/i,/secret/i,/private[_-]?key/i,/access[_-]?token/i,/refresh[_-]?token/i,/api[_-]?key/i,/authorization/i,/bearer/i,/cvv/i,/cvc/i,/\bpan\b/i,/card[_-]?number/i];
export function assertSafeMetadata(metadata?: Record<string, unknown>): void {
  if (!metadata) return;
  const text = JSON.stringify(metadata);
  if (SECRET_PATTERNS.some((p) => p.test(text))) throw new Error('Sensitive credential or payment data is not allowed in journey metadata.');
}

export function assertValidDelay(seconds?: number): void {
  if (seconds !== undefined && (!Number.isFinite(seconds) || seconds < 0)) throw new Error('delaySeconds must be a finite non-negative number.');
}

export async function validateJourneyDefinition(input: {journey: Journey; steps: JourneyStep[]; context: JourneyContext}): Promise<void> {
  if (!input.journey.id || !input.journey.tenantId || input.journey.tenantId !== input.context.tenantId) throw new Error('Journey tenant context mismatch.');
  if (!input.journey.name.trim()) throw new Error('Journey name is required.');
  if (input.journey.version < 1 || !Number.isInteger(input.journey.version)) throw new Error('Journey version must be a positive integer.');
  if (input.journey.entryStepId && !input.steps.some(s => s.id === input.journey.entryStepId)) throw new Error('Entry step does not exist.');
  for (const step of input.steps) { assertValidDelay(step.delaySeconds); assertSafeMetadata(step.metadata); if (step.journeyId !== input.journey.id) throw new Error('Step journey mismatch.'); }
  assertSafeMetadata(input.journey.metadata);
}

export function transitionJourney(status: JourneyStatus, action: JourneyAction): JourneyStatus {
  const allowed: Record<JourneyStatus, JourneyAction[]> = {
    DRAFT:['SCHEDULE','ACTIVATE','CANCEL','ARCHIVE'], SCHEDULED:['ACTIVATE','CANCEL','ARCHIVE'], ACTIVE:['PAUSE','COMPLETE','CANCEL'], PAUSED:['RESUME','CANCEL','ARCHIVE'], COMPLETED:['ARCHIVE'], CANCELLED:['ARCHIVE'], ARCHIVED:[]
  };
  if (!allowed[status].includes(action)) throw new Error(`Invalid journey transition: ${status} -> ${action}`);
  const map: Record<JourneyAction, JourneyStatus> = {CREATE:'DRAFT',SCHEDULE:'SCHEDULED',ACTIVATE:'ACTIVE',PAUSE:'PAUSED',RESUME:'ACTIVE',COMPLETE:'COMPLETED',CANCEL:'CANCELLED',ARCHIVE:'ARCHIVED'};
  return map[action];
}

export function createExecution(journey: Journey, context: JourneyContext, now: ISODateTime): JourneyExecution {
  return { id: crypto.randomUUID(), journeyId: journey.id, journeyVersion: journey.version, context, status:'PENDING', currentStepId: journey.entryStepId, startedAt: now, updatedAt: now };
}

export const STEP_59 = { name:'Customer Journey & Lifecycle Automation Foundation', version:'1.0.0', providerNeutral:true } as const;
