import { CompensationRequest, ExecutionDecision, ReliabilityContext, RetryPolicy } from './types';
export interface RetryPolicyPort { get(stepId: string, context: ReliabilityContext): Promise<RetryPolicy | undefined>; }
export interface WorkflowLockPort { acquire(workflowInstanceId: string): Promise<boolean>; release(workflowInstanceId: string): Promise<void>; }
export interface WorkflowIdempotencyPort { seen(key: string): Promise<boolean>; record(key: string): Promise<void>; }
export interface ReliabilityDecisionPort { decide(context: ReliabilityContext, attempt: number, failed: boolean): Promise<ExecutionDecision>; }
export interface CompensationRequestPort { request(input: CompensationRequest): Promise<void>; }
export interface ReliabilityControlPort { pause(workflowInstanceId: string): Promise<void>; resume(workflowInstanceId: string): Promise<void>; cancel(workflowInstanceId: string, reason?: string): Promise<void>; }
export interface ReliabilityAuditPort { record(event: { action: string; workflowInstanceId: string; stepId?: string; result: string; correlationId: string }): Promise<void>; }
export interface ReliabilityTelemetryPort { observe(event: { name: string; workflowInstanceId: string; stepId?: string; durationMs?: number; attributes?: Record<string, string> }): Promise<void>; }
