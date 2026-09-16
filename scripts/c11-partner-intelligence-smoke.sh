#!/usr/bin/env bash
set -euo pipefail
BASE='https://emeriona-global.emerionaglobal.workers.dev'
T="c11-smoke-${GITHUB_RUN_ID}"; T2="c11-isolation-${GITHUB_RUN_ID}"; P="c11-partner-${GITHUB_RUN_ID}"
npx wrangler d1 execute emeriona-global-db --remote --command="INSERT INTO tenants (id,name,status) VALUES ('${T}','C11 Smoke ${GITHUB_RUN_ID}','ACTIVE'),('${T2}','C11 Isolation ${GITHUB_RUN_ID}','ACTIVE'); INSERT INTO partners (id,tenant_id,legal_name,status) VALUES ('${P}','${T}','C11 Partner','VERIFIED');"
COMMON=(-H "x-tenant-id: ${T}" -H 'x-actor-id: c11-smoke' -H 'x-currency: USD' -H 'content-type: application/json')
for endpoint in analytics performance impact; do
  curl -fsS "${COMMON[@]}" -X POST "$BASE/api/v1/partners/${endpoint}" -d "{\"partnerId\":\"${P}\"}" > "${endpoint}.json"
  jq -e --arg p "$P" '.data.partnerId == $p' "${endpoint}.json"
done
jq -e '.data.products == 0 and .data.services == 0 and .data.orders == 0' analytics.json
jq -e '.data.fulfilledOrders == 0 and .data.settlementCount == 0' performance.json
jq -e '.data.fulfilledRate == 0 and .data.settlementCoverageRate == 0' impact.json
COMMON2=(-H "x-tenant-id: ${T2}" -H 'x-actor-id: c11-isolation' -H 'x-currency: USD' -H 'content-type: application/json')
CROSS_STATUS="$(curl -sS "${COMMON2[@]}" -X POST "$BASE/api/v1/partners/analytics" -d "{\"partnerId\":\"${P}\"}" -o /tmp/c11-cross.json -w '%{http_code}')"
test "$CROSS_STATUS" = '400'
MIGRATION="$(npx wrangler d1 execute emeriona-global-db --remote --json --command="SELECT version FROM schema_migrations WHERE version='0009_partner_intelligence_foundation';")"
printf '%s\n' "$MIGRATION" | jq -e '.[0].results | length == 1 and .[0].version == "0009_partner_intelligence_foundation"'
QUERY="SELECT (SELECT count(*) FROM partners WHERE tenant_id='${T}' AND id='${P}' AND status='VERIFIED') AS partner_ok,(SELECT count(*) FROM sqlite_master WHERE type='index' AND name='idx_order_items_partner_order') AS index_ok,(SELECT count(*) FROM audit_events WHERE tenant_id='${T}' AND outcome='SUCCEEDED') AS audit_ok;"
npx wrangler d1 execute emeriona-global-db --remote --json --command="$QUERY" > evidence.json
jq -e '.[0].results[0].partner_ok == 1 and .[0].results[0].index_ok == 1 and .[0].results[0].audit_ok >= 3' evidence.json
for endpoint in analytics performance impact; do test "$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/v1/partners/${endpoint}")" = '405'; done
