export type PricingDecisionId = string & { readonly __brand: "PricingDecisionId" };
export type PricingDecisionStatus = "PENDING" | "APPROVED" | "DECLINED" | "EXPIRED";
export type PricingInputDirection = "ADD" | "SUBTRACT";

export interface PricingDecision {
  readonly id: PricingDecisionId;
  readonly tenantId: string;
  readonly pricingRequestId: string;
  readonly status: PricingDecisionStatus;
  readonly amount?: number;
  readonly currency: string;
  readonly decidedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PricingDecisionInput {
  readonly id: string;
  readonly tenantId: string;
  readonly pricingDecisionId: PricingDecisionId;
  readonly direction: PricingInputDirection;
  readonly amount: number;
  readonly currency: string;
  readonly sourceType: string;
  readonly sourceReference: string;
  readonly sequence: number;
}

export interface PricingDecisionRepositoryPortV1 {
  findDecisionById(id: PricingDecisionId): Promise<PricingDecision|null>;
  findPendingByPricingRequest(pricingRequestId: string): Promise<PricingDecision|null>;
  saveDecision(entity: PricingDecision): Promise<PricingDecision>;
  addInput(input: PricingDecisionInput): Promise<PricingDecisionInput>;
  listInputs(pricingDecisionId: PricingDecisionId): Promise<readonly PricingDecisionInput[]>;
}
export const GOVERNED_PRICING_DOMAIN_VERSION="1.0.0" as const;
