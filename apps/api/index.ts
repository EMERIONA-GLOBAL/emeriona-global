import { createFoundationRuntime } from "../../packages/infrastructure/src/index.js";
import type { D1DatabaseLike } from "../../packages/infrastructure/src/index.js";
import type { UseCaseId, UseCaseRequest } from "../../packages/application/src/index.js";

interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  DB: D1DatabaseLike;
  ASSETS: AssetsBinding;
}

const ROUTES: Record<string, UseCaseId> = {
  "/api/v1/customers": "customer.create" as UseCaseId,
  "/api/v1/products": "catalog.product.create" as UseCaseId,
  "/api/v1/services": "catalog.service.create" as UseCaseId,
  "/api/v1/partners": "partner.create" as UseCaseId,
  "/api/v1/carts": "cart.create" as UseCaseId,
  "/api/v1/orders": "order.create" as UseCaseId,
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function requestId(request: Request): string {
  return request.headers.get("x-request-id")?.trim() || crypto.randomUUID();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ service: "emeriona-global", status: "ok", layer: "api-runtime" });
    }

    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405);
    }

    const useCaseId = ROUTES[url.pathname];
    if (!useCaseId) return json({ error: "not_found" }, 404);

    const tenantId = request.headers.get("x-tenant-id")?.trim();
    const actorId = request.headers.get("x-actor-id")?.trim();
    if (!tenantId || !actorId) {
      return json({ error: "tenant_and_actor_context_required" }, 400);
    }

    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const correlationId = request.headers.get("x-correlation-id")?.trim() || crypto.randomUUID();
    const idempotencyKey = request.headers.get("idempotency-key")?.trim() || undefined;
    const currency = request.headers.get("x-currency")?.trim() || "USD";

    const foundation = createFoundationRuntime(env.DB, {
      tenantId,
      currency,
      authorize: async (requestedUseCase) => requestedUseCase === useCaseId && actorId.length > 0,
    });

    const requestEnvelope: UseCaseRequest<unknown> = {
      useCaseId,
      context: {
        tenantId: tenantId as UseCaseRequest<unknown>["context"]["tenantId"],
        correlationId: correlationId as UseCaseRequest<unknown>["context"]["correlationId"],
        actorId,
        requestId: requestId(request),
        metadata: { transport: "cloudflare-worker" },
      },
      input,
      idempotencyKey,
    };

    try {
      const result = await foundation.execute<unknown, unknown>(requestEnvelope);
      return json({ data: result.output, meta: { useCaseId: result.useCaseId, correlationId: result.correlationId } }, 200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Use case execution failed";
      return json({ error: "use_case_failed", message, correlationId }, 400);
    }
  },
};
