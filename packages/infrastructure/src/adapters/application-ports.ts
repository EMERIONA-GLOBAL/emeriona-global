/** Provider-neutral infrastructure adapters for application runtime ports. */
import type {
  AuditPort,
  AuthorizationPort,
  IdempotencyPort,
  TelemetryPort,
} from "../../../application/src/ports.js";
import type {
  UseCaseContext,
  UseCaseId,
  UseCaseResponse,
} from "../../../application/src/index.js";

/** Explicit authorization adapter: policy evaluation is injected, never hard-coded into use cases. */
export class PolicyAuthorizationAdapter implements AuthorizationPort {
  constructor(private readonly policy: (context: UseCaseContext, useCaseId: UseCaseId) => Promise<boolean>) {}

  authorize(context: UseCaseContext, useCaseId: UseCaseId): Promise<boolean> {
    return this.policy(context, useCaseId);
  }
}

/** In-process idempotency adapter for development/bootstrap. Replace storage with D1-backed persistence later. */
export class InMemoryIdempotencyAdapter implements IdempotencyPort {
  private readonly results = new Map<string, UseCaseResponse<unknown>>();
  private readonly inFlight = new Set<string>();

  private key(key: string, context: UseCaseContext): string {
    return `${context.tenantId}:${key}`;
  }

  async acquire(key: string, context: UseCaseContext): Promise<boolean> {
    const scoped = this.key(key, context);
    if (this.results.has(scoped) || this.inFlight.has(scoped)) return false;
    this.inFlight.add(scoped);
    return true;
  }

  async getResult<T>(key: string, context: UseCaseContext): Promise<UseCaseResponse<T> | undefined> {
    return this.results.get(this.key(key, context)) as UseCaseResponse<T> | undefined;
  }

  async storeResult<T>(key: string, context: UseCaseContext, response: UseCaseResponse<T>): Promise<void> {
    const scoped = this.key(key, context);
    this.inFlight.delete(scoped);
    this.results.set(scoped, response);
  }

  async release(key: string, context: UseCaseContext): Promise<void> {
    this.inFlight.delete(this.key(key, context));
  }
}

/** Audit/telemetry adapters are injectable sinks; the default sink is deliberately side-effect free. */
export class NoopAuditAdapter implements AuditPort {
  async record(_event: Parameters<AuditPort["record"]>[0]): Promise<void> {}
}

export class NoopTelemetryAdapter implements TelemetryPort {
  async record(_event: Parameters<TelemetryPort["record"]>[0]): Promise<void> {}
}

export const APPLICATION_INFRASTRUCTURE_ADAPTERS_VERSION = "1.0.1" as const;
