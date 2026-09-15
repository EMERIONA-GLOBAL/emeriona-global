import type { Environment, RuntimeContext, RuntimePolicy } from './index.js';

export interface RuntimeHttpContext extends RuntimeContext {
  requestId: string;
  actorId?: string;
  locale?: string;
  timezone?: string;
}

export interface RuntimeHttpRequest {
  request: Request;
  service: string;
  environment: Environment;
  version: string;
}

export const DEFAULT_RUNTIME_POLICY: RuntimePolicy = {
  timeoutMs: 30_000,
  maxRequestBytes: 1_048_576,
  retryLimit: 0,
};

function requiredHeader(request: Request, name: string): string {
  const value = request.headers.get(name)?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function createRuntimeHttpContext(input: RuntimeHttpRequest): RuntimeHttpContext {
  const { request, service, environment, version } = input;
  const tenantId = requiredHeader(request, 'x-tenant-id');
  const requestId = request.headers.get('x-request-id')?.trim() || crypto.randomUUID();
  const correlationId = request.headers.get('x-correlation-id')?.trim() || requestId;
  const actorId = request.headers.get('x-actor-id')?.trim() || undefined;
  const locale = request.headers.get('accept-language')?.split(',')[0]?.trim() || undefined;
  const timezone = request.headers.get('x-timezone')?.trim() || undefined;

  return { tenantId, service, environment, version, correlationId, requestId, actorId, locale, timezone };
}

export function validateRuntimeHttpPolicy(request: Request, policy: RuntimePolicy = DEFAULT_RUNTIME_POLICY): void {
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    const bytes = Number(contentLength);
    if (!Number.isFinite(bytes) || bytes < 0 || bytes > policy.maxRequestBytes) {
      throw new Error('request_body_too_large');
    }
  }
}

export const RUNTIME_HTTP_VERSION = '1.0.0' as const;
