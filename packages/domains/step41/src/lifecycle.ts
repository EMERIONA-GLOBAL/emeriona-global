import { PricingPort, PriceRepository, TaxRuleRepository, PricingPolicyPort, TaxPolicyPort, TaxCalculationPort, PricingAuditPort, PricingTelemetryPort } from './contracts';
import { PricingContext, TaxContext, PriceQuote, TaxResult, TaxBehavior } from './types';
import { validatePricingContext, validateTaxContext } from './validation';

export class PricingLifecycle implements PricingPort {
  constructor(private readonly prices: PriceRepository, private readonly policy: PricingPolicyPort, private readonly audit: PricingAuditPort, private readonly telemetry: PricingTelemetryPort) {}
  async quote(c: PricingContext): Promise<PriceQuote> {
    validatePricingContext(c); if(!(await this.policy.isAllowed(c))) throw new Error('Pricing is not active for this context.');
    const p=await this.prices.findActive(c.offeringId,c); if(!p) throw new Error('No active price found.');
    const qty=c.quantity ?? 1; const subtotal={amount:p.amount.amount*qty,currency:p.amount.currency};
    const result:PriceQuote={subtotal,tax:{amount:0,currency:subtotal.currency},total:subtotal,taxBehavior:TaxBehavior.EXCLUSIVE,appliedTaxCodes:[],priceVersion:p.version};
    await this.audit.record('PRICE_QUOTED',c,result); await this.telemetry.record('pricing.quote',1); return result;
  }
}

export class TaxLifecycle implements TaxCalculationPort {
  constructor(private readonly rules: TaxRuleRepository, private readonly policy: TaxPolicyPort, private readonly audit: PricingAuditPort, private readonly telemetry: PricingTelemetryPort) {}
  async calculate(c: TaxContext, taxable: number): Promise<TaxResult> {
    validateTaxContext(c); if(!Number.isFinite(taxable)||taxable<0) throw new Error('Invalid taxable amount.'); if(!(await this.policy.isAllowed(c))) throw new Error('Tax calculation is not active for this context.');
    const rules=(await this.rules.findApplicable(c)).filter(r=>r.status==='ACTIVE').sort((a,b)=>a.priority-b.priority); const components=[] as Array<{code:string;amount:{amount:number;currency:string}}>;
    for(const r of rules) for(const x of r.components){ const amount=x.kind==='RATE'?taxable*x.value: x.value; components.push({code:x.code,amount:{amount,currency:c.currency}}); }
    const total=components.reduce((s,x)=>s+x.amount.amount,0); const result:TaxResult={tax:{amount:total,currency:c.currency},components,behavior:rules[0]?.behavior ?? TaxBehavior.EXCLUSIVE,ruleVersions:rules.map(r=>r.version)};
    await this.audit.record('TAX_CALCULATED',c,result); await this.telemetry.record('pricing.tax_calculation',1); return result;
  }
}
