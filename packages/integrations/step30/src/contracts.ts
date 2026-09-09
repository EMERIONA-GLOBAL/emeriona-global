import { ApiRequest, ApiResponse, IntegrationEndpoint, WebhookEvent } from './types';
export interface ApiRouterPort { dispatch<T = unknown>(request: ApiRequest): Promise<ApiResponse<T>>; }
export interface ApiRequestValidationPort { validate(request: ApiRequest): Promise<void>; }
export interface ApiAuthorizationPort { authorize(request: ApiRequest): Promise<boolean>; }
export interface ApiRateLimitPort { check(request: ApiRequest): Promise<boolean>; }
export interface ApiIdempotencyPort { begin(key: string, requestId: string): Promise<boolean>; complete(key: string, response: ApiResponse): Promise<void>; }
export interface ApiEndpointRegistryPort { register(endpoint: IntegrationEndpoint): Promise<void>; find(operation: string, version: string): Promise<IntegrationEndpoint | undefined>; }
export interface WebhookPort { publish(event: WebhookEvent, endpointId: string): Promise<void>; }
export interface IntegrationHealthPort { check(endpointId: string): Promise<boolean>; }
export interface ApiAuditPort { record(request: ApiRequest, response: ApiResponse): Promise<void>; }
export interface ApiTelemetryPort { record(request: ApiRequest, response: ApiResponse, durationMs: number): Promise<void>; }
