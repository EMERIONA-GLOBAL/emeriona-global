import type { EntityId, Result } from "../../core/src/index.js";

/** Provider-neutral repository port for domain/application use. */
export interface EntityRecord {
  readonly id: EntityId;
}

export interface EntityRepository<T extends EntityRecord> {
  findById(id: EntityId): Promise<Result<T | null>>;
  save(entity: T): Promise<Result<T>>;
}

export const REPOSITORY_PORT_VERSION = "1.0.0" as const;
