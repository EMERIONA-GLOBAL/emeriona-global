import type { AuditEvent } from './types';
const forbidden = /password|passwd|token|secret|authorization|cookie|card(number)?|cvv|cvc|private.?key/i;
export function containsForbiddenSensitiveField(event: AuditEvent): boolean {
 const raw = JSON.stringify(event);
 return forbidden.test(raw);
}
export function validateAuditSafety(event: AuditEvent): string[] {
 const errors:string[]=[];
 if(containsForbiddenSensitiveField(event)) errors.push('event contains a prohibited secret/payment/security field');
 if(event.changes?.some(c=>(c.beforeRef?.length ?? 0)>512 || (c.afterRef?.length ?? 0)>512)) errors.push('change reference is too long');
 return errors;
}
