import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
import type { PricingPort, PromotionPort } from "../../domains/src/index.js";
import type { PricingQuote, PromotionValidation } from "../../domains/src/pricing-promotions-foundation.js";

export interface PricingQuoteInput { cartId: string; }
export interface PromotionValidationInput { cartId: string; discountId: string; }

function required(value: string, field: string): string {
  if (!value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}
function response<T>(request: UseCaseRequest<unknown>, output: T): UseCaseResponse<T> {
  return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output };
}

export class ResolvePricingQuoteHandler implements UseCaseHandler<PricingQuoteInput, PricingQuote> {
  constructor(private readonly pricing: PricingPort) {}
  async handle(request: UseCaseRequest<PricingQuoteInput>): Promise<UseCaseResponse<PricingQuote>> {
    return response(request, await this.pricing.quote({ cartId: required(request.input.cartId, "cartId") as never }) as PricingQuote);
  }
}

export class ValidatePromotionHandler implements UseCaseHandler<PromotionValidationInput, PromotionValidation> {
  constructor(private readonly promotions: PromotionPort) {}
  async handle(request: UseCaseRequest<PromotionValidationInput>): Promise<UseCaseResponse<PromotionValidation>> {
    const result = await this.promotions.validateDiscount({ discountId: required(request.input.discountId, "discountId") as never, cartId: required(request.input.cartId, "cartId") as never });
    return response(request, result as unknown as PromotionValidation);
  }
}

export const PRICING_PROMOTIONS_APPLICATION_VERSION = "1.0.0" as const;
