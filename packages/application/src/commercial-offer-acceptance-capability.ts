import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
import type { CommercialOffer, CommercialOfferId, CommercialOfferRepositoryPortV1 } from "../../domains/src/commercial-offer.js";

export interface AcceptCommercialOfferInput { readonly offerId: string; }

const required=(v:string,f:string)=>{const x=v?.trim();if(!x)throw new Error(f+" is required");return x;};

export class AcceptCommercialOfferHandler implements UseCaseHandler<AcceptCommercialOfferInput,CommercialOffer>{
 constructor(private readonly repository:CommercialOfferRepositoryPortV1){}
 async handle(request:UseCaseRequest<AcceptCommercialOfferInput>):Promise<UseCaseResponse<CommercialOffer>>{
  const id=required(request.input.offerId,"offerId") as CommercialOfferId;
  const current=await this.repository.findById(id);
  if(!current)throw new Error("Commercial offer not found for tenant");
  if(current.status!=="PRESENTED")throw new Error("Only a presented commercial offer can be accepted");
  if(current.validUntil && new Date(current.validUntil).getTime()<=Date.now())throw new Error("Commercial offer has expired");
  const now=new Date().toISOString();
  const output=await this.repository.save({...current,status:"ACCEPTED",respondedAt:now,updatedAt:now});
  return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output};
 }
}

export const COMMERCIAL_OFFER_ACCEPTANCE_APPLICATION_VERSION="1.0.0" as const;
