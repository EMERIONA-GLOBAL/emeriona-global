import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
import type { PricingPort, PromotionPort } from "../../domains/src/index.js";
import type { PricingQuote, PromotionValidation } from "../../domains/src/pricing-promotions-foundation.js";

export interface PricingQuoteInput { cartId: string; }
export interface PromotionValidationInput { cartId: string; discountId: string; }

function required(value: string, field: string): string { if (!value.trim()) throw new Error(`${field} is required`); return value.trim(); }
function response<T>(request: UseCaseRequest<unknown>, output: T): UseCaseResponse<T> { return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output }; }

export class ResolvePricingQuoteHandler implements UseCaseHandler<PricingQuoteInput, PricingQuote> {
  constructor(private readonly pricing: PricingPort) {}
  async handle(request: UseCaseRequest<PricingQuoteInput>): Promise<UseCaseResponse<PricingQuote>> {
    const cartId=required(request.input.cartId,"cartId");
    const quote=await this.pricing.quote({cartId:cartId as never});
    const output:PricingQuote={quoteId:quote.quoteId,cartId,subtotal:quote.subtotal.amount,discount:quote.discount.amount,total:quote.total.amount,currency:quote.total.currency};
    return response(request,output);
  }
}

export class ValidatePromotionHandler implements UseCaseHandler<PromotionValidationInput, PromotionValidation> {
  constructor(private readonly promotions: PromotionPort) {}
  async handle(request: UseCaseRequest<PromotionValidationInput>): Promise<UseCaseResponse<PromotionValidation>> {
    const cartId=required(request.input.cartId,"cartId"); const discountId=required(request.input.discountId,"discountId");
    const discount=await this.promotions.validateDiscount({discountId:discountId as never,cartId:cartId as never});
    return response(request,{discountId,cartId,valid:true,discount:discount.value,currency:request.context.metadata?.currency as string ?? "",reason:undefined});
  }
}

export const PRICING_PROMOTIONS_APPLICATION_VERSION = "1.0.0" as const;
