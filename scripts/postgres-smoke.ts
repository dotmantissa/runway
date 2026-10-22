import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile, rename } from "node:fs/promises";
import pg from "pg";
import { Database } from "../apps/server/src/db/index.js";
import { createApp } from "../apps/server/src/app.js";
import { config } from "../apps/server/src/config.js";
import { MemoryAdapter } from "../apps/server/src/adapters/memwal/index.js";
import { runJobs } from "../apps/server/src/jobs.js";
import {
  id,
  load,
  queueJob,
  sampleState,
  type Workspace,
} from "../apps/server/src/services/state.js";

// Only an explicit test URL is accepted. Every operation uses a disposable schema.
const connection = process.env.RUNWAY_TEST_DATABASE_URL;
if (!connection)
  throw new Error(
    "Set RUNWAY_TEST_DATABASE_URL to a local or dedicated test PostgreSQL database.",
  );
const schema = "runway_smoke_" + randomUUID().replaceAll("-", "");
const admin = new pg.Pool({
  connectionString: connection,
  max: 1,
  connectionTimeoutMillis: 15000,
  enableChannelBinding: true,
} as pg.PoolConfig & { enableChannelBinding: boolean });
const url = new URL(connection);
url.searchParams.set("options", "-c search_path=" + schema);
const first = new Database(url.toString());
const second = new Database(url.toString());
let app: Awaited<ReturnType<typeof createApp>> | undefined;
const checks: string[] = [];
let schemaCreated = false;
try {
  await admin.query(`CREATE SCHEMA ${schema}`);
  schemaCreated = true;
  await Promise.all([first.initialize(), second.initialize()]);
  assert.deepEqual(
    (
      await first.query("SELECT version FROM migrations ORDER BY version")
    ).rows.map((r) => r.version),
    [1, 2, 3],
  );
  checks.push(
    "Concurrent server/worker migrations serialize and apply versions 1–3",
  );
  await assert.rejects(
    first.transaction(async (tx) => {
      await tx.query(
        "INSERT INTO worker_heartbeats(id) VALUES('rollback-check')",
      );
      throw new Error("rollback requested");
    }),
    /rollback requested/,
  );
  assert.equal(
    (
      await first.query(
        "SELECT * FROM worker_heartbeats WHERE id='rollback-check'",
      )
    ).rows.length,
    0,
  );
  checks.push("Failed transactions roll back");
  app = await createApp({ db: first, worker: false, serveStatic: false });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/demo/session",
    headers: { origin: config.origin },
    payload: { fixtureId: "hero" },
  });
  assert.equal(login.statusCode, 200);
  const cookie = "runway=" + login.cookies[0].value;
  const headers = {
    origin: config.origin,
    cookie,
    "x-csrf-token": login.json().csrf,
    "idempotency-key": "postgres-concurrent-policy",
  };
  const change = {
    method: "PUT" as const,
    url: "/api/v1/policy",
    headers,
    payload: {
      reserveAtomic: "50000000",
      horizonDays: 14,
      timezone: "Africa/Lagos",
      expectedStateVersion: 1,
    },
  };
  const responses = await Promise.all([app.inject(change), app.inject(change)]);
  assert.deepEqual(
    responses.map((r) => r.statusCode),
    [200, 200],
  );
  const workspace = (
    await app.inject({
      method: "GET",
      url: "/api/v1/bootstrap",
      headers: { cookie },
    })
  ).json();
  assert.equal(workspace.stateVersion, 2);
  assert.equal(workspace.state.policy.reserveAtomic, "50000000");
  checks.push(
    "Concurrent identical finance commands update state exactly once",
  );
  const w: Workspace = {
    id: id(),
    kind: "personal",
    wallet_address: "0x" + "1".repeat(64),
    state_version: 1,
    data: sampleState(),
  };
  w.data.accounts[0].kind = "sui";
  w.data.accounts[0].address = w.wallet_address!;
  await first.query("INSERT INTO workspaces(id,kind,data) VALUES($1,$2,$3)", [
    w.id,
    w.kind,
    JSON.stringify(w.data),
  ]);
  const jobId = await first.transaction((tx) =>
    queueJob(tx, w, "balance", { accountId: w.data.accounts[0].id }),
  );
  let reads = 0;
  const chain = {
    balance: async () => {
      reads++;
      await new Promise((r) => setTimeout(r, 50));
      return {
        amountAtomic: "900000000",
        checkedAt: new Date().toISOString(),
        source: "tatum_verified" as const,
        provider: "injected-postgres-test",
      };
    },
    receipt: async () => {
      throw new Error("Unexpected receipt call");
    },
  };
  await Promise.all([
    runJobs(first, chain, new MemoryAdapter()),
    runJobs(second, chain, new MemoryAdapter()),
  ]);
  assert.equal(reads, 1);
  assert.deepEqual(
    (await first.query("SELECT status,attempts FROM jobs WHERE id=$1", [jobId]))
      .rows[0],
    { status: "done", attempts: 1 },
  );
  assert.equal(
    (await load(first, w.id)).data.accounts[0].amountAtomic,
    "900000000",
  );
  checks.push(
    "Concurrent worker connections claim and complete a leased job once",
  );
  await app.close();
  app = undefined;
  app = await createApp({ db: second, worker: false, serveStatic: false });
  const restored = (
    await app.inject({
      method: "GET",
      url: "/api/v1/bootstrap",
      headers: { cookie },
    })
  ).json();
  assert.equal(restored.stateVersion, 2);
  assert.equal(restored.state.policy.reserveAtomic, "50000000");
  checks.push(
    "New server connection restores the saved session and finance state",
  );
  const version = (await admin.query("SHOW server_version")).rows[0]
    .server_version;
  const evidence = {
    state: "verified",
    database: "native-postgresql",
    serverVersion: version,
    checkedAt: new Date().toISOString(),
    isolatedSchema: true,
    providerCalls: "injected test only; no live receipt or memory claim",
    checks,
  };
  await writeFile(
    "docs/postgres-gate.json.tmp",
    JSON.stringify(evidence, null, 2) + "\n",
  );
  await rename("docs/postgres-gate.json.tmp", "docs/postgres-gate.json");
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  if (app) await app.close();
  await Promise.allSettled([first.close(), second.close()]);
  try {
    if (schemaCreated)
      await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  } finally {
    await admin.end();
  }
}
