import type { MarketCatalogQuery, MarketCatalogResult, MarketCatalogRepositoryPortV1 } from "../../domains/src/market.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";

export interface MarketCatalogQueryInput extends MarketCatalogQuery {}

function normalizeFilter(value: MarketCatalogQueryInput["filter"]): MarketCatalogQuery["filter"] {
  if (!value || value === "all") return "all";
  if (value === "products" || value === "services" || value === "offers" || value === "partners") return value;
  throw new Error("Unsupported market filter");
}

export class QueryMarketCatalogHandler implements UseCaseHandler<MarketCatalogQueryInput, MarketCatalogResult> {
  constructor(private readonly repository: MarketCatalogRepositoryPortV1) {}
  async handle(request: UseCaseRequest<MarketCatalogQueryInput>): Promise<UseCaseResponse<MarketCatalogResult>> {
    const query = request.input.query?.trim();
    const limit = request.input.limit === undefined ? 48 : Math.min(Math.max(Math.trunc(request.input.limit), 1), 100);
    const output = await this.repository.query({ filter: normalizeFilter(request.input.filter), query: query || undefined, limit });
    return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output };
  }
}

export const MARKET_CATALOG_QUERY_APPLICATION_VERSION = "1.0.0" as const;
