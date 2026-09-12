/**
 * Provider-neutral persistence contracts.
 * Domain and application code depend on these contracts, never on D1 APIs.
 */

export interface QueryResult<Row extends Record<string, unknown> = Record<string, unknown>> {
  rows: Row[];
  success: boolean;
  meta?: Record<string, unknown>;
}

export interface PersistenceExecutor {
  execute<Row extends Record<string, unknown> = Record<string, unknown>>(
    statement: string,
    parameters?: readonly unknown[],
  ): Promise<QueryResult<Row>>;
}

export interface TransactionalPersistence extends PersistenceExecutor {
  transaction<T>(work: (tx: PersistenceExecutor) => Promise<T>): Promise<T>;
}

export const PERSISTENCE_CONTRACT_VERSION = '1.0.0' as const;
