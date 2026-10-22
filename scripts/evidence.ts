import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { hero, FIXTURE_CLOCK } from "../packages/fixtures/src/index.js";
import {
  canonical,
  plan,
  normalizeHistory,
} from "../packages/domain/src/index.js";
import {
  MemoryAdapter,
  namespace,
  encodeMemory,
  decodeMemory,
} from "../apps/server/src/adapters/memwal/index.js";
import { hash } from "../apps/server/src/services/state.js";
import { config } from "../apps/server/src/config.js";
const command = process.argv[2] || "compare-local";
const workspace = "runway-builder-evidence-v1",
  scope = namespace(workspace),
  file = "docs/memory-manifest.json";
const h = hero();
const input = {
  stateVersion: 1,
  asOf: FIXTURE_CLOCK,
  localToday: "2026-10-29",
  horizonEnd: "2026-11-04",
  timezone: "Africa/Lagos",
  confirmedFundsAtomic: "800000000",
  reserveFloorAtomic: "100000000",
  pendingAtomic: "0",
  expenses: h.expenses,
  invoices: h.invoices,
};
async function atomicWrite(path: string, value: unknown) {
  await mkdir("docs", { recursive: true });
  await writeFile(path + ".tmp", JSON.stringify(value, null, 2) + "\n");
  await rename(path + ".tmp", path);
}
function records() {
  const useful = [
    ...h.outcomes.map((o) => ({
      id: o.id,
      type: "outcome",
      payload: o,
      eventAt: o.paidDate,
      summary:
        "Synthetic resolved Cedar Studio payment; confirmed funds remain separate.",
    })),
    {
      id: "hero-policy",
      type: "policy",
      payload: h.policy,
      eventAt: "2026-10-29",
      summary: "Synthetic reserve rule: preserve 100 USDC.",
    },
    ...h.expenses.map((e) => ({
      id: "hero-expense-" + e.id,
      type: "obligation",
      payload: e,
      eventAt: e.dueDate,
      summary: "Synthetic spending rule: " + e.label,
    })),
    {
      id: "hero-expectation",
      type: "expectation",
      payload: h.invoices[0],
      eventAt: h.invoices[0].dueDate,
      summary: "Synthetic client promise: 1200 USDC on Friday 30 October.",
    },
    {
      id: "hero-lesson",
      type: "lesson",
      payload: {
        clientId: "cedar",
        sampleCount: 4,
        medianDelay: 4,
        outcomeIds: h.outcomes.map((o) => o.id),
        synthetic: true,
      },
      eventAt: "2026-10-29",
      summary: "Four synthetic payments have a median delay of four days.",
    },
    {
      id: "hero-proposal",
      type: "proposal",
      payload: plan(input, h.outcomes, "history_median", "postgres"),
      eventAt: "2026-10-29",
      summary:
        "Synthetic proposal reduces Saturday purchase by 150 USDC to preserve reserve before rent.",
    },
  ];
  return useful.map((r) => ({
    ...r,
    id: "runway-evidence-v1-" + r.id,
    payloadHash: hash(r.payload),
    status: "local",
    blob_id: null as string | null,
    remote_job_id: null as string | null,
    recordedAt: new Date().toISOString(),
  }));
}
function normalizedResult(r: ReturnType<typeof plan>) {
  const { historyMode, freshness, ...result } = r;
  return result;
}
try {
  if (command === "compare-local") {
    const none = plan(input, [], "promised", "none"),
      database = plan(input, h.outcomes, "history_median", "postgres"),
      conservative = plan(input, [], "no_receipt", "none");
    await atomicWrite("docs/comparison-local.json", {
      state: "local_only",
      verifiedAt: new Date().toISOString(),
      inputHash: hash(input),
      historyHash: hash(normalizeHistory(h.outcomes)),
      withoutHistory: none,
      databaseHistory: database,
      noReceipt: conservative,
      walrus: "Not retrieved. B/C and fresh-process claims remain unverified.",
    });
    console.log("Local controlled comparison saved. No Mainnet recall claim.");
  } else if (command === "publish") {
    if (!config.memoryWrites)
      throw new Error(
        "Set MEMORY_WRITES_ENABLED=true only for this authorized synthetic builder evidence command.",
      );
    if (!existsSync(file))
      await atomicWrite(file, {
        schemaVersion: 1,
        workspaceId: workspace,
        scope,
        synthetic: true,
        records: records(),
      });
    const manifest = JSON.parse(await readFile(file, "utf8")),
      client = new MemoryAdapter().create(scope);
    try {
      for (const record of manifest.records) {
        if (record.status === "verified") continue;
        if (
          ["submitting", "needs_review"].includes(record.status) &&
          !record.remote_job_id
        )
          throw new Error(
            "Unknown submission for " +
              record.id +
              ". Reconcile before continuing.",
          );
        try {
          if (!record.remote_job_id) {
            record.status = "submitting";
            await atomicWrite(file, manifest);
            const envelope = {
              schemaVersion: 1 as const,
              recordId: record.id,
              recordType: record.type,
              workspaceScopeAlias: scope,
              recordedAt: record.recordedAt,
              eventAt: record.eventAt,
              payloadHash: record.payloadHash,
              payload: record.payload,
            };
            const accepted = await client.remember(
              encodeMemory(record.summary, envelope),
              { idempotencyKey: record.id },
            );
            record.remote_job_id = accepted.job_id;
            record.status = "running";
            await atomicWrite(file, manifest);
          }
          const done = await client.waitForRememberJob(record.remote_job_id, {
            timeoutMs: 180000,
            pollIntervalMs: 3000,
          });
          record.blob_id = done.blob_id;
          record.status = "uploaded";
          await atomicWrite(file, manifest);
          const response = await client.recall({
            query: record.summary + " record " + record.id,
            namespace: scope,
            limit: 30,
            timeoutMs: 20000,
          });
          const match = response.results.some((hit) => {
            try {
              const e = decodeMemory(hit.text);
              return (
                e.recordId === record.id &&
                e.workspaceScopeAlias === scope &&
                e.payloadHash === record.payloadHash &&
                hit.blob_id === record.blob_id
              );
            } catch {
              return false;
            }
          });
          if (!match)
            throw new Error(
              "Uploaded content has not been retrieved with a matching hash.",
            );
          record.status = "verified";
          record.verifiedAt = new Date().toISOString();
          delete record.error;
          await atomicWrite(file, manifest);
          console.log("Verified " + record.id);
        } catch (e) {
          record.status = record.remote_job_id ? "failed" : "needs_review";
          record.error = (e as Error).message;
          await atomicWrite(file, manifest);
          throw e;
        }
      }
    } finally {
      client.destroy();
    }
  } else if (command === "compare-walrus") {
    // This process only uses the fixture current state and bounded manifest. It never reads database historical outcomes.
    const manifest = JSON.parse(await readFile(file, "utf8"));
    if (
      manifest.workspaceId !== workspace ||
      !manifest.synthetic ||
      manifest.scope !== scope
    )
      throw new Error("Unexpected evidence workspace.");
    const needed = manifest.records.filter((r: any) => r.type === "outcome");
    if (needed.length !== 4 || needed.some((r: any) => r.status !== "verified"))
      throw new Error(
        "Four completed and verified outcome records are required.",
      );
    const recalled = await new MemoryAdapter().recall(
      workspace,
      needed.map((r: any) => ({
        id: r.id,
        record_type: r.type,
        payload_hash: r.payloadHash,
        blob_id: r.blob_id,
      })),
    );
    if (
      hash(normalizeHistory(recalled.outcomes)) !==
      hash(normalizeHistory(h.outcomes))
    )
      throw new Error(
        "Retrieved history differs from the controlled database fixture.",
      );
    const walrus = plan(input, recalled.outcomes, "history_median", "walrus"),
      database = plan(input, h.outcomes, "history_median", "postgres");
    if (
      canonical(normalizedResult(walrus)) !==
      canonical(normalizedResult(database))
    )
      throw new Error("Walrus and database results do not match.");
    await atomicWrite("docs/comparison.json", {
      state: "verified",
      freshProcess: true,
      pid: process.pid,
      inputHash: hash(input),
      historyHash: recalled.historyHash,
      verifiedAt: recalled.verifiedAt,
      withoutHistory: plan(input, [], "promised", "none"),
      walrusHistory: walrus,
      databaseHistory: database,
    });
    console.log(
      "Fresh-process Walrus/database parity verified with matching content.",
    );
  } else throw new Error("Use compare-local, publish, or compare-walrus.");
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
}
