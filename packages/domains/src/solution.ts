export type SolutionId = string & { readonly __brand: "SolutionId" };
export type SolutionStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
export interface Solution {
  readonly id: SolutionId; readonly tenantId: string; readonly ownerId: string;
  readonly name: string; readonly description?: string; readonly status: SolutionStatus;
}
export interface SolutionRepositoryPortV1 {
  findById(id: SolutionId): Promise<Solution | null>;
  findProducts(id: SolutionId): Promise<readonly string[]>;
  findServices(id: SolutionId): Promise<readonly string[]>;
  findOffers(id: SolutionId): Promise<readonly string[]>;
  save(entity: Solution, links: { productIds: readonly string[]; serviceIds: readonly string[]; offerIds: readonly string[] }): Promise<Solution>;
}
export const SOLUTION_DOMAIN_VERSION = "1.0.0" as const;
