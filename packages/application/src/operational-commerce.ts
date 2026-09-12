/** Complete operational commerce path: cart items -> priced order -> checked-out cart. */
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
import type { Money } from "../../domains/src/index.js";

export interface CartItemInput { readonly cartId: string; readonly productId?: string; readonly serviceId?: string; readonly quantity: number; readonly unitAmount: Money; }
export interface CartItemResult extends CartItemInput { readonly id: string; }
export interface CheckoutInput { readonly cartId: string; }
export interface CheckoutResult { readonly orderId: string; readonly cartId: string; readonly customerId: string; readonly total: Money; readonly itemCount: number; }
export interface OperationalCommercePort {
  addCartItem(input: CartItemInput & { id: string; tenantId: string }): Promise<CartItemResult>;
  checkout(input: CheckoutInput & { orderId: string; tenantId: string }): Promise<CheckoutResult>;
}
function required(value: string, field: string): string { if (!value.trim()) throw new Error(`${field} is required`); return value.trim(); }
export class AddCartItemHandler implements UseCaseHandler<CartItemInput, CartItemResult> {
  constructor(private readonly commerce: OperationalCommercePort, private readonly id: () => string) {}
  async handle(request: UseCaseRequest<CartItemInput>): Promise<UseCaseResponse<CartItemResult>> {
    const { cartId, productId, serviceId, quantity, unitAmount } = request.input;
    if ((productId ? 1 : 0) + (serviceId ? 1 : 0) !== 1) throw new Error("Exactly one of productId or serviceId is required");
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("quantity must be greater than zero");
    if (!Number.isFinite(unitAmount.amount) || unitAmount.amount < 0) throw new Error("unitAmount must be finite and non-negative");
    const item = await this.commerce.addCartItem({ cartId: required(cartId, "cartId"), productId, serviceId, quantity, unitAmount, id: this.id(), tenantId: request.context.tenantId });
    return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output: item };
  }
}
export class CheckoutHandler implements UseCaseHandler<CheckoutInput, CheckoutResult> {
  constructor(private readonly commerce: OperationalCommercePort, private readonly id: () => string) {}
  async handle(request: UseCaseRequest<CheckoutInput>): Promise<UseCaseResponse<CheckoutResult>> {
    const result = await this.commerce.checkout({ cartId: required(request.input.cartId, "cartId"), orderId: this.id(), tenantId: request.context.tenantId });
    return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output: result };
  }
}
export const OPERATIONAL_COMMERCE_VERSION = "1.0.1" as const;
