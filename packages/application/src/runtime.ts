import type {
  AuditPort,
  AuthorizationPort,
  IdempotencyPort,
  TelemetryPort,
  TransactionPort,
} from "./ports.js";
import {
  type UseCaseContext,
  type UseCaseHandler,
  type UseCaseRequest,
  type UseCaseResponse,
  type UseCaseId,
  validateRequest,
} from "./index.js";

/** Provider-neutral dependencies required to execute an application use case. */
export interface UseCaseRuntimeDependencies {
  authorization: AuthorizationPort;
  idempotency?: IdempotencyPort;
  audit?: AuditPort;
  telemetry?: TelemetryPort;
  transaction?: TransactionPort;
}

export interface UseCaseRuntime {
  execute<T, R>(
    handler: UseCaseHandler<T, R>,
    request: UseCaseRequest<T>,
  ): Promise<UseCaseResponse<R>>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Use case execution failed";
}

async function recordAudit(
  audit: AuditPort | undefined,
  request: UseCaseRequest<unknown>,
  outcome: "STARTED" | "SUCCEEDED" | "FAILED",
): Promise<void> {
  if (!audit) return;
  await audit.record({
    useCaseId: request.useCaseId,
    correlationId: request.context.correlationId,
    outcome,
  });
}

/**
 * Default application execution pipeline.
 * Order: validation -> authorization -> idempotency -> audit -> handler -> audit/telemetry.
 * Infrastructure providers remain behind the injected ports.
 */
export class DefaultUseCaseRuntime implements UseCaseRuntime {
  constructor(private readonly dependencies: UseCaseRuntimeDependencies) {}

  async execute<T, R>(
    handler: UseCaseHandler<T, R>,
    request: UseCaseRequest<T>,
  ): Promise<UseCaseResponse<R>> {
    validateRequest(request);

    const authorized = await this.dependencies.authorization.authorize(
      request.context,
      request.useCaseId,
    );
    if (!authorized) throw new Error(`Use case not authorized: ${request.useCaseId}`);

    const idempotency = this.dependencies.idempotency;
    if (idempotency && request.idempotencyKey) {
      const existing = await idempotency.getResult<R>(
        request.idempotencyKey,
        request.context,
      );
      if (existing) return existing;

      const acquired = await idempotency.acquire(
        request.idempotencyKey,
        request.context,
      );
      if (!acquired) {
        const result = await idempotency.getResult<R>(
          request.idempotencyKey,
          request.context,
        );
        if (result) return result;
        throw new Error("Idempotency key is already in progress");
      }
    }

    const startedAt = Date.now();
    await recordAudit(this.dependencies.audit, request, "STARTED");

    try {
      const executeHandler = () => handler.handle(request);
      const response = this.dependencies.transaction
        ? await this.dependencies.transaction.run(executeHandler)
        : await executeHandler();

      if (idempotency && request.idempotencyKey) {
        await idempotency.storeResult(
          request.idempotencyKey,
          request.context,
          response,
        );
      }

      await recordAudit(this.dependencies.audit, request, "SUCCEEDED");
      await this.dependencies.telemetry?.record({
        useCaseId: request.useCaseId,
        correlationId: request.context.correlationId,
        durationMs: Date.now() - startedAt,
        outcome: "SUCCEEDED",
      });
      return response;
    } catch (error) {
      try {
        await recordAudit(this.dependencies.audit, request, "FAILED");
        await this.dependencies.telemetry?.record({
          useCaseId: request.useCaseId,
          correlationId: request.context.correlationId,
          durationMs: Date.now() - startedAt,
          outcome: "FAILED",
        });
      } catch {
        // Observability failures must not replace the original use-case failure.
      }
      throw new Error(errorMessage(error));
    }
  }
}

export const APPLICATION_RUNTIME_VERSION = "1.0.0" as const;
