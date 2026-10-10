import test from "node:test";
import assert from "node:assert/strict";
import { D1IdentityAuthorizationAdapter } from "../packages/infrastructure/src/security/d1-identity-authorization.ts";
import type { D1DatabaseLike, D1StatementLike } from "../packages/infrastructure/src/d1.ts";
import { decideAuthorization } from "../packages/security/src/index.ts";

type Call = { sql: string; values: unknown[] };

function fakeD1(rows: Record<string, unknown>[] = []) {
  const calls: Call[] = [];
  const db: D1DatabaseLike = {
    prepare(sql: string): D1StatementLike {
      const call: Call = { sql, values: [] };
      calls.push(call);
      const statement: D1StatementLike = {
        bind(...values: unknown[]) {
          call.values = values;
          return statement;
        },
        async all<T extends Record<string, unknown>>() {
          return { results: rows as T[] };
        },
      };
      return statement;
    },
  };
  return { db, calls };
}

test("identity lookup is tenant-scoped and binds tenant before identity id", async () => {
  const { db, calls } = fakeD1([]);
  const adapter = new D1IdentityAuthorizationAdapter(db);
  const result = await adapter.findIdentityById("tenant-B" as never, "identity-A");

  assert.equal(result, undefined);
  assert.match(calls[0].sql, /WHERE tenant_id=\? AND id=\?/);
  assert.deepEqual(calls[0].values, ["tenant-B", "identity-A"]);
});

test("session validation scopes the session and joined identity/principal to the same tenant", async () => {
  const { db, calls } = fakeD1([]);
  const adapter = new D1IdentityAuthorizationAdapter(db);
  const result = await adapter.validateSession("tenant-B" as never, "hashed-token", "2026-10-10T00:00:00.000Z");

  assert.equal(result, undefined);
  assert.match(calls[0].sql, /s\.tenant_id=\?/);
  assert.match(calls[0].sql, /i\.tenant_id=s\.tenant_id/);
  assert.match(calls[0].sql, /p\.tenant_id=i\.tenant_id/);
  assert.deepEqual(calls[0].values, ["tenant-B", "hashed-token", "2026-10-10T00:00:00.000Z"]);
});

test("permission lookup binds tenant, principal and requested permission", async () => {
  const { db, calls } = fakeD1([]);
  const adapter = new D1IdentityAuthorizationAdapter(db);
  const allowed = await adapter.authorizePermission("tenant-B" as never, "principal-A", "market.product.update");

  assert.equal(allowed, false);
  assert.match(calls[0].sql, /pr\.tenant_id=\?/);
  assert.match(calls[0].sql, /r\.tenant_id=pr\.tenant_id/);
  assert.match(calls[0].sql, /rp\.tenant_id=r\.tenant_id/);
  assert.match(calls[0].sql, /p\.tenant_id=rp\.tenant_id/);
  assert.deepEqual(calls[0].values, ["tenant-B", "principal-A", "market.product.update"]);
});

test("authorization denies unauthenticated contexts", () => {
  assert.equal(
    decideAuthorization({ tenantId: "tenant-A", roles: [], scopes: [], authenticated: false, correlationId: "test" }, ["market.product.update"]).decision,
    "DENY",
  );
});

test("authorization denies an authenticated context without the required permission scope", () => {
  assert.equal(
    decideAuthorization({ tenantId: "tenant-A", subjectId: "principal-A", roles: [], scopes: ["market.catalog.read"], authenticated: true, correlationId: "test" }, ["market.product.update"]).decision,
    "DENY",
  );
});

test("authorization permits an authenticated context only when the required scope exists", () => {
  assert.equal(
    decideAuthorization({ tenantId: "tenant-A", subjectId: "principal-A", roles: [], scopes: ["market.product.update"], authenticated: true, correlationId: "test" }, ["market.product.update"]).decision,
    "ALLOW",
  );
});
