/** Product and Service are first-class catalog entities. */
export type ProductId=string & {readonly __brand:"ProductId"};
export type ServiceId=string & {readonly __brand:"ServiceId"};
export type CatalogId=string & {readonly __brand:"CatalogId"};
export type CatalogOwnerId=string & {readonly __brand:"CatalogOwnerId"};
export interface Product{readonly id:ProductId;readonly ownerId:CatalogOwnerId;readonly catalogId?:CatalogId;readonly name:string;readonly status:"DRAFT"|"PUBLISHED"|"ARCHIVED";}
export interface Service{readonly id:ServiceId;readonly ownerId:CatalogOwnerId;readonly catalogId?:CatalogId;readonly name:string;readonly status:"DRAFT"|"PUBLISHED"|"ARCHIVED";}
export interface Catalog{readonly id:CatalogId;readonly ownerId:CatalogOwnerId;readonly name:string;readonly status?:"DRAFT"|"PUBLISHED"|"ARCHIVED";}
export interface CatalogRepositoryPort{findProduct(id:ProductId):Promise<Product|null>;saveProduct(product:Product):Promise<Product>;findService(id:ServiceId):Promise<Service|null>;saveService(service:Service):Promise<Service>;findCatalog(id:CatalogId):Promise<Catalog|null>;saveCatalog(catalog:Catalog):Promise<Catalog>;}
export const CATALOG_DOMAIN_VERSION="1.1.0" as const;
