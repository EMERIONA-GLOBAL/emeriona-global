/** D1-backed domain repositories for the operational foundation. */
import type {
  Cart, CartRepositoryPortV1, CustomerId, CustomerProfile, CustomerRepositoryPortV1,
  Order, OrderId, OrderRepositoryPortV1, PartnerAccount, PartnerId, PartnerRepositoryPortV1,
  Product, ProductId, ProductRepositoryPortV1, Service, ServiceId, ServiceRepositoryPortV1,
} from "../../../domains/src/index.js";
import type { D1DatabaseLike } from "../d1.js";

async function one<T extends Record<string, unknown>>(db: D1DatabaseLike, sql: string, values: readonly unknown[]): Promise<T | null> {
  const statement = db.prepare(sql);
  const bound = values.length ? statement.bind(...values) : statement;
  const result = await bound.all<T>();
  return result.results[0] ?? null;
}

export class D1CustomerRepository implements CustomerRepositoryPortV1 {
  constructor(private readonly db: D1DatabaseLike) {}
  async findById(id: CustomerId): Promise<CustomerProfile | null> {
    return one<CustomerProfile>(this.db, "SELECT id,status,display_name AS displayName,locale,timezone FROM customers WHERE id = ?", [id]);
  }
  async save(entity: CustomerProfile): Promise<CustomerProfile> {
    const row = await one<CustomerProfile>(this.db,
      "INSERT INTO customers (id,tenant_id,display_name,status,locale,timezone) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name,status=excluded.status,locale=excluded.locale,timezone=excluded.timezone,updated_at=CURRENT_TIMESTAMP RETURNING id,status,display_name AS displayName,locale,timezone",
      [entity.id, entity.id, entity.displayName, entity.status, entity.locale ?? null, entity.timezone ?? null]);
    if (!row) throw new Error("Customer persistence returned no row");
    return row;
  }
}

export class D1ProductRepository implements ProductRepositoryPortV1 {
  constructor(private readonly db: D1DatabaseLike) {}
  async findById(id: ProductId): Promise<Product | null> {
    return one<Product>(this.db, "SELECT id,owner_id AS ownerId,name,status FROM products WHERE id = ?", [id]);
  }
  async save(entity: Product): Promise<Product> {
    const row = await one<Product>(this.db,
      "INSERT INTO products (id,tenant_id,owner_id,name,status) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,name=excluded.name,status=excluded.status,updated_at=CURRENT_TIMESTAMP RETURNING id,owner_id AS ownerId,name,status",
      [entity.id, entity.ownerId, entity.ownerId, entity.name, entity.status]);
    if (!row) throw new Error("Product persistence returned no row");
    return row;
  }
}

export class D1ServiceRepository implements ServiceRepositoryPortV1 {
  constructor(private readonly db: D1DatabaseLike) {}
  async findById(id: ServiceId): Promise<Service | null> {
    return one<Service>(this.db, "SELECT id,owner_id AS ownerId,name,status FROM services WHERE id = ?", [id]);
  }
  async save(entity: Service): Promise<Service> {
    const row = await one<Service>(this.db,
      "INSERT INTO services (id,tenant_id,owner_id,name,status) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,name=excluded.name,status=excluded.status,updated_at=CURRENT_TIMESTAMP RETURNING id,owner_id AS ownerId,name,status",
      [entity.id, entity.ownerId, entity.ownerId, entity.name, entity.status]);
    if (!row) throw new Error("Service persistence returned no row");
    return row;
  }
}

export class D1PartnerRepository implements PartnerRepositoryPortV1 {
  constructor(private readonly db: D1DatabaseLike) {}
  async findById(id: PartnerId): Promise<PartnerAccount | null> {
    return one<PartnerAccount>(this.db, "SELECT id,legal_name AS legalName,status,tenant_id AS tenantId FROM partners WHERE id = ?", [id]);
  }
  async save(entity: PartnerAccount): Promise<PartnerAccount> {
    const row = await one<PartnerAccount>(this.db,
      "INSERT INTO partners (id,tenant_id,legal_name,status) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET legal_name=excluded.legal_name,status=excluded.status,updated_at=CURRENT_TIMESTAMP RETURNING id,legal_name AS legalName,status,tenant_id AS tenantId",
      [entity.id, entity.tenantId, entity.legalName, entity.status]);
    if (!row) throw new Error("Partner persistence returned no row");
    return row;
  }
}

export class D1CartRepository implements CartRepositoryPortV1 {
  constructor(private readonly db: D1DatabaseLike) {}
  async findById(id: string): Promise<Cart | null> {
    return one<Cart>(this.db, "SELECT id,customer_id AS customerId,status FROM carts WHERE id = ?", [id]);
  }
  async save(entity: Cart): Promise<Cart> {
    const row = await one<Cart>(this.db,
      "INSERT INTO carts (id,tenant_id,customer_id,status,currency) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET customer_id=excluded.customer_id,status=excluded.status,updated_at=CURRENT_TIMESTAMP RETURNING id,customer_id AS customerId,status",
      [entity.id, entity.customerId, entity.customerId, entity.status, "USD"]);
    if (!row) throw new Error("Cart persistence returned no row");
    return row;
  }
}

export class D1OrderRepository implements OrderRepositoryPortV1 {
  constructor(private readonly db: D1DatabaseLike) {}
  async findById(id: OrderId): Promise<Order | null> {
    return one<Order>(this.db, "SELECT id,customer_id AS customerId,status,total_amount AS totalAmount,currency FROM orders WHERE id = ?", [id]).then((row) => row ? ({ id: row.id as OrderId, customerId: row.customerId as string, status: row.status as Order["status"], total: { amount: Number(row.totalAmount), currency: String(row.currency) } }) : null);
  }
  async save(entity: Order): Promise<Order> {
    const row = await one<Record<string, unknown>>(this.db,
      "INSERT INTO orders (id,tenant_id,customer_id,status,total_amount,currency) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET customer_id=excluded.customer_id,status=excluded.status,total_amount=excluded.total_amount,currency=excluded.currency,updated_at=CURRENT_TIMESTAMP RETURNING id,customer_id,status,total_amount,currency",
      [entity.id, entity.customerId, entity.customerId, entity.status, entity.total.amount, entity.total.currency]);
    if (!row) throw new Error("Order persistence returned no row");
    return { id: row.id as OrderId, customerId: String(row.customer_id), status: row.status as Order["status"], total: { amount: Number(row.total_amount), currency: String(row.currency) } };
  }
}

export const D1_DOMAIN_REPOSITORIES_VERSION = "1.0.0" as const;
