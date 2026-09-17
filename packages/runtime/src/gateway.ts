import type { UseCaseId } from '../../application/src/index.js';
export const API_VERSION = 'v1' as const;
export type ApiMethod = 'GET' | 'POST';
export type ApiRouteKind = 'HEALTH' | 'USE_CASE';
export interface ApiRouteDefinition { method: ApiMethod; path: string; version: typeof API_VERSION; kind: ApiRouteKind; useCaseId?: UseCaseId; }
export interface ApiRouteMatch { route: ApiRouteDefinition; path: string; method: ApiMethod; }
export type ApiErrorCode = 'method_not_allowed' | 'not_found' | 'invalid_runtime_context' | 'tenant_and_actor_context_required' | 'valid_currency_required' | 'invalid_json' | 'use_case_failed';
export interface ApiErrorBody { code: ApiErrorCode; message: string; requestId?: string; correlationId?: string; }
export interface ApiErrorEnvelope { error: ApiErrorBody; }
const USE_CASE_ROUTES: ReadonlyArray<ApiRouteDefinition> = [
  { method: 'POST', path: '/api/v1/customers', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'customer.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/catalogs', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'catalog.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/products', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'catalog.product.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/products/update', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'catalog.product.update' as UseCaseId },
  { method: 'POST', path: '/api/v1/catalog-products', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'catalog.product.create.bound' as UseCaseId },
  { method: 'POST', path: '/api/v1/services', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'catalog.service.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/services/update', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'catalog.service.update' as UseCaseId },
  { method: 'POST', path: '/api/v1/catalogs/publish', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'catalog.publish' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners/update', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.update' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners/verify', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.verify' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners/products', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.product.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners/products/update', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.product.update' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners/services', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.service.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners/services/update', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.service.update' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners/catalogs/publish', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.catalog.publish' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners/offers', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.offer.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners/offers/update', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.offer.update' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners/analytics', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.analytics.query' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners/performance', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.performance.query' as UseCaseId },
  { method: 'POST', path: '/api/v1/partners/impact', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'partner.impact.measure' as UseCaseId },
  { method: 'POST', path: '/api/v1/carts', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'cart.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/cart-items', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'cart.item.add' as UseCaseId },
  { method: 'POST', path: '/api/v1/checkout', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'checkout.execute' as UseCaseId },
  { method: 'POST', path: '/api/v1/orders', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'order.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/payment-intents', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'payment.intent.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/invoices', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'billing.invoice.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/settlements', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'billing.settlement.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/fulfillments', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'fulfillment.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/fulfillments/progress', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'fulfillment.progress' as UseCaseId },
  { method: 'POST', path: '/api/v1/returns', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'return.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/returns/progress', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'return.progress' as UseCaseId },
  { method: 'POST', path: '/api/v1/refund-requests', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'refund.request.create' as UseCaseId },
  { method: 'POST', path: '/api/v1/refund-requests/progress', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'refund.request.progress' as UseCaseId },
  { method: 'POST', path: '/api/v1/pricing/quote', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'pricing.quote' as UseCaseId },
  { method: 'POST', path: '/api/v1/promotions/discounts/validate', version: API_VERSION, kind: 'USE_CASE', useCaseId: 'discount.validate' as UseCaseId },
];
export const API_ROUTES: ReadonlyArray<ApiRouteDefinition> = [{ method: 'GET', path: '/api/health', version: API_VERSION, kind: 'HEALTH' }, ...USE_CASE_ROUTES];
export function resolveApiRoute(path: string, method: string): ApiRouteMatch | null { const normalizedMethod = method.toUpperCase(); const route = API_ROUTES.find((candidate) => candidate.path === path && candidate.method === normalizedMethod); if (!route) return null; return { route, path, method: normalizedMethod as ApiMethod }; }
export function hasApiPath(path: string): boolean { return API_ROUTES.some((route) => route.path === path); }
export function createApiError(code: ApiErrorCode, message: string, context?: Pick<ApiErrorBody, 'requestId' | 'correlationId'>): ApiErrorEnvelope { return { error: { code, message, ...context } }; }
