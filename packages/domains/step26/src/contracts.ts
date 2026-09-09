import type { AuditEvent, AuditQuery } from './types';
export interface AuditRepository { append(event: AuditEvent): Promise<void>; getById(id:string): Promise<AuditEvent|undefined>; query(query:AuditQuery): Promise<AuditEvent[]>; }
export interface AuditPort { record(event: AuditEvent): Promise<void>; }
export interface AuditQueryPort { query(query:AuditQuery): Promise<AuditEvent[]>; }
export interface AuditClock { now(): string; }
export interface AuditActivationPolicy { isCollectionEnabled(): boolean; isQueryEnabled(): boolean; }
export interface AuditSanitizer { sanitize(event:AuditEvent): AuditEvent; }
export interface AuditIntegrityPort { verify(event:AuditEvent): Promise<boolean>; }
