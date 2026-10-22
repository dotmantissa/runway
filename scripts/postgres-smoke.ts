import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile, rename } from "node:fs/promises";
import pg from "pg";
import { Challenge } from "mppx";
import {
  InvoiceAgent,
  SAMPLE_INVOICE,
} from "../apps/server/src/services/invoice-agent.js";
import {
  makeChallenge,
  type ToolWallet,
} from "../apps/server/src/adapters/parser/payment.js";
import { Database } from "../apps/server/src/db/index.js";
import { createApp } from "../apps/server/src/app.js";
import { config } from "../apps/server/src/config.js";
import {
  MemoryAdapter,
  namespace,
} from "../apps/server/src/adapters/memwal/index.js";
import { recoverMemory } from "../apps/server/src/services/memory-recovery.js";
import { runJobs } from "../apps/server/src/jobs.js";
import {
  id,
  hash,
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
    [1, 2, 3, 4],
  );
  checks.push(
    "Concurrent server/worker migrations serialize and apply versions 1–4",
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
  await first.query(
    "INSERT INTO workspaces(id,kind,data,wallet_address) VALUES($1,$2,$3,$4)",
    [w.id, w.kind, JSON.stringify(w.data), w.wallet_address],
  );
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
  const recordId = id(),
    remoteJobId = id();
  const payload = {
    synthetic: true,
    lesson: "Test recovery without a remote write.",
  };
  const envelope = {
    schemaVersion: 1 as const,
    recordId,
    recordType: "lesson",
    workspaceScopeAlias: namespace(w.id),
    recordedAt: new Date().toISOString(),
    eventAt: "2026-10-22",
    payloadHash: hash(payload),
    payload,
  };
  await first.query(
    "INSERT INTO memory_records(id,workspace_id,record_type,payload,payload_hash,summary,event_at,recorded_at,status,error) VALUES($1,$2,'lesson',$3,$4,'Synthetic recovery lesson',$5,$6,'needs_review','Interrupted submission')",
    [
      recordId,
      w.id,
      JSON.stringify(payload),
      envelope.payloadHash,
      envelope.eventAt,
      envelope.recordedAt,
    ],
  );
  const recoveryJobId = await first.transaction((tx) =>
    queueJob(tx, w, "memory_publish", { recordId }),
  );
  await first.query(
    "UPDATE jobs SET status='needs_review',error='Interrupted submission' WHERE id=$1",
    [recoveryJobId],
  );
  // Force both connections to inspect the same pre-recovery record before committing.
  let recalls = 0;
  let release!: () => void;
  const bothRecalled = new Promise<void>((resolve) => {
    release = resolve;
  });
  const memory = new MemoryAdapter();
  memory.create = () =>
    ({
      getRememberStatus: async () => ({
        job_id: remoteJobId,
        namespace: namespace(w.id),
        status: "done",
        blob_id: "injected-recovery-blob",
      }),
      destroy: () => {},
    }) as any;
  memory.recall = async () => {
    if (++recalls === 2) release();
    await bothRecalled;
    return {
      outcomes: [],
      historyHash: hash([]),
      records: [envelope],
      verifiedAt: new Date().toISOString(),
    };
  };
  const recovery = { workspaceId: w.id, recordId, remoteJobId, apply: true };
  const recovered = await Promise.allSettled([
    recoverMemory(first, memory, recovery),
    recoverMemory(second, memory, recovery),
  ]);
  assert.equal(recovered.filter((r) => r.status === "fulfilled").length, 1);
  const conflict = recovered.find(
    (r) => r.status === "rejected",
  ) as PromiseRejectedResult;
  assert.equal(conflict.reason.code, "RECOVERY_CONFLICT");
  assert.equal(
    (
      await first.query("SELECT status FROM memory_records WHERE id=$1", [
        recordId,
      ])
    ).rows[0].status,
    "verified",
  );
  assert.equal(
    (await first.query("SELECT status FROM jobs WHERE id=$1", [recoveryJobId]))
      .rows[0].status,
    "done",
  );
  const recoveryEvents = (
    await first.query(
      "SELECT details FROM audit WHERE workspace_id=$1 AND details->>'recordId'=$2",
      [w.id, recordId],
    )
  ).rows;
  assert.equal(recoveryEvents.length, 1);
  assert.equal(
    recoveryEvents[0].details.previous.error,
    "Interrupted submission",
  );
  checks.push(
    "Concurrent memory recovery verifies existing content once and preserves interrupted-job evidence without resubmission",
  );
  const priorTools = { ...config };
  try {
    const other: Workspace = {
      ...w,
      id: id(),
      wallet_address: "0x" + "3".repeat(64),
      data: sampleState(),
    };
    await first.query(
      "INSERT INTO workspaces(id,kind,data,wallet_address) VALUES($1,'personal',$2,$3)",
      [other.id, JSON.stringify(other.data), other.wallet_address],
    );
    Object.assign(config, {
      agentPayments: true,
      parserRecipient: "0x" + "9".repeat(64),
      parserSecret: "synthetic-postgres-proof-" + "x".repeat(32),
      toolAllowedWallets: [w.wallet_address!, other.wallet_address!],
      toolDailyGas: 50000000,
    });
    let signingCalls = 0;
    const wallet: ToolWallet = {
      address: "0x" + "2".repeat(64),
      prepare: async () => {
        signingCalls++;
        throw new Error("Signing is not part of this reservation check");
      },
      broadcast: async () => {
        throw new Error("No broadcast permitted in reservation check");
      },
      state: async () => "unknown",
    };
    const transport = {
      quote: async (requestId: string, requestHash: string) =>
        Challenge.serialize(makeChallenge(requestId, requestHash)),
      parse: async () => {
        throw new Error("No paid parser call permitted");
      },
    };
    const agentA = new InvoiceAgent(first, chain, { wallet, transport }),
      agentB = new InvoiceAgent(second, chain, { wallet, transport });
    await first.transaction((tx) =>
      agentA.setPolicy(tx, w, {
        enabled: true,
        perCallAtomic: "10000",
        dailyAtomic: "200000",
      }),
    );
    await second.transaction((tx) =>
      agentB.setPolicy(tx, other, {
        enabled: true,
        perCallAtomic: "10000",
        dailyAtomic: "200000",
      }),
    );
    const a = (await agentA.quote(w, { kind: "text", text: SAMPLE_INVOICE }))
        .order,
      b = (await agentB.quote(other, { kind: "text", text: SAMPLE_INVOICE }))
        .order;
    const day = new Date().toISOString().slice(0, 10);
    await first.query(
      "INSERT INTO tool_budget_days(wallet_address,day,spent_atomic) VALUES($1,$2,190000)",
      [wallet.address, day],
    );
    const approvals = await Promise.allSettled([
      first.transaction(async (tx) =>
        agentA.approve(tx, await load(tx, w.id, true), a.id),
      ),
      second.transaction(async (tx) =>
        agentB.approve(tx, await load(tx, other.id, true), b.id),
      ),
    ]);
    assert.equal(approvals.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(
      (approvals.find((r) => r.status === "rejected") as PromiseRejectedResult)
        .reason.code,
      "TOOL_BUDGET",
    );
    const budget = (
      await first.query(
        "SELECT spent_atomic::text,reserved_atomic::text FROM tool_budget_days WHERE wallet_address=$1 AND day=$2",
        [wallet.address, day],
      )
    ).rows[0];
    assert.deepEqual(budget, {
      spent_atomic: "190000",
      reserved_atomic: "10000",
    });
    assert.equal(signingCalls, 0);
    checks.push(
      "Concurrent workspaces share one tool-wallet daily budget and reserve the last allowance exactly once without signing or spending",
    );
  } finally {
    Object.assign(config, priorTools);
  }
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
