import type { IdentityAuthorizationPort, AuthIdentity, AuthPrincipal, AuthSession } from "../../../application/src/identity-authorization.js";
import type { TenantId } from "../../../application/src/index.js";
import type { D1DatabaseLike } from "../d1.js";

type IdentityRow = AuthIdentity & Record<string, unknown>;
type PrincipalRow = AuthPrincipal & Record<string, unknown>;
type SessionRow = AuthSession & Record<string, unknown>;

export class D1IdentityAuthorizationAdapter implements IdentityAuthorizationPort {
  constructor(private readonly db: D1DatabaseLike) {}

  async findIdentityByLogin(tenantId: TenantId, loginNormalized: string): Promise<AuthIdentity | undefined> {
    const result = await this.db.prepare("SELECT id,tenant_id AS tenantId,principal_id AS principalId,login,login_normalized AS loginNormalized,status FROM auth_identities WHERE tenant_id=? AND login_normalized=? LIMIT 1").bind(tenantId, loginNormalized).all<IdentityRow>();
    return result.results[0];
  }

  async findPrincipal(tenantId: TenantId, principalId: string): Promise<AuthPrincipal | undefined> {
    const result = await this.db.prepare("SELECT id,tenant_id AS tenantId,principal_type AS principalType,subject_id AS subjectId,status FROM auth_principals WHERE tenant_id=? AND id=? LIMIT 1").bind(tenantId, principalId).all<PrincipalRow>();
    return result.results[0];
  }

  async validateSession(tenantId: TenantId, tokenHash: string, nowIso: string): Promise<AuthSession | undefined> {
    const result = await this.db.prepare("SELECT s.id,s.tenant_id AS tenantId,s.identity_id AS identityId,s.token_hash AS tokenHash,s.status,s.expires_at AS expiresAt FROM auth_sessions s JOIN auth_identities i ON i.id=s.identity_id AND i.tenant_id=s.tenant_id AND i.status='ACTIVE' JOIN auth_principals p ON p.id=i.principal_id AND p.tenant_id=i.tenant_id AND p.status='ACTIVE' WHERE s.tenant_id=? AND s.token_hash=? AND s.status='ACTIVE' AND s.expires_at>? LIMIT 1").bind(tenantId, tokenHash, nowIso).all<SessionRow>();
    return result.results[0];
  }

  async authorizePermission(tenantId: TenantId, principalId: string, permission: string): Promise<boolean> {
    const result = await this.db.prepare("SELECT 1 AS ok FROM auth_principal_roles pr JOIN auth_roles r ON r.id=pr.role_id AND r.tenant_id=pr.tenant_id AND r.status='ACTIVE' JOIN auth_role_permissions rp ON rp.role_id=r.id AND rp.tenant_id=r.tenant_id JOIN auth_permissions p ON p.id=rp.permission_id AND p.tenant_id=rp.tenant_id WHERE pr.tenant_id=? AND pr.principal_id=? AND p.permission=? LIMIT 1").bind(tenantId, principalId, permission).all<{ok:number}>();
    return result.results.length > 0;
  }
}

export const HA1_IDENTITY_AUTHORIZATION_INFRASTRUCTURE_VERSION = "1.0.0" as const;
