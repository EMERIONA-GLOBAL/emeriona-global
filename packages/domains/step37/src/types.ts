export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type TenantType = 'PLATFORM' | 'ORGANIZATION' | 'TEAM' | 'PROJECT' | 'CUSTOM';
export type TenantMembershipStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
export type TenantRoleScope = 'TENANT' | 'PROJECT' | 'RESOURCE';
export interface Tenant { id: string; tenantType: TenantType; name: string; status: TenantStatus; parentTenantId?: string; metadata?: Record<string, string>; createdAt: string; updatedAt: string; }
export interface TenantMembership { id: string; tenantId: string; subjectId: string; status: TenantMembershipStatus; roles: string[]; scope: TenantRoleScope; createdAt: string; updatedAt: string; }
export interface TenantContext { tenantId: string; subjectId?: string; membershipId?: string; roles: string[]; environment: 'development' | 'staging' | 'production'; correlationId?: string; }
export interface TenantResolutionRequest { requestedTenantId?: string; subjectId?: string; resourceTenantId?: string; correlationId?: string; }
export interface TenantResolutionResult { resolved: boolean; context?: TenantContext; reason?: string; }
