import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";

export interface PartnerIntelligenceInput { partnerId: string; }
export interface PartnerAnalytics { partnerId: string; products: number; services: number; catalogs: number; offers: number; activeOffers: number; orders: number; grossMerchandiseValue: number; currency: string | null; }
export interface PartnerPerformance extends PartnerAnalytics { publishedProducts: number; publishedServices: number; publishedCatalogs: number; fulfilledOrders: number; settlementCount: number; settledNetAmount: number; }
export interface PartnerImpact extends PartnerPerformance { returnRequests: number; refundRequests: number; fulfilledRate: number; settlementCoverageRate: number; }

export interface PartnerIntelligencePort {
  analytics(input: PartnerIntelligenceInput): Promise<PartnerAnalytics>;
  performance(input: PartnerIntelligenceInput): Promise<PartnerPerformance>;
  impact(input: PartnerIntelligenceInput): Promise<PartnerImpact>;
}

function response<T>(request: UseCaseRequest<unknown>, output: T): UseCaseResponse<T> {
  return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output };
}
function required(value: string): string { if (!value?.trim()) throw new Error("partnerId is required"); return value.trim(); }

export class QueryPartnerAnalyticsHandler implements UseCaseHandler<PartnerIntelligenceInput, PartnerAnalytics> {
  constructor(private readonly intelligence: PartnerIntelligencePort) {}
  async handle(request: UseCaseRequest<PartnerIntelligenceInput>): Promise<UseCaseResponse<PartnerAnalytics>> {
    return response(request, await this.intelligence.analytics({ partnerId: required(request.input.partnerId) }));
  }
}
export class QueryPartnerPerformanceHandler implements UseCaseHandler<PartnerIntelligenceInput, PartnerPerformance> {
  constructor(private readonly intelligence: PartnerIntelligencePort) {}
  async handle(request: UseCaseRequest<PartnerIntelligenceInput>): Promise<UseCaseResponse<PartnerPerformance>> {
    return response(request, await this.intelligence.performance({ partnerId: required(request.input.partnerId) }));
  }
}
export class MeasurePartnerImpactHandler implements UseCaseHandler<PartnerIntelligenceInput, PartnerImpact> {
  constructor(private readonly intelligence: PartnerIntelligencePort) {}
  async handle(request: UseCaseRequest<PartnerIntelligenceInput>): Promise<UseCaseResponse<PartnerImpact>> {
    return response(request, await this.intelligence.impact({ partnerId: required(request.input.partnerId) }));
  }
}

export const PARTNER_INTELLIGENCE_APPLICATION_VERSION = "1.0.0" as const;
