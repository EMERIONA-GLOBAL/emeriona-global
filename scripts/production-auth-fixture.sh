#!/usr/bin/env bash
set -euo pipefail

# Ephemeral production-verification identity fixture.
# Creates a tenant-scoped active principal, identity, session, role and
# permission set for the smoke test tenant. The token itself is never written
# to D1; only its SHA-256 hash is persisted.
provision_verification_auth() {
  local tenant_id="$1"
  local run_id="$2"
  local actor_id="$3"
  local key_suffix="${tenant_id}-${run_id}"

  export AUTH_TOKEN
  AUTH_TOKEN="verify-${run_id}-$(openssl rand -hex 24)"
  local token_hash
  token_hash="$(printf '%s' "$AUTH_TOKEN" | sha256sum | cut -d' ' -f1)"

  local principal_id="verify-principal-${key_suffix}"
  export AUTH_ACTOR_ID="$principal_id"
  local identity_id="verify-identity-${key_suffix}"
  local role_id="verify-role-${key_suffix}"
  local session_id="verify-session-${key_suffix}"

  local use_cases=(
    "customer.create" "customer.update" "catalog.product.create" "catalog.product.update"
    "catalog.service.create" "catalog.service.update" "partner.create" "partner.update"
    "partner.verify" "partner.product.create" "partner.product.update" "partner.service.create"
    "partner.service.update" "partner.catalog.publish" "partner.offer.create" "partner.offer.update"
    "cart.create" "cart.update" "cart.item.add" "checkout.execute" "order.create" "order.update"
    "payment.intent.create" "payment.create" "payment.authorize" "payment.capture" "payment.refund"
    "payment.status" "billing.invoice.create" "billing.query" "billing.settlement.create"
    "fulfillment.create" "fulfillment.execute" "fulfillment.progress" "return.create" "return.progress"
    "refund.request.create" "refund.request.progress" "pricing.quote" "discount.validate" "catalog.publish"
    "solution.create" "solution.update" "solution.query" "commercial.inquiry.create"
    "commercial.inquiry.update" "commercial.inquiry.query" "pricing.request.create"
    "pricing.request.update" "pricing.request.query" "pricing.decision.create" "pricing.decision.input.add"
    "pricing.decision.resolve" "commercial.offer.create" "commercial.offer.update" "commercial.offer.accept"
    "commercial.offer.accepted.to.cart" "partner.analytics.query" "partner.performance.query" "partner.impact.measure"
  )

  local permissions_sql=""
  local use_case permission_id
  for use_case in "${use_cases[@]}"; do
    permission_id="verify-perm-${key_suffix}-${use_case//./-}"
    permissions_sql+="INSERT OR IGNORE INTO auth_permissions (id,tenant_id,permission,description) VALUES ('${permission_id}','${tenant_id}','${use_case}','Production verification permission');"
    permissions_sql+="INSERT OR IGNORE INTO auth_role_permissions (tenant_id,role_id,permission_id) VALUES ('${tenant_id}','${role_id}','${permission_id}');"
  done

  npx wrangler d1 execute emeriona-global-db --remote --command="
    INSERT OR IGNORE INTO tenants (id,name,status) VALUES ('${tenant_id}','Production Verification ${run_id}','ACTIVE');
    INSERT OR IGNORE INTO auth_principals (id,tenant_id,principal_type,subject_id,status)
      VALUES ('${principal_id}','${tenant_id}','STAFF','${actor_id}','ACTIVE');
    INSERT OR IGNORE INTO auth_identities (id,tenant_id,principal_id,login,login_normalized,status)
      VALUES ('${identity_id}','${tenant_id}','${principal_id}','${actor_id}','${actor_id}','ACTIVE');
    INSERT OR IGNORE INTO auth_roles (id,tenant_id,name,description,status)
      VALUES ('${role_id}','${tenant_id}','production-verifier','Ephemeral production verification role','ACTIVE');
    INSERT OR IGNORE INTO auth_principal_roles (tenant_id,principal_id,role_id)
      VALUES ('${tenant_id}','${principal_id}','${role_id}');
    INSERT OR IGNORE INTO auth_sessions (id,tenant_id,identity_id,token_hash,status,expires_at)
      VALUES ('${session_id}','${tenant_id}','${identity_id}','${token_hash}','ACTIVE',datetime('now','+1 hour'));
    ${permissions_sql}
  " >/dev/null
}
