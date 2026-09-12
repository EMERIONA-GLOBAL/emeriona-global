export type { EntityRecord, EntityRepository } from "./repositories.js";
export { REPOSITORY_PORT_VERSION } from "./repositories.js";

export type { CustomerId, CustomerStatus, CustomerProfile, CustomerRepositoryPort, CustomerCapabilityContract } from "./customer.js";
export { CUSTOMER_DOMAIN_VERSION } from "./customer.js";

export type { ProductId, ServiceId, CatalogId, CatalogOwnerId, Product, Service, Catalog, CatalogRepositoryPort } from "./catalog.js";
export { CATALOG_DOMAIN_VERSION } from "./catalog.js";

export type { PartnerId, PartnerOfferId, SettlementId, PartnerAccount, PartnerStore, PartnerProduct, PartnerService, PartnerOffer, PartnerSettlement, PartnerAccessPolicy, PartnerRepositoryPort } from "./partner.js";
export { PARTNER_ECOSYSTEM_DOMAIN_VERSION } from "./partner.js";

export type { OrderId, CartId, PaymentId, OfferId, DiscountId, Money, PriceQuote, Offer, Discount, Cart, Order, PaymentTransaction, Fulfillment, PricingPort, PromotionPort, CommerceRepositoryPort } from "./commerce.js";
export { COMMERCE_DOMAIN_VERSION } from "./commerce.js";

export type { PaymentIntent, PaymentProviderPort, BillingPort } from "./payments.js";
export { PAYMENTS_DOMAIN_VERSION } from "./payments.js";

export type { RecommendationId, AgentRunId, Recommendation, SalesAssistantRequest, SalesAssistantResponse, AgentRun, RecommendationPort, SalesAssistantPort, AgentPort, ModelRouterPort } from "./ai.js";
export { AI_DOMAIN_VERSION } from "./ai.js";

/** Domain package public boundary. Keep provider-specific infrastructure out of this layer. */
export const DOMAIN_LAYER_VERSION = "1.1.0" as const;
