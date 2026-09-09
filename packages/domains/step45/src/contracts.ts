import { SettlementBatch, SettlementId, SettlementQuery, SettlementRecord, SettlementResult } from './types';

export interface SettlementRepository { save(record: SettlementRecord): Promise<void>; get(id: SettlementId): Promise<SettlementRecord | undefined>; query(query: SettlementQuery): Promise<SettlementRecord[]>; }
export interface SettlementBatchRepository { save(batch: SettlementBatch): Promise<void>; get(id: string): Promise<SettlementBatch | undefined>; }
export interface SettlementPort { settle(record: SettlementRecord): Promise<SettlementResult>; reverse(id: SettlementId, reason: string): Promise<SettlementResult>; }
export interface SettlementReconciliationPort { reconcile(batchId: string): Promise<{matched: number; unmatched: number; errors: string[]}>; }
export interface SettlementQueryPort { get(id: SettlementId): Promise<SettlementRecord | undefined>; query(query: SettlementQuery): Promise<SettlementRecord[]>; }
export interface SettlementValidationPort { validate(record: SettlementRecord): void; }
export interface SettlementAuditPort { record(action: string, id: SettlementId, metadata?: Record<string, unknown>): Promise<void>; }
export interface SettlementTelemetryPort { measure(name: string, value: number, tags?: Record<string,string>): Promise<void>; }
export interface SettlementActivationPolicy { isEnabled(scope?: string): Promise<boolean>; }
