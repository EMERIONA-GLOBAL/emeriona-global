import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";
import {
  EMERIONA_CORE_WORKFLOW,
  validateWorkflowExecutionContext,
} from "../../packages/runtime/src/index.js";
import type {
  WorkflowExecutionContext,
  WorkflowExecutionResult,
} from "../../packages/runtime/src/index.js";

export type EmerionaWorkflowPayload = WorkflowExecutionContext;
export type EmerionaWorkflowResult = WorkflowExecutionResult;

export class EmerionaCoreWorkflow extends WorkflowEntrypoint<Env, EmerionaWorkflowPayload> {
  async run(
    event: WorkflowEvent<EmerionaWorkflowPayload>,
    step: WorkflowStep,
  ): Promise<EmerionaWorkflowResult> {
    const context = await step.do("validate execution context", async () => {
      validateWorkflowExecutionContext(event.payload);
      return event.payload;
    });

    return {
      workflow: EMERIONA_CORE_WORKFLOW.name,
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
