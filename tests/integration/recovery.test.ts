import { describe, it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "../../apps/server/src/db/index.js";
import { createApp } from "../../apps/server/src/app.js";
import { config } from "../../apps/server/src/config.js";
import {
  MemoryAdapter,
  encodeMemory,
  decodeMemory,
  namespace,
} from "../../apps/server/src/adapters/memwal/index.js";
import { hash } from "../../apps/server/src/services/state.js";
import {
  id,
  sampleState,
  queueJob,
  type Workspace,
  load,
  save,
} from "../../apps/server/src/services/state.js";
import { runJobs } from "../../apps/server/src/jobs.js";
describe("restart and memory reliability", () => {
  it("authenticates scheduled processing and drains jobs without an inline timer", async () => {
    const secret = config.cronSecret;
    config.cronSecret = "test-only-cron-secret-" + "x".repeat(32);
    const operations: Promise<unknown>[] = [];
    const app = await createApp({
      db: new Database(undefined, "memory://"),
      worker: false,
      serveStatic: false,
      background: (operation) => {
        operations.push(operation);
      },
    });
    try {
      expect(
        (await app.inject({ method: "GET", url: "/api/v1/internal/jobs" }))
          .statusCode,
      ).toBe(401);
      expect(
        (
          await app.inject({
            method: "GET",
            url: "/api/v1/internal/jobs",
            headers: { authorization: "Bearer wrong" },
          })
        ).statusCode,
      ).toBe(401);
      expect(
        (
          await app.inject({
            method: "GET",
            url: "/api/v1/internal/jobs",
            headers: { authorization: "Bearer " + config.cronSecret },
          })
        ).json(),
      ).toEqual({ processed: 0 });
      expect(operations).toHaveLength(0);
      const login = await app.inject({
        method: "POST",
        url: "/api/v1/demo/session",
        headers: { origin: config.origin },
        payload: { fixtureId: "hero" },
      });
      expect(login.statusCode).toBe(200);
      expect(operations).toHaveLength(1);
      await Promise.all(operations);
      expect(
        (await app.inject({ method: "GET", url: "/api/v1/health/ready" }))
          .statusCode,
      ).toBe(200);
      expect(operations).toHaveLength(1);
    } finally {
      await Promise.all(operations);
      await app.close();
      config.cronSecret = secret;
    }
  });
  it("keeps reconciliation pending if finances change during a remote balance read", async () => {
    const db = new Database(undefined, "memory://");
    await db.initialize();
    try {
      const w: Workspace = {
        id: id(),
        kind: "personal",
        wallet_address: "0x" + "1".repeat(64),
        state_version: 1,
        data: sampleState(),
      };
      w.data.accounts[0].kind = "sui";
      w.data.accounts[0].address = w.wallet_address!;
      await db.query("INSERT INTO workspaces(id,kind,data) VALUES($1,$2,$3)", [
        w.id,
        w.kind,
        JSON.stringify(w.data),
      ]);
      await db.transaction((tx) =>
        queueJob(tx, w, "balance", { accountId: w.data.accounts[0].id }),
      );
      const chain = {
        balance: async () => {
          await db.transaction(async (tx) => {
            const latest = await load(tx, w.id, true);
            latest.data.accounts[0].reconciliationPending = true;
            await save(tx, latest);
          });
          return {
            amountAtomic: "900000000",
            checkedAt: new Date().toISOString(),
            source: "tatum_verified" as const,
            provider: "injected-test",
          };
        },
        receipt: async () => {
          throw new Error("Unexpected receipt");
        },
      };
      await runJobs(db, chain, new MemoryAdapter());
      const latest = await load(db, w.id);
      expect(latest.data.accounts[0].reconciliationPending).toBe(true);
      expect(latest.data.accounts[0].amountAtomic).toBe("900000000");
    } finally {
      await db.close();
    }
  });
  it("resumes expired leases and reconciles lost memory submission without resending", async () => {
    const db = new Database(undefined, "memory://");
    await db.initialize();
    const prior = config.memoryWrites;
    config.memoryWrites = true;
    try {
      const w: Workspace = {
        id: id(),
        kind: "personal",
        wallet_address: null,
        state_version: 1,
        data: { ...sampleState(), consent: true },
      };
      await db.query("INSERT INTO workspaces(id,kind,data) VALUES($1,$2,$3)", [
        w.id,
        w.kind,
        JSON.stringify(w.data),
      ]);
      const recordId = id();
      await db.query(
        "INSERT INTO memory_records(id,workspace_id,record_type,payload,payload_hash,summary,event_at,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          recordId,
          w.id,
          "lesson",
          "{}",
          hash({}),
          "Synthetic test lesson",
          "2026-10-29",
          "submitting",
        ],
      );
      const jobId = await db.transaction((tx) =>
        queueJob(tx, w, "memory_publish", { recordId }),
      );
      await db.query(
        "UPDATE jobs SET status='running',lease_until=now()-interval '1 minute',lease_owner='interrupted' WHERE id=$1",
        [jobId],
      );
      let submits = 0;
      const mem = new MemoryAdapter();
      (mem as any).create = () => ({
        remember: async () => {
          submits++;
          return { job_id: "never" };
        },
        destroy: () => {},
      });
      const chain = {
        balance: async () => {
          throw new Error("Unexpected chain call");
        },
        receipt: async () => {
          throw new Error("Unexpected chain call");
        },
      };
      await runJobs(db, chain, mem);
      const record = (
          await db.query("SELECT status FROM memory_records WHERE id=$1", [
            recordId,
          ])
        ).rows[0],
        job = (
          await db.query("SELECT status,attempts FROM jobs WHERE id=$1", [
            jobId,
          ])
        ).rows[0];
      expect(record.status).toBe("needs_review");
      expect(job.status).toBe("needs_review");
      expect(job.attempts).toBe(1);
      expect(submits).toBe(0);
    } finally {
      config.memoryWrites = prior;
      await db.close();
    }
  });
  it("preserves session and finance state across a new server/database instance", async () => {
    const directory = await mkdtemp(join(tmpdir(), "runway-recovery-"));
    let app = await createApp({
      db: new Database(undefined, directory),
      worker: false,
      serveStatic: false,
    });
    try {
      const login = await app.inject({
        method: "POST",
        url: "/api/v1/demo/session",
        headers: { origin: config.origin },
        payload: { fixtureId: "hero" },
      });
      const cookie = "runway=" + login.cookies[0].value,
        csrf = login.json().csrf;
      const changed = await app.inject({
        method: "PUT",
        url: "/api/v1/policy",
        headers: {
          origin: config.origin,
          cookie,
          "x-csrf-token": csrf,
          "idempotency-key": "restart-policy",
        },
        payload: {
          reserveAtomic: "50000000",
          horizonDays: 7,
          timezone: "Africa/Lagos",
          expectedStateVersion: 1,
        },
      });
      expect(changed.statusCode).toBe(200);
      await app.close();
      app = await createApp({
        db: new Database(undefined, directory),
        worker: false,
        serveStatic: false,
      });
      const boot = (
        await app.inject({
          method: "GET",
          url: "/api/v1/bootstrap",
          headers: { cookie },
        })
      ).json();
      expect(boot.state.policy.reserveAtomic).toBe("50000000");
      expect(boot.stateVersion).toBe(2);
    } finally {
      await app.close();
      await rm(directory, { recursive: true, force: true });
    }
  });
  it("rejects tampered content and incomplete required history", async () => {
    const payload = { id: "one", value: 100 };
    const envelope = {
      schemaVersion: 1 as const,
      recordId: "one",
      recordType: "lesson",
      workspaceScopeAlias: namespace("tenant"),
      recordedAt: new Date().toISOString(),
      eventAt: "2026-10-29",
      payloadHash: hash(payload),
      payload,
    };
    const encoded = encodeMemory("Human summary", envelope);
    expect(decodeMemory(encoded).payloadHash).toBe(hash(payload));
    expect(() => decodeMemory(encoded.replace("100", "200"))).toThrow(
      "hash mismatch",
    );
    const adapter = new MemoryAdapter();
    (adapter as any).create = () => ({
      recall: async () => ({ results: [] }),
      destroy: () => {},
    });
    await expect(
      adapter.recall("tenant", [
        {
          id: "one",
          record_type: "lesson",
          payload_hash: hash(payload),
          blob_id: "blob",
        },
      ]),
    ).rejects.toThrow("History is incomplete");
  });
});
