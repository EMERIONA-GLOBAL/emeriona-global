import type { Solution, SolutionId, SolutionRepositoryPortV1, SolutionStatus } from "../../domains/src/solution.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
export interface CreateSolutionInput { readonly ownerId:string; readonly name:string; readonly description?:string; readonly productIds?:readonly string[]; readonly serviceIds?:readonly string[]; readonly offerIds?:readonly string[]; }
export interface UpdateSolutionInput { readonly solutionId:string; readonly name?:string; readonly description?:string; readonly status?:SolutionStatus; }
export interface QuerySolutionInput { readonly id:string; }
export interface SolutionQueryOutput { readonly solution:Solution|null; readonly productIds:readonly string[]; readonly serviceIds:readonly string[]; readonly offerIds:readonly string[]; }
const required=(v:string,f:string)=>{const x=v?.trim();if(!x)throw new Error(`${f} is required`);return x;};
const clean=(v?:readonly string[])=>[...new Set((v??[]).map(x=>String(x).trim()).filter(Boolean))];
export class CreateSolutionHandler implements UseCaseHandler<CreateSolutionInput,Solution>{
 constructor(private readonly repository:SolutionRepositoryPortV1){}
 async handle(request:UseCaseRequest<CreateSolutionInput>):Promise<UseCaseResponse<Solution>>{
  const i=request.input,p=clean(i.productIds),s=clean(i.serviceIds),o=clean(i.offerIds);
  if(p.length+s.length+o.length===0)throw new Error("At least one productId, serviceId or offerId is required");
  const entity:Solution={id:`sol_${crypto.randomUUID()}` as SolutionId,tenantId:request.context.tenantId,ownerId:required(i.ownerId,"ownerId"),name:required(i.name,"name"),description:i.description?.trim()||undefined,status:"DRAFT"};
  return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output:await this.repository.save(entity,{productIds:p,serviceIds:s,offerIds:o})};
 }
}
export class UpdateSolutionHandler implements UseCaseHandler<UpdateSolutionInput,Solution>{
 constructor(private readonly repository:SolutionRepositoryPortV1){}
 async handle(request:UseCaseRequest<UpdateSolutionInput>):Promise<UseCaseResponse<Solution>>{
  const id=required(request.input.solutionId,"solutionId") as SolutionId,current=await this.repository.findById(id);if(!current)throw new Error("Solution not found for tenant");
  const updated={...current,name:request.input.name===undefined?current.name:required(request.input.name,"name"),description:request.input.description===undefined?current.description:request.input.description.trim()||undefined,status:request.input.status??current.status};
  return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output:await this.repository.save(updated,{productIds:await this.repository.findProducts(id),serviceIds:await this.repository.findServices(id),offerIds:await this.repository.findOffers(id)})};
 }
}
export class QuerySolutionHandler implements UseCaseHandler<QuerySolutionInput,SolutionQueryOutput>{
 constructor(private readonly repository:SolutionRepositoryPortV1){}
 async handle(request:UseCaseRequest<QuerySolutionInput>):Promise<UseCaseResponse<SolutionQueryOutput>>{
  const id=required(request.input.id,"solution id") as SolutionId,solution=await this.repository.findById(id);
  if(!solution)return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output:{solution:null,productIds:[],serviceIds:[],offerIds:[]}};
  return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output:{solution,productIds:await this.repository.findProducts(id),serviceIds:await this.repository.findServices(id),offerIds:await this.repository.findOffers(id)}};
 }
}
export const SOLUTION_APPLICATION_VERSION="1.0.0" as const;
