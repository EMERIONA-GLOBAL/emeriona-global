import type { CommissionRule, ReferralEvent, Affiliate, Commission, CommissionStatus } from "./types";

export type { CommissionRule, ReferralEvent, Affiliate, Commission, CommissionStatus } from "./types";

export interface ReferralAffiliateCommissionRepository {
  getAffiliate(affiliateId: string): Promise<Affiliate | null>;
  getCommissionRule(ruleId: string): Promise<CommissionRule | null>;
  recordReferralEvent(event: ReferralEvent): Promise<void>;
  createCommission(commission: Commission): Promise<void>;
  getCommission(commissionId: string): Promise<Commission | null>;
  updateCommissionStatus(commissionId: string, status: CommissionStatus): Promise<void>;
}

export interface ReferralAffiliateCommissionService {
  registerReferralEvent(event: ReferralEvent): Promise<void>;
  calculateCommission(input: CalculateCommissionInput): Promise<CommissionCalculationResult>;
  approveCommission(commissionId: string): Promise<void>;
  rejectCommission(commissionId: string): Promise<void>;
}

export interface CalculateCommissionInput {
  affiliateId: string;
  referralEventId: string;
  orderId: string;
  orderAmount: number;
  currency: string;
  occurredAt: string;
}

export interface CommissionCalculationResult {
  commissionId: string;
  affiliateId: string;
  referralEventId: string;
  orderId: string;
  amount: number;
  currency: string;
  ruleId: string;
  calculatedAt: string;
}

export class ReferralAffiliateCommissionDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReferralAffiliateCommissionDomainError";
  }
}

export class ReferralAffiliateCommissionServiceImpl implements ReferralAffiliateCommissionService {
  constructor(private readonly repository: ReferralAffiliateCommissionRepository) {}

  async registerReferralEvent(event: ReferralEvent): Promise<void> {
    if (!event.id || !event.affiliateId || !event.occurredAt) {
      throw new ReferralAffiliateCommissionDomainError("Invalid referral event");
    }

    const affiliate = await this.repository.getAffiliate(event.affiliateId);
    if (!affiliate || affiliate.status !== "active") {
      throw new ReferralAffiliateCommissionDomainError("Affiliate is not active");
    }

    await this.repository.recordReferralEvent(event);
  }

  async calculateCommission(input: CalculateCommissionInput): Promise<CommissionCalculationResult> {
    if (input.orderAmount < 0) {
      throw new ReferralAffiliateCommissionDomainError("Order amount cannot be negative");
    }

    const affiliate = await this.repository.getAffiliate(input.affiliateId);
    if (!affiliate || affiliate.status !== "active") {
      throw new ReferralAffiliateCommissionDomainError("Affiliate is not active");
    }

    const rule = await this.repository.getCommissionRule(affiliate.commissionRuleId);
    if (!rule || !rule.active) {
      throw new ReferralAffiliateCommissionDomainError("Commission rule is not active");
    }

    const amount = calculateCommissionAmount(input.orderAmount, rule);
    const commissionId = createCommissionId();
    const calculatedAt = new Date().toISOString();

    const commission: Commission = {
      id: commissionId,
      affiliateId: input.affiliateId,
      referralEventId: input.referralEventId,
      orderId: input.orderId,
      amount,
      currency: input.currency,
      ruleId: rule.id,
      status: "pending",
      calculatedAt,
    };

    await this.repository.createCommission(commission);

    return {
      commissionId,
      affiliateId: input.affiliateId,
      referralEventId: input.referralEventId,
      orderId: input.orderId,
      amount,
      currency: input.currency,
      ruleId: rule.id,
      calculatedAt,
    };
  }

  async approveCommission(commissionId: string): Promise<void> {
    const commission = await this.repository.getCommission(commissionId);
    if (!commission) {
      throw new ReferralAffiliateCommissionDomainError("Commission not found");
    }
    if (commission.status !== "pending") {
      throw new ReferralAffiliateCommissionDomainError("Commission is not pending");
    }
    await this.repository.updateCommissionStatus(commissionId, "approved");
  }

  async rejectCommission(commissionId: string): Promise<void> {
    const commission = await this.repository.getCommission(commissionId);
    if (!commission) {
      throw new ReferralAffiliateCommissionDomainError("Commission not found");
    }
    if (commission.status !== "pending") {
      throw new ReferralAffiliateCommissionDomainError("Commission is not pending");
    }
    await this.repository.updateCommissionStatus(commissionId, "rejected");
  }
}

function calculateCommissionAmount(orderAmount: number, rule: CommissionRule): number {
  if (rule.type === "percentage") {
    return Math.round(orderAmount * (rule.value / 100) * 100) / 100;
  }
  return Math.min(rule.value, orderAmount);
}

function createCommissionId(): string {
  return `commission_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
