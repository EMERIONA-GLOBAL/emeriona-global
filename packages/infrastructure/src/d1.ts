import type { PersistenceExecutor, QueryResult } from "../../core/src/index.js";

/** Minimal D1 shape required by the adapter; keeps Cloudflare types out of the core contract. */
export interface D1StatementLike {
  bind(...values: unknown[]): D1StatementLike;
  all<T extends Record<string, unknown>>(): Promise<{ results: T[] } & Record<string, unknown>>;
}

export interface D1DatabaseLike {
  prepare(statement: string): D1StatementLike;
}

/**
 * Infrastructure adapter for Cloudflare D1.
 * Application/domain layers consume PersistenceExecutor only.
 */
export class D1PersistenceAdapter implements PersistenceExecutor {
  constructor(private readonly db: D1DatabaseLike) {}

  async execute<Row extends Record<string, unknown> = Record<string, unknown>>(
    statement: string,
    parameters: readonly unknown[] = [],
  ): Promise<QueryResult<Row>> {
    const prepared = this.db.prepare(statement);
    const bound = parameters.length > 0 ? prepared.bind(...parameters) : prepared;
    const result = await bound.all<Row>();

    return {
      rows: result.results,
      success: true,
    };
  }
}

export const D1_ADAPTER_VERSION = "1.0.0" as const;
