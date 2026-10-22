import {
  MemoryAdapter,
  namespace,
} from "../apps/server/src/adapters/memwal/index.js";
import { config } from "../apps/server/src/config.js";
import { hash } from "../apps/server/src/services/state.js";
import { checkMemoryGate } from "./lib/memory-gate.js";
import { readFile } from "node:fs/promises";

const scope = namespace("runway-builder-evidence-v1");
let existing: { recordId?: string; recordedAt?: string } = {};
try {
  existing = JSON.parse(await readFile("docs/memory-gate.json", "utf8"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
const recordId = existing.recordId || "runway-synthetic-compatibility-v1";
if (!/^runway-synthetic-compatibility-v[1-9]\d*$/.test(recordId))
  throw new Error(
    "Unexpected compatibility record ID; reconcile the existing evidence before continuing.",
  );
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
  recordedAt: existing.recordedAt || new Date().toISOString(),
  eventAt: "2026-10-29",
  payloadHash: hash(payload),
  payload,
};
let client: ReturnType<MemoryAdapter["create"]> | undefined;
try {
  client = new MemoryAdapter().create(scope);
  const evidence = await checkMemoryGate(
    client,
    "docs/memory-gate.json",
    config.memoryUrl,
    envelope,
    config.memoryWrites,
  );
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Memory smoke failed.",
  );
  process.exitCode = 1;
} finally {
  client?.destroy();
}
