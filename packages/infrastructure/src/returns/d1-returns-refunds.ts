import type { D1DatabaseLike } from "../d1.js";
import type { RefundRequestRecord, RefundRequestStatus, ReturnRequestRecord, ReturnStatus } from "../../../domains/src/returns-refunds-foundation.js";
import { assertRefundAmount, assertRefundRequestTransition, assertReturnTransition } from "../../../domains/src/returns-refunds-foundation.js";
import type { ReturnsRefundsPort } from "../../../application/src/returns-refunds-capabilities.js";

async function one<T>(db:D1DatabaseLike,sql:string,values:readonly unknown[]):Promise<T|null>{const statement=db.prepare(sql);const bound=values.length?statement.bind(...values):statement;const result=await bound.all<T & Record<string,unknown>>();return(result.results[0] as T|undefined)??null;}

export class D1ReturnsRefundsAdapter implements ReturnsRefundsPort {
 constructor(private readonly db:D1DatabaseLike,private readonly tenantId:string,private readonly correlationId:string){}
 async createReturn(input:{orderId:string;reason:string}):Promise<ReturnRequestRecord>{
  const order=await one<{id:string;customer_id:string;status:string}>(this.db,"SELECT id,customer_id,status FROM orders WHERE id=? AND tenant_id=?",[input.orderId,this.tenantId]);
  if(!order)throw new Error("Order not found for tenant"); if(order.status!=="FULFILLED")throw new Error("Only fulfilled orders can be returned");
  const existing=await one<{id:string;customer_id:string;status:ReturnStatus;reason:string;return_reference:string}>(this.db,"SELECT id,customer_id,status,reason,return_reference FROM return_requests WHERE order_id=? AND tenant_id=? LIMIT 1",[input.orderId,this.tenantId]);
  if(existing)return{id:existing.id,orderId:input.orderId as ReturnRequestRecord["orderId"],customerId:existing.customer_id,status:existing.status,reason:existing.reason,reference:existing.return_reference};
  const id=`ret_${crypto.randomUUID()}`,reference=`RET-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${id.slice(-12).toUpperCase()}`,event=`rtev_${crypto.randomUUID()}`;
  const row=await one<{id:string;customer_id:string;status:ReturnStatus;reason:string;return_reference:string}>(this.db,"INSERT INTO return_requests (id,tenant_id,order_id,customer_id,status,reason,return_reference,correlation_id) VALUES (?,?,?,?,?,?,?,?) RETURNING id,customer_id,status,reason,return_reference",[id,this.tenantId,input.orderId,order.customer_id,"REQUESTED",input.reason,reference,this.correlationId]);
  if(!row)throw new Error("Return persistence returned no row");
  await this.db.prepare("INSERT INTO return_events (id,tenant_id,return_request_id,order_id,from_status,to_status,correlation_id) VALUES (?,?,?,?,?,?,?)").bind(event,this.tenantId,id,input.orderId,null,"REQUESTED",this.correlationId).all();
  return{id:row.id,orderId:input.orderId as ReturnRequestRecord["orderId"],customerId:row.customer_id,status:row.status,reason:row.reason,reference:row.return_reference};
 }
 async progressReturn(input:{returnId:string;status:ReturnStatus}):Promise<ReturnRequestRecord>{
  const current=await one<{id:string;order_id:string;customer_id:string;status:ReturnStatus;reason:string;return_reference:string}>(this.db,"SELECT id,order_id,customer_id,status,reason,return_reference FROM return_requests WHERE id=? AND tenant_id=?",[input.returnId,this.tenantId]);
  if(!current)throw new Error("Return request not found for tenant"); assertReturnTransition(current.status,input.status);
  const event=`rtev_${crypto.randomUUID()}`;
  const updated=await one<typeof current>(this.db,"UPDATE return_requests SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=? RETURNING id,order_id,customer_id,status,reason,return_reference",[input.status,input.returnId,this.tenantId]);
  if(!updated)throw new Error("Return update returned no row");
  await this.db.prepare("INSERT INTO return_events (id,tenant_id,return_request_id,order_id,from_status,to_status,correlation_id) VALUES (?,?,?,?,?,?,?)").bind(event,this.tenantId,current.id,current.order_id,current.status,input.status,this.correlationId).all();
  return{id:updated.id,orderId:updated.order_id as ReturnRequestRecord["orderId"],customerId:updated.customer_id,status:updated.status,reason:updated.reason,reference:updated.return_reference};
 }
 async createRefundRequest(input:{orderId:string;paymentId:string;amount:{amount:number;currency:string};reason:string}):Promise<RefundRequestRecord>{
  const payment=await one<{id:string;order_id:string;status:string;amount:number;currency:string}>(this.db,"SELECT id,order_id,status,amount,currency FROM payment_intents WHERE id=? AND tenant_id=?",[input.paymentId,this.tenantId]);
  if(!payment)throw new Error("Payment intent not found for tenant"); if(payment.order_id!==input.orderId)throw new Error("Payment intent does not belong to order"); if(payment.status!=="CAPTURED")throw new Error("Only captured payments can be refunded");
  assertRefundAmount(input.amount,{amount:Number(payment.amount),currency:payment.currency});
  const existing=await one<{id:string;order_id:string;payment_intent_id:string;amount:number;currency:string;status:RefundRequestStatus;reason:string;refund_reference:string}>(this.db,"SELECT id,order_id,payment_intent_id,amount,currency,status,reason,refund_reference FROM refund_requests WHERE payment_intent_id=? AND tenant_id=? LIMIT 1",[input.paymentId,this.tenantId]);
  if(existing)return{id:existing.id,orderId:existing.order_id as RefundRequestRecord["orderId"],paymentId:existing.payment_intent_id as RefundRequestRecord["paymentId"],amount:{amount:Number(existing.amount),currency:existing.currency},status:existing.status,reason:existing.reason,reference:existing.refund_reference};
  const id=`rfd_${crypto.randomUUID()}`,reference=`RFD-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${id.slice(-12).toUpperCase()}`,event=`rfev_${crypto.randomUUID()}`;
  const row=await one<{id:string;order_id:string;payment_intent_id:string;amount:number;currency:string;status:RefundRequestStatus;reason:string;refund_reference:string}>(this.db,"INSERT INTO refund_requests (id,tenant_id,order_id,payment_intent_id,amount,currency,status,reason,refund_reference,correlation_id) VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING id,order_id,payment_intent_id,amount,currency,status,reason,refund_reference",[id,this.tenantId,input.orderId,input.paymentId,input.amount.amount,input.amount.currency,"REQUESTED",input.reason,reference,this.correlationId]);
  if(!row)throw new Error("Refund request persistence returned no row");
  await this.db.prepare("INSERT INTO refund_events (id,tenant_id,refund_request_id,order_id,payment_intent_id,from_status,to_status,correlation_id) VALUES (?,?,?,?,?,?,?,?)").bind(event,this.tenantId,id,input.orderId,input.paymentId,null,"REQUESTED",this.correlationId).all();
  return{id:row.id,orderId:row.order_id as RefundRequestRecord["orderId"],paymentId:row.payment_intent_id as RefundRequestRecord["paymentId"],amount:{amount:Number(row.amount),currency:row.currency},status:row.status,reason:row.reason,reference:row.refund_reference};
 }
 async progressRefundRequest(input:{refundRequestId:string;status:RefundRequestStatus}):Promise<RefundRequestRecord>{
  const current=await one<{id:string;order_id:string;payment_intent_id:string;amount:number;currency:string;status:RefundRequestStatus;reason:string;refund_reference:string}>(this.db,"SELECT id,order_id,payment_intent_id,amount,currency,status,reason,refund_reference FROM refund_requests WHERE id=? AND tenant_id=?",[input.refundRequestId,this.tenantId]);
  if(!current)throw new Error("Refund request not found for tenant"); assertRefundRequestTransition(current.status,input.status); if(input.status==="COMPLETED")throw new Error("Provider-neutral adapter cannot complete a real refund");
  const event=`rfev_${crypto.randomUUID()}`;
  const updated=await one<typeof current>(this.db,"UPDATE refund_requests SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=? RETURNING id,order_id,payment_intent_id,amount,currency,status,reason,refund_reference",[input.status,input.refundRequestId,this.tenantId]);
  if(!updated)throw new Error("Refund request update returned no row");
  await this.db.prepare("INSERT INTO refund_events (id,tenant_id,refund_request_id,order_id,payment_intent_id,from_status,to_status,correlation_id) VALUES (?,?,?,?,?,?,?,?)").bind(event,this.tenantId,current.id,current.order_id,current.payment_intent_id,current.status,input.status,this.correlationId).all();
  return{id:updated.id,orderId:updated.order_id as RefundRequestRecord["orderId"],paymentId:updated.payment_intent_id as RefundRequestRecord["paymentId"],amount:{amount:Number(updated.amount),currency:updated.currency},status:updated.status,reason:updated.reason,reference:updated.refund_reference};
 }
}
export const D1_RETURNS_REFUNDS_ADAPTER_VERSION="1.0.0" as const;
