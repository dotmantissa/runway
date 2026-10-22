import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { MemWal } from "@mysten-incubation/memwal";
import {
  decodeMemory,
  encodeMemory,
  type Envelope,
} from "../../apps/server/src/adapters/memwal/index.js";

type Client = Pick<
  MemWal,
  | "health"
  | "listMemories"
  | "remember"
  | "getRememberStatus"
  | "waitForRememberJob"
  | "recall"
>;
export async function checkMemoryGate(
  client: Client,
  file: string,
  provider: string,
  envelope: Envelope,
  writesEnabled: boolean,
) {
  let evidence: Record<string, any> = {};
  try {
    evidence = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const persist = async () => {
    await mkdir(dirname(file), { recursive: true });
    const temporary = file + ".tmp";
    await writeFile(temporary, JSON.stringify(evidence, null, 2) + "\n");
    await rename(temporary, file);
  };
  const scope = envelope.workspaceScopeAlias;
  if (
    (evidence.namespace && evidence.namespace !== scope) ||
    (evidence.provider && evidence.provider !== provider)
  )
    throw new Error(
      "Existing memory evidence belongs to another provider or namespace.",
    );
  try {
    const health = await client.health();
    const list = await client.listMemories({ namespace: scope, limit: 10 });
    evidence = {
      ...evidence,
      provider,
      namespace: scope,
      compatibility: {
        status: health.status,
        version: health.version,
        write_ready: health.write_ready,
        writes: (health as typeof health & { writes?: string }).writes,
      },
      signedAccessVerified: true,
      priorMemoryCount: list.memories.length,
      lastStatusCheck: new Date().toISOString(),
    };
    let jobId = evidence.jobId || evidence.acceptedJobId;
    if (!jobId) {
      if (["submitting", "needs_review"].includes(evidence.state)) {
        evidence.state = "needs_review";
        throw new Error(
          "The previous submission response is unknown. Reconcile its remote job before retrying.",
        );
      }
      if (!writesEnabled)
        throw new Error(
          "A new memory write requires MEMORY_WRITES_ENABLED=true. Existing jobs can be checked without enabling writes.",
        );
      evidence = {
        ...evidence,
        state: "submitting",
        recordId: envelope.recordId,
        payloadHash: envelope.payloadHash,
        submittedAt: new Date().toISOString(),
      };
      await persist();
      const accepted = await client.remember(
        encodeMemory(
          "Synthetic Runway compatibility record. Confirmed funds exclude expected payments.",
          envelope,
        ),
        { idempotencyKey: envelope.recordId },
      );
      jobId = accepted.job_id;
      evidence.acceptedJobId = jobId;
      evidence.state = "accepted";
      await persist();
    }
    const status = await client.getRememberStatus(jobId);
    evidence.remoteStatus = status.status;
    if (["failed", "not_found"].includes(status.status)) {
      evidence.state = status.status === "failed" ? "failed" : "needs_review";
      throw new Error(
        status.error || "The existing memory job is " + status.status + ".",
      );
    }
    evidence.state = "running";
    await persist();
    const done = await client.waitForRememberJob(jobId, {
      timeoutMs: 180000,
      pollIntervalMs: 3000,
    });
    if (!done.blob_id)
      throw new Error("The completed memory job did not return a blob ID.");
    evidence.state = "uploaded";
    evidence.blobId = done.blob_id;
    await persist();
    const recalled = await client.recall({
      query: "Runway synthetic compatibility confirmed funds reserve",
      limit: 10,
      namespace: scope,
      timeoutMs: 30000,
    });
    const match = recalled.results.some((hit) => {
      try {
        const value = decodeMemory(hit.text);
        return (
          value.recordId === envelope.recordId &&
          value.workspaceScopeAlias === scope &&
          value.recordType === envelope.recordType &&
          value.payloadHash === envelope.payloadHash &&
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
    evidence = {
      ...evidence,
      sdk: "0.1.9",
      state: "stored_and_retrieved",
      jobId,
      recordId: envelope.recordId,
      payloadHash: envelope.payloadHash,
      verifiedAt: new Date().toISOString(),
      completedRecords: 1,
    };
    delete evidence.error;
    await persist();
    return evidence;
  } catch (error) {
    if (evidence.state === "submitting") evidence.state = "needs_review";
    evidence.error =
      error instanceof Error ? error.message : "Memory smoke failed.";
    evidence.checkedAt = new Date().toISOString();
    await persist();
    throw error;
  }
}
