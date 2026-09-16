/** C5 fulfillment and order lifecycle invariants. */
import type { OrderId } from "./commerce.js";
export const FULFILLMENT_FOUNDATION_VERSION = "1.0.0" as const;
export const FULFILLMENT_USE_CASE_IDS = { create: "fulfillment.create", progress: "fulfillment.progress" } as const;
export type FulfillmentUseCaseId = (typeof FULFILLMENT_USE_CASE_IDS)[keyof typeof FULFILLMENT_USE_CASE_IDS];
export type FulfillmentStatus = "PENDING" | "IN_PROGRESS" | "FULFILLED" | "CANCELLED";
export interface FulfillmentRecord { readonly id:string; readonly orderId:OrderId; readonly status:FulfillmentStatus; readonly reference:string; }
export function assertFulfillmentOrder(orderId:OrderId, fulfillmentOrderId:OrderId):void { if(orderId!==fulfillmentOrderId) throw new Error("fulfillment order mismatch"); }
export function assertFulfillmentTransition(from:FulfillmentStatus,to:FulfillmentStatus):void { const allowed:Record<FulfillmentStatus,readonly FulfillmentStatus[]>={PENDING:["IN_PROGRESS","CANCELLED"],IN_PROGRESS:["FULFILLED","CANCELLED"],FULFILLED:[],CANCELLED:[]}; if(!allowed[from].includes(to)) throw new Error(`invalid fulfillment transition: ${from} -> ${to}`); }
export const FULFILLMENT_LIFECYCLE={PENDING:["IN_PROGRESS","CANCELLED"],IN_PROGRESS:["FULFILLED","CANCELLED"],FULFILLED:[],CANCELLED:[]} as const;
