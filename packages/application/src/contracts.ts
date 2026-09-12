/**
 * Provider-neutral application capability registry.
 * These contracts define stable use-case boundaries; activation is progressive.
 */
import type { UseCaseId } from "./index.js";

export type UseCaseDomain =
  | "IDENTITY" | "CUSTOMER" | "COMMERCE" | "CATALOG" | "PRICING" | "PROMOTION"
  | "PAYMENT" | "BILLING" | "SETTLEMENT" | "SEARCH" | "KNOWLEDGE" | "SUPPORT"
  | "AI" | "PARTNER" | "CAMPAIGN" | "NOTIFICATION" | "WORKFLOW" | "ANALYTICS"
  | "IMPACT" | "ADMINISTRATION";
export type UseCaseLifecycle = "FOUNDATION" | "ACTIVE" | "DEPRECATED";

export interface UseCaseContract<I = unknown, O = unknown> {
  readonly id: UseCaseId;
  readonly domain: UseCaseDomain;
  readonly name: string;
  readonly version: string;
  readonly lifecycle: UseCaseLifecycle;
  readonly inputSchema: string;
  readonly outputSchema: string;
}

export interface UseCaseContractRegistry {
  get(id: UseCaseId): UseCaseContract | undefined;
  list(domain?: UseCaseDomain): readonly UseCaseContract[];
}

const id = (value: string) => value as UseCaseId;
const contract = <I = unknown, O = unknown>(useCaseId: string, domain: UseCaseDomain, name: string): UseCaseContract<I, O> => ({
  id: id(useCaseId), domain, name, version: "1.0.0", lifecycle: "FOUNDATION",
  inputSchema: "application/input", outputSchema: "application/output",
});

/** Stable identifiers prevent capability names from being scattered across implementations. */
export const USE_CASE_IDS = {
  identity: { authenticate: id("identity.authenticate"), authorize: id("identity.authorize"), revoke: id("identity.revoke") },
  customer: { create: id("customer.create"), update: id("customer.update") },
  catalog: { productCreate: id("catalog.product.create"), productUpdate: id("catalog.product.update"), serviceCreate: id("catalog.service.create"), serviceUpdate: id("catalog.service.update"), publish: id("catalog.publish") },
  partner: { create: id("partner.create"), update: id("partner.update"), onboard: id("partner.onboard"), verify: id("partner.verify"), productCreate: id("partner.product.create"), productUpdate: id("partner.product.update"), serviceCreate: id("partner.service.create"), serviceUpdate: id("partner.service.update"), catalogPublish: id("partner.catalog.publish"), offerCreate: id("partner.offer.create"), offerUpdate: id("partner.offer.update"), analytics: id("partner.analytics.query"), performance: id("partner.performance.query"), impact: id("partner.impact.measure") },
  commerce: { cartCreate: id("cart.create"), cartUpdate: id("cart.update"), checkout: id("checkout.execute"), orderCreate: id("order.create"), orderUpdate: id("order.update"), fulfillment: id("fulfillment.execute") },
  pricing: { quote: id("pricing.quote"), resolve: id("pricing.resolve") },
  promotion: { offerCreate: id("offer.create"), offerUpdate: id("offer.update"), discountValidate: id("discount.validate"), discountApply: id("discount.apply") },
  payment: { create: id("payment.create"), authorize: id("payment.authorize"), capture: id("payment.capture"), refund: id("payment.refund"), status: id("payment.status") },
  billing: { invoiceCreate: id("billing.invoice.create"), query: id("billing.query") },
  settlement: { calculate: id("settlement.calculate"), execute: id("settlement.execute") },
  discovery: { search: id("search.execute"), discover: id("discovery.execute") },
  ai: { recommendation: id("recommendation.generate"), personalization: id("personalization.generate"), salesAssistant: id("sales.assistant.execute"), agent: id("ai.agent.execute"), modelRoute: id("ai.model.route") },
  support: { create: id("support.case.create") },
  knowledge: { retrieve: id("knowledge.retrieve") },
  campaign: { execute: id("campaign.execute") },
  notification: { send: id("notification.send") },
  workflow: { execute: id("workflow.execute") },
  analytics: { query: id("analytics.query") },
  impact: { measure: id("impact.measure") },
} as const;

export const USE_CASE_CONTRACTS = [
  contract("identity.authenticate", "IDENTITY", "Authenticate Identity"), contract("identity.authorize", "IDENTITY", "Authorize Capability"), contract("identity.revoke", "IDENTITY", "Revoke Access"),
  contract("customer.create", "CUSTOMER", "Create Customer"), contract("customer.update", "CUSTOMER", "Update Customer"),
  contract("catalog.product.create", "CATALOG", "Create Product"), contract("catalog.product.update", "CATALOG", "Update Product"), contract("catalog.service.create", "CATALOG", "Create Service"), contract("catalog.service.update", "CATALOG", "Update Service"), contract("catalog.publish", "CATALOG", "Publish Catalog"),
  contract("partner.create", "PARTNER", "Create Partner"), contract("partner.update", "PARTNER", "Update Partner"), contract("partner.onboard", "PARTNER", "Onboard Partner"), contract("partner.verify", "PARTNER", "Verify Partner"), contract("partner.product.create", "PARTNER", "Create Partner Product"), contract("partner.product.update", "PARTNER", "Update Partner Product"), contract("partner.service.create", "PARTNER", "Create Partner Service"), contract("partner.service.update", "PARTNER", "Update Partner Service"), contract("partner.catalog.publish", "PARTNER", "Publish Partner Catalog"), contract("partner.offer.create", "PARTNER", "Create Partner Offer"), contract("partner.offer.update", "PARTNER", "Update Partner Offer"), contract("partner.analytics.query", "PARTNER", "Query Partner Analytics"), contract("partner.performance.query", "PARTNER", "Query Partner Performance"), contract("partner.impact.measure", "PARTNER", "Measure Partner Impact"),
  contract("cart.create", "COMMERCE", "Create Cart"), contract("cart.update", "COMMERCE", "Update Cart"), contract("checkout.execute", "COMMERCE", "Execute Checkout"), contract("order.create", "COMMERCE", "Create Order"), contract("order.update", "COMMERCE", "Update Order"), contract("fulfillment.execute", "COMMERCE", "Execute Fulfillment"),
  contract("pricing.quote", "PRICING", "Quote Price"), contract("pricing.resolve", "PRICING", "Resolve Pricing"),
  contract("offer.create", "PROMOTION", "Create Offer"), contract("offer.update", "PROMOTION", "Update Offer"), contract("discount.validate", "PROMOTION", "Validate Discount"), contract("discount.apply", "PROMOTION", "Apply Discount"),
  contract("payment.create", "PAYMENT", "Create Payment"), contract("payment.authorize", "PAYMENT", "Authorize Payment"), contract("payment.capture", "PAYMENT", "Capture Payment"), contract("payment.refund", "PAYMENT", "Refund Payment"), contract("payment.status", "PAYMENT", "Get Payment Status"), contract("billing.invoice.create", "BILLING", "Create Invoice"), contract("billing.query", "BILLING", "Query Billing"),
  contract("settlement.calculate", "SETTLEMENT", "Calculate Settlement"), contract("settlement.execute", "SETTLEMENT", "Execute Settlement"),
  contract("search.execute", "SEARCH", "Search"), contract("discovery.execute", "SEARCH", "Execute Discovery"), contract("knowledge.retrieve", "KNOWLEDGE", "Retrieve Knowledge"), contract("support.case.create", "SUPPORT", "Create Support Case"),
  contract("recommendation.generate", "AI", "Generate Recommendation"), contract("personalization.generate", "AI", "Generate Personalization"), contract("sales.assistant.execute", "AI", "Execute Sales Assistant"), contract("ai.agent.execute", "AI", "Execute AI Agent"), contract("ai.model.route", "AI", "Route AI Model"),
  contract("campaign.execute", "CAMPAIGN", "Execute Campaign"), contract("notification.send", "NOTIFICATION", "Send Notification"), contract("workflow.execute", "WORKFLOW", "Execute Workflow"), contract("analytics.query", "ANALYTICS", "Query Analytics"), contract("impact.measure", "IMPACT", "Measure Impact"),
] as const satisfies readonly UseCaseContract[];

export class DefaultUseCaseContractRegistry implements UseCaseContractRegistry {
  private readonly contracts = new Map<string, UseCaseContract>(USE_CASE_CONTRACTS.map((item) => [item.id, item]));
  get(useCaseId: UseCaseId): UseCaseContract | undefined { return this.contracts.get(useCaseId); }
  list(domain?: UseCaseDomain): readonly UseCaseContract[] { const values = [...this.contracts.values()]; return domain ? values.filter((item) => item.domain === domain) : values; }
}

export const USE_CASE_CONTRACTS_VERSION = "1.1.0" as const;
