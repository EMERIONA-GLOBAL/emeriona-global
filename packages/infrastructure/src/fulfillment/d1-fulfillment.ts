import type { D1DatabaseLike } from "../d1.js";
import type { FulfillmentRecord, FulfillmentStatus } from "../../../domains/src/fulfillment-foundation.js";
import { assertFulfillmentTransition } from "../../../domains/src/fulfillment-foundation.js";
async function one<T>(db:D1DatabaseLike,sql:string,values:readonly unknown[]):Promise<T|null>{const statement=db.prepare(sql);const bound=values.length?statement.bind(...values):statement;const result=await bound.all<T & Record<string,unknown>>();return(result.results[0] as T|undefined)??null;}
export class D1FulfillmentAdapter {
 constructor(private readonly db:D1DatabaseLike,private readonly tenantId:string,private readonly correlationId:string){}
 async create(input:{orderId:string}):Promise<FulfillmentRecord>{
  const order=await one<{id:string;status:string}>(this.db,"SELECT id,status FROM orders WHERE id=? AND tenant_id=?",[input.orderId,this.tenantId]);
  if(!order)throw new Error("Order not found for tenant"); if(order.status!=="CONFIRMED")throw new Error("Order must be CONFIRMED before fulfillment can be created");
  const existing=await one<{id:string;fulfillment_reference:string|null;status:FulfillmentStatus}>(this.db,"SELECT id,fulfillment_reference,status FROM fulfillments WHERE order_id=? AND tenant_id=? LIMIT 1",[input.orderId,this.tenantId]);
  if(existing)return{id:existing.id,orderId:input.orderId as FulfillmentRecord["orderId"],status:existing.status,reference:existing.fulfillment_reference??existing.id};
  const id=`ful_${crypto.randomUUID()}`,reference=`FUL-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${id.slice(-12).toUpperCase()}`,event=`fev_${crypto.randomUUID()}`;
  const row=await one<{id:string;fulfillment_reference:string;status:FulfillmentStatus}>(this.db,"INSERT INTO fulfillments (id,tenant_id,order_id,status,fulfillment_reference) VALUES (?,?,?,?,?) RETURNING id,fulfillment_reference,status",[id,this.tenantId,input.orderId,"PENDING",reference]);
  if(!row)throw new Error("Fulfillment persistence returned no row");
  await this.db.prepare("INSERT INTO fulfillment_events (id,tenant_id,fulfillment_id,order_id,from_status,to_status,correlation_id) VALUES (?,?,?,?,?,?,?)").bind(event,this.tenantId,id,input.orderId,null,"PENDING",this.correlationId).all();
  return{id:row.id,orderId:input.orderId as FulfillmentRecord["orderId"],status:row.status,reference:row.fulfillment_reference};
 }
 async progress(input:{fulfillmentId:string;status:FulfillmentStatus}):Promise<FulfillmentRecord>{
  const current=await one<{id:string;order_id:string;status:FulfillmentStatus;fulfillment_reference:string}>(this.db,"SELECT id,order_id,status,fulfillment_reference FROM fulfillments WHERE id=? AND tenant_id=?",[input.fulfillmentId,this.tenantId]);
  if(!current)throw new Error("Fulfillment not found for tenant"); assertFulfillmentTransition(current.status,input.status);
  const order=await one<{status:string}>(this.db,"SELECT status FROM orders WHERE id=? AND tenant_id=?",[current.order_id,this.tenantId]); if(!order)throw new Error("Fulfillment order not found");
  const event=`fev_${crypto.randomUUID()}`; const nowField=input.status==="IN_PROGRESS"?",started_at=CURRENT_TIMESTAMP":input.status==="FULFILLED"?",fulfilled_at=CURRENT_TIMESTAMP":input.status==="CANCELLED"?",cancelled_at=CURRENT_TIMESTAMP":"";
  const updated=await one<{id:string;order_id:string;status:FulfillmentStatus;fulfillment_reference:string}>(this.db,`UPDATE fulfillments SET status=?,updated_at=CURRENT_TIMESTAMP${nowField} WHERE id=? AND tenant_id=? RETURNING id,order_id,status,fulfillment_reference`,[input.status,input.fulfillmentId,this.tenantId]);
  if(!updated)throw new Error("Fulfillment update returned no row");
  if(input.status==="IN_PROGRESS")await this.db.prepare("UPDATE orders SET status='FULFILLING',updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=?").bind(current.order_id,this.tenantId).all();
  if(input.status==="FULFILLED")await this.db.prepare("UPDATE orders SET status='FULFILLED',updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=?").bind(current.order_id,this.tenantId).all();
  if(input.status==="CANCELLED")await this.db.prepare("UPDATE orders SET status='CANCELLED',updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=?").bind(current.order_id,this.tenantId).all();
  await this.db.prepare("INSERT INTO fulfillment_events (id,tenant_id,fulfillment_id,order_id,from_status,to_status,correlation_id) VALUES (?,?,?,?,?,?,?)").bind(event,this.tenantId,current.id,current.order_id,current.status,input.status,this.correlationId).all();
  return{id:updated.id,orderId:updated.order_id as FulfillmentRecord["orderId"],status:updated.status,reference:updated.fulfillment_reference};
 }
}
export const D1_FULFILLMENT_ADAPTER_VERSION="1.1.0" as const;
