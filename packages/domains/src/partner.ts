/** Partner Ecosystem contracts. Partner-owned products/services are independent catalog entities. */
import type { Product, Service, Catalog } from "./catalog.js";

export type PartnerId = string & { readonly __brand: "PartnerId" };
export type PartnerOfferId = string & { readonly __brand: "PartnerOfferId" };
export type SettlementId = string & { readonly __brand: "SettlementId" };

export interface PartnerAccount {
  readonly id: PartnerId;
  readonly legalName: string;
  readonly status: "PENDING" | "VERIFIED" | "SUSPENDED" | "CLOSED";
  readonly tenantId: string;
}

export interface PartnerStore extends Catalog {
  readonly partnerId: PartnerId;
}

export interface PartnerProduct extends Product {
  readonly partnerId: PartnerId;
}

export interface PartnerService extends Service {
  readonly partnerId: PartnerId;
}

export interface PartnerOffer {
  readonly id: PartnerOfferId;
  readonly partnerId: PartnerId;
  readonly name: string;
  readonly status: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED";
}

export interface PartnerSettlement {
  readonly id: SettlementId;
  readonly partnerId: PartnerId;
  readonly orderId: string;
  readonly status: "PENDING" | "SETTLED" | "REVERSED";
  readonly commissionAmount: number;
  readonly netAmount: number;
}

export interface PartnerAccessPolicy {
  readonly partnerId: PartnerId;
  readonly allowedResourceScopes: readonly string[];
  readonly dataIsolationRequired: true;
}

export interface PartnerRepositoryPort {
  findById(id: PartnerId): Promise<PartnerAccount | null>;
  save(partner: PartnerAccount): Promise<PartnerAccount>;
}

export const PARTNER_ECOSYSTEM_DOMAIN_VERSION = "1.0.0" as const;
