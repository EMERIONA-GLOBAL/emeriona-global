export type SecurityDecision='ALLOW'|'DENY'|'REVIEW';
export interface SecurityContext{tenantId:string;subjectId?:string;roles:string[];scopes:string[];authenticated:boolean;correlationId:string;metadata?:Record<string,unknown>}
export interface AuthorizationRequest{resource:string;action:string;context:SecurityContext}
export interface AuthorizationDecision{decision:SecurityDecision;reason?:string;policyId?:string}
export interface CredentialValidationResult{valid:boolean;subjectId?:string;expiresAt?:string;reason?:string}
export interface CredentialValidator{validate(credential:string):Promise<CredentialValidationResult>}
export interface AuthorizationPolicyPort{authorize(request:AuthorizationRequest):Promise<AuthorizationDecision>}
export interface RevocationPort{isRevoked(subjectId:string,tokenId?:string):Promise<boolean>}
const SENSITIVE=/(password|secret|private[_ -]?key|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|authorization|bearer|cvv|cvc|pan|card[_ -]?number)/i;
export function validateSecurityContext(context:SecurityContext):void{if(!context.tenantId||!context.correlationId)throw new Error('tenantId and correlationId are required');if(!context.authenticated&&context.subjectId)throw new Error('Unauthenticated context cannot carry subjectId');for(const key of Object.keys(context.metadata??{}))if(SENSITIVE.test(key))throw new Error(`Sensitive security metadata key rejected: ${key}`);}
export function decideAuthorization(context:SecurityContext,requiredScopes:string[]):AuthorizationDecision{validateSecurityContext(context);if(!context.authenticated)return {decision:'DENY',reason:'Authentication required'};const missing=requiredScopes.filter(s=>!context.scopes.includes(s));return missing.length?{decision:'DENY',reason:`Missing scopes: ${missing.join(',')}`}:{decision:'ALLOW'};}
export const STEP_72={name:'Application Security & Identity Integration Foundation',version:'1.0.0',status:'FOUNDATION',providerNeutral:true} as const;
