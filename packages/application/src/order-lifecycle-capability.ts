import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
import type { Order, OrderId } from "../../domains/src/commerce.js";
import { assertOrderStatusTransition } from "../../domains/src/order-lifecycle.js";

export interface UpdateOrderInput {
  orderId: string;
  status: Order["status"];
}

export interface OrderLifecyclePort {
  findOrder(orderId: OrderId): Promise<Order | null>;
  updateOrderStatus(orderId: OrderId, status: Order["status"], correlationId: string): Promise<Order>;
}

const required = (value: string, field: string): string => {
  if (!value?.trim()) throw new Error(`${field} is required`);
  return value.trim();
};

const response = <T>(request: UseCaseRequest<unknown>, output: T): UseCaseResponse<T> => ({
  useCaseId: request.useCaseId,
  correlationId: request.context.correlationId,
  output,
});

export class UpdateOrderHandler implements UseCaseHandler<UpdateOrderInput, Order> {
  constructor(private readonly orders: OrderLifecyclePort) {}

  async handle(request: UseCaseRequest<UpdateOrderInput>): Promise<UseCaseResponse<Order>> {
    const orderId = required(request.input.orderId, "orderId") as OrderId;
    const order = await this.orders.findOrder(orderId);
    if (!order) throw new Error("Order not found for tenant");
    assertOrderStatusTransition(order.status, request.input.status);
    const updated = await this.orders.updateOrderStatus(orderId, request.input.status, request.context.correlationId);
    return response(request, updated);
  }
}

export const ORDER_LIFECYCLE_APPLICATION_VERSION = "1.0.0" as const;
