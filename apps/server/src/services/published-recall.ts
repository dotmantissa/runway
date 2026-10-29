import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { MemoryAdapter, namespace } from "../adapters/memwal/index.js";
import { AppError, hash } from "./state.js";
import {
  hero,
  FIXTURE_CLOCK,
} from "../../../../packages/fixtures/src/index.js";
import {
  canonical,
  plan,
  timing,
  type Policy,
} from "../../../../packages/domain/src/index.js";

const workspace = "runway-builder-evidence-v1";
const manifestSchema = z.object({
  workspaceId: z.literal(workspace),
  scope: z.literal(namespace(workspace)),
  synthetic: z.literal(true),
  records: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        status: z.literal("verified"),
        payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
        blob_id: z.string().min(1),
      }),
    )
    .min(1)
    .max(12),
});

// Only the already-public synthetic namespace is reachable from this endpoint.
// Every request performs remote retrieval; there is no local-history fallback.
export async function recallPublishedExample(
  memory: Pick<MemoryAdapter, "recall">,
) {
  const manifests = await Promise.all(
    ["memory-manifest.json", "memory-corrections-manifest.json"].map(
      async (file) =>
        manifestSchema.parse(
          JSON.parse(await readFile(resolve("docs", file), "utf8")),
        ),
    ),
  );
  const required = manifests.flatMap((m) => m.records);
  if (required.length !== 12 || new Set(required.map((r) => r.id)).size !== 12)
    throw new AppError(
      503,
      "EXAMPLE_MANIFEST",
      "The published example manifest is incomplete.",
    );
  const recalled = await memory.recall(
    workspace,
    required.map((r) => ({
      id: r.id,
      record_type: r.type,
      payload_hash: r.payloadHash,
      blob_id: r.blob_id,
    })),
  );
  const record = (id: string) => {
    const value = recalled.records.find((r) => r.recordId === id);
    const expected = required.find((r) => r.id === id);
    if (
      !value ||
      !expected ||
      value.workspaceScopeAlias !== namespace(workspace) ||
      value.recordType !== expected.type ||
      value.payloadHash !== expected.payloadHash ||
      hash(value.payload) !== expected.payloadHash
    )
      throw new AppError(
        503,
        "EXAMPLE_INCOMPLETE",
        "A required published memory could not be verified. Try again later.",
      );
    return value;
  };
  required.forEach((r) => record(r.id));
  const h = hero();
  const originals = h.outcomes.map((o) => {
    const value = record("runway-evidence-v1-" + o.id);
    if (canonical(value.payload) !== canonical(o))
      throw new AppError(
        503,
        "EXAMPLE_CHANGED",
        "The recalled history does not match this dated example.",
      );
    return value.payload as typeof o;
  });
  const oldPolicy = record("runway-evidence-v1-hero-policy");
  const newPolicy = recalled.records.find(
    (r) => r.recordType === "policy" && r.supersedesId === oldPolicy.recordId,
  );
  if (!newPolicy || canonical(oldPolicy.payload) !== canonical(h.policy))
    throw new AppError(
      503,
      "EXAMPLE_POLICY",
      "The published policy versions could not be verified.",
    );
  const corrected = z
    .object({
      reserveAtomic: z.literal("50000000"),
      horizonDays: z.literal(14),
      timezone: z.literal("Africa/Lagos"),
      version: z.literal(2),
    })
    .parse(newPolicy.payload) as Policy;
  const input = {
    stateVersion: 1,
    asOf: FIXTURE_CLOCK,
    localToday: "2026-10-29",
    horizonEnd: "2026-11-04",
    timezone: h.policy.timezone,
    confirmedFundsAtomic: "800000000",
    pendingAtomic: "0",
    reserveFloorAtomic: h.policy.reserveAtomic,
    expenses: h.expenses,
    invoices: h.invoices,
  };
  return {
    verifiedAt: recalled.verifiedAt,
    source: "walrus",
    synthetic: true,
    recordsRetrieved: required.length,
    historyHash: recalled.historyHash,
    original: plan(input, originals, "history_median", "walrus"),
    corrected: plan(
      { ...input, reserveFloorAtomic: corrected.reserveAtomic },
      originals,
      "history_median",
      "walrus",
    ),
    correctedClientHistory: timing(recalled.outcomes, "cedar"),
    boundaries:
      "Dated synthetic example. Current funds and obligations are fixed inputs; history and policy versions are retrieved from Mainnet. Policy comparison holds the original history fixed. No funds move or memories are written.",
  };
}
