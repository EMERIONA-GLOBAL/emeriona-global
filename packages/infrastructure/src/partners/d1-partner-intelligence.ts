import type { D1DatabaseLike } from "../d1.js";
import type { PartnerAnalytics, PartnerImpact, PartnerIntelligenceInput, PartnerIntelligencePort, PartnerPerformance } from "../../../application/src/partner-intelligence-capabilities.js";

type Row = { products: number; services: number; catalogs: number; offers: number; active_offers: number; orders: number; gross_merchandise_value: number; currency: string | null; published_products: number; published_services: number; published_catalogs: number; fulfilled_orders: number; settlement_count: number; settled_net_amount: number; return_requests: number; refund_requests: number };

export class D1PartnerIntelligenceAdapter implements PartnerIntelligencePort {
  constructor(private readonly db: D1DatabaseLike, private readonly tenantId: string) {}

  private async row(partnerId: string): Promise<Row> {
    const result = await this.db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM products WHERE tenant_id=? AND partner_id=?) AS products,
        (SELECT COUNT(*) FROM services WHERE tenant_id=? AND partner_id=?) AS services,
        (SELECT COUNT(*) FROM catalogs WHERE tenant_id=? AND partner_id=?) AS catalogs,
        (SELECT COUNT(*) FROM offers WHERE tenant_id=? AND partner_id=?) AS offers,
        (SELECT COUNT(*) FROM offers WHERE tenant_id=? AND partner_id=? AND status='ACTIVE') AS active_offers,
        (SELECT COUNT(DISTINCT oi.order_id) FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.tenant_id=? AND oi.partner_id=?) AS orders,
        COALESCE((SELECT SUM(oi.quantity * oi.unit_amount) FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.tenant_id=? AND oi.partner_id=?),0) AS gross_merchandise_value,
        (SELECT o.currency FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE o.tenant_id=? AND oi.partner_id=? LIMIT 1) AS currency,
        (SELECT COUNT(*) FROM products WHERE tenant_id=? AND partner_id=? AND status='PUBLISHED') AS published_products,
        (SELECT COUNT(*) FROM services WHERE tenant_id=? AND partner_id=? AND status='PUBLISHED') AS published_services,
        (SELECT COUNT(*) FROM catalogs WHERE tenant_id=? AND partner_id=? AND status='PUBLISHED') AS published_catalogs,
        (SELECT COUNT(DISTINCT f.order_id) FROM fulfillments f JOIN order_items oi ON oi.order_id=f.order_id WHERE f.tenant_id=? AND oi.partner_id=? AND f.status='FULFILLED') AS fulfilled_orders,
        (SELECT COUNT(*) FROM settlements WHERE tenant_id=? AND partner_id=?) AS settlement_count,
        COALESCE((SELECT SUM(net_amount) FROM settlements WHERE tenant_id=? AND partner_id=? AND status='SETTLED'),0) AS settled_net_amount,
        (SELECT COUNT(DISTINCT r.id) FROM return_requests r JOIN order_items oi ON oi.order_id=r.order_id WHERE r.tenant_id=? AND oi.partner_id=?) AS return_requests,
        (SELECT COUNT(DISTINCT rr.id) FROM refund_requests rr JOIN order_items oi ON oi.order_id=rr.order_id WHERE rr.tenant_id=? AND oi.partner_id=?) AS refund_requests
    `).bind(
      this.tenantId, partnerId, this.tenantId, partnerId, this.tenantId, partnerId, this.tenantId, partnerId,
      this.tenantId, partnerId, this.tenantId, partnerId, this.tenantId, partnerId, this.tenantId, partnerId,
      this.tenantId, partnerId, this.tenantId, partnerId, this.tenantId, partnerId, this.tenantId, partnerId,
      this.tenantId, partnerId, this.tenantId, partnerId, this.tenantId, partnerId, this.tenantId, partnerId
    ).all<Row>();
    return result.results[0] ?? { products:0, services:0, catalogs:0, offers:0, active_offers:0, orders:0, gross_merchandise_value:0, currency:null, published_products:0, published_services:0, published_catalogs:0, fulfilled_orders:0, settlement_count:0, settled_net_amount:0, return_requests:0, refund_requests:0 };
  }

  private async partnerExists(partnerId: string): Promise<void> {
    const result = await this.db.prepare("SELECT id FROM partners WHERE tenant_id=? AND id=? LIMIT 1").bind(this.tenantId, partnerId).all<{id:string}>();
    if (!result.results[0]) throw new Error("Partner not found for tenant");
  }

  async analytics(input: PartnerIntelligenceInput): Promise<PartnerAnalytics> {
    await this.partnerExists(input.partnerId);
    const r = await this.row(input.partnerId);
    return { partnerId: input.partnerId, products:r.products, services:r.services, catalogs:r.catalogs, offers:r.offers, activeOffers:r.active_offers, orders:r.orders, grossMerchandiseValue:r.gross_merchandise_value, currency:r.currency };
  }
  async performance(input: PartnerIntelligenceInput): Promise<PartnerPerformance> {
    await this.partnerExists(input.partnerId);
    const r = await this.row(input.partnerId);
    return { partnerId: input.partnerId, products:r.products, services:r.services, catalogs:r.catalogs, offers:r.offers, activeOffers:r.active_offers, orders:r.orders, grossMerchandiseValue:r.gross_merchandise_value, currency:r.currency, publishedProducts:r.published_products, publishedServices:r.published_services, publishedCatalogs:r.published_catalogs, fulfilledOrders:r.fulfilled_orders, settlementCount:r.settlement_count, settledNetAmount:r.settled_net_amount };
  }
  async impact(input: PartnerIntelligenceInput): Promise<PartnerImpact> {
    await this.partnerExists(input.partnerId);
    const r = await this.row(input.partnerId);
    const fulfilledRate = r.orders === 0 ? 0 : r.fulfilled_orders / r.orders;
    const settlementCoverageRate = r.orders === 0 ? 0 : r.settlement_count / r.orders;
    return { partnerId: input.partnerId, products:r.products, services:r.services, catalogs:r.catalogs, offers:r.offers, activeOffers:r.active_offers, orders:r.orders, grossMerchandiseValue:r.gross_merchandise_value, currency:r.currency, publishedProducts:r.published_products, publishedServices:r.published_services, publishedCatalogs:r.published_catalogs, fulfilledOrders:r.fulfilled_orders, settlementCount:r.settlement_count, settledNetAmount:r.settled_net_amount, returnRequests:r.return_requests, refundRequests:r.refund_requests, fulfilledRate, settlementCoverageRate };
  }
}

export const C11_PARTNER_INTELLIGENCE_INFRASTRUCTURE_VERSION = "1.0.0" as const;
