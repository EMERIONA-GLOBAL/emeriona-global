import type { DomainEvent, EventFailure, EventHandlerResult, EventPublishResult, EventSubscription } from './types';
export interface EventBusPort { publish<T>(event: DomainEvent<T>): Promise<EventPublishResult>; publishBatch<T>(events: DomainEvent<T>[]): Promise<EventPublishResult[]>; }
export interface EventPublisherPort { publish<T>(event: DomainEvent<T>): Promise<EventPublishResult>; }
export interface EventSubscriberPort { subscribe(subscription: EventSubscription): Promise<void>; unsubscribe(subscriptionId: string): Promise<void>; }
export interface EventHandlerPort<TPayload = unknown> { handle<T extends TPayload>(event: DomainEvent<T>): Promise<EventHandlerResult>; }
export interface EventRouterPort { resolve(event: DomainEvent): Promise<EventSubscription[]>; }
export interface EventRepository { append<T>(event: DomainEvent<T>): Promise<void>; findById(eventId: string): Promise<DomainEvent | null>; }
export interface EventSubscriptionRepository { save(subscription: EventSubscription): Promise<void>; findByEvent(eventName: string, version?: string): Promise<EventSubscription[]>; }
export interface EventIdempotencyPort { hasProcessed(key: string): Promise<boolean>; markProcessed(key: string): Promise<void>; }
export interface EventFailurePort { record(failure: EventFailure): Promise<void>; deadLetter(failure: EventFailure): Promise<void>; }
export interface EventAuditPort { record(event: DomainEvent, status: string): Promise<void>; }
export interface EventTelemetryPort { record(event: DomainEvent, status: string, durationMs?: number): Promise<void>; }
export interface EventActivationPolicy { isEnabled(eventName: string, context?: { tenantId?: string; environment?: string }): Promise<boolean>; }
