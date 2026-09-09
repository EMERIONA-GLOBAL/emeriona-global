export type EventVersion = `v${number}`;
export type EventId = string;
export type EventName = string;
export type EventSource = 'WEB' | 'APP' | 'PORTAL' | 'API' | 'SYSTEM' | 'ADMIN' | 'EXTERNAL' | 'CUSTOM';
export type EventDelivery = 'AT_MOST_ONCE' | 'AT_LEAST_ONCE';
export type EventStatus = 'PUBLISHED' | 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'FAILED' | 'DEAD_LETTERED';
export interface EventMetadata { eventId: EventId; eventName: EventName; version: EventVersion; occurredAt: string; source: EventSource; tenantId?: string; actorId?: string; identityId?: string; customerAccountId?: string; correlationId?: string; causationId?: string; requestId?: string; sessionId?: string; }
export interface DomainEvent<TPayload = unknown> { metadata: EventMetadata; payload: TPayload; }
export interface EventSubscription { subscriptionId: string; eventName: EventName; version?: EventVersion; consumer: string; enabled: boolean; delivery: EventDelivery; maxAttempts?: number; }
export interface EventPublishResult { eventId: EventId; status: EventStatus; acceptedAt: string; deliveredCount: number; failedCount: number; }
export interface EventHandlerResult { handled: boolean; retryable?: boolean; reason?: string; }
export interface EventFailure { eventId: EventId; subscriptionId: string; attempt: number; failedAt: string; errorCode?: string; reason?: string; retryable: boolean; }
