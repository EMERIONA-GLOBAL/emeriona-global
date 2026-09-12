/**
 * Provider-neutral use-case contract registry.
 *
 * This file defines stable application capabilities without implementing
 * commercial, AI, or operational behavior. Implementations are activated
 * progressively behind the same contracts.
 */

import type { UseCaseId } from "./index.js";

export type UseCaseDomain =
  | "IDENTITY"
  | "CUSTOMER"
  | "COMMERCE"
  | "CATALOG"
  | "SEARCH"
  | "KNOWLEDGE"
  | "SUPPORT"
  | "AI"
  | "PARTNER"
  | "CAMPAIGN"
  | "ANALYTICS"
  | "IMPACT"
  | "ADMINISTRATION";

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

const contract = <I, O>(
  id: UseCaseId,
  domain: UseCaseDomain,
  name: string,
  inputSchema = "application/input",
  outputSchema = "application/output",
): UseCaseContract<I, O> => ({
  id,
  domain,
  name,
  version: "1.0.0",
  lifecycle: "FOUNDATION",
  inputSchema,
  outputSchema,
});

/**
 * Canonical capability map. These are architectural contracts only; no
 * business transaction, payment, AI inference, or external integration is
 * activated by registering a contract here.
 */
export const USE_CASE_CONTRACTS = [
  contract("customer.create" as UseCaseId, "CUSTOMER", "Create Customer"),
  contract("customer.update" as UseCaseId, "CUSTOMER", "Update Customer"),
  contract("order.create" as UseCaseId, "COMMERCE", "Create Order"),
  contract("order.update" as UseCaseId, "COMMERCE", "Update Order"),
  contract("search.execute" as UseCaseId, "SEARCH", "Search"),
  contract("support.case.create" as UseCaseId, "SUPPORT", "Create Support Case"),
  contract("recommendation.generate" as UseCaseId, "AI", "Generate Recommendation"),
  contract("campaign.execute" as UseCaseId, "CAMPAIGN", "Execute Campaign"),
  contract("knowledge.retrieve" as UseCaseId, "KNOWLEDGE", "Retrieve Knowledge"),
  contract("ai.agent.execute" as UseCaseId, "AI", "Execute AI Agent"),
  contract("analytics.query" as UseCaseId, "ANALYTICS", "Query Analytics"),
  contract("impact.measure" as UseCaseId, "IMPACT", "Measure Impact"),
] as const satisfies readonly UseCaseContract[];

export class DefaultUseCaseContractRegistry implements UseCaseContractRegistry {
  private readonly contracts = new Map<string, UseCaseContract>(
    USE_CASE_CONTRACTS.map((item) => [item.id, item]),
  );

  get(id: UseCaseId): UseCaseContract | undefined {
    return this.contracts.get(id);
  }

  list(domain?: UseCaseDomain): readonly UseCaseContract[] {
    const values = [...this.contracts.values()];
    return domain ? values.filter((item) => item.domain === domain) : values;
  }
}

export const USE_CASE_CONTRACTS_VERSION = "1.0.0" as const;
