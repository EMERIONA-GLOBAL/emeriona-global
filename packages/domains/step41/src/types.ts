export type ID = string;
export type CurrencyCode = string;
export type RegionCode = string;
export type TaxCode = string;
export type MoneyAmount = number;
export type PolicyVersion = `v${number}`;

export enum PriceKind { BASE='BASE', SALE='SALE', CUSTOM='CUSTOM' }
export enum TaxBehavior { EXCLUSIVE='EXCLUSIVE', INCLUSIVE='INCLUSIVE', EXEMPT='EXEMPT' }
export enum TaxRuleStatus { DRAFT='DRAFT', ACTIVE='ACTIVE', PAUSED='PAUSED', RETIRED='RETIRED' }
export enum PriceStatus { DRAFT='DRAFT', ACTIVE='ACTIVE', ARCHIVED='ARCHIVED' }
export enum TaxComponentKind { RATE='RATE', FIXED='FIXED' }

export interface Money { amount: MoneyAmount; currency: CurrencyCode; }
export interface PriceDefinition { id: ID; offeringId: ID; kind: PriceKind; status: PriceStatus; amount: Money; validFrom?: string; validTo?: string; regionCode?: RegionCode; tenantId?: ID; version: PolicyVersion; }
export interface TaxComponent { code: TaxCode; kind: TaxComponentKind; value: number; }
export interface TaxRule { id: ID; code: TaxCode; status: TaxRuleStatus; behavior: TaxBehavior; components: TaxComponent[]; regionCode?: RegionCode; category?: string; priority: number; version: PolicyVersion; validFrom?: string; validTo?: string; }
export interface PricingContext { offeringId: ID; tenantId?: ID; customerAccountId?: ID; regionCode?: RegionCode; currency: CurrencyCode; quantity?: number; at: string; }
export interface TaxContext { offeringId: ID; tenantId?: ID; customerAccountId?: ID; regionCode?: RegionCode; currency: CurrencyCode; at: string; category?: string; }
export interface PriceQuote { subtotal: Money; tax: Money; total: Money; taxBehavior: TaxBehavior; appliedTaxCodes: TaxCode[]; priceVersion: PolicyVersion; }
export interface TaxResult { tax: Money; components: Array<{code: TaxCode; amount: Money}>; behavior: TaxBehavior; ruleVersions: PolicyVersion[]; }
export interface PricingPolicy { id: ID; status: 'ACTIVE'|'INACTIVE'; supportedCurrencies: CurrencyCode[]; }
