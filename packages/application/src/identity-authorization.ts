import type { TenantId } from "./index.js";

export type PrincipalType = "CUSTOMER" | "PARTNER" | "STAFF" | "SERVICE";
export type AuthPrincipalStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";
export type AuthIdentityStatus = "ACTIVE" | "LOCKED" | "DISABLED";
export type AuthSessionStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export interface AuthPrincipal {
  id: string;
  tenantId: TenantId;
  principalType: PrincipalType;
  subjectId: string;
  status: AuthPrincipalStatus;
}

export interface AuthIdentity {
  id: string;
  tenantId: TenantId;
  principalId: string;
  login: string;
  loginNormalized: string;
  status: AuthIdentityStatus;
}

export interface AuthSession {
  id: string;
  tenantId: TenantId;
  identityId: string;
  tokenHash: string;
  status: AuthSessionStatus;
  expiresAt: string;
}

export interface IdentityAuthorizationPort {
  findIdentityByLogin(tenantId: TenantId, loginNormalized: string): Promise<AuthIdentity | undefined>;
  findPrincipal(tenantId: TenantId, principalId: string): Promise<AuthPrincipal | undefined>;
  validateSession(tenantId: TenantId, tokenHash: string, nowIso: string): Promise<AuthSession | undefined>;
  authorizePermission(tenantId: TenantId, principalId: string, permission: string): Promise<boolean>;
}

export const IDENTITY_AUTHORIZATION_APPLICATION_VERSION = "1.0.0" as const;
