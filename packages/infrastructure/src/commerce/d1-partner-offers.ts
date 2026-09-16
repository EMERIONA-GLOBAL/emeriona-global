import type { PartnerOffer, PartnerOfferId, PartnerOfferRepositoryPortV1 } from "../../../domains/src/index.js";
import type { D1DatabaseLike } from "../d1.js";

export class D1PartnerOffersAdapter implements PartnerOfferRepositoryPortV1 {
  constructor(private readonly db:D1DatabaseLike){}
  async create(offer:PartnerOffer,tenantId:string):Promise<PartnerOffer>{
    const row=await this.db.prepare("INSERT INTO offers (id,tenant_id,owner_id,partner_id,name,status) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM partners WHERE id=? AND tenant_id=? AND status='VERIFIED') RETURNING id,partner_id AS partnerId,name,status").bind(offer.id,tenantId,offer.partnerId,offer.partnerId,offer.name,offer.status,offer.partnerId,tenantId).all<{id:string;partnerId:string;name:string;status:PartnerOffer["status"]}>();
    const result=row.results[0]; if(!result) throw new Error("Partner not found for tenant or not verified");
    return {id:result.id as PartnerOfferId,partnerId:result.partnerId as PartnerOffer["partnerId"],name:result.name,status:result.status};
  }
  async update(id:PartnerOfferId,patch:{name?:string;status?:PartnerOffer["status"]},tenantId:string):Promise<PartnerOffer>{
    const current=await this.db.prepare("SELECT id,partner_id AS partnerId,name,status FROM offers WHERE id=? AND tenant_id=?").bind(id,tenantId).all<{id:string;partnerId:string;name:string;status:PartnerOffer["status"]}>();
    const existing=current.results[0]; if(!existing) throw new Error("Partner offer not found for tenant");
    const nextName=patch.name??existing.name; const nextStatus=patch.status??existing.status;
    if(["ACTIVE","PAUSED"].includes(nextStatus) && !(await this.isVerified(existing.partnerId,tenantId))) throw new Error("Partner must be verified before activating an offer");
    const updated=await this.db.prepare("UPDATE offers SET name=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=? RETURNING id,partner_id AS partnerId,name,status").bind(nextName,nextStatus,id,tenantId).all<{id:string;partnerId:string;name:string;status:PartnerOffer["status"]}>();
    const result=updated.results[0]; if(!result) throw new Error("Partner offer update failed");
    return {id:result.id as PartnerOfferId,partnerId:result.partnerId as PartnerOffer["partnerId"],name:result.name,status:result.status};
  }
  private async isVerified(partnerId:string,tenantId:string):Promise<boolean>{const result=await this.db.prepare("SELECT 1 AS ok FROM partners WHERE id=? AND tenant_id=? AND status='VERIFIED'").bind(partnerId,tenantId).all<{ok:number}>();return result.results.length>0;}
}
export const C10_PARTNER_OFFERS_INFRASTRUCTURE_VERSION="1.0.0" as const;
