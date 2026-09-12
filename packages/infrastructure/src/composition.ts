/**
 * Executable composition root for the provider-neutral application foundation.
 * Infrastructure owns wiring; domain/application layers remain provider-neutral.
 */
import type {
  ApplicationIdFactory,
  DefaultUseCaseRuntime,
  UseCaseRuntime,
  UseCaseHandler,
  UseCaseRequest,
  UseCaseResponse,
} from "../../application/src/index.js";
import {
  CreateCartHandler,
  CreateCustomerHandler,
  CreateOrderHandler,
  CreatePartnerHandler,
  CreateProductHandler,
  CreateServiceHandler,
} from "../../application/src/index.js";
import { DefaultUseCaseRuntime } from "../../application/src/index.js";
import { DefaultUseCaseBus } from "../../application/src/index.js";
import type { UseCaseId } from "../../application/src/index.js";
import {
  D1CartRepository,
  D1CustomerRepository,
  D1OrderRepository,
  D1PartnerRepository,
  D1ProductRepository,
  D1ServiceRepository,
} from "./repositories/domain-repositories.js";
import {
  InMemoryIdempotencyAdapter,
  NoopAuditAdapter,
  NoopTelemetryAdapter,
  PolicyAuthorizationAdapter,
} from "./adapters/application-ports.js";
import type { D1DatabaseLike } from "./d1.js";

export interface FoundationCompositionOptions {
  readonly tenantId: string;
  readonly currency: string;
  readonly authorize?: (useCaseId: UseCaseId) => Promise<boolean>;
  readonly ids?: ApplicationIdFactory;
}

export interface FoundationRuntime {
  readonly runtime: UseCaseRuntime;
  readonly bus: DefaultUseCaseBus;
}

function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function defaultIds(): ApplicationIdFactory {
  return {
    customer: () => randomId("cus") as ReturnType<ApplicationIdFactory["customer"]>,
    product: () => randomId("prd") as ReturnType<ApplicationIdFactory["product"]>,
    service: () => randomId("srv") as ReturnType<ApplicationIdFactory["service"]>,
    partner: () => randomId("ptr") as ReturnType<ApplicationIdFactory["partner"]>,
    cart: () => randomId("crt") as ReturnType<ApplicationIdFactory["cart"]>,
    order: () => randomId("ord") as ReturnType<ApplicationIdFactory["order"]>,
    payment: () => randomId("pay") as ReturnType<ApplicationIdFactory["payment"]>,
  };
}

export function createFoundationRuntime(
  db: D1DatabaseLike,
  options: FoundationCompositionOptions,
): FoundationRuntime {
  const ids = options.ids ?? defaultIds();
  const tenantId = options.tenantId;

  const customerRepository = new D1CustomerRepository(db, tenantId);
  const productRepository = new D1ProductRepository(db, tenantId);
  const serviceRepository = new D1ServiceRepository(db, tenantId);
  const partnerRepository = new D1PartnerRepository(db);
  const cartRepository = new D1CartRepository(db, tenantId, options.currency);
  const orderRepository = new D1OrderRepository(db, tenantId);

  const authorization = new PolicyAuthorizationAdapter(async (_context, useCaseId) => {
    return options.authorize ? options.authorize(useCaseId) : useCaseId.length > 0;
  });

  const runtime = new DefaultUseCaseRuntime({
    authorization,
    idempotency: new InMemoryIdempotencyAdapter(),
    audit: new NoopAuditAdapter(),
    telemetry: new NoopTelemetryAdapter(),
  });

  const bus = new DefaultUseCaseBus();
  const register = <I, O>(id: UseCaseId, handler: UseCaseHandler<I, O>) => bus.register(id, handler);

  register("customer.create" as UseCaseId, new CreateCustomerHandler(customerRepository, ids));
  register("catalog.product.create" as UseCaseId, new CreateProductHandler(productRepository, ids));
  register("catalog.service.create" as UseCaseId, new CreateServiceHandler(serviceRepository, ids));
  register("partner.create" as UseCaseId, new CreatePartnerHandler(partnerRepository, ids));
  register("cart.create" as UseCaseId, new CreateCartHandler(cartRepository, ids));
  register("order.create" as UseCaseId, new CreateOrderHandler(orderRepository, ids));

  return { runtime, bus };
}

export async function executeFoundationUseCase<I, O>(
  runtime: UseCaseRuntime,
  handler: UseCaseHandler<I, O>,
  request: UseCaseRequest<I>,
): Promise<UseCaseResponse<O>> {
  return runtime.execute(handler, request);
}

export const INFRASTRUCTURE_COMPOSITION_VERSION = "1.0.0" as const;
