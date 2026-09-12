/** Commerce boundaries: pricing, promotions, checkout, orders, fulfillment and settlement. */
export type OrderId = string & { readonly __brand: "OrderId" };
export type CartId = string & { readonly __brand: "CartId" };
export type PaymentId = string & { readonly __brand: "PaymentId" };
export type OfferId = string & { readonly __brand: "OfferId" };
export type DiscountId = string & { readonly __brand: "DiscountId" };
export type SettlementId = string & { readonly __brand: "SettlementId" };

export interface Money { readonly amount: number; readonly currency: string; }
export interface PriceQuote { readonly subtotal: Money; readonly discount: Money; readonly total: Money; readonly quoteId: string; }
export interface Offer { readonly id: OfferId; readonly status: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED"; readonly ownerId: string; }
export interface Discount { readonly id: DiscountId; readonly status: "ACTIVE" | "INACTIVE"; readonly value: number; readonly type: "PERCENTAGE" | "FIXED"; readonly ownerId: string; }
export interface Cart { readonly id: CartId; readonly customerId: string; readonly status: "OPEN" | "CHECKED_OUT" | "ABANDONED"; }
export interface Order { readonly id: OrderId; readonly customerId: string; readonly status: "PENDING" | "CONFIRMED" | "FULFILLING" | "FULFILLED" | "CANCELLED"; readonly total: Money; }
export interface PaymentTransaction { readonly id: PaymentId; readonly orderId: OrderId; readonly status: "CREATED" | "AUTHORIZED" | "CAPTURED" | "REFUNDED" | "FAILED"; readonly amount: Money; readonly providerReference?: string; }
export interface Fulfillment { readonly orderId: OrderId; readonly status: "PENDING" | "IN_PROGRESS" | "FULFILLED" | "CANCELLED"; }
export interface Settlement { readonly id: SettlementId; readonly partnerId: string; readonly orderId: OrderId; readonly commission: Money; readonly netAmount: Money; readonly status: "PENDING" | "SETTLED" | "REVERSED"; }

export interface PricingPort { quote(input: { cartId: CartId }): Promise<PriceQuote>; }
export interface PromotionPort { resolveOffers(input: { cartId: CartId }): Promise<readonly Offer[]>; validateDiscount(input: { discountId: DiscountId; cartId: CartId }): Promise<Discount>; }
export interface CommerceRepositoryPort { saveCart(cart: Cart): Promise<Cart>; saveOrder(order: Order): Promise<Order>; findOrder(id: OrderId): Promise<Order | null>; saveSettlement(settlement: Settlement): Promise<Settlement>; }
export interface FulfillmentPort { start(orderId: OrderId): Promise<Fulfillment>; cancel(orderId: OrderId): Promise<Fulfillment>; }
export interface SettlementPort { settle(settlementId: SettlementId): Promise<Settlement>; reverse(settlementId: SettlementId): Promise<Settlement>; }

export const COMMERCE_DOMAIN_VERSION = "1.1.0" as const;
