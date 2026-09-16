import type { Catalog, CatalogId } from "../../domains/src/index.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";

export interface PublishCatalogInput { catalogId: CatalogId; }
export interface PublishCatalogOutput { catalog: Catalog; publishedAt: string; }

export interface CatalogPublicationPort {
  publishCatalog(catalogId: CatalogId): Promise<PublishCatalogOutput>;
  publishPartnerCatalog(catalogId: CatalogId, partnerId: string): Promise<PublishCatalogOutput>;
}

function required(value: string, field: string): string {
  if (!value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

export class PublishCatalogHandler implements UseCaseHandler<PublishCatalogInput, PublishCatalogOutput> {
  constructor(private readonly publication: CatalogPublicationPort) {}
  async handle(request: UseCaseRequest<PublishCatalogInput>): Promise<UseCaseResponse<PublishCatalogOutput>> {
    const catalogId = required(request.input.catalogId, "catalogId") as CatalogId;
    return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output: await this.publication.publishCatalog(catalogId) };
  }
}

export interface PublishPartnerCatalogInput { catalogId: CatalogId; partnerId: string; }

export class PublishPartnerCatalogHandler implements UseCaseHandler<PublishPartnerCatalogInput, PublishCatalogOutput> {
  constructor(private readonly publication: CatalogPublicationPort) {}
  async handle(request: UseCaseRequest<PublishPartnerCatalogInput>): Promise<UseCaseResponse<PublishCatalogOutput>> {
    const catalogId = required(request.input.catalogId, "catalogId") as CatalogId;
    const partnerId = required(request.input.partnerId, "partnerId");
    return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output: await this.publication.publishPartnerCatalog(catalogId, partnerId) };
  }
}

export const CATALOG_PUBLICATION_APPLICATION_VERSION = "1.0.1" as const;
