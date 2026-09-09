export type Brand<T, B extends string> = T & { readonly __brand: B };
export type EntityId = Brand<string, "EntityId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type EventId = Brand<string, "EventId">;
export type Version = Brand<string, "Version">;
export interface Metadata { readonly version: Version; readonly createdAt: string; readonly updatedAt?: string; readonly correlationId?: CorrelationId; readonly source?: string; readonly tags?: readonly string[]; }
export interface RequestContext { readonly requestId: CorrelationId; readonly tenantId: EntityId; readonly actorId?: EntityId; readonly locale?: string; readonly region?: string; readonly metadata?: Readonly<Record<string, unknown>>; }
export interface Success<T> { readonly ok: true; readonly value: T; }
export interface Failure { readonly ok: false; readonly error: CoreError; }
export type Result<T> = Success<T> | Failure;
export interface CoreError { readonly code: string; readonly message: string; readonly category: "VALIDATION"|"NOT_FOUND"|"CONFLICT"|"UNAUTHORIZED"|"FORBIDDEN"|"DEPENDENCY"|"INTERNAL"; readonly retryable?: boolean; readonly details?: Readonly<Record<string, unknown>>; }
export type DomainEventName = Brand<string, "DomainEventName">;
export interface DomainEvent<T extends object = Record<string, unknown>> { readonly id: EventId; readonly name: DomainEventName; readonly version: Version; readonly occurredAt: string; readonly aggregateId: EntityId; readonly tenantId: EntityId; readonly correlationId: CorrelationId; readonly payload: T; readonly metadata?: Readonly<Record<string, unknown>>; }
export interface EventEnvelope<T extends object = Record<string, unknown>> { readonly event: DomainEvent<T>; readonly schemaVersion: Version; readonly publishedAt?: string; }
export interface Contract<TRequest, TResponse> { readonly name: string; readonly version: Version; validateRequest(input: TRequest): Result<TRequest>; validateResponse(output: TResponse): Result<TResponse>; }
export interface Validator<T> { validate(input: T): Result<T>; }
export interface IdFactory { entity(): EntityId; correlation(): CorrelationId; event(): EventId; }
export interface Clock { now(): string; }
export interface EventPublisher { publish<T extends object>(envelope: EventEnvelope<T>): Promise<Result<void>>; }
export interface EventSubscriber { subscribe<T extends object>(name: DomainEventName, handler: (event: DomainEvent<T>) => Promise<Result<void>>): Promise<Result<void>>; }
const SENSITIVE=/(password|secret|private[_ -]?key|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|authorization|bearer|cvv|cvc|pan|card[_ -]?number)/i;
export function validateMetadata(metadata?: Readonly<Record<string, unknown>>): Result<void> { if(!metadata)return {ok:true,value:undefined}; for(const key of Object.keys(metadata)) if(SENSITIVE.test(key)) return {ok:false,error:{code:"CORE_SENSITIVE_METADATA",message:`Sensitive metadata key rejected: ${key}`,category:"VALIDATION"}}; return {ok:true,value:undefined}; }
export function ok<T>(value:T):Success<T>{return {ok:true,value};}
export function fail(error:CoreError):Failure{return {ok:false,error};}
export function asEntityId(value:string):EntityId{if(!value.trim())throw new Error("EntityId cannot be empty");return value as EntityId;}
export function asCorrelationId(value:string):CorrelationId{if(!value.trim())throw new Error("CorrelationId cannot be empty");return value as CorrelationId;}
export function asEventId(value:string):EventId{if(!value.trim())throw new Error("EventId cannot be empty");return value as EventId;}
export function asVersion(value:string):Version{if(!/^\d+\.\d+\.\d+$/.test(value))throw new Error("Version must be semantic x.y.z");return value as Version;}
export function validateContext(context:RequestContext):Result<RequestContext>{if(!context.requestId||!context.tenantId)return fail({code:"CORE_CONTEXT_INVALID",message:"requestId and tenantId are required",category:"VALIDATION"});const meta=validateMetadata(context.metadata);return meta.ok?ok(context):meta;}
export const STEP_66={name:"Shared Core & Contracts Integration Foundation",version:"1.0.0",status:"FOUNDATION",providerNeutral:true} as const;
