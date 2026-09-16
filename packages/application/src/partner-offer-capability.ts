import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
import type { PartnerOffer, PartnerOfferId, PartnerOfferRepositoryPortV1 } from "../../domains/src/index.js";

export interface CreatePartnerOfferInput { partnerId: string; name: string; }
export interface UpdatePartnerOfferInput { offerId: string; name?: string; status?: PartnerOffer["status"]; }
function required(value:string,field:string):string { if(!value.trim()) throw new Error(`${field} is required`); return value.trim(); }
function response<T>(request:UseCaseRequest<unknown>,output:T):UseCaseResponse<T>{return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output};}

export class CreatePartnerOfferHandler implements UseCaseHandler<CreatePartnerOfferInput,PartnerOffer>{
  constructor(private readonly repository:PartnerOfferRepositoryPortV1){}
  async handle(request:UseCaseRequest<CreatePartnerOfferInput>):Promise<UseCaseResponse<PartnerOffer>>{
    const partnerId=required(request.input.partnerId,"partnerId");
    const name=required(request.input.name,"name");
    const offer:PartnerOffer={id:`off_${crypto.randomUUID()}` as PartnerOfferId,partnerId:partnerId as PartnerOffer["partnerId"],name,status:"DRAFT"};
    return response(request,await this.repository.create(offer,request.context.tenantId));
  }
}

export class UpdatePartnerOfferHandler implements UseCaseHandler<UpdatePartnerOfferInput,PartnerOffer>{
  constructor(private readonly repository:PartnerOfferRepositoryPortV1){}
  async handle(request:UseCaseRequest<UpdatePartnerOfferInput>):Promise<UseCaseResponse<PartnerOffer>>{
    const offerId=required(request.input.offerId,"offerId") as PartnerOfferId;
    if(request.input.name!==undefined && !request.input.name.trim()) throw new Error("name cannot be empty");
    return response(request,await this.repository.update(offerId,{name:request.input.name?.trim(),status:request.input.status},request.context.tenantId));
  }
}

export const PARTNER_OFFERS_APPLICATION_VERSION="1.0.0" as const;
