import type { UseCaseHandler,UseCaseRequest,UseCaseResponse } from "./index.js";
import type { PricingRequest,PricingRequestId,PricingRequestRepositoryPortV1,PricingRequestStatus } from "../../domains/src/pricing-request.js";
export interface CreatePricingRequestInput { readonly inquiryId:string; readonly currency:string; }
export interface UpdatePricingRequestInput { readonly pricingRequestId:string; readonly status:PricingRequestStatus; }
export interface QueryPricingRequestInput { readonly id:string; }
const required=(v:string,f:string)=>{const x=v?.trim();if(!x)throw new Error(f+" is required");return x;};
export class CreatePricingRequestHandler implements UseCaseHandler<CreatePricingRequestInput,PricingRequest>{
 constructor(private readonly pricing:PricingRequestRepositoryPortV1){}
 async handle(r:UseCaseRequest<CreatePricingRequestInput>):Promise<UseCaseResponse<PricingRequest>>{
  const inquiryId=required(r.input.inquiryId,"inquiryId"),currency=required(r.input.currency,"currency");
  const existing=await this.pricing.findPendingByInquiry(inquiryId); if(existing)return {useCaseId:r.useCaseId,correlationId:r.context.correlationId,output:existing};
  const entity:PricingRequest={id:("prq_"+crypto.randomUUID()) as PricingRequestId,tenantId:r.context.tenantId,inquiryId,status:"PENDING",currency,requestedAt:new Date().toISOString()};
  return {useCaseId:r.useCaseId,correlationId:r.context.correlationId,output:await this.pricing.save(entity)};
 }
}
export class UpdatePricingRequestHandler implements UseCaseHandler<UpdatePricingRequestInput,PricingRequest>{
 constructor(private readonly pricing:PricingRequestRepositoryPortV1){}
 async handle(r:UseCaseRequest<UpdatePricingRequestInput>):Promise<UseCaseResponse<PricingRequest>>{
  const id=required(r.input.pricingRequestId,"pricingRequestId") as PricingRequestId,current=await this.pricing.findById(id);if(!current)throw new Error("Pricing request not found for tenant");
  if(current.status==="PRICED"||current.status==="DECLINED"||current.status==="EXPIRED")throw new Error("Pricing request is terminal");
  const status=r.input.status;if(status!=="PRICED"&&status!=="DECLINED"&&status!=="EXPIRED")throw new Error("Only terminal pricing outcomes may be recorded");
  const updated={...current,status,pricedAt:status==="PRICED"?new Date().toISOString():current.pricedAt};
  return {useCaseId:r.useCaseId,correlationId:r.context.correlationId,output:await this.pricing.save(updated)};
 }
}
export class QueryPricingRequestHandler implements UseCaseHandler<QueryPricingRequestInput,PricingRequest|null>{
 constructor(private readonly pricing:PricingRequestRepositoryPortV1){}
 async handle(r:UseCaseRequest<QueryPricingRequestInput>):Promise<UseCaseResponse<PricingRequest|null>>{
  const id=required(r.input.id,"pricingRequest id") as PricingRequestId;
  return {useCaseId:r.useCaseId,correlationId:r.context.correlationId,output:await this.pricing.findById(id)};
 }
}
export const PRICING_REQUEST_APPLICATION_VERSION="1.0.0" as const;
