import type { CatalogCategory, CatalogCategoryKind, CatalogCategoryRepositoryPort, CatalogCategoryId } from "../../../domains/src/catalog-taxonomy.js";
import type { D1DatabaseLike } from "../d1.js";
async function all<T>(db:D1DatabaseLike,sql:string,values:readonly unknown[]):Promise<T[]> { const statement=db.prepare(sql); const bound=values.length?statement.bind(...values):statement; const result=await bound.all<T&Record<string,unknown>>(); return result.results as T[]; }
export class D1CatalogCategoryRepository implements CatalogCategoryRepositoryPort {
  constructor(private readonly db:D1DatabaseLike, private readonly tenantId:string) {}
  async list(kind:CatalogCategoryKind):Promise<readonly CatalogCategory[]> {
    return all<CatalogCategory>(this.db,"SELECT id,tenant_id AS tenantId,kind,parent_id AS parentId,slug,name,description,status,sort_order AS sortOrder FROM catalog_categories WHERE tenant_id=? AND kind=? AND status='ACTIVE' ORDER BY sort_order ASC,name ASC",[this.tenantId,kind]);
  }
  async findById(id:CatalogCategoryId):Promise<CatalogCategory|null> {
    const rows=await all<CatalogCategory>(this.db,"SELECT id,tenant_id AS tenantId,kind,parent_id AS parentId,slug,name,description,status,sort_order AS sortOrder FROM catalog_categories WHERE id=? AND tenant_id=?",[id,this.tenantId]);
    return rows[0]??null;
  }
}
export const D1_CATALOG_CATEGORY_REPOSITORY_VERSION="1.0.0" as const;
