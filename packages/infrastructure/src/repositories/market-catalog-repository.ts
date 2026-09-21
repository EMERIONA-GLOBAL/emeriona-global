import type { D1DatabaseLike } from "../d1.js";
import type { MarketCatalogQuery, MarketCatalogRepositoryPortV1, MarketCatalogResult, MarketItem } from "../../../domains/src/market.js";

async function all<T>(db: D1DatabaseLike, sql: string, values: readonly unknown[]): Promise<T[]> {
  const statement = db.prepare(sql);
  const bound = values.length ? statement.bind(...values) : statement;
  const result = await bound.all<T & Record<string, unknown>>();
  return result.results as T[];
}

export class D1MarketCatalogRepository implements MarketCatalogRepositoryPortV1 {
  constructor(private readonly db: D1DatabaseLike, private readonly tenantId: string) {}

  async query(input: MarketCatalogQuery): Promise<MarketCatalogResult> {
    const search = input.query ? `%${input.query.toLowerCase().replace(/[%_]/g, "")}%` : null;
    const limit = input.limit ?? 48;
    const filter = input.filter ?? "all";
    const includeProducts = filter === "all" || filter === "products" || filter === "partners";
    const includeServices = filter === "all" || filter === "services" || filter === "partners";
    const includeOffers = filter === "all" || filter === "offers";

    const rows: MarketItem[] = [];

    if (includeProducts) {
      const productRows = await all<Record<string, unknown>>(this.db,
        `SELECT p.id,p.name,p.status,p.created_at,CASE WHEN p.partner_id IS NOT NULL THEN pa.legal_name ELSE 'EMERIONA GLOBAL' END AS partner
         FROM products p
         JOIN catalogs c ON c.id=p.catalog_id AND c.tenant_id=p.tenant_id AND c.status='PUBLISHED'
         LEFT JOIN partners pa ON pa.id=p.partner_id AND pa.tenant_id=p.tenant_id AND pa.status='VERIFIED'
         WHERE p.tenant_id=? AND p.status='PUBLISHED' AND (p.partner_id IS NULL OR pa.id IS NOT NULL)
           AND (? IS NULL OR lower(p.name) LIKE ?)
         ORDER BY p.created_at DESC LIMIT ?`,
        [this.tenantId, search, search, limit],
      );
      rows.push(...productRows.map(row => ({ id: String(row.id), type: "product" as const, name: String(row.name), status: "PUBLISHED" as const, partner: String(row.partner), isNew: Date.now() - Date.parse(String(row.created_at)) < 30 * 86400000 })));
    }

    if (includeServices) {
      const serviceRows = await all<Record<string, unknown>>(this.db,
        `SELECT s.id,s.name,s.status,s.created_at,CASE WHEN s.partner_id IS NOT NULL THEN pa.legal_name ELSE 'EMERIONA GLOBAL' END AS partner
         FROM services s
         JOIN catalogs c ON c.id=s.catalog_id AND c.tenant_id=s.tenant_id AND c.status='PUBLISHED'
         LEFT JOIN partners pa ON pa.id=s.partner_id AND pa.tenant_id=s.tenant_id AND pa.status='VERIFIED'
         WHERE s.tenant_id=? AND s.status='PUBLISHED' AND (s.partner_id IS NULL OR pa.id IS NOT NULL)
           AND (? IS NULL OR lower(s.name) LIKE ?)
         ORDER BY s.created_at DESC LIMIT ?`,
        [this.tenantId, search, search, limit],
      );
      rows.push(...serviceRows.map(row => ({ id: String(row.id), type: "service" as const, name: String(row.name), status: "PUBLISHED" as const, partner: String(row.partner), isNew: Date.now() - Date.parse(String(row.created_at)) < 30 * 86400000 })));
    }

    if (includeOffers) {
      const offerRows = await all<Record<string, unknown>>(this.db,
        `SELECT o.id,o.name,o.status,o.created_at,CASE WHEN o.partner_id IS NOT NULL THEN pa.legal_name ELSE 'EMERIONA GLOBAL' END AS partner
         FROM offers o
         LEFT JOIN partners pa ON pa.id=o.partner_id AND pa.tenant_id=o.tenant_id AND pa.status='VERIFIED'
         WHERE o.tenant_id=? AND o.status='ACTIVE'
           AND (o.starts_at IS NULL OR o.starts_at<=CURRENT_TIMESTAMP)
           AND (o.ends_at IS NULL OR o.ends_at>=CURRENT_TIMESTAMP)
           AND (o.partner_id IS NULL OR pa.id IS NOT NULL)
           AND (? IS NULL OR lower(o.name) LIKE ?)
         ORDER BY o.created_at DESC LIMIT ?`,
        [this.tenantId, search, search, limit],
      );
      rows.push(...offerRows.map(row => ({ id: String(row.id), type: "offer" as const, name: String(row.name), status: "ACTIVE" as const, partner: String(row.partner), isNew: Date.now() - Date.parse(String(row.created_at)) < 30 * 86400000 })));
    }

    rows.sort((a,b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
    return { items: rows.slice(0, limit), total: rows.length };
  }
}

export const D1_MARKET_CATALOG_REPOSITORY_VERSION = "1.0.0" as const;
