export interface InfrastructureContext{tenantId:string;correlationId:string;requestId?:string}
export interface InfrastructureResult<T>{ok:boolean;value?:T;error?:{code:string;message:string;retryable:boolean;providerNeutral:boolean}}
export interface InfrastructureAdapter<I,O>{execute(context:InfrastructureContext,input:I):Promise<InfrastructureResult<O>>;health(context:InfrastructureContext):Promise<{status:'UNKNOWN'|'HEALTHY'|'DEGRADED'|'UNAVAILABLE';checkedAt:string;latencyMs?:number}>}
export interface AdapterRegistration{id:string;portName:string;direction:'INBOUND'|'OUTBOUND';provider?:string;version:string}
export interface AdapterRegistry{register(registration:AdapterRegistration):Promise<void>;get(id:string):Promise<AdapterRegistration|undefined>}
export { D1PersistenceAdapter, D1_ADAPTER_VERSION } from './d1.js';export type { D1DatabaseLike, D1StatementLike } from './d1.js';
export { PersistenceEntityRepository, PERSISTENCE_REPOSITORY_VERSION } from './repositories/persistence-repository.js';export type { PersistenceEntityMapper } from './repositories/persistence-repository.js';
export { D1CustomerRepository, D1ProductRepository, D1ServiceRepository, D1PartnerRepository, D1CartRepository, D1OrderRepository, D1_DOMAIN_REPOSITORIES_VERSION } from './repositories/domain-repositories.js';
export { D1PartnerCatalogRepository, D1_PARTNER_CATALOG_REPOSITORY_VERSION } from './repositories/partner-catalog-repository.js';
export { D1CatalogRepository, D1_CATALOG_REPOSITORY_VERSION } from './repositories/catalog-repository.js';
export { D1CatalogPublicationAdapter, C9_CATALOG_PUBLICATION_INFRASTRUCTURE_VERSION } from './catalog/catalog-publication.js';
export { D1PartnerOffersAdapter, C10_PARTNER_OFFERS_INFRASTRUCTURE_VERSION } from './commerce/d1-partner-offers.js';
export { D1OperationalCommerceAdapter, D1_OPERATIONAL_COMMERCE_VERSION } from './commerce/operational.js';export { D1PricingPromotionsAdapter, D1_PRICING_PROMOTIONS_VERSION } from './commerce/d1-pricing-promotions.js';export { D1ProviderNeutralPaymentAdapter, D1_PROVIDER_NEUTRAL_PAYMENT_VERSION } from './payments/d1-provider-neutral.js';export { D1BillingAdapter, D1_BILLING_ADAPTER_VERSION } from './billing/d1-billing.js';export { D1FulfillmentAdapter, D1_FULFILLMENT_ADAPTER_VERSION } from './fulfillment/d1-fulfillment.js';export { D1ReturnsRefundsAdapter, D1_RETURNS_REFUNDS_ADAPTER_VERSION } from './returns/d1-returns-refunds.js';export { D1PartnerIntelligenceAdapter, C11_PARTNER_INTELLIGENCE_INFRASTRUCTURE_VERSION } from './partners/d1-partner-intelligence.js';export { D1IdempotencyAdapter, D1AuditAdapter, D1_RUNTIME_ADAPTERS_VERSION } from './adapters/d1-runtime.js';
export { PolicyAuthorizationAdapter, InMemoryIdempotencyAdapter, NoopAuditAdapter, NoopTelemetryAdapter, APPLICATION_INFRASTRUCTURE_ADAPTERS_VERSION } from './adapters/application-ports.js';
export { D1IdentityAuthorizationAdapter, HA1_IDENTITY_AUTHORIZATION_INFRASTRUCTURE_VERSION } from './security/d1-identity-authorization.js';
export { createFoundationRuntime, INFRASTRUCTURE_COMPOSITION_VERSION } from './composition.js';export type { FoundationCompositionOptions, FoundationRuntime } from './composition.js';
export const STEP_68={name:'Infrastructure & Integration Adapter Foundation',version:'2.3.0',status:'DURABLE_D1_OPERATIONAL_PATH',providerNeutral:true} as const;
