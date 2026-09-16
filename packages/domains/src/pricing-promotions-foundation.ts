export const PRICING_PROMOTIONS_FOUNDATION_VERSION = "1.0.0" as const;

export interface PricingQuote {
  readonly quoteId: string;
  readonly cartId: string;
  readonly subtotal: number;
  readonly discount: number;
  readonly total: number;
  readonly currency: string;
}

export interface PromotionValidation {
  readonly discountId: string;
  readonly cartId: string;
  readonly valid: boolean;
  readonly discount: number;
  readonly currency: string;
  readonly reason?: string;
}

export function assertPricingInvariant(input: { subtotal: number; discount: number; total: number }): void {
  if (![input.subtotal, input.discount, input.total].every(Number.isFinite)) throw new Error("Pricing values must be finite");
  if (input.subtotal < 0 || input.discount < 0 || input.total < 0) throw new Error("Pricing values must be non-negative");
  if (input.discount > input.subtotal) throw new Error("Discount cannot exceed subtotal");
  if (Math.abs(input.total - (input.subtotal - input.discount)) > 0.000001) throw new Error("Pricing total invariant failed");
}
