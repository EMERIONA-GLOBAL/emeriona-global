import type { Product, ProductId, CatalogId } from "../../domains/src/catalog.js";
import type { ProductRepositoryPortV1 } from "../../domains/src/ports.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
export interface CreateCatalogProductInput{readonly catalogId:string;readonly ownerId:string;readonly name:string;}
export class CreateCatalogProductHandler implements UseCaseHandler<CreateCatalogProductInput,Product>{constructor(private readonly repository:ProductRepositoryPortV1,private readonly id:()=>ProductId){}async handle(request:UseCaseRequest<CreateCatalogProductInput>):Promise<UseCaseResponse<Product>>{const catalogId=request.input.catalogId.trim(),ownerId=request.input.ownerId.trim(),name=request.input.name.trim();if(!catalogId||!ownerId||!name)throw new Error("catalogId, ownerId and name are required");const output=await this.repository.save({id:this.id(),catalogId:catalogId as CatalogId,ownerId:ownerId as Product["ownerId"],name,status:"DRAFT"});return{useCaseId:request.useCaseId,correlationId:request.context.correlationId,output};}}
export const CATALOG_PRODUCT_APPLICATION_VERSION="1.0.0" as const;
