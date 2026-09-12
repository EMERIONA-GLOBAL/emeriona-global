import type { EntityRecord, EntityRepository } from "../../domains/src/index.js";
import type { UseCaseContext, UseCaseId, UseCaseResponse } from "./index.js";

/** Application-facing repository boundary; implementations remain outside Application. */
export type ApplicationRepository<T extends EntityRecord> = EntityRepository<T>;

export interface TransactionPort {
  run<T>(work: () => Promise<T>): Promise<T>;
}

export interface AuthorizationPort {
  authorize(context: UseCaseContext, useCaseId: UseCaseId): Promise<boolean>;
}

export interface IdempotencyPort {
  acquire(key: string, context: UseCaseContext): Promise<boolean>;
  getResult<T>(key: string, context: UseCaseContext): Promise<UseCaseResponse<T> | undefined>;
  storeResult<T>(key: string, context: UseCaseContext, response: UseCaseResponse<T>): Promise<void>;
}

export interface AuditPort {
  record(event: {
    useCaseId: UseCaseId;
    correlationId: string;
    outcome: "STARTED" | "SUCCEEDED" | "FAILED";
    metadata?: Readonly<Record<string, unknown>>;
  }): Promise<void>;
}

export interface TelemetryPort {
  record(event: {
    useCaseId: UseCaseId;
    correlationId: string;
    durationMs: number;
    outcome: "SUCCEEDED" | "FAILED";
  }): Promise<void>;
}

export const APPLICATION_PORTS_VERSION = "1.0.0" as const;
