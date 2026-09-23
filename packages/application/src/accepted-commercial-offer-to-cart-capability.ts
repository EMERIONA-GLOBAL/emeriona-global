import type { CommercialOffer, CommercialOfferId, CommercialOfferRepositoryPortV1 } from "../../domains/src/commercial-offer.js";
import type { CommercialInquiryId, CommercialInquiryRepositoryPortV1 } from "../../domains/src/commercial-inquiry.js";
import type { CartRepositoryPortV1 } from "../../domains/src/commerce.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
import type { CartItemResult, OperationalCommercePort } from "./operational-commerce.js";

export interface AddAcceptedCommercialOfferToCartInput {
  readonly offerId: string;
  readonly cartId: string;
  readonly quantity?: number;
}

const required=(v:string,f:string)=>{const x=v?.trim();if(!x)throw new Error(f+" is required");return x;};

export class AddAcceptedCommercialOfferToCartHandler implements UseCaseHandler<AddAcceptedCommercialOfferToCartInput,CartItemResult>{
  constructor(
    private readonly offers:CommercialOfferRepositoryPortV1,
    private readonly inquiries:CommercialInquiryRepositoryPortV1,
    private readonly carts:CartRepositoryPortV1,
    private readonly commerce:OperationalCommercePort,
    private readonly id:()=>string
  ){}
  async handle(request:UseCaseRequest<AddAcceptedCommercialOfferToCartInput>):Promise<UseCaseResponse<CartItemResult>>{
    const offer=await this.offers.findById(required(request.input.offerId,"offerId") as CommercialOfferId);
    if(!offer)throw new Error("Commercial offer not found for tenant");
    if(offer.status!=="ACCEPTED")throw new Error("Only an accepted commercial offer can be added to cart");

    const inquiry=await this.inquiries.findById(offer.inquiryId as CommercialInquiryId);
    if(!inquiry)throw new Error("Commercial inquiry not found for tenant");
    const cart=await this.carts.findById(required(request.input.cartId,"cartId"));
    if(!cart)throw new Error("Cart not found for tenant");
    if(inquiry.customerId!==cart.customerId)throw new Error("Commercial offer customer does not match cart customer");

    const targetCount=(inquiry.productId?1:0)+(inquiry.serviceId?1:0);
    if(targetCount!==1)throw new Error("Accepted commercial offer must resolve to exactly one cartable product or service");

    const quantity=request.input.quantity===undefined?1:request.input.quantity;
    if(!Number.isFinite(quantity)||quantity<=0)throw new Error("quantity must be greater than zero");

    const output=await this.commerce.addCartItem({
      cartId:cart.id,
      productId:inquiry.productId,
      serviceId:inquiry.serviceId,
      quantity,
      unitAmount:{amount:offer.amount,currency:offer.currency},
      id:this.id(),
      tenantId:request.context.tenantId
    });
    return {useCaseId:request.useCaseId,correlationId:request.context.correlationId,output};
  }
}

export const ACCEPTED_COMMERCIAL_OFFER_TO_CART_APPLICATION_VERSION="1.0.0" as const;
