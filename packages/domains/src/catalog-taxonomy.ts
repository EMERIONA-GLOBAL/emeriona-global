export type CatalogCategoryKind = "PRODUCT" | "SERVICE";
export type CatalogCategoryStatus = "ACTIVE" | "INACTIVE";
export type CatalogCategoryId = string & { readonly __brand: "CatalogCategoryId" };

export interface CatalogCategory {
  readonly id: CatalogCategoryId;
  readonly tenantId: string;
  readonly kind: CatalogCategoryKind;
  readonly parentId?: CatalogCategoryId;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly status: CatalogCategoryStatus;
  readonly sortOrder: number;
}

export interface CatalogCategoryRepositoryPort {
  list(kind: CatalogCategoryKind): Promise<readonly CatalogCategory[]>;
  findById(id: CatalogCategoryId): Promise<CatalogCategory | null>;
}

export const CATALOG_TAXONOMY_VERSION = "1.0.0" as const;
