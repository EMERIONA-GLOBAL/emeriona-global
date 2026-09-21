import type { Product, Service } from "./catalog.js";

export type MarketItemType = "product" | "service" | "offer";

export interface MarketItem {
  readonly id: string;
  readonly type: MarketItemType;
  readonly name: string;
  readonly status: "PUBLISHED" | "ACTIVE";
  readonly category?: string;
  readonly partner?: string;
  readonly isNew?: boolean;
}

export interface MarketCatalogQuery {
  readonly filter?: "all" | "products" | "services" | "offers" | "partners";
  readonly query?: string;
  readonly limit?: number;
}

export interface MarketCatalogResult {
  readonly items: readonly MarketItem[];
  readonly total: number;
}

export interface MarketCatalogRepositoryPortV1 {
  query(input: MarketCatalogQuery): Promise<MarketCatalogResult>;
}

export const MARKET_DOMAIN_VERSION = "1.0.0" as const;
