export type AuditAction = 'CREATE'|'UPDATE'|'DELETE'|'READ'|'LOGIN'|'LOGOUT'|'EXPORT'|'IMPORT'|'APPROVE'|'REJECT'|'PUBLISH'|'UNPUBLISH'|'CUSTOM';
export type ActorType = 'CUSTOMER'|'USER'|'ADMIN'|'SERVICE'|'SYSTEM'|'EXTERNAL'|'ANONYMOUS';
export type AuditResult = 'SUCCESS'|'FAILURE'|'DENIED'|'PARTIAL';
export interface AuditActor { type: ActorType; actorId?: string; identityId?: string; }
export interface AuditEntity { entityType: string; entityId: string; }
export interface AuditContext { tenantId?: string; environment?: string; application?: string; module?: string; requestId?: string; correlationId?: string; sessionId?: string; ipAddress?: string; userAgent?: string; }
export interface AuditChange { kind: 'FIELD_CHANGED'|'ENTITY_CREATED'|'ENTITY_DELETED'|'STATE_CHANGED'|'SUMMARY'; field?: string; beforeRef?: string; afterRef?: string; summary?: string; }
export interface AuditEvent { id: string; occurredAt: string; action: AuditAction; actor: AuditActor; entity: AuditEntity; result: AuditResult; context?: AuditContext; changes?: AuditChange[]; reason?: string; metadata?: Record<string, string|number|boolean>; }
export interface AuditQuery { entity?: AuditEntity; actorId?: string; action?: AuditAction; result?: AuditResult; from?: string; to?: string; correlationId?: string; limit?: number; }
