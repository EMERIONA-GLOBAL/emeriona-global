import type { Solution, SolutionId, SolutionRepositoryPortV1 } from "../../../domains/src/index.js";
import type { D1DatabaseLike } from "../d1.js";
async function one<T>(db:D1DatabaseLike,sql:string,values:readonly unknown[]):Promise<T|null>{const s=db.prepare(sql),r=await (values.length?s.bind(...values):s).all<T&Record<string,unknown>>();return(r.results[0] as T|undefined)??null;}
async function ids(db:D1DatabaseLike,sql:string,values:readonly unknown[]):Promise<readonly string[]>{const r=await db.prepare(sql).bind(...values).all<Record<string,unknown>>();return r.results.map(x=>String(Object.values(x)[0]));}
export class D1SolutionRepository implements SolutionRepositoryPortV1{
 constructor(private readonly db:D1DatabaseLike,private readonly tenantId:string){}
 findById(id:SolutionId){return one<Solution>(this.db,"SELECT id,tenant_id AS tenantId,owner_id AS ownerId,name,description,status FROM solutions WHERE id=? AND tenant_id=?",[id,this.tenantId]);}
 findProducts(id:SolutionId){return ids(this.db,"SELECT product_id FROM solution_product_links WHERE solution_id=? AND tenant_id=? ORDER BY created_at",[id,this.tenantId]);}
 findServices(id:SolutionId){return ids(this.db,"SELECT service_id FROM solution_service_links WHERE solution_id=? AND tenant_id=? ORDER BY created_at",[id,this.tenantId]);}
 findOffers(id:SolutionId){return ids(this.db,"SELECT offer_id FROM solution_offer_links WHERE solution_id=? AND tenant_id=? ORDER BY created_at",[id,this.tenantId]);}
 async save(entity:Solution,links:{productIds:readonly string[];serviceIds:readonly string[];offerIds:readonly string[]}) {
  if(entity.tenantId!==this.tenantId)throw new Error("Solution tenant mismatch");
  if(!links.productIds.length&&!links.serviceIds.length&&!links.offerIds.length)throw new Error("Solution must contain at least one capability");
  for(const id of links.productIds){if(!await one(this.db,"SELECT id FROM products WHERE id=? AND tenant_id=?",[id,this.tenantId]))throw new Error(`Product not found for tenant: ${id}`);}
  for(const id of links.serviceIds){if(!await one(this.db,"SELECT id FROM services WHERE id=? AND tenant_id=?",[id,this.tenantId]))throw new Error(`Service not found for tenant: ${id}`);}
  for(const id of links.offerIds){if(!await one(this.db,"SELECT id FROM offers WHERE id=? AND tenant_id=? AND status IN ('ACTIVE','PAUSED')",[id,this.tenantId]))throw new Error(`Active offer not found for tenant: ${id}`);}
  const row=await one<Solution>(this.db,"INSERT INTO solutions (id,tenant_id,owner_id,name,description,status) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,name=excluded.name,description=excluded.description,status=excluded.status,updated_at=CURRENT_TIMESTAMP WHERE solutions.tenant_id=excluded.tenant_id RETURNING id,tenant_id AS tenantId,owner_id AS ownerId,name,description,status",[entity.id,this.tenantId,entity.ownerId,entity.name,entity.description??null,entity.status]);if(!row)throw new Error("Solution persistence returned no row");
  await this.db.prepare("DELETE FROM solution_product_links WHERE solution_id=? AND tenant_id=?").bind(entity.id,this.tenantId).all();
  await this.db.prepare("DELETE FROM solution_service_links WHERE solution_id=? AND tenant_id=?").bind(entity.id,this.tenantId).all();
  await this.db.prepare("DELETE FROM solution_offer_links WHERE solution_id=? AND tenant_id=?").bind(entity.id,this.tenantId).all();
  for(const id of links.productIds)await this.db.prepare("INSERT INTO solution_product_links (id,tenant_id,solution_id,product_id) VALUES (?,?,?,?)").bind(crypto.randomUUID(),this.tenantId,entity.id,id).all();
  for(const id of links.serviceIds)await this.db.prepare("INSERT INTO solution_service_links (id,tenant_id,solution_id,service_id) VALUES (?,?,?,?)").bind(crypto.randomUUID(),this.tenantId,entity.id,id).all();
  for(const id of links.offerIds)await this.db.prepare("INSERT INTO solution_offer_links (id,tenant_id,solution_id,offer_id) VALUES (?,?,?,?)").bind(crypto.randomUUID(),this.tenantId,entity.id,id).all();
  return row;
 }
}
export const D1_SOLUTION_REPOSITORY_VERSION="1.0.0" as const;
