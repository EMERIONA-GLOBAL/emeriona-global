import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
import type { FulfillmentRecord, FulfillmentStatus } from "../../domains/src/fulfillment-foundation.js";
export interface FulfillmentInput { orderId:string; }
export interface FulfillmentProgressInput { fulfillmentId:string; status:FulfillmentStatus; }
export interface FulfillmentPort { create(input:FulfillmentInput):Promise<FulfillmentRecord>; progress(input:FulfillmentProgressInput):Promise<FulfillmentRecord>; }
const response=<T>(request:UseCaseRequest<unknown>,output:T):UseCaseResponse<T>=>({useCaseId:request.useCaseId,correlationId:request.context.correlationId,output});
const required=(value:string,field:string)=>{if(!value?.trim())throw new Error(`${field} is required`);return value.trim();};
export class CreateFulfillmentHandler implements UseCaseHandler<FulfillmentInput,FulfillmentRecord>{constructor(private readonly fulfillment:FulfillmentPort){}async handle(request:UseCaseRequest<FulfillmentInput>){return response(request,await this.fulfillment.create({orderId:required(request.input.orderId,"orderId")}));}}
export class ProgressFulfillmentHandler implements UseCaseHandler<FulfillmentProgressInput,FulfillmentRecord>{constructor(private readonly fulfillment:FulfillmentPort){}async handle(request:UseCaseRequest<FulfillmentProgressInput>){return response(request,await this.fulfillment.progress({fulfillmentId:required(request.input.fulfillmentId,"fulfillmentId"),status:request.input.status}));}}
export const FULFILLMENT_APPLICATION_VERSION="1.0.0" as const;
