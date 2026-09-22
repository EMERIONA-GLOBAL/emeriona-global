import type { Product, ProductId, Service, ServiceId } from "../../domains/src/catalog.js";
import type { CatalogCategory } from "../../domains/src/catalog-taxonomy.js";
import type { ProductRepositoryPortV1, ServiceRepositoryPortV1 } from "../../domains/src/ports.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";

export interface CatalogEntityQueryInput { readonly id: string; }
export interface ProductQueryOutput { readonly product: Product | null; readonly categories: readonly CatalogCategory[]; }
export interface ServiceQueryOutput { readonly service: Service | null; readonly categories: readonly CatalogCategory[]; }

export class QueryProductHandler implements UseCaseHandler<CatalogEntityQueryInput,ProductQueryOutput>{
  constructor(private readonly repository:ProductRepositoryPortV1){}
  async handle(request:UseCaseRequest<CatalogEntityQueryInput>):Promise<UseCaseResponse<ProductQueryOutput>>{
    const id=request.input.id?.trim(); if(!id) throw new Error("Product id is required");
    const product=await this.repository.findById(id as ProductId);
    const categories=product?await this.repository.findCategories(id as ProductId):[];
    return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output:{product,categories}};
  }
}
export class QueryServiceHandler implements UseCaseHandler<CatalogEntityQueryInput,ServiceQueryOutput>{
  constructor(private readonly repository:ServiceRepositoryPortV1){}
  async handle(request:UseCaseRequest<CatalogEntityQueryInput>):Promise<UseCaseResponse<ServiceQueryOutput>>{
    const id=request.input.id?.trim(); if(!id) throw new Error("Service id is required");
    const service=await this.repository.findById(id as ServiceId);
    const categories=service?await this.repository.findCategories(id as ServiceId):[];
    return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output:{service,categories}};
  }
}
export const CATALOG_ENTITY_QUERY_APPLICATION_VERSION="1.1.0" as const;
