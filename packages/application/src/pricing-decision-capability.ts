import type { UseCaseHandler,UseCaseRequest,UseCaseResponse } from "./index.js";
import type { PricingDecision,PricingDecisionId,PricingDecisionInput,PricingDecisionRepositoryPortV1,PricingInputDirection } from "../../domains/src/pricing-decision.js";

export interface CreatePricingDecisionInput { readonly pricingRequestId:string; readonly currency:string; }
export interface AddPricingDecisionInputInput { readonly pricingDecisionId:string; readonly direction:PricingInputDirection; readonly amount:number; readonly currency:string; readonly sourceType:string; readonly sourceReference:string; readonly sequence:number; }
export interface ResolvePricingDecisionInput { readonly pricingDecisionId:string; }

const required=(v:string,f:string)=>{const x=v?.trim();if(!x)throw new Error(f+" is required");return x;};
const positiveOrZero=(v:number,f:string)=>{if(!Number.isFinite(v)||v<0)throw new Error(f+" must be a finite non-negative number");return v;};

export class CreatePricingDecisionHandler implements UseCaseHandler<CreatePricingDecisionInput,PricingDecision>{
 constructor(private readonly pricing:PricingDecisionRepositoryPortV1){}
 async handle(r:UseCaseRequest<CreatePricingDecisionInput>):Promise<UseCaseResponse<PricingDecision>>{
  const pricingRequestId=required(r.input.pricingRequestId,"pricingRequestId"),currency=required(r.input.currency,"currency");
  const existing=await this.pricing.findPendingByPricingRequest(pricingRequestId);
  if(existing)return {useCaseId:r.useCaseId,correlationId:r.context.correlationId,output:existing};
  const now=new Date().toISOString();
  const entity:PricingDecision={id:("prd_"+crypto.randomUUID()) as PricingDecisionId,tenantId:r.context.tenantId,pricingRequestId,status:"PENDING",currency,createdAt:now,updatedAt:now};
  return {useCaseId:r.useCaseId,correlationId:r.context.correlationId,output:await this.pricing.saveDecision(entity)};
 }
}

export class AddPricingDecisionInputHandler implements UseCaseHandler<AddPricingDecisionInputInput,PricingDecisionInput>{
 constructor(private readonly pricing:PricingDecisionRepositoryPortV1){}
 async handle(r:UseCaseRequest<AddPricingDecisionInputInput>):Promise<UseCaseResponse<PricingDecisionInput>>{
  const pricingDecisionId=required(r.input.pricingDecisionId,"pricingDecisionId") as PricingDecisionId;
  const sourceType=required(r.input.sourceType,"sourceType"),sourceReference=required(r.input.sourceReference,"sourceReference");
  const currency=required(r.input.currency,"currency");
  positiveOrZero(r.input.amount,"amount");
  if(!Number.isInteger(r.input.sequence)||r.input.sequence<0)throw new Error("sequence must be a non-negative integer");
  const decision=await this.pricing.findDecisionById(pricingDecisionId);
  if(!decision)throw new Error("Pricing decision not found for tenant");
  if(decision.status!=="PENDING")throw new Error("Pricing decision is not pending");
  if(decision.currency!==currency)throw new Error("Pricing input currency does not match pricing decision");
  const input:PricingDecisionInput={id:"pin_"+crypto.randomUUID(),tenantId:r.context.tenantId,pricingDecisionId,direction:r.input.direction,amount:r.input.amount,currency,sourceType,sourceReference,sequence:r.input.sequence};
  return {useCaseId:r.useCaseId,correlationId:r.context.correlationId,output:await this.pricing.addInput(input)};
 }
}

export class ResolvePricingDecisionHandler implements UseCaseHandler<ResolvePricingDecisionInput,PricingDecision>{
 constructor(private readonly pricing:PricingDecisionRepositoryPortV1){}
 async handle(r:UseCaseRequest<ResolvePricingDecisionInput>):Promise<UseCaseResponse<PricingDecision>>{
  const id=required(r.input.pricingDecisionId,"pricingDecisionId") as PricingDecisionId;
  const current=await this.pricing.findDecisionById(id); if(!current)throw new Error("Pricing decision not found for tenant");
  if(current.status!=="PENDING")throw new Error("Pricing decision is not pending");
  const inputs=await this.pricing.listInputs(id);
  const base=inputs.filter(i=>i.direction==="ADD");
  if(base.length===0)throw new Error("Pricing decision requires at least one authoritative pricing input");
  let total=0;
  for(const input of inputs){ total += input.direction==="ADD" ? input.amount : -input.amount; }
  if(!Number.isFinite(total)||total<0)throw new Error("Pricing decision total is invalid");
  const decidedAt=new Date().toISOString();
  const updated={...current,status:"APPROVED" as const,amount:total,decidedAt,updatedAt:decidedAt};
  return {useCaseId:r.useCaseId,correlationId:r.context.correlationId,output:await this.pricing.saveDecision(updated)};
 }
}
export const GOVERNED_PRICING_APPLICATION_VERSION="1.0.0" as const;
