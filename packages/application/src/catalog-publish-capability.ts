import type { Catalog, CatalogId, Product, ProductId, Service, ServiceId } from "../../domains/src/index.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";

export interface PublishCatalogInput { catalogId: CatalogId; }
export interface PublishCatalogOutput { catalog: Catalog; products: readonly Product[]; services: readonly Service[]; }

export interface CatalogPublicationPort {
  publishCatalog(catalogId: CatalogId): Promise<PublishCatalogOutput>;
  publishProduct(productId: ProductId): Promise<Product>;
  publishService(serviceId: ServiceId): Promise<Service>;
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
export interface PublishPartnerCatalogOutput extends PublishCatalogOutput { partnerId: string; }

export class PublishPartnerCatalogHandler implements UseCaseHandler<PublishPartnerCatalogInput, PublishPartnerCatalogOutput> {
  constructor(private readonly publication: CatalogPublicationPort) {}
  async handle(request: UseCaseRequest<PublishPartnerCatalogInput>): Promise<UseCaseResponse<PublishPartnerCatalogOutput>> {
    const catalogId = required(request.input.catalogId, "catalogId") as CatalogId;
    const partnerId = required(request.input.partnerId, "partnerId");
    const output = await this.publication.publishCatalog(catalogId);
    return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output: { ...output, partnerId } };
  }
}

export const CATALOG_PUBLICATION_APPLICATION_VERSION = "1.0.0" as const;
