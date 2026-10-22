import { mkdir, writeFile, readFile } from "node:fs/promises";
import {
  MemoryAdapter,
  namespace,
  encodeMemory,
  decodeMemory,
} from "../apps/server/src/adapters/memwal/index.js";
import { config } from "../apps/server/src/config.js";
import { hash } from "../apps/server/src/services/state.js";
const workspace = "runway-builder-evidence-v1",
  recordId = "runway-synthetic-compatibility-v1",
  scope = namespace(workspace);
const payload = {
  type: "compatibility",
  synthetic: true,
  reserveAtomic: "100000000",
  message: "Runway records outcomes separately from confirmed funds.",
};
const envelope = {
  schemaVersion: 1 as const,
  recordId,
  recordType: "compatibility",
  workspaceScopeAlias: scope,
  recordedAt: new Date().toISOString(),
  eventAt: "2026-10-29",
  payloadHash: hash(payload),
  payload,
};
const adapter = new MemoryAdapter();
const client = adapter.create(scope);
try {
  const compatibility = await client.health();
  console.log("Relayer health received; checking signed account access.");
  const list = await client.listMemories({ namespace: scope, limit: 10 });
  console.log("Signed memory listing succeeded.");
  let previous: any = {};
  try {
    previous = JSON.parse(await readFile("docs/memory-gate.json", "utf8"));
  } catch {}
  const existingJob = previous.jobId || previous.acceptedJobId;
  if (!existingJob) {
    await mkdir("docs", { recursive: true });
    await writeFile(
      "docs/memory-gate.json",
      JSON.stringify(
        {
          provider: config.memoryUrl,
          namespace: scope,
          state: "submitting",
          recordId,
          payloadHash: envelope.payloadHash,
        },
        null,
        2,
      ) + "\n",
    );
  }
  if (!existingJob && ["submitting", "needs_review"].includes(previous.state))
    throw new Error(
      "The previous submission response is unknown. Reconcile its remote job before retrying.",
    );
  const accepted = existingJob
    ? { job_id: existingJob }
    : await client.remember(
        encodeMemory(
          "Synthetic Runway compatibility record. Confirmed funds exclude expected payments.",
          envelope,
        ),
        { idempotencyKey: recordId },
      );
  await mkdir("docs", { recursive: true });
  await writeFile(
    "docs/memory-gate.json",
    JSON.stringify(
      {
        provider: config.memoryUrl,
        namespace: scope,
        acceptedJobId: accepted.job_id,
        state: "accepted",
        checkedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Remember accepted; polling job " + accepted.job_id);
  const done = await client.waitForRememberJob(accepted.job_id, {
    timeoutMs: 180000,
    pollIntervalMs: 3000,
  });
  const recalled = await client.recall({
    query: "Runway synthetic compatibility confirmed funds reserve",
    limit: 10,
    namespace: scope,
    timeoutMs: 30000,
  });
  const match = recalled.results.find((hit) => {
    try {
      const e = decodeMemory(hit.text);
      return (
        e.recordId === recordId &&
        e.payloadHash === envelope.payloadHash &&
        hit.blob_id === done.blob_id
      );
    } catch {
      return false;
    }
  });
  if (!match)
    throw new Error(
      "Completed record could not be retrieved with matching content.",
    );
  const evidence = {
    provider: config.memoryUrl,
    namespace: scope,
    sdk: "0.1.9",
    state: "stored_and_retrieved",
    jobId: accepted.job_id,
    blobId: done.blob_id,
    recordId,
    payloadHash: envelope.payloadHash,
    verifiedAt: new Date().toISOString(),
    compatibility,
    priorMemoryCount: list.memories?.length,
  };
  await writeFile(
    "docs/memory-gate.json",
    JSON.stringify(evidence, null, 2) + "\n",
  );
  console.log(JSON.stringify(evidence, null, 2));
} catch (e) {
  const message = e instanceof Error ? e.message : "Memory smoke failed.";
  let prior = {};
  try {
    prior = JSON.parse(await readFile("docs/memory-gate.json", "utf8"));
  } catch {}
  await mkdir("docs", { recursive: true });
  await writeFile(
    "docs/memory-gate.json",
    JSON.stringify(
      {
        ...prior,
        state: "failed",
        error: message,
        checkedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
  console.error(message);
  process.exitCode = 1;
} finally {
  client.destroy();
}
