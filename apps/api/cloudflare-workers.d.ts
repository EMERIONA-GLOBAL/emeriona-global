declare module "cloudflare:workers" {
  export interface WorkflowEvent<T = unknown> {
    payload: T;
    timestamp: number;
    instanceId: string;
    workflowName: string;
  }

  export interface WorkflowStep {
    do<T>(
      name: string,
      callback: () => T | Promise<T>,
    ): Promise<T>;
  }

  export abstract class WorkflowEntrypoint<Env = unknown, Params = unknown> {
    protected readonly env: Env;
    abstract run(
      event: WorkflowEvent<Params>,
      step: WorkflowStep,
    ): Promise<unknown>;
  }
}
