import type { PricingDecision,PricingDecisionId,PricingDecisionInput,PricingDecisionRepositoryPortV1 } from "../../../domains/src/pricing-decision.js";
import type { D1DatabaseLike } from "../d1.js";
async function one<T>(db:D1DatabaseLike,sql:string,v:readonly unknown[]=[]):Promise<T|null>{const s=db.prepare(sql),r=await (v.length?s.bind(...v):s).all<T&Record<string,unknown>>();return(r.results[0] as T|undefined)??null;}
async function all<T>(db:D1DatabaseLike,sql:string,v:readonly unknown[]=[]):Promise<T[]>{const s=db.prepare(sql),r=await (v.length?s.bind(...v):s).all<T&Record<string,unknown>>();return r.results as T[];}

export class D1PricingDecisionRepository implements PricingDecisionRepositoryPortV1{
 constructor(private readonly db:D1DatabaseLike,private readonly tenantId:string){}
 async findDecisionById(id:PricingDecisionId){return one<PricingDecision>(this.db,"SELECT id,tenant_id AS tenantId,pricing_request_id AS pricingRequestId,status,amount,currency,decided_at AS decidedAt,created_at AS createdAt,updated_at AS updatedAt FROM pricing_decisions WHERE id=? AND tenant_id=?",[id,this.tenantId]);}
 async findPendingByPricingRequest(pricingRequestId:string){return one<PricingDecision>(this.db,"SELECT id,tenant_id AS tenantId,pricing_request_id AS pricingRequestId,status,amount,currency,decided_at AS decidedAt,created_at AS createdAt,updated_at AS updatedAt FROM pricing_decisions WHERE pricing_request_id=? AND tenant_id=? AND status='PENDING'",[pricingRequestId,this.tenantId]);}
 async saveDecision(entity:PricingDecision){
  if(entity.tenantId!==this.tenantId)throw new Error("Pricing decision tenant mismatch");
  const request=await one<Record<string,unknown>>(this.db,"SELECT id,status,currency FROM pricing_requests WHERE id=? AND tenant_id=?",[entity.pricingRequestId,this.tenantId]);
  if(!request)throw new Error("Pricing request not found for tenant");
  if(String(request.status)==="DECLINED"||String(request.status)==="EXPIRED")throw new Error("Pricing request is not active");
  if(String(request.currency)!==entity.currency)throw new Error("Pricing decision currency does not match pricing request");
  const row=await one<PricingDecision>(this.db,"INSERT INTO pricing_decisions (id,tenant_id,pricing_request_id,status,amount,currency,decided_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,amount=excluded.amount,currency=excluded.currency,decided_at=excluded.decided_at,updated_at=CURRENT_TIMESTAMP WHERE pricing_decisions.tenant_id=excluded.tenant_id RETURNING id,tenant_id AS tenantId,pricing_request_id AS pricingRequestId,status,amount,currency,decided_at AS decidedAt,created_at AS createdAt,updated_at AS updatedAt",[entity.id,this.tenantId,entity.pricingRequestId,entity.status,entity.amount??null,entity.currency,entity.decidedAt??null,entity.createdAt,entity.updatedAt]);
  if(!row)throw new Error("Pricing decision persistence returned no row");return row;
 }
 async addInput(input:PricingDecisionInput){
  if(input.tenantId!==this.tenantId)throw new Error("Pricing input tenant mismatch");
  const decision=await this.findDecisionById(input.pricingDecisionId);if(!decision)throw new Error("Pricing decision not found for tenant");
  const row=await one<PricingDecisionInput>(this.db,"INSERT INTO pricing_decision_inputs (id,tenant_id,pricing_decision_id,direction,amount,currency,source_type,source_reference,sequence) VALUES (?,?,?,?,?,?,?,?,?) RETURNING id,tenant_id AS tenantId,pricing_decision_id AS pricingDecisionId,direction,amount,currency,source_type AS sourceType,source_reference AS sourceReference,sequence",[input.id,this.tenantId,input.pricingDecisionId,input.direction,input.amount,input.currency,input.sourceType,input.sourceReference,input.sequence]);
  if(!row)throw new Error("Pricing input persistence returned no row");return row;
 }
 async listInputs(pricingDecisionId:PricingDecisionId){
  return all<PricingDecisionInput>(this.db,"SELECT id,tenant_id AS tenantId,pricing_decision_id AS pricingDecisionId,direction,amount,currency,source_type AS sourceType,source_reference AS sourceReference,sequence FROM pricing_decision_inputs WHERE pricing_decision_id=? AND tenant_id=? ORDER BY sequence,id",[pricingDecisionId,this.tenantId]);
 }
}
export const D1_PRICING_DECISION_REPOSITORY_VERSION="1.0.0" as const;
