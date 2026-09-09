import type { AuditEvent } from './types';
export function isImmutable(event: AuditEvent, replacement?: AuditEvent): boolean { return replacement === undefined; }
export function validateAuditEvent(event: AuditEvent): string[] {
 const errors:string[]=[];
 if(!event.id) errors.push('id is required');
 if(!event.occurredAt) errors.push('occurredAt is required');
 if(!event.action) errors.push('action is required');
 if(!event.actor?.type) errors.push('actor.type is required');
 if(!event.entity?.entityType || !event.entity?.entityId) errors.push('entity reference is required');
 if(!event.result) errors.push('result is required');
 return errors;
}
