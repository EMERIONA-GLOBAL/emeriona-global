/** Shared immutable domain value objects. No infrastructure/provider dependencies. */
export type EntityId = string & { readonly __brand: "EntityId" };

export interface MoneyValue {
  readonly amount: number;
  readonly currency: string;
}

export interface PercentageValue { readonly basisPoints: number; }

export interface TenantScope { readonly tenantId: string; }

export interface ResourceScope extends TenantScope {
  readonly ownerId?: string;
  readonly resourceType: string;
}

export function money(amount: number, currency: string): MoneyValue {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Money amount must be finite and non-negative");
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Currency must be an ISO-style 3-letter code");
  return Object.freeze({ amount, currency });
}

export function percentage(basisPoints: number): PercentageValue {
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10000) {
    throw new Error("Percentage basis points must be between 0 and 10000");
  }
  return Object.freeze({ basisPoints });
}

export const DOMAIN_VALUE_OBJECTS_VERSION = "1.0.0" as const;
