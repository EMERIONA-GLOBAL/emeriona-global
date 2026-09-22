export type TenantId=string & {readonly __brand:'TenantId'};
export type CorrelationId=string & {readonly __brand:'CorrelationId'};
export type UseCaseId=string & {readonly __brand:'UseCaseId'};
export interface UseCaseContext{tenantId:TenantId;correlationId:CorrelationId;actorId?:string;requestId?:string;locale?:string;timezone?:string;metadata?:Record<string,unknown>}
export interface UseCaseRequest<T>{useCaseId:UseCaseId;context:UseCaseContext;input:T;idempotencyKey?:string}
export interface UseCaseResponse<T>{useCaseId:UseCaseId;correlationId:CorrelationId;output:T}
export interface UseCaseHandler<T,R>{handle(request:UseCaseRequest<T>):Promise<UseCaseResponse<R>>}
export interface UseCaseBus{register<T,R>(id:UseCaseId,handler:UseCaseHandler<T,R>):void;execute<T,R>(request:UseCaseRequest<T>):Promise<UseCaseResponse<R>>}
const SENSITIVE=/(password|secret|private[_ -]?key|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|authorization|bearer|cvv|cvc|pan|card[_ -]?number)/i;
export function validateMetadata(value:unknown):void{if(value===null||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(validateMetadata);return;}for(const [k,v] of Object.entries(value as Record<string,unknown>)){if(SENSITIVE.test(k))throw new Error(`Sensitive metadata key is not allowed: ${k}`);validateMetadata(v);}}
export function validateRequest<T>(request:UseCaseRequest<T>):void{if(!request.useCaseId?.trim())throw new Error('useCaseId is required');if(!request.context.tenantId?.trim())throw new Error('tenantId is required');if(!request.context.correlationId?.trim())throw new Error('correlationId is required');validateMetadata(request.context.metadata);validateMetadata(request.input);if(request.idempotencyKey!==undefined&&!request.idempotencyKey.trim())throw new Error('idempotencyKey cannot be empty');}
export class DefaultUseCaseBus implements UseCaseBus{private readonly handlers=new Map<string,UseCaseHandler<unknown,unknown>>();register<T,R>(id:UseCaseId,handler:UseCaseHandler<T,R>):void{if(this.handlers.has(id))throw new Error(`Use case already registered: ${id}`);this.handlers.set(id,handler as UseCaseHandler<unknown,unknown>);}async execute<T,R>(request:UseCaseRequest<T>):Promise<UseCaseResponse<R>>{validateRequest(request);const handler=this.handlers.get(request.useCaseId);if(!handler)throw new Error(`Use case handler not found: ${request.useCaseId}`);return handler.handle(request) as Promise<UseCaseResponse<R>>;}}
export type { ApplicationRepository, TransactionPort, AuthorizationPort, IdempotencyPort, AuditPort, TelemetryPort } from './ports.js';
export { APPLICATION_PORTS_VERSION } from './ports.js';
export type { UseCaseRuntimeDependencies, UseCaseRuntime } from './runtime.js';
export { DefaultUseCaseRuntime, APPLICATION_RUNTIME_VERSION } from './runtime.js';
export type { UseCaseDomain, UseCaseLifecycle, UseCaseContract, UseCaseContractRegistry } from './contracts.js';
export { USE_CASE_IDS, USE_CASE_CONTRACTS, DefaultUseCaseContractRegistry, USE_CASE_CONTRACTS_VERSION } from './contracts.js';
export type { ApplicationIdFactory, CreateCustomerInput, UpdateCustomerInput, CreateProductInput, UpdateProductInput, CreateServiceInput, UpdateServiceInput, CreatePartnerInput, UpdatePartnerInput, CreateCartInput, UpdateCartInput, CreateOrderInput, CreatePaymentInput, RecommendationInput, PartnerCatalogCreateInput, PartnerProductUpdateInput, VerifyPartnerInput } from './capabilities.js';
export { CreateCustomerHandler, UpdateCustomerHandler, CreateProductHandler, UpdateProductHandler, CreateServiceHandler, UpdateServiceHandler, CreatePartnerHandler, UpdatePartnerHandler, VerifyPartnerHandler, CreatePartnerProductHandler, UpdatePartnerProductHandler, CreatePartnerServiceHandler, CreateCartHandler, UpdateCartHandler, CreateOrderHandler, ResolvePriceHandler, ValidateDiscountHandler, CreatePaymentIntentHandler, GenerateRecommendationHandler, EXECUTABLE_FOUNDATION_USE_CASES, APPLICATION_CAPABILITIES_VERSION } from './capabilities.js';
export type { UpdateOrderInput, OrderLifecyclePort } from "./order-lifecycle-capability.js";
export { UpdateOrderHandler, ORDER_LIFECYCLE_APPLICATION_VERSION } from "./order-lifecycle-capability.js";
export type { PartnerServiceUpdateInput } from './partner-service-update-capability.js';
export { UpdatePartnerServiceHandler, PARTNER_SERVICE_UPDATE_APPLICATION_VERSION } from './partner-service-update-capability.js';
export type { AuthorizePaymentInput } from "./payment-authorization-capability.js";
export { AuthorizePaymentHandler, PAYMENT_AUTHORIZATION_APPLICATION_VERSION } from "./payment-authorization-capability.js";
export type { CapturePaymentInput } from "./payment-capture-capability.js";
export { CapturePaymentHandler, PAYMENT_CAPTURE_APPLICATION_VERSION } from "./payment-capture-capability.js";
export type { RefundPaymentInput } from "./payment-refund-capability.js";
export { RefundPaymentHandler, PAYMENT_REFUND_APPLICATION_VERSION } from "./payment-refund-capability.js";
export type { PaymentStatusInput } from "./payment-status-capability.js";
export { PaymentStatusHandler, PAYMENT_STATUS_APPLICATION_VERSION } from "./payment-status-capability.js";
export type { CreateInvoiceInput, CreateSettlementInput, BillingQueryInput, BillingPort } from './billing-capabilities.js';
export { CreateInvoiceHandler, CreateSettlementHandler, BillingQueryHandler, BILLING_APPLICATION_VERSION } from './billing-capabilities.js';
export type { FulfillmentInput, FulfillmentProgressInput, FulfillmentPort } from './fulfillment-capabilities.js';
export { CreateFulfillmentHandler, ProgressFulfillmentHandler, FULFILLMENT_APPLICATION_VERSION } from './fulfillment-capabilities.js';
export type { ReturnCreateInput, ReturnProgressInput, RefundRequestCreateInput, RefundRequestProgressInput, ReturnsRefundsPort } from './returns-refunds-capabilities.js';
export { CreateReturnHandler, ProgressReturnHandler, CreateRefundRequestHandler, ProgressRefundRequestHandler, RETURNS_REFUNDS_APPLICATION_VERSION } from './returns-refunds-capabilities.js';
export type { MarketCatalogQueryInput } from './market-catalog-query-capability.js';
export type { CatalogCategoryQueryInput, CatalogCategoryQueryOutput } from './catalog-category-query-capability.js';
export { QueryCatalogCategoriesHandler, CATALOG_CATEGORY_QUERY_APPLICATION_VERSION } from './catalog-category-query-capability.js';
export { QueryMarketCatalogHandler, MARKET_CATALOG_QUERY_APPLICATION_VERSION } from './market-catalog-query-capability.js';
export type { CreateCatalogInput } from './catalog-capability.js';
export { CreateCatalogHandler, CATALOG_APPLICATION_VERSION } from './catalog-capability.js';
export type { CreateCatalogProductInput, UpdateCatalogProductInput } from './catalog-product-capability.js';
export { CreateCatalogProductHandler, UpdateCatalogProductHandler, CATALOG_PRODUCT_APPLICATION_VERSION } from './catalog-product-capability.js';
export type { CartItemInput, CartItemResult, CheckoutResult, OperationalCommercePort } from './operational-commerce.js';
export { AddCartItemHandler, CheckoutHandler, OPERATIONAL_COMMERCE_VERSION } from './operational-commerce.js';
export type { PricingQuoteInput, PromotionValidationInput } from './pricing-promotions-capabilities.js';
export { ResolvePricingQuoteHandler, ValidatePromotionHandler, PRICING_PROMOTIONS_APPLICATION_VERSION } from './pricing-promotions-capabilities.js';
export type { PublishCatalogInput, PublishCatalogOutput, CatalogPublicationPort, PublishPartnerCatalogInput } from './catalog-publish-capability.js';
export { PublishCatalogHandler, PublishPartnerCatalogHandler, CATALOG_PUBLICATION_APPLICATION_VERSION } from './catalog-publish-capability.js';
export type { CreatePartnerOfferInput, UpdatePartnerOfferInput } from './partner-offer-capability.js';
export { CreatePartnerOfferHandler, UpdatePartnerOfferHandler, PARTNER_OFFERS_APPLICATION_VERSION } from './partner-offer-capability.js';
export type { AuthPrincipal, AuthIdentity, AuthSession, PrincipalType, AuthPrincipalStatus, AuthIdentityStatus, AuthSessionStatus, IdentityAuthorizationPort } from './identity-authorization.js';
export { IDENTITY_AUTHORIZATION_APPLICATION_VERSION } from './identity-authorization.js';
export type { PartnerIntelligenceInput, PartnerAnalytics, PartnerPerformance, PartnerImpact, PartnerIntelligencePort } from './partner-intelligence-capabilities.js';
export { QueryPartnerAnalyticsHandler, QueryPartnerPerformanceHandler, MeasurePartnerImpactHandler, PARTNER_INTELLIGENCE_APPLICATION_VERSION } from './partner-intelligence-capabilities.js';
export type { CreateSolutionInput, UpdateSolutionInput, QuerySolutionInput, SolutionQueryOutput } from "./solution-capability.js";
export { CreateSolutionHandler, UpdateSolutionHandler, QuerySolutionHandler, SOLUTION_APPLICATION_VERSION } from "./solution-capability.js";
export type { CreateCommercialInquiryInput, UpdateCommercialInquiryInput, QueryCommercialInquiryInput } from "./commercial-inquiry-capability.js";
export { CreateCommercialInquiryHandler, UpdateCommercialInquiryHandler, QueryCommercialInquiryHandler, COMMERCIAL_INQUIRY_APPLICATION_VERSION } from "./commercial-inquiry-capability.js";
export const STEP_69={name:'Application Layer & Use-Case Orchestration Foundation',version:'2.1.0',status:'OPERATIONAL_D1_PATH',providerNeutral:true} as const;

export { QueryProductHandler, QueryServiceHandler, CATALOG_ENTITY_QUERY_APPLICATION_VERSION } from "./catalog-entity-query-capability.js";
export type { CatalogEntityQueryInput, ProductQueryOutput, ServiceQueryOutput } from "./catalog-entity-query-capability.js";
