import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";

export interface EmerionaWorkflowPayload {
  tenantId: string;
  requestId?: string;
  correlationId?: string;
  actorId?: string;
  operation: string;
  version?: string;
  metadata?: Record<string, string>;
}

export interface EmerionaWorkflowResult {
  workflow: "emeriona-core-workflow";
  status: "ACCEPTED";
  instanceId: string;
  operation: string;
  tenantId: string;
  correlationId?: string;
}

export class EmerionaCoreWorkflow extends WorkflowEntrypoint<Env, EmerionaWorkflowPayload> {
  async run(
    event: WorkflowEvent<EmerionaWorkflowPayload>,
    step: WorkflowStep,
  ): Promise<EmerionaWorkflowResult> {
    const context = await step.do("validate execution context", async () => {
      if (!event.payload.tenantId || !event.payload.operation) {
        throw new Error("workflow_context_required");
      }

      return {
        tenantId: event.payload.tenantId,
        operation: event.payload.operation,
        correlationId: event.payload.correlationId,
      };
    });

    return {
      workflow: "emeriona-core-workflow",
      status: "ACCEPTED",
      instanceId: event.instanceId,
      operation: context.operation,
      tenantId: context.tenantId,
      correlationId: context.correlationId,
    };
  }
}

declare interface Env {
  DB: unknown;
  ASSETS: unknown;
}
