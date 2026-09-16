-- EMERIONA GLOBAL — Identity & Authorization Foundation
-- Migration 0008
-- Provider-neutral identity, session, role and permission persistence.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_principals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  principal_type TEXT NOT NULL CHECK (principal_type IN ('CUSTOMER','PARTNER','STAFF','SERVICE')),
  subject_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','SUSPENDED','CLOSED')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, principal_type, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_auth_principals_tenant ON auth_principals(tenant_id);

CREATE TABLE IF NOT EXISTS auth_identities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  principal_id TEXT NOT NULL REFERENCES auth_principals(id) ON DELETE CASCADE,
  login TEXT NOT NULL,
  login_normalized TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','LOCKED','DISABLED')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, login_normalized)
);
CREATE INDEX IF NOT EXISTS idx_auth_identities_principal ON auth_identities(tenant_id, principal_id);

CREATE TABLE IF NOT EXISTS auth_credentials (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  identity_id TEXT NOT NULL REFERENCES auth_identities(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL CHECK (credential_type IN ('PASSWORD_HASH','API_KEY_HASH')),
  secret_hash TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','REVOKED')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_auth_credentials_identity ON auth_credentials(tenant_id, identity_id, status);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  identity_id TEXT NOT NULL REFERENCES auth_identities(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','REVOKED','EXPIRED')) DEFAULT 'ACTIVE',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT,
  UNIQUE (tenant_id, token_hash)
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_identity ON auth_sessions(tenant_id, identity_id, status);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(tenant_id, expires_at, status);

CREATE TABLE IF NOT EXISTS auth_roles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','DISABLED')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS auth_permissions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  permission TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, permission)
);

CREATE TABLE IF NOT EXISTS auth_role_permissions (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  role_id TEXT NOT NULL REFERENCES auth_roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES auth_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (tenant_id, role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS auth_principal_roles (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  principal_id TEXT NOT NULL REFERENCES auth_principals(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES auth_roles(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, principal_id, role_id)
);

INSERT OR IGNORE INTO schema_migrations (version)
VALUES ('0008_identity_authorization_foundation');
