import { DeadLetterRecord, JobEnvelope, JobResult, RetryPolicy, ScheduleDefinition, WorkerContext } from './types';
export interface JobQueuePort { enqueue<T>(job: JobEnvelope<T>): Promise<void>; dequeue(limit?: number): Promise<JobEnvelope[]>; acknowledge(jobId: string): Promise<void>; }
export interface JobRepository { save(job: JobEnvelope): Promise<void>; get(jobId: string): Promise<JobEnvelope | null>; updateStatus(jobId: string, status: string): Promise<void>; }
export interface WorkerPort { start(context: WorkerContext): Promise<void>; stop(): Promise<void>; }
export interface JobProcessorPort { process(job: JobEnvelope, context: WorkerContext): Promise<JobResult>; }
export interface RetryPolicyPort { nextAttempt(job: JobEnvelope, error?: Error): number | null; nextRetryAt(job: JobEnvelope, now: Date): Date | null; getPolicy(job: JobEnvelope): RetryPolicy; }
export interface DeadLetterPort { write(record: DeadLetterRecord): Promise<void>; get(jobId: string): Promise<DeadLetterRecord | null>; }
export interface SchedulerPort { register(schedule: ScheduleDefinition): Promise<void>; remove(scheduleId: string): Promise<void>; listEnabled(): Promise<ScheduleDefinition[]>; }
export interface JobIdempotencyPort { hasProcessed(key: string): Promise<boolean>; markProcessed(key: string, jobId: string): Promise<void>; }
export interface JobAuditPort { record(event: { action: string; jobId: string; status: string; correlationId?: string; details?: Record<string, unknown>; }): Promise<void>; }
export interface JobTelemetryPort { recordMetric(name: string, value: number, dimensions?: Record<string, string>): Promise<void>; recordError(error: Error, context?: Record<string, string>): Promise<void>; }
export interface JobActivationPolicy { isEnabled(jobName: string, tenantId?: string): Promise<boolean>; }
