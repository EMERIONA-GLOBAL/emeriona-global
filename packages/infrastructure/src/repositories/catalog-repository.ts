import type { Catalog, CatalogId } from "../../../domains/src/catalog.js";
import type { CatalogRepositoryPortV1 } from "../../../domains/src/ports.js";
import type { D1DatabaseLike } from "../d1.js";
async function one<T>(db:D1DatabaseLike,sql:string,values:readonly unknown[]):Promise<T|null>{const statement=db.prepare(sql);const bound=values.length?statement.bind(...values):statement;const result=await bound.all<T&Record<string,unknown>>();return (result.results[0] as T|undefined)??null;}
export class D1CatalogRepository implements CatalogRepositoryPortV1{
 constructor(private readonly db:D1DatabaseLike){}
 async findById(id:CatalogId):Promise<Catalog|null>{return one<Catalog>(this.db,"SELECT id,owner_id AS ownerId,name,status FROM catalogs WHERE id=?",[id]);}
 async save(entity:Catalog):Promise<Catalog>{const row=await one<Catalog>(this.db,"INSERT INTO catalogs (id,owner_id,name,status) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,name=excluded.name,status=excluded.status,updated_at=CURRENT_TIMESTAMP RETURNING id,owner_id AS ownerId,name,status",[entity.id,entity.ownerId,entity.name,entity.status??"DRAFT"]);if(!row)throw new Error("Catalog persistence returned no row");return row;}
}
export const D1_CATALOG_REPOSITORY_VERSION="1.0.0" as const;
