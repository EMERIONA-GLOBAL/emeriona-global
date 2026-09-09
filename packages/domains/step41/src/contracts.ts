import { PriceDefinition, TaxRule, PricingContext, TaxContext, PriceQuote, TaxResult, ID } from './types';

export interface PriceRepository { findActive(offeringId: ID, context: PricingContext): Promise<PriceDefinition | undefined>; }
export interface TaxRuleRepository { findApplicable(context: TaxContext): Promise<TaxRule[]>; }
export interface PricingPolicyPort { isAllowed(context: PricingContext): Promise<boolean>; }
export interface TaxPolicyPort { isAllowed(context: TaxContext): Promise<boolean>; }
export interface PricingPort { quote(context: PricingContext): Promise<PriceQuote>; }
export interface TaxCalculationPort { calculate(context: TaxContext, taxable: number): Promise<TaxResult>; }
export interface PricingValidationPort { validateContext(context: PricingContext): void; }
export interface TaxValidationPort { validateContext(context: TaxContext): void; }
export interface PricingAuditPort { record(action: string, context: unknown, result: unknown): Promise<void>; }
export interface PricingTelemetryPort { record(metric: string, value: number): Promise<void>; }
