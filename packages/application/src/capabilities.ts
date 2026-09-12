/**
 * Executable application capabilities over provider-neutral domain ports.
 * These handlers are intentionally infrastructure-agnostic: persistence, payment,
 * and AI providers are injected through domain/application ports.
 */
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
import { USE_CASE_IDS } from "./contracts.js";
import type {
  CustomerId, CustomerProfile, CustomerRepositoryPort,
  Product, ProductId, ProductRepositoryPortV1,
  Service, ServiceId, ServiceRepositoryPortV1,
  PartnerAccount, PartnerId, PartnerRepositoryPortV1, PartnerProduct, PartnerService,
  PartnerCatalogRepositoryPortV1,
  Cart, CartId, CartRepositoryPortV1, Order, OrderId, OrderRepositoryPortV1,
  Money, PriceQuote, PricingPort, Discount, DiscountId, PromotionPort,
  PaymentId, PaymentIntent, PaymentProviderPort,
  Recommendation, RecommendationPort,
} from "../../domains/src/index.js";

export interface ApplicationIdFactory {
  customer(): CustomerId;
  product(): ProductId;
  service(): ServiceId;
  partner(): PartnerId;
  cart(): CartId;
  order(): OrderId;
  payment(): PaymentId;
}

export interface CreateCustomerInput { displayName: string; locale?: string; timezone?: string; }
export interface CreateProductInput { ownerId: string; name: string; }
export interface CreateServiceInput { ownerId: string; name: string; }
export interface CreatePartnerInput { legalName: string; tenantId: string; }
export interface CreateCartInput { customerId: string; }
export interface CreateOrderInput { customerId: string; total: Money; }
export interface CreatePaymentInput { orderId: OrderId; amount: Money; }
export interface RecommendationInput { subjectId: string; context?: Readonly<Record<string, unknown>>; }

function required(value: string, field: string): string {
  if (!value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

function response<T>(request: UseCaseRequest<unknown>, output: T): UseCaseResponse<T> {
  return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output };
}

export class CreateCustomerHandler implements UseCaseHandler<CreateCustomerInput, CustomerProfile> {
  constructor(private readonly repository: CustomerRepositoryPort, private readonly ids: ApplicationIdFactory) {}
  async handle(request: UseCaseRequest<CreateCustomerInput>): Promise<UseCaseResponse<CustomerProfile>> {
    const displayName = required(request.input.displayName, "displayName");
    const customer: CustomerProfile = { id: this.ids.customer(), status: "ACTIVE", displayName, locale: request.input.locale, timezone: request.input.timezone };
    return response(request, await this.repository.save(customer));
  }
}

export class CreateProductHandler implements UseCaseHandler<CreateProductInput, Product> {
  constructor(private readonly repository: ProductRepositoryPortV1, private readonly ids: ApplicationIdFactory) {}
  async handle(request: UseCaseRequest<CreateProductInput>): Promise<UseCaseResponse<Product>> {
    const product: Product = { id: this.ids.product(), ownerId: required(request.input.ownerId, "ownerId") as Product["ownerId"], name: required(request.input.name, "name"), status: "DRAFT" };
    return response(request, await this.repository.save(product));
  }
}

export class CreateServiceHandler implements UseCaseHandler<CreateServiceInput, Service> {
  constructor(private readonly repository: ServiceRepositoryPortV1, private readonly ids: ApplicationIdFactory) {}
  async handle(request: UseCaseRequest<CreateServiceInput>): Promise<UseCaseResponse<Service>> {
    const service: Service = { id: this.ids.service(), ownerId: required(request.input.ownerId, "ownerId") as Service["ownerId"], name: required(request.input.name, "name"), status: "DRAFT" };
    return response(request, await this.repository.save(service));
  }
}

export class CreatePartnerHandler implements UseCaseHandler<CreatePartnerInput, PartnerAccount> {
  constructor(private readonly repository: PartnerRepositoryPortV1, private readonly ids: ApplicationIdFactory) {}
  async handle(request: UseCaseRequest<CreatePartnerInput>): Promise<UseCaseResponse<PartnerAccount>> {
    const partner: PartnerAccount = { id: this.ids.partner(), legalName: required(request.input.legalName, "legalName"), tenantId: required(request.input.tenantId, "tenantId"), status: "PENDING" };
    return response(request, await this.repository.save(partner));
  }
}

export class CreateCartHandler implements UseCaseHandler<CreateCartInput, Cart> {
  constructor(private readonly repository: CartRepositoryPortV1, private readonly ids: ApplicationIdFactory) {}
  async handle(request: UseCaseRequest<CreateCartInput>): Promise<UseCaseResponse<Cart>> {
    const cart: Cart = { id: this.ids.cart(), customerId: required(request.input.customerId, "customerId"), status: "OPEN" };
    return response(request, await this.repository.save(cart));
  }
}

export class CreateOrderHandler implements UseCaseHandler<CreateOrderInput, Order> {
  constructor(private readonly repository: OrderRepositoryPortV1, private readonly ids: ApplicationIdFactory) {}
  async handle(request: UseCaseRequest<CreateOrderInput>): Promise<UseCaseResponse<Order>> {
    const customerId = required(request.input.customerId, "customerId");
    if (request.input.total.amount < 0 || !Number.isFinite(request.input.total.amount)) throw new Error("Order total must be finite and non-negative");
    const order: Order = { id: this.ids.order(), customerId, status: "PENDING", total: request.input.total };
    return response(request, await this.repository.save(order));
  }
}

export class ResolvePriceHandler implements UseCaseHandler<{ cartId: string }, PriceQuote> {
  constructor(private readonly pricing: PricingPort) {}
  async handle(request: UseCaseRequest<{ cartId: string }>): Promise<UseCaseResponse<PriceQuote>> {
    return response(request, await this.pricing.quote({ cartId: required(request.input.cartId, "cartId") as CartId }));
  }
}

export class ValidateDiscountHandler implements UseCaseHandler<{ discountId: string; cartId: string }, Discount> {
  constructor(private readonly promotion: PromotionPort) {}
  async handle(request: UseCaseRequest<{ discountId: string; cartId: string }>): Promise<UseCaseResponse<Discount>> {
    return response(request, await this.promotion.validateDiscount({ discountId: required(request.input.discountId, "discountId") as DiscountId, cartId: required(request.input.cartId, "cartId") as CartId }));
  }
}

export class CreatePaymentIntentHandler implements UseCaseHandler<CreatePaymentInput, PaymentIntent> {
  constructor(private readonly payments: PaymentProviderPort, private readonly ids: ApplicationIdFactory) {}
  async handle(request: UseCaseRequest<CreatePaymentInput>): Promise<UseCaseResponse<PaymentIntent>> {
    const amount = request.input.amount;
    if (!Number.isFinite(amount.amount) || amount.amount < 0) throw new Error("Payment amount must be finite and non-negative");
    const intent = await this.payments.create({ orderId: request.input.orderId, amount });
    return response(request, { ...intent, id: intent.id || this.ids.payment() });
  }
}

export class GenerateRecommendationHandler implements UseCaseHandler<RecommendationInput, Recommendation> {
  constructor(private readonly recommendations: RecommendationPort) {}
  async handle(request: UseCaseRequest<RecommendationInput>): Promise<UseCaseResponse<Recommendation>> {
    return response(request, await this.recommendations.generate({ subjectId: required(request.input.subjectId, "subjectId"), context: request.input.context }));
  }
}

export interface PartnerCatalogCreateInput { partnerId: PartnerId; name: string; ownerId: string; }
export class CreatePartnerProductHandler implements UseCaseHandler<PartnerCatalogCreateInput, PartnerProduct> {
  constructor(private readonly repository: PartnerCatalogRepositoryPortV1, private readonly ids: ApplicationIdFactory) {}
  async handle(request: UseCaseRequest<PartnerCatalogCreateInput>): Promise<UseCaseResponse<PartnerProduct>> {
    const entity = { id: this.ids.product(), partnerId: request.input.partnerId, ownerId: required(request.input.ownerId, "ownerId"), name: required(request.input.name, "name"), status: "DRAFT" as const } as PartnerProduct;
    return response(request, await this.repository.saveProduct(entity));
  }
}

export class CreatePartnerServiceHandler implements UseCaseHandler<PartnerCatalogCreateInput, PartnerService> {
  constructor(private readonly repository: PartnerCatalogRepositoryPortV1, private readonly ids: ApplicationIdFactory) {}
  async handle(request: UseCaseRequest<PartnerCatalogCreateInput>): Promise<UseCaseResponse<PartnerService>> {
    const entity = { id: this.ids.service(), partnerId: request.input.partnerId, ownerId: required(request.input.ownerId, "ownerId"), name: required(request.input.name, "name"), status: "DRAFT" as const } as PartnerService;
    return response(request, await this.repository.saveService(entity));
  }
}

/** Canonical registration map for the executable foundation. */
export const EXECUTABLE_FOUNDATION_USE_CASES = {
  createCustomer: USE_CASE_IDS.customer.create,
  createProduct: USE_CASE_IDS.catalog.productCreate,
  createService: USE_CASE_IDS.catalog.serviceCreate,
  createPartner: USE_CASE_IDS.partner.create,
  createPartnerProduct: USE_CASE_IDS.partner.productCreate,
  createPartnerService: USE_CASE_IDS.partner.serviceCreate,
  createCart: USE_CASE_IDS.commerce.cartCreate,
  createOrder: USE_CASE_IDS.commerce.orderCreate,
  resolvePrice: USE_CASE_IDS.pricing.quote,
  validateDiscount: USE_CASE_IDS.promotion.discountValidate,
  createPaymentIntent: USE_CASE_IDS.payment.create,
  generateRecommendation: USE_CASE_IDS.ai.recommendation,
} as const;

export const APPLICATION_CAPABILITIES_VERSION = "1.0.0" as const;
