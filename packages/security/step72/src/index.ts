export type IdentityStatus='ACTIVE'|'SUSPENDED'|'REVOKED'|'EXPIRED';
export type CredentialKind='SESSION'|'ACCESS_TOKEN'|'API_KEY_REFERENCE'|'SERVICE_IDENTITY'|'CUSTOM';
export type AuthorizationDecision='ALLOW'|'DENY'|'REVIEW';
export type PolicyEffect='ALLOW'|'DENY';
export type SecurityAction='AUTHENTICATE'|'AUTHORIZE'|'REVOKE'|'REFRESH'|'VALIDATE';
export interface SecurityContext { tenantId:string; subjectId:string; correlationId:string; requestId:string; roles?:string[]; scopes?:string[]; metadata?:Record<string,unknown>; }
export interface IdentityReference { id:string; tenantId:string; status:IdentityStatus; type:'CUSTOMER'|'USER'|'SERVICE'|'SYSTEM'; }
export interface CredentialReference { id:string; identityId:string; kind:CredentialKind; version:string; expiresAt?:string; metadata?:Record<string,unknown>; }
export interface AuthorizationRequest { context:SecurityContext; resource:string; action:string; resourceId?:string; }
export interface AuthorizationResult { decision:AuthorizationDecision; policyId?:string; reason?:string; }
export interface AuthenticationRequest { context:SecurityContext; credential:CredentialReference; }
export interface AuthenticationResult { authenticated:boolean; identity?:IdentityReference; expiresAt?:string; reason?:string; }
export interface SecurityPolicy { id:string; version:string; effect:PolicyEffect; actions:string[]; resources:string[]; roles?:string[]; scopes?:string[]; }
export interface SecurityDecision { action:SecurityAction; decision:AuthorizationDecision; identityId:string; correlationId:string; timestamp:string; }
export interface IdentityRepository { findById(id:string):Promise<IdentityReference|undefined>; }
export interface CredentialValidationPort { validate(input:AuthenticationRequest):Promise<AuthenticationResult>; }
export interface AuthorizationPort { authorize(input:AuthorizationRequest):Promise<AuthorizationResult>; }
export interface RevocationPort { isRevoked(referenceId:string):Promise<boolean>; revoke(referenceId:string):Promise<void>; }
export interface SecurityPolicyPort { evaluate(input:AuthorizationRequest):Promise<AuthorizationResult>; }
export interface SecurityAuditPort { record(decision:SecurityDecision):Promise<void>; }
export interface SecurityTelemetryPort { record(name:string,data:Record<string,unknown>):Promise<void>; }
const SENSITIVE=/(password|secret|private.?key|access.?token|refresh.?token|api.?key|authorization|bearer|cvv|cvc|pan|card.?number)/i;
export function validateMetadata(metadata:Record<string,unknown>|undefined):void { if(!metadata)return; for(const key of Object.keys(metadata)) if(SENSITIVE.test(key)) throw new Error(`Sensitive metadata is not permitted: ${key}`); }
export function validateContext(context:SecurityContext):void { if(!context.tenantId||!context.subjectId||!context.correlationId||!context.requestId) throw new Error('Invalid security context'); validateMetadata(context.metadata); }
export function validateAuthorizationRequest(input:AuthorizationRequest):void { validateContext(input.context); if(!input.resource||!input.action) throw new Error('Resource and action are required'); }
export function decide(policy:SecurityPolicy,input:AuthorizationRequest):AuthorizationResult { validateAuthorizationRequest(input); const actionOk=policy.actions.includes('*')||policy.actions.includes(input.action); const resourceOk=policy.resources.includes('*')||policy.resources.includes(input.resource); const roleOk=!policy.roles?.length||policy.roles.some(r=>input.context.roles?.includes(r)); const scopeOk=!policy.scopes?.length||policy.scopes.some(s=>input.context.scopes?.includes(s)); const matches=actionOk&&resourceOk&&roleOk&&scopeOk; return {decision:matches?(policy.effect==='ALLOW'?'ALLOW':'DENY'):'DENY',policyId:policy.id,reason:matches?'Policy matched':'Policy did not match'}; }
export const STEP_72={name:'Application Security & Identity Integration Foundation',version:'1.0.0',status:'FOUNDATION',providerNeutral:true,flow:'Identity → Credential Validation → Security Context → Authorization Policy → Decision → Revocation → Audit/Telemetry',ownership:['identity/security integration contracts','credential validation boundary','authorization policy boundary','revocation boundary','security context propagation','security audit and telemetry hooks'],exclusions:['credential secrets','passwords','raw access/refresh tokens','provider SDKs','business-domain ownership','accounting/payment source of truth','analytics source of truth']};
