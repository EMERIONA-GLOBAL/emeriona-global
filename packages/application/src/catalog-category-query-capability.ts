import type { CatalogCategory, CatalogCategoryKind, CatalogCategoryRepositoryPort } from "../../domains/src/catalog-taxonomy.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
export interface CatalogCategoryQueryInput { readonly kind?: CatalogCategoryKind; }
export interface CatalogCategoryQueryOutput { readonly categories: readonly CatalogCategory[]; readonly kind: CatalogCategoryKind; }
export class QueryCatalogCategoriesHandler implements UseCaseHandler<CatalogCategoryQueryInput,CatalogCategoryQueryOutput>{
 constructor(private readonly repository:CatalogCategoryRepositoryPort){}
 async handle(request:UseCaseRequest<CatalogCategoryQueryInput>):Promise<UseCaseResponse<CatalogCategoryQueryOutput>>{
   const kind=request.input.kind??"PRODUCT";
   if(kind!=="PRODUCT"&&kind!=="SERVICE") throw new Error("Unsupported catalog category kind");
   return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output:{categories:await this.repository.list(kind),kind}};
 }
}
export const CATALOG_CATEGORY_QUERY_APPLICATION_VERSION="1.0.0" as const;
