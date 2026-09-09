export interface IntegrationContext{tenantId:string;correlationId:string;requestId?:string;locale?:string;region?:string}
export interface NormalizedIntegrationError{code:string;message:string;retryable:boolean;providerNeutral:true}
export interface ExternalAdapter<I,O>{execute(context:IntegrationContext,input:I):Promise<{ok:true;value:O}|{ok:false;error:NormalizedIntegrationError}>;health(context:IntegrationContext):Promise<{status:'HEALTHY'|'DEGRADED'|'UNAVAILABLE';checkedAt:string}>}
export interface IntegrationAuditEvent{adapterId:string;operation:string;correlationId:string;outcome:'SUCCESS'|'FAILURE';timestamp:string}
export const INTEGRATION_RULES={providerCredentials:'external-only',businessLogic:'domain-only',normalization:'adapter-boundary-only'} as const;
