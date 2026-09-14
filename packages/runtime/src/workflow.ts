export type WorkflowExecutionStatus = 'ACCEPTED' | 'COMPLETED' | 'FAILED';

export interface WorkflowExecutionContext {
  tenantId: string;
  operation: string;
  requestId?: string;
  correlationId?: string;
  actorId?: string;
  version?: string;
  metadata?: Record<string, string>;
}

export interface WorkflowExecutionResult {
  workflow: string;
  status: WorkflowExecutionStatus;
  instanceId: string;
  operation: string;
  tenantId: string;
  correlationId?: string;
}

export interface WorkflowExecutionContract {
  name: string;
  version: string;
  execute(context: WorkflowExecutionContext): Promise<WorkflowExecutionResult>;
}

export function validateWorkflowExecutionContext(context: WorkflowExecutionContext): void {
  if (!context.tenantId || !context.operation) {
    throw new Error('workflow_context_required');
  }
}

export const EMERIONA_CORE_WORKFLOW = {
  name: 'emeriona-core-workflow',
  version: '1.0.0',
} as const;
