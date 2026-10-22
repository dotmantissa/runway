import assert from "node:assert/strict";
import { readFile, writeFile, rename } from "node:fs/promises";
import {
  MemoryAdapter,
  namespace,
  encodeMemory,
} from "../apps/server/src/adapters/memwal/index.js";
import { config } from "../apps/server/src/config.js";
import { hash } from "../apps/server/src/services/state.js";
import {
  activeOutcomes,
  canonical,
  plan,
  timing,
  type Outcome,
  type Policy,
} from "../packages/domain/src/index.js";
import { hero, FIXTURE_CLOCK } from "../packages/fixtures/src/index.js";

const workspace = "runway-builder-evidence-v1",
  scope = namespace(workspace);
const file = "docs/memory-corrections-manifest.json";
const command = process.argv[2];
async function persist(path: string, value: unknown) {
  await writeFile(path + ".tmp", JSON.stringify(value, null, 2) + "\n");
  await rename(path + ".tmp", path);
}
const original = JSON.parse(
  await readFile("docs/memory-manifest.json", "utf8"),
);
assert.equal(original.workspaceId, workspace);
assert.equal(original.scope, scope);
assert.equal(original.synthetic, true);
const policy = original.records.find((r: any) => r.type === "policy");
const oldOutcome = original.records.find(
  (r: any) => r.id === "runway-evidence-v1-cedar-outcome-1",
);
assert.equal(policy.status, "verified");
assert.equal(oldOutcome.status, "verified");
let manifest: any;
try {
  manifest = JSON.parse(await readFile(file, "utf8"));
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
}
const recordedAt = manifest?.recordedAt || new Date().toISOString();
const specifications = [
  {
    id: "runway-evidence-v1-policy-correction-1",
    type: "policy",
    supersedesId: policy.id,
    payload: { ...policy.payload, reserveAtomic: "50000000", version: 2 },
    summary:
      "Synthetic confirmed correction: reserve floor is now 50 USDC, replacing the original 100 USDC policy.",
  },
  {
    id: "runway-evidence-v1-outcome-correction-1",
    type: "outcome",
    supersedesId: oldOutcome.id,
    payload: {
      ...oldOutcome.payload,
      id: "cedar-outcome-1-corrected",
      clientId: "other-synthetic-client",
      supersedesId: oldOutcome.payload.id,
      recordedAt,
    },
    summary:
      "Synthetic payment correction: first payment belonged to a different client. Supersede its Cedar association; only three Cedar outcomes remain, insufficient for a timing estimate.",
  },
].map((r) => ({
  ...r,
  payloadHash: hash(r.payload),
  recordedAt,
  eventAt: "2026-10-29",
}));
if (!manifest) {
  if (command !== "publish")
    throw new Error(
      "Publish the two authorized synthetic corrections before read-only verification.",
    );
  manifest = {
    schemaVersion: 1,
    workspaceId: workspace,
    scope,
    synthetic: true,
    recordedAt,
    records: specifications.map((r) => ({ ...r, status: "ready" })),
  };
  await persist(file, manifest);
}
assert.equal(manifest.workspaceId, workspace);
assert.equal(manifest.scope, scope);
assert.equal(manifest.synthetic, true);
assert.equal(manifest.records.length, 2);
manifest.records.forEach((r: any, i: number) => {
  for (const key of [
    "id",
    "type",
    "supersedesId",
    "payloadHash",
    "recordedAt",
    "eventAt",
  ])
    assert.equal(r[key], (specifications[i] as any)[key]);
  assert.equal(hash(r.payload), specifications[i].payloadHash);
});
try {
  if (command === "publish") {
    const client = new MemoryAdapter().create(scope);
    try {
      for (const record of manifest.records) {
        if (record.status === "verified") continue;
        if (!record.remote_job_id && record.status !== "ready")
          throw new Error(
            "Uncertain submission requires reconciliation: " + record.id,
          );
        try {
          if (!record.remote_job_id) {
            if (!config.memoryWrites)
              throw new Error(
                "New synthetic writes require MEMORY_WRITES_ENABLED=true.",
              );
            record.status = "submitting";
            await persist(file, manifest);
            const accepted = await client.remember(
              encodeMemory(record.summary, {
                schemaVersion: 1,
                recordId: record.id,
                recordType: record.type,
                workspaceScopeAlias: scope,
                recordedAt: record.recordedAt,
                eventAt: record.eventAt,
                payloadHash: record.payloadHash,
                payload: record.payload,
                supersedesId: record.supersedesId,
              }),
              { idempotencyKey: record.id },
            );
            record.remote_job_id = accepted.job_id;
            record.status = "accepted";
            await persist(file, manifest);
          }
          const status = await client.getRememberStatus(record.remote_job_id);
          record.remoteStatus = status.status;
          if (["failed", "not_found"].includes(status.status))
            throw new Error(
              status.error ||
                "Existing job is " + status.status + "; no resubmission.",
            );
          const done = await client.waitForRememberJob(record.remote_job_id, {
            timeoutMs: 180000,
            pollIntervalMs: 3000,
          });
          assert.ok(done.blob_id);
          record.blob_id = done.blob_id;
          record.remoteStatus = "done";
          record.status = "uploaded";
          await persist(file, manifest);
          const result = await new MemoryAdapter().recall(workspace, [
            {
              id: record.id,
              record_type: record.type,
              payload_hash: record.payloadHash,
              blob_id: record.blob_id,
            },
          ]);
          assert.equal(result.records[0].supersedesId, record.supersedesId);
          record.status = "verified";
          record.verifiedAt = result.verifiedAt;
          delete record.error;
          await persist(file, manifest);
          console.log("Verified correction " + record.id);
        } catch (e) {
          record.error = (e as Error).message;
          await persist(file, manifest);
          throw e;
        }
      }
    } finally {
      client.destroy();
    }
  } else if (command === "verify") {
    assert.ok(manifest.records.every((r: any) => r.status === "verified"));
    const required = [
      ...original.records.filter((r: any) =>
        ["policy", "outcome"].includes(r.type),
      ),
      ...manifest.records,
    ];
    const recalled = await new MemoryAdapter().recall(
      workspace,
      required.map((r: any) => ({
        id: r.id,
        record_type: r.type,
        payload_hash: r.payloadHash,
        blob_id: r.blob_id,
      })),
    );
    assert.equal(recalled.records.length, 7);
    const originalPolicy = recalled.records.find(
      (r) => r.recordId === policy.id,
    )!;
    const correctedPolicy = recalled.records.find(
      (r) => r.recordId === specifications[0].id,
    )!;
    assert.equal(correctedPolicy.supersedesId, originalPolicy.recordId);
    const oldPolicy = originalPolicy.payload as Policy;
    const newPolicy = correctedPolicy.payload as typeof oldPolicy;
    assert.equal(newPolicy.version, oldPolicy.version + 1);
    assert.equal(newPolicy.reserveAtomic, "50000000");
    const baseHistory = recalled.records
      .filter((r) => r.recordType === "outcome" && !r.supersedesId)
      .map((r) => r.payload as Outcome);
    const active = activeOutcomes(recalled.outcomes);
    assert.equal(
      active.some((o) => o.id === oldOutcome.payload.id),
      false,
    );
    assert.equal(active.length, 4);
    assert.equal(timing(recalled.outcomes, "cedar").sampleCount, 3);
    assert.equal(timing(recalled.outcomes, "cedar").medianDelay, undefined);
    const h = hero();
    const input = {
      stateVersion: 1,
      asOf: FIXTURE_CLOCK,
      localToday: "2026-10-29",
      horizonEnd: "2026-11-04",
      timezone: "Africa/Lagos",
      confirmedFundsAtomic: "800000000",
      pendingAtomic: "0",
      expenses: h.expenses,
      invoices: h.invoices,
      reserveFloorAtomic: oldPolicy.reserveAtomic,
    };
    const before = plan(input, baseHistory, "history_median", "walrus");
    const after = plan(
      { ...input, reserveFloorAtomic: newPolicy.reserveAtomic },
      baseHistory,
      "history_median",
      "walrus",
    );
    assert.equal(before.totalReductionAtomic, "150000000");
    assert.equal(after.totalReductionAtomic, "100000000");
    const databaseHistory = [
      ...h.outcomes,
      specifications[1].payload as Outcome,
    ];
    assert.equal(canonical(active), canonical(activeOutcomes(databaseHistory)));
    assert.throws(
      () => plan(input, recalled.outcomes, "history_median", "walrus"),
      /not enough payment history/,
    );
    await persist("docs/memory-corrections.json", {
      state: "verified",
      synthetic: true,
      freshProcess: true,
      pid: process.pid,
      verifiedAt: recalled.verifiedAt,
      scope,
      requiredRecords: required.map((r: any) => ({
        id: r.id,
        payloadHash: r.payloadHash,
        blobId: r.blob_id,
      })),
      recordCount: recalled.records.length,
      historyHash: recalled.historyHash,
      policy: {
        originalId: policy.id,
        correctedId: correctedPolicy.recordId,
        originalReserveAtomic: oldPolicy.reserveAtomic,
        correctedReserveAtomic: newPolicy.reserveAtomic,
        originalReductionAtomic: before.totalReductionAtomic,
        correctedReductionAtomic: after.totalReductionAtomic,
        resolution:
          "Confirmed version 2 supersedes version 1; both remotely recalled. Historical outcomes held fixed for policy comparison.",
      },
      outcome: {
        supersededId: oldOutcome.payload.id,
        correctionId: specifications[1].payload.id,
        activeOutcomeIds: active.map((o) => o.id),
        cedarSampleCount: 3,
        timingEstimate: "insufficient_history",
        databaseParity: true,
        resolution:
          "Both original and correction recalled; superseded client association excluded before statistics. No stale four-payment forecast.",
      },
      boundaries: [
        "Synthetic integration proof; no personal financial records published.",
        "Policy version selection is demonstrated by this evidence harness; application current financial state remains database-backed.",
        "A correction changes the active interpretation and does not delete the original stored record.",
      ],
    });
    console.log(
      "Fresh-process remote correction proof verified: policy 150 to 100 USDC; corrected association leaves insufficient history; database parity.",
    );
  } else throw new Error("Use publish or verify.");
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
}
