export type WorkflowStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'PAUSED' | 'CANCELLED' | 'TIMED_OUT';
export type WorkflowStepKind = 'ACTION' | 'WAIT' | 'CONDITION' | 'PARALLEL' | 'COMPENSATION' | 'CUSTOM';
export type StepStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED' | 'CANCELLED';
export interface WorkflowStepDefinition { id: string; name: string; kind: WorkflowStepKind; action?: string; dependsOn?: string[]; timeoutMs?: number; retryPolicy?: { maxAttempts: number; baseDelayMs: number; maxDelayMs: number }; }
export interface WorkflowDefinition { id: string; name: string; version: string; steps: WorkflowStepDefinition[]; enabled: boolean; }
export interface WorkflowInstance { id: string; definitionId: string; definitionVersion: string; status: WorkflowStatus; tenantId?: string; correlationId?: string; causationId?: string; startedAt?: string; completedAt?: string; input?: unknown; }
export interface StepExecution { id: string; workflowInstanceId: string; stepId: string; status: StepStatus; attempt: number; startedAt?: string; completedAt?: string; output?: unknown; error?: string; }
export interface WorkflowSignal { id: string; workflowInstanceId: string; name: string; payload?: unknown; createdAt: string; }
export interface CompensationRecord { id: string; workflowInstanceId: string; stepId: string; status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'; reason?: string; }
