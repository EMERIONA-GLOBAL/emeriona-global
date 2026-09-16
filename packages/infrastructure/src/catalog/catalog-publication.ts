import type { Catalog, CatalogId, CatalogOwnerId } from "../../../domains/src/catalog.js";
import type { PublishCatalogOutput, CatalogPublicationPort } from "../../../application/src/catalog-publish-capability.js";
import type { D1DatabaseLike } from "../d1.js";

async function one<T>(db: D1DatabaseLike, sql: string, values: readonly unknown[]): Promise<T | null> {
  const statement = db.prepare(sql);
  const bound = values.length ? statement.bind(...values) : statement;
  const result = await bound.all<T & Record<string, unknown>>();
  return (result.results[0] as T | undefined) ?? null;
}

interface CatalogRow {
  id: CatalogId;
  ownerId: CatalogOwnerId;
  name: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export class D1CatalogPublicationAdapter implements CatalogPublicationPort {
  constructor(private readonly db: D1DatabaseLike, private readonly tenantId: string) {}

  async publishCatalog(catalogId: CatalogId): Promise<PublishCatalogOutput> {
    const catalog = await one<CatalogRow>(
      this.db,
      "UPDATE catalogs SET status='PUBLISHED',updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=? AND status IN ('DRAFT','PUBLISHED') RETURNING id,owner_id AS ownerId,name,status",
      [catalogId, this.tenantId],
    );
    if (!catalog) throw new Error("Catalog not found for tenant or cannot be published");
    const published: Catalog = catalog;
    return { catalog: published, publishedAt: new Date().toISOString() };
  }

  async publishPartnerCatalog(catalogId: CatalogId, partnerId: string): Promise<PublishCatalogOutput> {
    const catalog = await one<CatalogRow>(
      this.db,
      "UPDATE catalogs SET status='PUBLISHED',updated_at=CURRENT_TIMESTAMP WHERE id=? AND tenant_id=? AND partner_id=? AND status IN ('DRAFT','PUBLISHED') AND EXISTS (SELECT 1 FROM partners WHERE id=? AND tenant_id=? AND status='VERIFIED') RETURNING id,owner_id AS ownerId,name,status",
      [catalogId, this.tenantId, partnerId, partnerId, this.tenantId],
    );
    if (!catalog) throw new Error("Partner catalog not found, not owned by partner, or partner is not verified");
    const published: Catalog = catalog;
    return { catalog: published, publishedAt: new Date().toISOString() };
  }
}

export const C9_CATALOG_PUBLICATION_INFRASTRUCTURE_VERSION = "1.0.1" as const;
