import { createFoundationRuntime } from "../../packages/infrastructure/src/index.js";
import type { D1DatabaseLike } from "../../packages/infrastructure/src/index.js";
import type { UseCaseId, UseCaseRequest } from "../../packages/application/src/index.js";
import { API_VERSION, createApiError, hasApiPath, resolveApiRoute, createRuntimeHttpContext, validateRuntimeHttpPolicy, RUNTIME_HTTP_VERSION } from "../../packages/runtime/src/index.js";
export { EmerionaCoreWorkflow } from "./workflows.js";
interface AssetsBinding { fetch(request: Request): Promise<Response> }
interface Env { DB: D1DatabaseLike; ASSETS: AssetsBinding }
function json(data: unknown, status = 200, headers?: HeadersInit): Response { return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } }); }
function errorResponse(code: Parameters<typeof createApiError>[0], message: string, status: number, context?: { requestId?: string; correlationId?: string }): Response { return json(createApiError(code, message, context), status); }
function validCurrency(value: string | null): value is string { return value !== null && /^[A-Z]{3}$/.test(value.trim()); }
async function checkDatabase(db: D1DatabaseLike): Promise<{ status: "ok" | "error"; latencyMs: number }> { const started = Date.now(); await db.prepare("SELECT 1 AS ok").all<{ ok: number }>(); return { status: "ok", latencyMs: Date.now() - started }; }
export default { async fetch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url); const path = url.pathname; const route = resolveApiRoute(path, request.method);
  if (!path.startsWith("/api/")) return env.ASSETS.fetch(request);
  if (path === "/api/health") { if (!route) return errorResponse("method_not_allowed", "Method not allowed", 405); return json({ service: "emeriona-global", status: "ok", layer: "api-runtime", apiVersion: API_VERSION, runtimeVersion: RUNTIME_HTTP_VERSION, workflow: "emeriona-core-workflow" }); }
  if (path === "/api/health/ready") {
    if (request.method !== "GET") return errorResponse("method_not_allowed", "Method not allowed", 405);
    try { const database = await checkDatabase(env.DB); return json({ service: "emeriona-global", status: "ready", dependencies: { database }, apiVersion: API_VERSION, runtimeVersion: RUNTIME_HTTP_VERSION }); }
    catch (error) { return json({ service: "emeriona-global", status: "not_ready", dependencies: { database: { status: "error", message: error instanceof Error ? error.message : "Database readiness check failed" } }, apiVersion: API_VERSION, runtimeVersion: RUNTIME_HTTP_VERSION }, 503); }
  }
  if (!hasApiPath(path)) return errorResponse("not_found", "API route not found", 404);
  if (!route || route.route.kind !== "USE_CASE" || !route.route.useCaseId) return errorResponse("method_not_allowed", "Method not allowed", 405);
  const useCaseId = route.route.useCaseId as UseCaseId; let runtimeContext;
  try { runtimeContext = createRuntimeHttpContext({ request, service: "emeriona-global-api", environment: "PRODUCTION", version: RUNTIME_HTTP_VERSION }); validateRuntimeHttpPolicy(request); }
  catch (error) { return errorResponse("invalid_runtime_context", error instanceof Error ? error.message : "Invalid runtime context", 400); }
  const actorId = runtimeContext.actorId; const requestContext = { requestId: runtimeContext.requestId, correlationId: runtimeContext.correlationId };
  if (!actorId) return errorResponse("tenant_and_actor_context_required", "Tenant and actor context are required", 400, requestContext);
  const currency = request.headers.get("x-currency"); if (!validCurrency(currency)) return errorResponse("valid_currency_required", "A valid ISO 4217 currency code is required", 400, requestContext);
  let input: unknown; try { input = await request.json(); } catch { return errorResponse("invalid_json", "Request body must be valid JSON", 400, requestContext); }
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || undefined; const foundation = createFoundationRuntime(env.DB, { tenantId: runtimeContext.tenantId, currency: currency.trim(), authorize: async requestedUseCase => requestedUseCase === useCaseId && actorId.length > 0 });
  const envelope: UseCaseRequest<unknown> = { useCaseId, context: { tenantId: runtimeContext.tenantId as UseCaseRequest<unknown>["context"]["tenantId"], correlationId: runtimeContext.correlationId as UseCaseRequest<unknown>["context"]["correlationId"], actorId, requestId: runtimeContext.requestId, locale: runtimeContext.locale, timezone: runtimeContext.timezone, metadata: { transport: "cloudflare-worker", runtimeVersion: RUNTIME_HTTP_VERSION, apiVersion: API_VERSION, workflow: "emeriona-core-workflow" } }, input, idempotencyKey };
  try { const result = await foundation.execute<unknown, unknown>(envelope); return json({ data: result.output, meta: { useCaseId: result.useCaseId, correlationId: result.correlationId, requestId: runtimeContext.requestId, apiVersion: API_VERSION } }); }
  catch (error) { return errorResponse("use_case_failed", error instanceof Error ? error.message : "Use case execution failed", 400, requestContext); }
} };
