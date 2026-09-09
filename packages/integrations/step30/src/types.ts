export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiEnvironment = 'development' | 'staging' | 'production';
export type RequestSource = 'WEB' | 'APP' | 'PORTAL' | 'API' | 'SYSTEM' | 'ADMIN' | 'EXTERNAL';
export type ResponseStatus = 'SUCCESS' | 'CLIENT_ERROR' | 'SERVER_ERROR' | 'REJECTED';
export type IntegrationKind = 'INTERNAL' | 'PARTNER' | 'PUBLIC' | 'WEBHOOK' | 'ASYNC';
export interface ApiRequestContext { requestId: string; correlationId?: string; tenantId?: string; identityId?: string; customerAccountId?: string; environment: ApiEnvironment; source: RequestSource; timestamp: string; }
export interface ApiRequest { context: ApiRequestContext; method: HttpMethod; path: string; operation: string; version: string; idempotencyKey?: string; payload?: unknown; }
export interface ApiResponse<T = unknown> { requestId: string; correlationId?: string; status: ResponseStatus; statusCode: number; version: string; data?: T; error?: ApiError; timestamp: string; }
export interface ApiError { code: string; message: string; retryable: boolean; details?: Record<string, unknown>; }
export interface IntegrationEndpoint { id: string; name: string; kind: IntegrationKind; basePath: string; version: string; enabled: boolean; requiresAuthorization: boolean; }
export interface WebhookEvent { eventId: string; eventType: string; version: string; occurredAt: string; source: string; correlationId?: string; payload: unknown; }
