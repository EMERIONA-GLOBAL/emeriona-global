export type ApiStatus = 'DRAFT'|'ACTIVE'|'PAUSED'|'DEPRECATED'|'RETIRED';
export type ApiProtocol = 'HTTP'|'HTTPS'|'WEBHOOK'|'CUSTOM';
export type ApiMethod = 'GET'|'POST'|'PUT'|'PATCH'|'DELETE';
export type ResponseStatus = 'SUCCESS'|'CLIENT_ERROR'|'SERVER_ERROR'|'REJECTED'|'TIMEOUT';

export interface ApiContext { tenantId:string; correlationId:string; requestId:string; actorId?:string; locale?:string; region?:string; metadata?:Record<string, unknown>; }
export interface ApiRequest<T=unknown> { id:string; method:ApiMethod; path:string; context:ApiContext; body?:T; query?:Record<string,string>; headers?:Record<string,string>; }
export interface ApiResponse<T=unknown> { requestId:string; correlationId:string; statusCode:number; status:ResponseStatus; data?:T; error?:ApiError; }
export interface ApiError { code:string; message:string; retryable?:boolean; details?:Record<string,unknown>; }
export interface RouteDefinition { id:string; method:ApiMethod; path:string; useCase:string; version:string; status:ApiStatus; authRequired:boolean; }
export interface ApiPolicy { id:string; version:string; rateLimitPerMinute?:number; timeoutMs?:number; maxBodyBytes?:number; allowedMethods:ApiMethod[]; }
export interface ApiContract { id:string; version:string; requestSchema?:string; responseSchema?:string; }
export interface ApiValidationResult { valid:boolean; errors:string[]; }

export interface ApiRouteRegistryPort { register(route:RouteDefinition):Promise<void>; resolve(method:ApiMethod,path:string):Promise<RouteDefinition|undefined>; }
export interface ApiValidationPort { validate<T>(request:ApiRequest<T>, route:RouteDefinition):Promise<ApiValidationResult>; }
export interface ApiAuthenticationPort { authenticate<T>(request:ApiRequest<T>):Promise<ApiContext>; }
export interface ApiAuthorizationPort { authorize(context:ApiContext, route:RouteDefinition):Promise<boolean>; }
export interface ApiRateLimitPort { check(context:ApiContext, policy:ApiPolicy):Promise<boolean>; }
export interface ApiUseCasePort { execute<TReq,TRes>(useCase:string, request:ApiRequest<TReq>):Promise<TRes>; }
export interface ApiResponsePort { success<T>(request:ApiRequest<unknown>,data:T,statusCode?:number):ApiResponse<T>; failure(request:ApiRequest<unknown>,error:ApiError,statusCode:number):ApiResponse<never>; }
export interface ApiContractPort { resolve(route:RouteDefinition):Promise<ApiContract|undefined>; }
export interface ApiAuditPort { record(event:Record<string,unknown>):Promise<void>; }
export interface ApiTelemetryPort { record(event:Record<string,unknown>):Promise<void>; }
export interface ApiSecurityPort { validateMetadata(metadata?:Record<string,unknown>):ApiValidationResult; }

const SENSITIVE=/(password|secret|private[_ -]?key|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|authorization|bearer|cvv|cvc|pan|card[_ -]?number)/i;
export function validateMetadata(metadata?:Record<string,unknown>):ApiValidationResult { const errors:string[]=[]; for(const key of Object.keys(metadata??{})) if(SENSITIVE.test(key)) errors.push(`Sensitive metadata key is not allowed: ${key}`); return {valid:errors.length===0,errors}; }
export function validateRequest<T>(request:ApiRequest<T>):ApiValidationResult { const errors:string[]=[]; if(!request.id.trim()) errors.push('Request id is required'); if(!request.path.startsWith('/')) errors.push('Path must start with /'); if(!request.context.tenantId.trim()) errors.push('Tenant id is required'); if(!request.context.correlationId.trim()) errors.push('Correlation id is required'); if(!request.context.requestId.trim()) errors.push('Context request id is required'); const m=validateMetadata(request.context.metadata); errors.push(...m.errors); return {valid:errors.length===0,errors}; }
export function normalizePath(path:string):string { return path.trim().replace(/^\/+/, '/').replace(/\/{2,}/g,'/').replace(/\/$/,'') || '/'; }
export function buildResponse<T>(request:ApiRequest<unknown>,data:T,statusCode=200):ApiResponse<T> { return {requestId:request.id,correlationId:request.context.correlationId,statusCode,status:'SUCCESS',data}; }
export function buildError(request:ApiRequest<unknown>,error:ApiError,statusCode:number):ApiResponse<never> { const status:ResponseStatus=statusCode>=500?'SERVER_ERROR':statusCode>=400?'CLIENT_ERROR':'REJECTED'; return {requestId:request.id,correlationId:request.context.correlationId,statusCode,status,error}; }
export const STEP_70={name:'API & Delivery Layer Foundation',version:'1.0.0',status:'FOUNDATION',providerNeutral:true,flow:'Client → API Route → Validation/Auth/Policy → Application Use Case → Response → Audit/Telemetry',ownership:['API request/response contracts','route registry and versioning','delivery validation','authentication/authorization boundaries','rate-limit and timeout policy boundaries','API-to-application use-case dispatch','normalized API errors/responses','API audit and telemetry boundaries'],exclusions:['business-domain ownership','domain business rules','customer identity source of truth','payment/accounting source of truth','analytics source of truth','audit source of truth','provider credentials and secrets']};
