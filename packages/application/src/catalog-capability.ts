import type { Catalog, CatalogId, CatalogOwnerId } from "../../domains/src/catalog.js";
import type { CatalogRepositoryPortV1 } from "../../domains/src/ports.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
export interface CreateCatalogInput { readonly ownerId:string; readonly name:string; }
export class CreateCatalogHandler implements UseCaseHandler<CreateCatalogInput,Catalog>{
 constructor(private readonly repository:CatalogRepositoryPortV1,private readonly id:()=>CatalogId){}
 async handle(request:UseCaseRequest<CreateCatalogInput>):Promise<UseCaseResponse<Catalog>>{
  const ownerId=request.input.ownerId.trim();const name=request.input.name.trim();if(!ownerId)throw new Error("ownerId is required");if(!name)throw new Error("name is required");
  const catalog:Catalog={id:this.id(),ownerId:ownerId as CatalogOwnerId,name,status:"DRAFT"};const output=await this.repository.save(catalog);return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output};
 }
}
export const CATALOG_APPLICATION_VERSION="1.0.0" as const;
