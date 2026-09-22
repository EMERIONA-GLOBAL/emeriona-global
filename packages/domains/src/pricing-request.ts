export type PricingRequestId = string & { readonly __brand: "PricingRequestId" };
export type PricingRequestStatus = "PENDING" | "PRICED" | "DECLINED" | "EXPIRED";
export interface PricingRequest {
 readonly id: PricingRequestId; readonly tenantId: string; readonly inquiryId: string;
 readonly status: PricingRequestStatus; readonly currency: string;
 readonly requestedAt: string; readonly pricedAt?: string;
}
export interface PricingRequestRepositoryPortV1 {
 findById(id: PricingRequestId): Promise<PricingRequest|null>;
 findPendingByInquiry(inquiryId: string): Promise<PricingRequest|null>;
 save(entity: PricingRequest): Promise<PricingRequest>;
}
export const PRICING_REQUEST_DOMAIN_VERSION="1.0.0" as const;
