import { Tenant, TenantContext, TenantMembership, TenantResolutionRequest, TenantResolutionResult } from './types';
export interface TenantRepository { getById(tenantId: string): Promise<Tenant | null>; save(tenant: Tenant): Promise<void>; }
export interface TenantMembershipRepository { getBySubject(tenantId: string, subjectId: string): Promise<TenantMembership | null>; save(membership: TenantMembership): Promise<void>; }
export interface TenantResolverPort { resolve(request: TenantResolutionRequest): Promise<TenantResolutionResult>; }
export interface TenantContextPort { getContext(): TenantContext | null; requireContext(): TenantContext; }
export interface TenantIsolationPort { assertTenantAccess(context: TenantContext, resourceTenantId: string): void; }
export interface TenantPolicyPort { canAccessTenant(context: TenantContext, tenant: Tenant): boolean; }
export interface TenantAuditPort { record(action: string, tenantId: string, subjectId?: string, correlationId?: string): Promise<void>; }
export interface TenantActivationPolicy { isEnabled(tenantId: string, environment: TenantContext['environment']): Promise<boolean>; }
