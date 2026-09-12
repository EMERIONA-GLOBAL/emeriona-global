/** Provider-neutral Customer domain capability contracts. */
export type CustomerId = string & { readonly __brand: "CustomerId" };
export type CustomerStatus = "PROSPECT" | "ACTIVE" | "SUSPENDED" | "CLOSED";

export interface CustomerProfile {
  readonly id: CustomerId;
  readonly status: CustomerStatus;
  readonly displayName: string;
  readonly locale?: string;
  readonly timezone?: string;
}

export interface CustomerRepositoryPort {
  findById(id: CustomerId): Promise<CustomerProfile | null>;
  save(customer: CustomerProfile): Promise<CustomerProfile>;
}

export interface CustomerCapabilityContract {
  readonly create: (input: { displayName: string; locale?: string; timezone?: string }) => Promise<CustomerProfile>;
  readonly update: (input: Partial<CustomerProfile> & { id: CustomerId }) => Promise<CustomerProfile>;
}

export const CUSTOMER_DOMAIN_VERSION = "1.0.0" as const;
