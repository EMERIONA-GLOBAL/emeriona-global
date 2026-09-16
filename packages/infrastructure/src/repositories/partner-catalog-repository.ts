import type { PartnerCatalogRepositoryPortV1, PartnerId, PartnerProduct, PartnerService } from "../../../domains/src/index.js";
import type { D1DatabaseLike } from "../d1.js";

async function one<T>(db: D1DatabaseLike, sql: string, values: readonly unknown[]): Promise<T | null> {
  const statement = db.prepare(sql);
  const bound = values.length ? statement.bind(...values) : statement;
  const result = await bound.all<T & Record<string, unknown>>();
  return (result.results[0] as T | undefined) ?? null;
}

export class D1PartnerCatalogRepository implements PartnerCatalogRepositoryPortV1 {
  constructor(private readonly db: D1DatabaseLike, private readonly tenantId: string) {}

  async saveProduct(entity: PartnerProduct): Promise<PartnerProduct> {
    const partner = await one<{ id: string; status: string }>(this.db, "SELECT id,status FROM partners WHERE id=? AND tenant_id=?", [entity.partnerId, this.tenantId]);
    if (!partner || partner.status !== "VERIFIED") throw new Error("Verified partner not found for tenant");
    const row = await one<Record<string, unknown>>(this.db, "INSERT INTO products (id,tenant_id,owner_id,partner_id,name,status) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,partner_id=excluded.partner_id,name=excluded.name,status=excluded.status,updated_at=CURRENT_TIMESTAMP WHERE products.tenant_id=excluded.tenant_id AND products.partner_id=excluded.partner_id RETURNING id,owner_id,partner_id,name,status", [entity.id, this.tenantId, entity.ownerId, entity.partnerId, entity.name, entity.status]);
    if (!row) throw new Error("Partner product persistence returned no row");
    return { id: row.id as PartnerProduct["id"], ownerId: String(row.owner_id) as PartnerProduct["ownerId"], partnerId: row.partner_id as PartnerId, name: String(row.name), status: row.status as PartnerProduct["status"] };
  }

  async saveService(entity: PartnerService): Promise<PartnerService> {
    const partner = await one<{ id: string; status: string }>(this.db, "SELECT id,status FROM partners WHERE id=? AND tenant_id=?", [entity.partnerId, this.tenantId]);
    if (!partner || partner.status !== "VERIFIED") throw new Error("Verified partner not found for tenant");
    const row = await one<Record<string, unknown>>(this.db, "INSERT INTO services (id,tenant_id,owner_id,partner_id,name,status) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,partner_id=excluded.partner_id,name=excluded.name,status=excluded.status,updated_at=CURRENT_TIMESTAMP WHERE services.tenant_id=excluded.tenant_id AND services.partner_id=excluded.partner_id RETURNING id,owner_id,partner_id,name,status", [entity.id, this.tenantId, entity.ownerId, entity.partnerId, entity.name, entity.status]);
    if (!row) throw new Error("Partner service persistence returned no row");
    return { id: row.id as PartnerService["id"], ownerId: String(row.owner_id) as PartnerService["ownerId"], partnerId: row.partner_id as PartnerId, name: String(row.name), status: row.status as PartnerService["status"] };
  }
}

export const D1_PARTNER_CATALOG_REPOSITORY_VERSION = "1.0.0" as const;
