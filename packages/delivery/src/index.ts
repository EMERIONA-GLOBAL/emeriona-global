export type ApiStatus='DRAFT'|'ACTIVE'|'PAUSED'|'DEPRECATED'|'RETIRED';
export type ApiMethod='GET'|'POST'|'PUT'|'PATCH'|'DELETE';
export interface ApiContext{tenantId:string;correlationId:string;requestId:string;actorId?:string;locale?:string;region?:string;metadata?:Record<string,unknown>}
export interface ApiRequest<T=unknown>{id:string;method:ApiMethod;path:string;context:ApiContext;body?:T;query?:Record<string,string>;headers?:Record<string,string>}
export interface ApiResponse<T=unknown>{requestId:string;correlationId:string;statusCode:number;status:'SUCCESS'|'CLIENT_ERROR'|'SERVER_ERROR'|'REJECTED'|'TIMEOUT';data?:T;error?:{code:string;message:string;retryable?:boolean;details?:Record<string,unknown>}}
export interface RouteDefinition{id:string;method:ApiMethod;path:string;useCase:string;version:string;status:ApiStatus;authRequired:boolean}
const SENSITIVE=/(password|secret|private[_ -]?key|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|authorization|bearer|cvv|cvc|pan|card[_ -]?number)/i;
export function validateMetadata(metadata?:Record<string,unknown>):string[]{return Object.keys(metadata??{}).filter(k=>SENSITIVE.test(k));}
export function validateRequest<T>(request:ApiRequest<T>):string[]{const e:string[]=[];if(!request.id.trim())e.push('Request id is required');if(!request.path.startsWith('/'))e.push('Path must start with /');if(!request.context.tenantId.trim())e.push('Tenant id is required');if(!request.context.correlationId.trim())e.push('Correlation id is required');if(!request.context.requestId.trim())e.push('Context request id is required');e.push(...validateMetadata(request.context.metadata));return e;}
export function normalizePath(path:string):string{return path.trim().replace(/^\/+/, '/').replace(/\/{2,}/g,'/').replace(/\/$/,'')||'/';}
export function buildResponse<T>(request:ApiRequest<unknown>,data:T,statusCode=200):ApiResponse<T>{return {requestId:request.id,correlationId:request.context.correlationId,statusCode,status:'SUCCESS',data};}
export const STEP_70={name:'API & Delivery Layer Foundation',version:'1.0.0',status:'FOUNDATION',providerNeutral:true} as const;
