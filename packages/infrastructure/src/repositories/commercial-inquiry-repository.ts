import type { CommercialInquiry, CommercialInquiryId, CommercialInquiryRepositoryPortV1 } from "../../../domains/src/index.js";
import type { D1DatabaseLike } from "../d1.js";

async function one<T>(db:D1DatabaseLike,sql:string,values:readonly unknown[]):Promise<T|null>{const s=db.prepare(sql),r=await (values.length?s.bind(...values):s).all<T&Record<string,unknown>>();return(r.results[0] as T|undefined)??null;}

export class D1CommercialInquiryRepository implements CommercialInquiryRepositoryPortV1 {
 constructor(private readonly db:D1DatabaseLike,private readonly tenantId:string){}
 findById(id:CommercialInquiryId){
  return one<CommercialInquiry>(this.db,"SELECT id,tenant_id AS tenantId,customer_id AS customerId,partner_id AS partnerId,product_id AS productId,service_id AS serviceId,offer_id AS offerId,solution_id AS solutionId,subject,message,status FROM commercial_inquiries WHERE id=? AND tenant_id=?",[id,this.tenantId]);
 }
 async save(entity:CommercialInquiry){
  if(entity.tenantId!==this.tenantId)throw new Error("Commercial inquiry tenant mismatch");
  if(!await one(this.db,"SELECT id FROM customers WHERE id=? AND tenant_id=? AND status<> 'CLOSED'",[entity.customerId,this.tenantId]))throw new Error("Customer not found for tenant");
  const targets=[entity.productId,entity.serviceId,entity.offerId,entity.solutionId].filter(Boolean);
  if(!targets.length)throw new Error("Commercial inquiry requires a commercial target");
  if(entity.partnerId&&!await one(this.db,"SELECT id FROM partners WHERE id=? AND tenant_id=? AND status='VERIFIED'",[entity.partnerId,this.tenantId]))throw new Error("Verified partner not found for tenant");
  if(entity.productId&&!await one(this.db,"SELECT id FROM products WHERE id=? AND tenant_id=?",[entity.productId,this.tenantId]))throw new Error("Product not found for tenant");
  if(entity.serviceId&&!await one(this.db,"SELECT id FROM services WHERE id=? AND tenant_id=?",[entity.serviceId,this.tenantId]))throw new Error("Service not found for tenant");
  if(entity.offerId&&!await one(this.db,"SELECT id FROM offers WHERE id=? AND tenant_id=? AND status IN ('ACTIVE','PAUSED')",[entity.offerId,this.tenantId]))throw new Error("Active offer not found for tenant");
  if(entity.solutionId&&!await one(this.db,"SELECT id FROM solutions WHERE id=? AND tenant_id=? AND status<>'ARCHIVED'",[entity.solutionId,this.tenantId]))throw new Error("Solution not found for tenant");
  const row=await one<CommercialInquiry>(this.db,"INSERT INTO commercial_inquiries (id,tenant_id,customer_id,partner_id,product_id,service_id,offer_id,solution_id,subject,message,status) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET partner_id=excluded.partner_id,subject=excluded.subject,message=excluded.message,status=excluded.status,updated_at=CURRENT_TIMESTAMP WHERE commercial_inquiries.tenant_id=excluded.tenant_id RETURNING id,tenant_id AS tenantId,customer_id AS customerId,partner_id AS partnerId,product_id AS productId,service_id AS serviceId,offer_id AS offerId,solution_id AS solutionId,subject,message,status",[entity.id,this.tenantId,entity.customerId,entity.partnerId??null,entity.productId??null,entity.serviceId??null,entity.offerId??null,entity.solutionId??null,entity.subject,entity.message??null,entity.status]);
  if(!row)throw new Error("Commercial inquiry persistence returned no row"); return row;
 }
}
export const D1_COMMERCIAL_INQUIRY_REPOSITORY_VERSION="1.0.0" as const;
