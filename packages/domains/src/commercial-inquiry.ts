export type CommercialInquiryId = string & { readonly __brand: "CommercialInquiryId" };
export type CommercialInquiryStatus = "NEW" | "QUALIFYING" | "QUOTED" | "NEGOTIATING" | "CONVERTED" | "CLOSED" | "CANCELLED";

export interface CommercialInquiry {
  readonly id: CommercialInquiryId;
  readonly tenantId: string;
  readonly customerId: string;
  readonly partnerId?: string;
  readonly productId?: string;
  readonly serviceId?: string;
  readonly offerId?: string;
  readonly solutionId?: string;
  readonly subject: string;
  readonly message?: string;
  readonly status: CommercialInquiryStatus;
}
export interface CommercialInquiryRepositoryPortV1 {
  findById(id: CommercialInquiryId): Promise<CommercialInquiry | null>;
  save(entity: CommercialInquiry): Promise<CommercialInquiry>;
}
export const COMMERCIAL_INQUIRY_DOMAIN_VERSION = "1.0.0" as const;
