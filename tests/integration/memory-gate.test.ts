import { describe, it, expect, vi } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkMemoryGate } from "../../scripts/lib/memory-gate.js";
import { namespace } from "../../apps/server/src/adapters/memwal/index.js";
import { hash } from "../../apps/server/src/services/state.js";

const envelope = {
  schemaVersion: 1 as const,
  recordId: "gate-record",
  recordType: "compatibility",
  workspaceScopeAlias: namespace("gate-workspace"),
  recordedAt: "2026-10-22T00:00:00.000Z",
  eventAt: "2026-10-29",
  payloadHash: hash({ synthetic: true }),
  payload: { synthetic: true },
};
describe("crash-safe memory compatibility evidence", () => {
  it("never resubmits an unknown response, even after repeated restarts", async () => {
    const directory = await mkdtemp(join(tmpdir(), "runway-gate-"));
    const file = join(directory, "gate.json");
    const remember = vi.fn(async () => {
      throw new Error("Connection interrupted");
    });
    const client = {
      health: async () => ({}),
      listMemories: async () => ({ memories: [] }),
      remember,
    } as any;
    try {
      await expect(
        checkMemoryGate(client, file, "https://test.invalid", envelope, true),
      ).rejects.toThrow("Connection interrupted");
      for (let restart = 0; restart < 2; restart++)
        await expect(
          checkMemoryGate(client, file, "https://test.invalid", envelope, true),
        ).rejects.toThrow("previous submission response is unknown");
      expect(remember).toHaveBeenCalledTimes(1);
      expect(JSON.parse(await readFile(file, "utf8"))).toMatchObject({
        state: "needs_review",
        recordId: envelope.recordId,
        payloadHash: envelope.payloadHash,
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
  it("preserves terminal remote-job evidence without resubmitting", async () => {
    const directory = await mkdtemp(join(tmpdir(), "runway-gate-"));
    const file = join(directory, "gate.json");
    const remember = vi.fn();
    const client = {
      health: async () => ({}),
      listMemories: async () => ({ memories: [] }),
      remember,
      getRememberStatus: async () => ({
        status: "failed",
        error: "Embedding HTTP 401",
      }),
    } as any;
    try {
      await writeFile(
        file,
        JSON.stringify({
          acceptedJobId: "known-job",
          state: "failed",
          completedRecords: 0,
          originalCheck: "preserve",
        }),
      );
      await expect(
        checkMemoryGate(client, file, "https://test.invalid", envelope, false),
      ).rejects.toThrow("Embedding HTTP 401");
      expect(remember).not.toHaveBeenCalled();
      expect(JSON.parse(await readFile(file, "utf8"))).toMatchObject({
        acceptedJobId: "known-job",
        state: "failed",
        completedRecords: 0,
        originalCheck: "preserve",
        signedAccessVerified: true,
        remoteStatus: "failed",
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
  it("requires explicit write enablement when no known job exists", async () => {
    const directory = await mkdtemp(join(tmpdir(), "runway-gate-"));
    const file = join(directory, "gate.json");
    const remember = vi.fn();
    try {
      const client = {
        health: async () => ({}),
        listMemories: async () => ({ memories: [] }),
        remember,
      } as any;
      await expect(
        checkMemoryGate(client, file, "https://test.invalid", envelope, false),
      ).rejects.toThrow("MEMORY_WRITES_ENABLED=true");
      expect(remember).not.toHaveBeenCalled();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
