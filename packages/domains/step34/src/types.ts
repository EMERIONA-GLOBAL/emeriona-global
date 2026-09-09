export type ReliabilityAction = 'RETRY'|'PAUSE'|'RESUME'|'CANCEL'|'COMPENSATE';
export type DecisionStatus = 'CONTINUE'|'RETRY'|'PAUSED'|'CANCELLED'|'COMPENSATE'|'FAILED';
export type RetryStrategy = 'FIXED'|'LINEAR'|'EXPONENTIAL';
export interface RetryPolicy { maxAttempts: number; strategy: RetryStrategy; baseDelaySeconds: number; maxDelaySeconds?: number; jitter?: boolean; }
export interface ExecutionDecision { workflowInstanceId: string; stepId?: string; status: DecisionStatus; nextAttempt?: number; reason?: string; }
export interface CompensationRequest { workflowInstanceId: string; failedStepId: string; reason: string; correlationId: string; }
export interface ReliabilityContext { workflowInstanceId: string; correlationId: string; tenantId?: string; }
