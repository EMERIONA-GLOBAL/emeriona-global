export type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'RETRYING' | 'CANCELLED' | 'DEAD_LETTERED';
export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type JobKind = 'COMMAND' | 'EVENT_HANDLER' | 'SCHEDULED' | 'BATCH' | 'CUSTOM';
export type BackoffStrategy = 'FIXED' | 'LINEAR' | 'EXPONENTIAL';
export type ScheduleKind = 'ONCE' | 'RECURRING';
export interface RetryPolicy { maxAttempts: number; strategy: BackoffStrategy; baseDelayMs: number; maxDelayMs: number; jitter: boolean; }
export interface JobEnvelope<TPayload = unknown> { id: string; name: string; version: string; kind: JobKind; priority: JobPriority; tenantId?: string; correlationId?: string; causationId?: string; idempotencyKey?: string; createdAt: string; scheduledAt?: string; attempts: number; retryPolicy: RetryPolicy; payload: TPayload; }
export interface WorkerContext { workerId: string; startedAt: string; correlationId?: string; traceId?: string; }
export interface JobResult { status: 'SUCCEEDED' | 'FAILED' | 'RETRYING' | 'DEAD_LETTERED'; message?: string; output?: unknown; retryAt?: string; }
export interface DeadLetterRecord { id: string; jobId: string; failedAt: string; attempts: number; reason: string; lastError?: string; payloadReference?: string; }
export interface ScheduleDefinition { id: string; name: string; kind: ScheduleKind; jobName: string; jobVersion: string; cron?: string; runAt?: string; timezone?: string; enabled: boolean; }
