import type { CommercialInquiry, CommercialInquiryId, CommercialInquiryRepositoryPortV1, CommercialInquiryStatus } from "../../domains/src/commercial-inquiry.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";

export interface CreateCommercialInquiryInput {
  readonly customerId: string; readonly partnerId?: string; readonly productId?: string; readonly serviceId?: string; readonly offerId?: string; readonly solutionId?: string; readonly subject: string; readonly message?: string;
}
export interface UpdateCommercialInquiryInput { readonly inquiryId: string; readonly status?: CommercialInquiryStatus; readonly subject?: string; readonly message?: string; readonly partnerId?: string; }
export interface QueryCommercialInquiryInput { readonly id: string; }

const required=(v:string,f:string)=>{const x=v?.trim();if(!x)throw new Error(f+" is required");return x;};
const transition:Record<CommercialInquiryStatus,readonly CommercialInquiryStatus[]>={
 NEW:["QUALIFYING","CANCELLED"], QUALIFYING:["QUOTED","NEGOTIATING","CANCELLED"], QUOTED:["NEGOTIATING","CONVERTED","CANCELLED"], NEGOTIATING:["QUOTED","CONVERTED","CANCELLED"], CONVERTED:["CLOSED"], CLOSED:[], CANCELLED:[]
};
function assertTransition(current:CommercialInquiryStatus,next:CommercialInquiryStatus){if(current===next)return;if(!transition[current].includes(next))throw new Error("Invalid inquiry status transition: "+current+" -> "+next);}

export class CreateCommercialInquiryHandler implements UseCaseHandler<CreateCommercialInquiryInput,CommercialInquiry>{
 constructor(private readonly repository:CommercialInquiryRepositoryPortV1){}
 async handle(request:UseCaseRequest<CreateCommercialInquiryInput>):Promise<UseCaseResponse<CommercialInquiry>>{
  const i=request.input; const targets=[i.productId,i.serviceId,i.offerId,i.solutionId].filter(Boolean);
  if(targets.length===0)throw new Error("At least one productId, serviceId, offerId or solutionId is required");
  const entity:CommercialInquiry={id:("inq_"+crypto.randomUUID()) as CommercialInquiryId,tenantId:request.context.tenantId,customerId:required(i.customerId,"customerId"),partnerId:i.partnerId?.trim()||undefined,productId:i.productId?.trim()||undefined,serviceId:i.serviceId?.trim()||undefined,offerId:i.offerId?.trim()||undefined,solutionId:i.solutionId?.trim()||undefined,subject:required(i.subject,"subject"),message:i.message?.trim()||undefined,status:"NEW"};
  return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output:await this.repository.save(entity)};
 }
}
export class UpdateCommercialInquiryHandler implements UseCaseHandler<UpdateCommercialInquiryInput,CommercialInquiry>{
 constructor(private readonly repository:CommercialInquiryRepositoryPortV1){}
 async handle(request:UseCaseRequest<UpdateCommercialInquiryInput>):Promise<UseCaseResponse<CommercialInquiry>>{
  const id=required(request.input.inquiryId,"inquiryId") as CommercialInquiryId,current=await this.repository.findById(id);if(!current)throw new Error("Commercial inquiry not found for tenant");
  const next=request.input.status??current.status;assertTransition(current.status,next);
  const updated:CommercialInquiry={...current,status:next,subject:request.input.subject===undefined?current.subject:required(request.input.subject,"subject"),message:request.input.message===undefined?current.message:request.input.message.trim()||undefined,partnerId:request.input.partnerId===undefined?current.partnerId:request.input.partnerId.trim()||undefined};
  return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output:await this.repository.save(updated)};
 }
}
export class QueryCommercialInquiryHandler implements UseCaseHandler<QueryCommercialInquiryInput,CommercialInquiry|null>{
 constructor(private readonly repository:CommercialInquiryRepositoryPortV1){}
 async handle(request:UseCaseRequest<QueryCommercialInquiryInput>):Promise<UseCaseResponse<CommercialInquiry|null>>{
  const id=required(request.input.id,"inquiry id") as CommercialInquiryId;
  return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output:await this.repository.findById(id)};
 }
}
export const COMMERCIAL_INQUIRY_APPLICATION_VERSION="1.0.0" as const;
