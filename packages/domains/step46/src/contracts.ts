import type { PayoutBatch, PayoutBatchId, PayoutContext, PayoutId, PayoutInstruction, PayoutQuery, PayoutRecord, PayoutResult } from './types';
export interface PayoutRepository { save(payout:PayoutRecord):Promise<void>; getById(id:PayoutId):Promise<PayoutRecord|undefined>; }
export interface PayoutBatchRepository { save(batch:PayoutBatch):Promise<void>; getById(id:PayoutBatchId):Promise<PayoutBatch|undefined>; }
export interface PayoutPort { create(payout:PayoutRecord):Promise<PayoutResult>; approve(id:PayoutId, context?:PayoutContext):Promise<PayoutResult>; process(id:PayoutId, instruction:PayoutInstruction):Promise<PayoutResult>; }
export interface PayoutEligibilityPort { check(payout:PayoutRecord):Promise<{eligible:boolean; reason?:string}>; }
export interface PayoutApprovalPort { approve(payout:PayoutRecord, context?:PayoutContext):Promise<PayoutRecord>; }
export interface PayoutReversalPort { reverse(payout:PayoutRecord, reason:string, context?:PayoutContext):Promise<PayoutRecord>; }
export interface PayoutReconciliationPort { reconcile(payout:PayoutRecord):Promise<{matched:boolean; reference?:string; reason?:string}>; }
export interface PayoutQueryPort { query(query:PayoutQuery):Promise<PayoutRecord[]>; }
export interface PayoutValidationPort { validate(payout:PayoutRecord):void; validateInstruction(instruction:PayoutInstruction):void; }
export interface PayoutAuditPort { record(action:string, payout:PayoutRecord, context?:PayoutContext):Promise<void>; }
export interface PayoutTelemetryPort { record(event:string, payout:PayoutRecord, context?:PayoutContext):Promise<void>; }
export interface PayoutActivationPolicy { isEnabled(context?:PayoutContext):Promise<boolean>; }