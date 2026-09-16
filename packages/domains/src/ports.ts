/** Specialized domain repository ports. Implementations belong to infrastructure. */
import type { CustomerId, CustomerProfile } from "./customer.js";
import type { ProductId, Product, ServiceId, Service, CatalogId, Catalog } from "./catalog.js";
import type { PartnerId, PartnerAccount, PartnerProduct, PartnerService, PartnerOffer, PartnerOfferId } from "./partner.js";
import type { CartId, Cart, OrderId, Order } from "./commerce.js";
export interface CustomerRepositoryPortV1 { findById(id: CustomerId): Promise<CustomerProfile | null>; save(entity: CustomerProfile): Promise<CustomerProfile>; }
export interface ProductRepositoryPortV1 { findById(id: ProductId): Promise<Product | null>; save(entity: Product): Promise<Product>; }
export interface ServiceRepositoryPortV1 { findById(id: ServiceId): Promise<Service | null>; save(entity: Service): Promise<Service>; }
export interface CatalogRepositoryPortV1 { findById(id: CatalogId): Promise<Catalog | null>; save(entity: Catalog): Promise<Catalog>; }
export interface PartnerRepositoryPortV1 { findById(id: PartnerId): Promise<PartnerAccount | null>; save(entity: PartnerAccount): Promise<PartnerAccount>; verify(id: PartnerId): Promise<PartnerAccount>; }
export interface PartnerCatalogRepositoryPortV1 { saveProduct(entity: PartnerProduct): Promise<PartnerProduct>; saveService(entity: PartnerService): Promise<PartnerService>; }
export interface PartnerOfferRepositoryPortV1 { create(entity: PartnerOffer, tenantId: string): Promise<PartnerOffer>; update(id: PartnerOfferId, patch: { name?: string; status?: PartnerOffer["status"] }, tenantId: string): Promise<PartnerOffer>; }
export interface CartRepositoryPortV1 { findById(id: CartId): Promise<Cart | null>; save(entity: Cart): Promise<Cart>; }
export interface OrderRepositoryPortV1 { findById(id: OrderId): Promise<Order | null>; save(entity: Order): Promise<Order>; }
export interface UnitOfWorkPort { run<T>(work: () => Promise<T>): Promise<T>; }
export const DOMAIN_REPOSITORY_PORTS_VERSION = "1.3.0" as const;
