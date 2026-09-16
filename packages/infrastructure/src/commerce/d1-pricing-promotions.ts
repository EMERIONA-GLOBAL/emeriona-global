import type { PricingPort, PromotionPort, PriceQuote, Discount, Offer, OfferId, CartId } from "../../../domains/src/index.js";
import type { D1DatabaseLike } from "../d1.js";

interface Row { [key:string]: unknown }
async function all<T extends Row>(db:D1DatabaseLike,sql:string,values:readonly unknown[]=[]):Promise<T[]> { const statement=db.prepare(sql); const bound=values.length?statement.bind(...values):statement; return (await bound.all<T>()).results; }

export class D1PricingPromotionsAdapter implements PricingPort, PromotionPort {
  constructor(private readonly db:D1DatabaseLike,private readonly tenantId:string,private readonly currency:string) {}
  async quote(input:{cartId:CartId}):Promise<PriceQuote> {
    const cartId=String(input.cartId); const carts=await all<Row>(this.db,"SELECT id,currency,status FROM carts WHERE id=? AND tenant_id=?",[cartId,this.tenantId]); const cart=carts[0];
    if(!cart) throw new Error("Cart not found for tenant"); if(String(cart.status)!=="OPEN") throw new Error("Cart is not open"); if(String(cart.currency)!==this.currency) throw new Error("Cart currency does not match request currency");
    const items=await all<Row>(this.db,"SELECT quantity,unit_amount,currency FROM cart_items WHERE cart_id=? ORDER BY rowid",[cartId]); let subtotal=0;
    for(const item of items){if(String(item.currency)!==this.currency) throw new Error("Cart contains mixed currencies"); subtotal+=Number(item.quantity)*Number(item.unit_amount);}
    const quoteId=`quote_${crypto.randomUUID()}`; await all(this.db,"INSERT INTO price_quotes (id,tenant_id,cart_id,subtotal_amount,discount_amount,total_amount,currency) VALUES (?,?,?,?,?,?,?)",[quoteId,this.tenantId,cartId,subtotal,0,subtotal,this.currency]);
    return {quoteId,subtotal:{amount:subtotal,currency:this.currency},discount:{amount:0,currency:this.currency},total:{amount:subtotal,currency:this.currency}};
  }
  async resolveOffers(input:{cartId:CartId}):Promise<readonly Offer[]> {
    const rows=await all<Row>(this.db,"SELECT id,status,owner_id FROM offers WHERE tenant_id=? AND status='ACTIVE' AND (starts_at IS NULL OR starts_at<=CURRENT_TIMESTAMP) AND (ends_at IS NULL OR ends_at>=CURRENT_TIMESTAMP)",[this.tenantId]);
    return rows.map(row=>({id:String(row.id) as OfferId,status:String(row.status) as Offer["status"],ownerId:String(row.owner_id)}));
  }
  async validateDiscount(input:{discountId:string;cartId:CartId}):Promise<Discount> {
    const cartId=String(input.cartId); const carts=await all<Row>(this.db,"SELECT currency,status FROM carts WHERE id=? AND tenant_id=?",[cartId,this.tenantId]); const cart=carts[0];
    if(!cart) throw new Error("Cart not found for tenant"); if(String(cart.status)!=="OPEN") throw new Error("Cart is not open");
    const rows=await all<Row>(this.db,"SELECT id,status,type,value,owner_id,currency FROM discounts WHERE id=? AND tenant_id=?",[input.discountId,this.tenantId]); const row=rows[0];
    if(!row) throw new Error("Discount not found for tenant"); if(String(row.status)!=="ACTIVE") throw new Error("Discount is inactive");
    const discountCurrency=row.currency==null?this.currency:String(row.currency); if(discountCurrency!==String(cart.currency)) throw new Error("Discount currency does not match cart currency");
    const discount:Discount={id:String(row.id) as never,status:'ACTIVE',type:String(row.type) as 'PERCENTAGE'|'FIXED',value:Number(row.value),ownerId:String(row.owner_id)};
    const items=await all<Row>(this.db,"SELECT quantity,unit_amount,currency FROM cart_items WHERE cart_id=?",[cartId]); const subtotal=items.reduce((sum,item)=>sum+Number(item.quantity)*Number(item.unit_amount),0);
    const amount=discount.type==='PERCENTAGE'?subtotal*Math.min(discount.value,100)/100:Math.min(discount.value,subtotal); const eventId=`promo_${crypto.randomUUID()}`;
    await all(this.db,"INSERT INTO promotion_events (id,tenant_id,cart_id,discount_id,outcome,discount_amount,currency,reason) VALUES (?,?,?,?,?,?,?,?)",[eventId,this.tenantId,cartId,input.discountId,'VALID',amount,String(cart.currency),null]);
    return discount;
  }
}
export const D1_PRICING_PROMOTIONS_VERSION="1.0.0" as const;
