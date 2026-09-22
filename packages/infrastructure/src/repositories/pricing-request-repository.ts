import type { PricingRequest,PricingRequestId,PricingRequestRepositoryPortV1 } from "../../../domains/src/pricing-request.js";
import type { D1DatabaseLike } from "../d1.js";
async function one<T>(db:D1DatabaseLike,sql:string,v:readonly unknown[]=[]):Promise<T|null>{const s=db.prepare(sql),r=await (v.length?s.bind(...v):s).all<T&Record<string,unknown>>();return(r.results[0] as T|undefined)??null;}
export class D1PricingRequestRepository implements PricingRequestRepositoryPortV1{
 constructor(private readonly db:D1DatabaseLike,private readonly tenantId:string){}
 async findById(id:PricingRequestId){return one<PricingRequest>(this.db,"SELECT id,tenant_id AS tenantId,inquiry_id AS inquiryId,status,currency,requested_at AS requestedAt,priced_at AS pricedAt FROM pricing_requests WHERE id=? AND tenant_id=?",[id,this.tenantId]);}
 async findPendingByInquiry(inquiryId:string){return one<PricingRequest>(this.db,"SELECT id,tenant_id AS tenantId,inquiry_id AS inquiryId,status,currency,requested_at AS requestedAt,priced_at AS pricedAt FROM pricing_requests WHERE inquiry_id=? AND tenant_id=? AND status='PENDING'",[inquiryId,this.tenantId]);}
 async save(entity:PricingRequest){
  if(entity.tenantId!==this.tenantId)throw new Error("Pricing request tenant mismatch");
  const inquiry=await one(this.db,"SELECT id,status FROM commercial_inquiries WHERE id=? AND tenant_id=? AND status NOT IN ('CANCELLED','CLOSED')",[entity.inquiryId,this.tenantId]);if(!inquiry)throw new Error("Commercial inquiry not found or closed");
  const row=await one<PricingRequest>(this.db,"INSERT INTO pricing_requests (id,tenant_id,inquiry_id,status,currency,requested_at,priced_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,currency=excluded.currency,priced_at=excluded.priced_at,updated_at=CURRENT_TIMESTAMP WHERE pricing_requests.tenant_id=excluded.tenant_id RETURNING id,tenant_id AS tenantId,inquiry_id AS inquiryId,status,currency,requested_at AS requestedAt,priced_at AS pricedAt",[entity.id,this.tenantId,entity.inquiryId,entity.status,entity.currency,entity.requestedAt,entity.pricedAt??null]);
  if(!row)throw new Error("Pricing request persistence returned no row");return row;
 }
}
export const D1_PRICING_REQUEST_REPOSITORY_VERSION="1.0.0" as const;
