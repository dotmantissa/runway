import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { recallPublishedExample } from "./published-recall.js";
import { hash } from "./state.js";
import { namespace, type Envelope } from "../adapters/memwal/index.js";
import { normalizeHistory } from "../../../../packages/domain/src/index.js";

function remoteFixture() {
  const manifests = [
    "memory-manifest.json",
    "memory-corrections-manifest.json",
  ].map((file) => JSON.parse(readFileSync("docs/" + file, "utf8")));
  const records: Envelope[] = manifests.flatMap((m) =>
    m.records.map((r: any) => ({
      schemaVersion: 1,
      recordId: r.id,
      recordType: r.type,
      workspaceScopeAlias: m.scope,
      recordedAt: r.recordedAt,
      eventAt: r.eventAt,
      payloadHash: r.payloadHash,
      payload: r.payload,
      ...(r.supersedesId ? { supersedesId: r.supersedesId } : {}),
    })),
  );
  const outcomes = records
    .filter((r) => r.recordType === "outcome")
    .map((r) => r.payload as any);
  return {
    records,
    outcomes,
    historyHash: hash(normalizeHistory(outcomes)),
    verifiedAt: new Date().toISOString(),
  };
}

describe("published synthetic recall", () => {
  it("requires the fixed namespace and every blob/hash; reproduces both reserve decisions and corrected history", async () => {
    const remote = remoteFixture();
    const recall = vi.fn(async () => remote);
    const result = await recallPublishedExample({ recall });
    expect(recall).toHaveBeenCalledWith(
      "runway-builder-evidence-v1",
      expect.arrayContaining([
        expect.objectContaining({
          blob_id: expect.any(String),
          payload_hash: expect.any(String),
        }),
      ]),
    );
    expect(recall.mock.calls[0]).toHaveLength(2);
    expect(result.recordsRetrieved).toBe(12);
    expect(result.original.historyMode).toBe("walrus");
    expect(result.original.totalReductionAtomic).toBe("150000000");
    expect(result.corrected.totalReductionAtomic).toBe("100000000");
    expect(result.original.firstExposedFixedBill?.date).toBe("2026-11-02");
    expect(result.correctedClientHistory.sampleCount).toBe(3);
    expect(result.correctedClientHistory.medianDelay).toBeUndefined();
  });
  it("propagates remote failure without substituting local history", async () => {
    await expect(
      recallPublishedExample({
        recall: async () => {
          throw new Error("Relayer unavailable");
        },
      }),
    ).rejects.toThrow("Relayer unavailable");
  });
  it.each(["missing", "foreign", "tampered", "supersession"])(
    "rejects %s remote evidence",
    async (mode) => {
      const remote = remoteFixture();
      if (mode === "missing") remote.records.pop();
      if (mode === "foreign")
        remote.records[0].workspaceScopeAlias = namespace("someone-else");
      if (mode === "tampered")
        remote.records[0].payload = { amountAtomic: "1" };
      if (mode === "supersession")
        delete remote.records.find((r) =>
          r.recordId.includes("policy-correction"),
        )!.supersedesId;
      await expect(
        recallPublishedExample({ recall: async () => remote }),
      ).rejects.toThrow();
    },
  );
});
