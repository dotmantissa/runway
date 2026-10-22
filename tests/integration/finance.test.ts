import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Database } from "../../apps/server/src/db/index.js";
import { createApp } from "../../apps/server/src/app.js";
import { config } from "../../apps/server/src/config.js";
import { runJobs } from "../../apps/server/src/jobs.js";
import { MemoryAdapter } from "../../apps/server/src/adapters/memwal/index.js";
const db = new Database(undefined, "memory://");
let app: Awaited<ReturnType<typeof createApp>>;
type Browser = { cookie: string; csrf: string };
const browsers: Browser[] = [];
async function request(
  b: Browser,
  method: string,
  url: string,
  body?: unknown,
  key = crypto.randomUUID(),
) {
  return app.inject({
    method: method as any,
    url: "/api/v1" + url,
    headers: {
      origin: config.origin,
      cookie: b.cookie,
      "x-csrf-token": b.csrf,
      "idempotency-key": key,
    },
    payload: body as any,
  });
}
async function sample() {
  const r = await app.inject({
    method: "POST",
    url: "/api/v1/demo/session",
    headers: { origin: config.origin },
    payload: { fixtureId: "hero" },
  });
  return {
    cookie: r.cookies[0].name + "=" + r.cookies[0].value,
    csrf: r.json().csrf,
  };
}
beforeAll(async () => {
  app = await createApp({ db, worker: false, serveStatic: false });
  browsers.push(await sample(), await sample());
});
afterAll(async () => {
  await app?.close();
});
describe("scoped finance commands", () => {
  it("accepts an exact feasible plan once without changing funds", async () => {
    const b = browsers[0],
      p = (
        await request(b, "POST", "/plans/preview", {
          scenario: "history_median",
          historyMode: "postgres",
          expectedStateVersion: 1,
        })
      ).json();
    expect(p.result.totalReductionAtomic).toBe("150000000");
    const body = {
        expectedStateVersion: 1,
        currentInputHash: p.inputHash,
        confirmedAdjustments: p.result.adjustments.map((a: any) => ({
          expenseId: a.expenseId,
          expectedExpenseVersion: a.expectedExpenseVersion,
          newAmountAtomic: a.newAmountAtomic,
        })),
      },
      key = crypto.randomUUID();
    const [a, c] = await Promise.all([
      request(b, "POST", `/plans/${p.id}/accept`, body, key),
      request(b, "POST", `/plans/${p.id}/accept`, body, key),
    ]);
    expect(a.statusCode).toBe(200);
    expect(c.statusCode).toBe(200);
    const state = (await request(b, "GET", "/bootstrap")).json();
    expect(state.stateVersion).toBe(2);
    expect(state.state.accounts[0].amountAtomic).toBe("800000000");
    expect(state.state.expenses[0].amountAtomic).toBe("100000000");
    expect(
      (await request(browsers[1], "GET", `/plans/${p.id}`)).statusCode,
    ).toBe(404);
    expect(
      (
        await request(
          b,
          "POST",
          `/plans/${p.id}/accept`,
          { ...body, currentInputHash: "x".repeat(64) },
          key,
        )
      ).statusCode,
    ).toBe(409);
  });
  it("rejects stale proposals and preserves fixed bills", async () => {
    const b = browsers[1],
      p = (
        await request(b, "POST", "/plans/preview", {
          scenario: "history_median",
          historyMode: "postgres",
          expectedStateVersion: 1,
        })
      ).json();
    expect(
      (
        await request(b, "PUT", "/policy", {
          reserveAtomic: "50000000",
          horizonDays: 14,
          timezone: "Africa/Lagos",
          expectedStateVersion: 1,
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await request(b, "POST", `/plans/${p.id}/accept`, {
          expectedStateVersion: 1,
          currentInputHash: p.inputHash,
          confirmedAdjustments: [],
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (
        await request(b, "POST", "/expenses", {
          label: "Rent",
          amountAtomic: "600000000",
          dueDate: "2026-11-02",
          kind: "fixed",
          maxReductionAtomic: "1",
          expectedStateVersion: 2,
        })
      ).statusCode,
    ).toBe(400);
  });
  it("blocks CSRF, invalid origin and cross-tenant entity reads", async () => {
    expect(
      (
        await app.inject({
          method: "PUT",
          url: "/api/v1/policy",
          headers: { origin: config.origin, cookie: browsers[0].cookie },
          payload: {},
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/demo/session",
          headers: { origin: "https://evil.example" },
          payload: {},
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (await request(browsers[0], "GET", "/invoices/unknown")).statusCode,
    ).toBe(404);
  });
  it("corrects history by supersession and keeps source labels", async () => {
    const b = browsers[1];
    expect(
      (
        await request(b, "POST", "/outcomes/cedar-outcome-4/correct", {
          clientId: "cedar",
          dueDate: "2026-10-16",
          paidDate: "2026-10-16",
          reason: "Corrected synthetic date",
          expectedStateVersion: 2,
        })
      ).statusCode,
    ).toBe(200);
    const detail = (await request(b, "GET", "/invoices/cedar-oct")).json();
    expect(detail.timing.sampleCount).toBe(4);
    expect(detail.timing.observedDelayMax).toBe(4);
    expect(detail.outcomes.at(-1).source).toBe("synthetic_replay");
    expect(
      (
        await request(b, "POST", "/outcomes/cedar-outcome-4/correct", {
          clientId: "cedar",
          dueDate: "2026-10-16",
          paidDate: "2026-10-16",
          reason: "Again",
          expectedStateVersion: 3,
        })
      ).statusCode,
    ).toBe(409);
  });
  it("signs a wallet challenge and rejects nonce replay", async () => {
    const keypair = Ed25519Keypair.generate(),
      wallet = keypair.toSuiAddress();
    const challenge = (
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/challenge",
        headers: { origin: config.origin },
        payload: { address: wallet, network: "mainnet" },
      })
    ).json();
    const signed = await keypair.signPersonalMessage(
        new TextEncoder().encode(challenge.message),
      ),
      payload = { challengeId: challenge.challengeId, ...signed };
    const responses = await Promise.all(
      [0, 1].map(() =>
        app.inject({
          method: "POST",
          url: "/api/v1/auth/verify",
          headers: { origin: config.origin },
          payload,
        }),
      ),
    );
    expect(responses.map((r) => r.statusCode).sort()).toEqual([200, 401]);
  });
  it("verifies and deduplicates receipt jobs with injected chain evidence", async () => {
    const keypair = Ed25519Keypair.generate(),
      wallet = keypair.toSuiAddress();
    const ch = (
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/challenge",
        headers: { origin: config.origin },
        payload: { address: wallet, network: "mainnet" },
      })
    ).json();
    const signed = await keypair.signPersonalMessage(
      new TextEncoder().encode(ch.message),
    );
    const login = await app.inject({
        method: "POST",
        url: "/api/v1/auth/verify",
        headers: { origin: config.origin },
        payload: { challengeId: ch.challengeId, ...signed },
      }),
      b = {
        cookie: "runway=" + login.cookies[0].value,
        csrf: login.json().csrf,
      };
    const digest = "1".repeat(43);
    const first = (
      await request(b, "POST", "/receipts/verify", {
        digest,
        expectedStateVersion: 1,
      })
    ).json();
    const chain = {
      balance: async () => ({
        amountAtomic: "1000000",
        checkedAt: new Date().toISOString(),
        source: "tatum_verified" as const,
        provider: "injected-test",
      }),
      receipt: async () => ({
        digest,
        recipient: wallet,
        sender: "0x" + "1".repeat(64),
        amountAtomic: "1000000",
        coinType: "USDC-test",
        checkpoint: "1",
        settledAt: "2026-10-20T12:00:00Z",
        source: "tatum_verified" as const,
        provider: "injected-test",
      }),
    };
    await runJobs(db, chain, new MemoryAdapter());
    expect(
      (await request(b, "GET", `/jobs/${first.jobId}`)).json().job.status,
    ).toBe("done");
    await request(b, "POST", "/receipts/verify", {
      digest,
      expectedStateVersion: 1,
    });
    await runJobs(db, chain, new MemoryAdapter());
    expect(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM receipts WHERE digest=$1",
          [digest],
        )
      ).rows[0].n,
    ).toBe(1);
  });
  it("keeps settlement dates correct when offchain partials are entered out of order", async () => {
    const b = await sample();
    expect(
      (
        await request(b, "POST", "/invoices/cedar-oct/confirm-offchain", {
          amountAtomic: "400000000",
          paidDate: "2026-10-28",
          source: "user_confirmed",
          expectedStateVersion: 1,
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await request(b, "POST", "/invoices/cedar-oct/confirm-offchain", {
          amountAtomic: "800000000",
          paidDate: "2026-10-27",
          source: "user_confirmed",
          expectedStateVersion: 2,
        })
      ).statusCode,
    ).toBe(200);
    const boot = (await request(b, "GET", "/bootstrap")).json();
    expect(boot.state.outcomes.at(-1).paidDate).toBe("2026-10-28");
    expect(boot.state.accounts[0].amountAtomic).toBe("800000000");
    expect(boot.freshness).toBe("stale");
  });
  it("blocks acceptance after marking an outgoing expense paid until funds reconcile", async () => {
    const b = await sample();
    const response = await request(b, "PATCH", "/expenses/rent", {
      label: "Rent",
      amountAtomic: "600000000",
      dueDate: "2026-11-02",
      kind: "fixed",
      maxReductionAtomic: "0",
      status: "paid",
      expectedVersion: 1,
      expectedStateVersion: 1,
    });
    expect(response.statusCode).toBe(200);
    const boot = (await request(b, "GET", "/bootstrap")).json();
    expect(boot.freshness).toBe("stale");
    expect(
      (
        await request(b, "PATCH", "/expenses/rent", {
          label: "Rent",
          amountAtomic: "600000000",
          dueDate: "2026-11-02",
          kind: "fixed",
          maxReductionAtomic: "0",
          status: "planned",
          expectedVersion: 2,
          expectedStateVersion: 2,
        })
      ).statusCode,
    ).toBe(422);
  });
  it("does not skip unpublished outcomes to claim complete Walrus history", async () => {
    const b = await sample();
    const response = await request(b, "POST", "/plans/preview", {
      scenario: "history_median",
      historyMode: "walrus",
      expectedStateVersion: 1,
    });
    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe("HISTORY_INCOMPLETE");
  });
});
