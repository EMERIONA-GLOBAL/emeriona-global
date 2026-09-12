import type { EntityId, Result } from "../../../core/src/index.js";
import { fail, ok } from "../../../core/src/index.js";
import type { EntityRecord, EntityRepository } from "../../../domains/src/repositories.js";
import type { PersistenceExecutor } from "../../../core/src/index.js";

/**
 * Provider-neutral repository implementation over the persistence port.
 * Concrete infrastructure adapters (for example D1) remain below this boundary.
 */
export interface PersistenceEntityMapper<T extends EntityRecord> {
  selectById(id: EntityId): { statement: string; parameters: readonly unknown[] };
  save(entity: T): { statement: string; parameters: readonly unknown[] };
  fromRow(row: Record<string, unknown>): T;
}

export class PersistenceEntityRepository<T extends EntityRecord> implements EntityRepository<T> {
  constructor(
    private readonly persistence: PersistenceExecutor,
    private readonly mapper: PersistenceEntityMapper<T>,
  ) {}

  async findById(id: EntityId): Promise<Result<T | null>> {
    try {
      const query = this.mapper.selectById(id);
      const result = await this.persistence.execute(query.statement, query.parameters);
      const row = result.rows[0];
      return row ? ok(this.mapper.fromRow(row)) : ok(null);
    } catch (error) {
      return fail({
        code: "REPOSITORY_FIND_FAILED",
        message: error instanceof Error ? error.message : "Repository lookup failed",
        category: "DEPENDENCY",
        retryable: true,
      });
    }
  }

  async save(entity: T): Promise<Result<T>> {
    try {
      const command = this.mapper.save(entity);
      await this.persistence.execute(command.statement, command.parameters);
      return ok(entity);
    } catch (error) {
      return fail({
        code: "REPOSITORY_SAVE_FAILED",
        message: error instanceof Error ? error.message : "Repository save failed",
        category: "DEPENDENCY",
        retryable: true,
      });
    }
  }
}

export const PERSISTENCE_REPOSITORY_VERSION = "1.0.0" as const;
