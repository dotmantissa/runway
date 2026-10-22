import { randomUUID } from "node:crypto";
import type { Database } from "./db/index.js";
import type { ChainAdapter } from "./adapters/tatum/index.js";
import {
  MemoryAdapter,
  namespace,
  encodeMemory,
} from "./adapters/memwal/index.js";
import { config } from "./config.js";
import { load, save, audit, id, AppError } from "./services/state.js";
const owner = randomUUID();
export async function runJobs(
  db: Database,
  chain: ChainAdapter,
  memory: MemoryAdapter,
) {
  await db.query(
    "INSERT INTO worker_heartbeats(id) VALUES($1) ON CONFLICT(id) DO UPDATE SET seen_at=now()",
    [owner],
  );
  await db.query(
    "DELETE FROM workspaces WHERE kind='sample' AND expires_at<now()",
  );
  await db.query("DELETE FROM sessions WHERE expires_at<now()");
  await db.query(
    "DELETE FROM challenges WHERE expires_at<now()-interval '1 hour'",
  );
  const job = await db.transaction(async (tx) => {
    const j = (
      await tx.query(
        "SELECT * FROM jobs WHERE (status='queued' AND run_after<=now()) OR (status='running' AND lease_until<now()) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",
      )
    ).rows[0];
    if (!j) return;
    await tx.query(
      "UPDATE jobs SET status='running',lease_owner=$1,lease_until=now()+interval '20 minutes',attempts=attempts+1 WHERE id=$2",
      [owner, j.id],
    );
    return j;
  });
  if (!job) return false;
  const heartbeat = setInterval(() => {
    void db
      .query("UPDATE worker_heartbeats SET seen_at=now() WHERE id=$1", [owner])
      .catch(() => {});
  }, 10000);
  heartbeat.unref();
  let status = "done",
    result: unknown = {},
    safeError: string | null = null;
  try {
    const w = await load(db, job.workspace_id);
    if (job.kind === "balance") {
      const account = w.data.accounts.find(
        (a) => a.id === job.payload.accountId,
      );
      if (!account?.address) throw new Error("Wallet account is unavailable.");
      const balance = await chain.balance(account.address);
      await db.transaction(async (tx) => {
        const latest = await load(tx, w.id, true),
          a = latest.data.accounts.find((a) => a.id === account.id);
        if (!a) throw new Error("Wallet account was removed.");
        Object.assign(a, {
          amountAtomic: balance.amountAtomic,
          confirmedAt: balance.checkedAt,
          source: balance.source,
          reconciliationPending: latest.state_version !== w.state_version,
          version: a.version + 1,
        });
        await save(tx, latest);
        await audit(
          tx,
          latest,
          "balance",
          "Wallet funds verified through Tatum.",
        );
      });
      result = balance;
    } else if (job.kind === "receipt") {
      const facts = await chain.receipt(
        job.payload.digest,
        job.payload.address,
      );
      result = await db.transaction(async (tx) => {
        const latest = await load(tx, w.id, true),
          receiptId = id();
        const r = (
          await tx.query(
            "INSERT INTO receipts(id,workspace_id,digest,facts) VALUES($1,$2,$3,$4) ON CONFLICT(workspace_id,digest) DO UPDATE SET digest=EXCLUDED.digest RETURNING id",
            [receiptId, w.id, facts.digest, JSON.stringify(facts)],
          )
        ).rows[0];
        await audit(
          tx,
          latest,
          "payment",
          "Incoming native USDC receipt verified through Tatum.",
        );
        return { receiptId: r.id, facts };
      });
    } else if (job.kind === "memory_publish") {
      const record = (
        await db.query(
          "SELECT * FROM memory_records WHERE id=$1 AND workspace_id=$2",
          [job.payload.recordId, w.id],
        )
      ).rows[0];
      if (!record) throw new Error("Memory record is unavailable.");
      if (record.status === "verified")
        result = { recordId: record.id, blobId: record.blob_id };
      else {
        if (!w.data.consent || !config.memoryWrites || w.kind === "sample")
          throw new Error(
            "Future memory publication is disabled for this workspace.",
          );
        if (record.status === "needs_review")
          throw new Error(
            "The submission result is unknown. Reconcile the remote job before retrying.",
          );
        const scope = namespace(w.id),
          client = memory.create(scope);
        try {
          let remoteJob = record.remote_job_id;
          if (!remoteJob) {
            // Persist uncertainty before the remote side effect. A lost response never causes a blind duplicate write.
            if (record.status === "submitting")
              throw new Error(
                "The submission response was interrupted. Reconcile this record before retrying.",
              );
            await db.query(
              "UPDATE memory_records SET status='submitting' WHERE id=$1",
              [record.id],
            );
            const envelope = {
              schemaVersion: 1 as const,
              recordId: record.id,
              recordType: record.record_type,
              workspaceScopeAlias: scope,
              recordedAt: new Date(record.recorded_at).toISOString(),
              eventAt: record.event_at,
              payloadHash: record.payload_hash,
              payload: record.payload,
              ...(record.supersedes_id
                ? { supersedesId: record.supersedes_id }
                : {}),
            };
            const accepted = await client.remember(
              encodeMemory(record.summary, envelope),
              { idempotencyKey: record.id },
            );
            remoteJob = accepted.job_id;
            await db.query(
              "UPDATE memory_records SET remote_job_id=$1,status='running' WHERE id=$2",
              [remoteJob, record.id],
            );
          }
          const remote = await client.getRememberStatus(remoteJob);
          if (remote.status === "failed")
            throw new Error(
              "The Walrus relayer could not process this memory.",
            );
          if (remote.status === "not_found")
            throw new Error("The remote memory job could not be found.");
          if (remote.status !== "done") {
            status = "queued";
            result = { remoteJobId: remoteJob, status: remote.status };
          } else {
            if (!remote.blob_id)
              throw new Error("The completed job did not return a blob ID.");
            await db.query(
              "UPDATE memory_records SET status='uploaded',blob_id=$1 WHERE id=$2",
              [remote.blob_id, record.id],
            );
            await memory.recall(w.id, [
              {
                id: record.id,
                record_type: record.record_type,
                payload_hash: record.payload_hash,
                blob_id: remote.blob_id,
              },
            ]);
            await db.query(
              "UPDATE memory_records SET status='verified',verified_at=now(),error=NULL WHERE id=$1",
              [record.id],
            );
            await db.transaction(async (tx) => {
              await audit(
                tx,
                await load(tx, w.id, true),
                "memory",
                "Memory stored and retrieved on Mainnet.",
                { recordId: record.id },
              );
            });
            result = { recordId: record.id, blobId: remote.blob_id };
          }
        } finally {
          client.destroy();
        }
      }
    } else if (job.kind === "memory_verify") {
      const manifest = (
        await db.query(
          "SELECT id,record_type,payload_hash,blob_id FROM memory_records WHERE workspace_id=$1 AND status IN ('uploaded','verified')",
          [w.id],
        )
      ).rows;
      if (!manifest.length)
        throw new Error("No uploaded memory records are available.");
      const recalled = await memory.recall(w.id, manifest);
      result = {
        count: recalled.records.length,
        historyHash: recalled.historyHash,
        verifiedAt: recalled.verifiedAt,
      };
      await db.query(
        "UPDATE memory_records SET status='verified',verified_at=now(),error=NULL WHERE workspace_id=$1 AND id=ANY($2::text[])",
        [w.id, manifest.map((r) => r.id)],
      );
    } else throw new Error("This job type is unsupported.");
  } catch (e) {
    status = "failed";
    safeError = job.kind.startsWith("memory")
      ? "Walrus Memory could not complete this operation. Open the record status and retry after the service is available."
      : e instanceof AppError
        ? e.message
        : "Sui verification could not complete. Try again after the provider is available.";
    if (job.kind === "memory_publish") {
      const record = (
        await db.query(
          "SELECT status,remote_job_id FROM memory_records WHERE id=$1",
          [job.payload.recordId],
        )
      ).rows[0];
      const unknown = record?.status === "submitting" && !record?.remote_job_id;
      await db.query(
        "UPDATE memory_records SET status=$1,error=$2 WHERE id=$3",
        [unknown ? "needs_review" : "failed", safeError, job.payload.recordId],
      );
      if (unknown) status = "needs_review";
    }
  }
  clearInterval(heartbeat);
  await db.query(
    "UPDATE jobs SET status=$1,result=$2,error=$3,lease_owner=NULL,lease_until=NULL,run_after=now()+interval '3 seconds' WHERE id=$4 AND lease_owner=$5",
    [status, JSON.stringify(result), safeError, job.id, owner],
  );
  return true;
}
