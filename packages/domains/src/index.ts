export type { EntityRecord, EntityRepository } from "./repositories.js";
export { REPOSITORY_PORT_VERSION } from "./repositories.js";
export type { CustomerId, CustomerStatus, CustomerProfile, CustomerRepositoryPort, CustomerCapabilityContract } from "./customer.js";
export { CUSTOMER_DOMAIN_VERSION } from "./customer.js";
export type { ProductId, ServiceId, CatalogId, CatalogOwnerId, Product, Service, Catalog, CatalogRepositoryPort } from "./catalog.js";
export { CATALOG_DOMAIN_VERSION } from "./catalog.js";
export type { PartnerId, PartnerOfferId, SettlementId, PartnerAccount, PartnerStore, PartnerProduct, PartnerService, PartnerOffer, PartnerSettlement, PartnerAccessPolicy, PartnerRepositoryPort } from "./partner.js";
export { PARTNER_ECOSYSTEM_DOMAIN_VERSION } from "./partner.js";
export type { OrderId, CartId, PaymentId, OfferId, DiscountId, Money, PriceQuote, Offer, Discount, Cart, Order, PaymentTransaction, Fulfillment, Settlement, PricingPort, PromotionPort, CommerceRepositoryPort, FulfillmentPort, SettlementPort } from "./commerce.js";
export { COMMERCE_DOMAIN_VERSION } from "./commerce.js";
export type { PaymentIntent, PaymentProviderPort, BillingPort } from "./payments.js";
export { PAYMENTS_DOMAIN_VERSION } from "./payments.js";
export type { RecommendationId, AgentRunId, Recommendation, SalesAssistantRequest, SalesAssistantResponse, AgentRun, RecommendationPort, SalesAssistantPort, AgentPort, ModelRouterPort } from "./ai.js";
export { AI_DOMAIN_VERSION } from "./ai.js";
export type { EntityId, MoneyValue, PercentageValue, TenantScope, ResourceScope } from "./value-objects.js";
export { money, percentage, DOMAIN_VALUE_OBJECTS_VERSION } from "./value-objects.js";
export type { CustomerRepositoryPortV1, ProductRepositoryPortV1, ServiceRepositoryPortV1, PartnerRepositoryPortV1, PartnerCatalogRepositoryPortV1, CartRepositoryPortV1, OrderRepositoryPortV1, UnitOfWorkPort } from "./ports.js";
export { DOMAIN_REPOSITORY_PORTS_VERSION } from "./ports.js";
export type { CommerceUseCaseId } from "./commerce-foundation.js";
export { COMMERCE_FOUNDATION_VERSION, COMMERCE_USE_CASE_IDS, assertMoney, assertSameCurrency, assertOrderTotal, assertPaymentMatchesOrder, assertCheckoutableCart, assertFulfillmentAllowed, COMMERCE_LIFECYCLE } from "./commerce-foundation.js";

/** Domain package public boundary. Keep provider-specific infrastructure out of this layer. */
export const DOMAIN_LAYER_VERSION = "1.3.0" as const;
