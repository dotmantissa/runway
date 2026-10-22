import type { Database } from "../db/index.js";
import { MemoryAdapter, namespace } from "../adapters/memwal/index.js";
import { AppError, audit, hash, load } from "./state.js";

export interface MemoryRecoveryRequest {
  workspaceId: string;
  recordId: string;
  remoteJobId?: string;
  apply?: boolean;
}

/** Inspect an existing submission, then optionally finalize its verified content.
 * This operation never calls remember, replaces a job, or enables publication.
 */
export async function recoverMemory(
  db: Database,
  memory: MemoryAdapter,
  request: MemoryRecoveryRequest,
) {
  const { workspaceId, recordId } = request;
  const readRecord = async () => {
    const record = (
      await db.query(
        "SELECT * FROM memory_records WHERE workspace_id=$1 AND id=$2",
        [workspaceId, recordId],
      )
    ).rows[0];
    if (!record)
      throw new AppError(
        404,
        "NOT_FOUND",
        "This memory is not in the selected workspace.",
      );
    return record;
  };
  const record = await readRecord();
  const fingerprint = (value: unknown) =>
    hash(JSON.parse(JSON.stringify(value)));
  const initialFingerprint = fingerprint(record);
  const w = await load(db, workspaceId);
  if (w.kind !== "personal")
    throw new AppError(
      403,
      "RECOVERY_DISABLED",
      "Only personal workspace submissions can be recovered.",
    );
  if (
    ![
      "submitting",
      "needs_review",
      "running",
      "uploaded",
      "failed",
      "verified",
    ].includes(record.status)
  )
    throw new AppError(
      409,
      "NOT_SUBMITTED",
      "This record has no interrupted submission to recover.",
    );
  const remoteJobId = request.remoteJobId || record.remote_job_id;
  if (!remoteJobId)
    throw new AppError(
      422,
      "JOB_REQUIRED",
      "Supply the existing remote job ID obtained from the relayer.",
    );
  if (record.remote_job_id && record.remote_job_id !== remoteJobId)
    throw new AppError(
      409,
      "JOB_CONFLICT",
      "This record already belongs to a different remote job. Replacement requires separate review.",
    );

  const scope = namespace(workspaceId);
  const client = memory.create(scope);
  let remote;
  try {
    remote = await client.getRememberStatus(remoteJobId);
  } finally {
    client.destroy();
  }
  if (
    remote.job_id !== remoteJobId ||
    (remote.namespace !== undefined && remote.namespace !== scope) ||
    (remote.status === "done" && remote.namespace !== scope)
  )
    throw new AppError(
      409,
      "REMOTE_SCOPE_MISMATCH",
      "The remote job does not match the requested job and workspace namespace.",
    );
  const report = {
    workspaceId,
    recordId,
    remoteJobId,
    localStatus: record.status as string,
    remoteStatus: remote.status,
    blobId: remote.blob_id || null,
    contentVerified: false,
    applied: false,
  };
  if (remote.status !== "done") {
    if (request.apply)
      throw new AppError(
        409,
        "REMOTE_NOT_COMPLETE",
        "The existing remote job is not complete. No local state was changed.",
      );
    return report;
  }
  if (!remote.blob_id || (record.blob_id && record.blob_id !== remote.blob_id))
    throw new AppError(
      409,
      "BLOB_CONFLICT",
      "The completed job has no matching blob ID.",
    );
  const recalled = await memory.recall(workspaceId, [
    {
      id: record.id,
      record_type: record.record_type,
      payload_hash: record.payload_hash,
      blob_id: remote.blob_id,
    },
  ]);
  const envelope = recalled.records.find((r) => r.recordId === recordId);
  // Check the entire immutable envelope, including metadata outside the payload hash.
  if (
    !envelope ||
    envelope.schemaVersion !== 1 ||
    envelope.recordType !== record.record_type ||
    envelope.workspaceScopeAlias !== scope ||
    envelope.payloadHash !== record.payload_hash ||
    hash(envelope.payload) !== record.payload_hash ||
    envelope.eventAt !== record.event_at ||
    envelope.recordedAt !== new Date(record.recorded_at).toISOString() ||
    (envelope.supersedesId || null) !== record.supersedes_id
  )
    throw new AppError(
      409,
      "CONTENT_MISMATCH",
      "The stored envelope does not match this immutable local record.",
    );
  report.contentVerified = true;
  if (!request.apply) return report;

  await db.transaction(async (tx) => {
    const currentWorkspace = await load(tx, workspaceId, true);
    const current = (
      await tx.query(
        "SELECT * FROM memory_records WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
        [workspaceId, recordId],
      )
    ).rows[0];
    // Remote reads happen outside the transaction; a worker may have changed the record meanwhile.
    if (
      currentWorkspace.kind !== "personal" ||
      !current ||
      fingerprint(current) !== initialFingerprint
    )
      throw new AppError(
        409,
        "RECOVERY_CONFLICT",
        "This record changed during remote verification. Inspect it again before applying recovery.",
      );
    const jobs = (
      await tx.query(
        "SELECT id,status,result,error FROM jobs WHERE workspace_id=$1 AND kind='memory_publish' AND payload->>'recordId'=$2 FOR UPDATE",
        [workspaceId, recordId],
      )
    ).rows;
    if (jobs.some((j) => j.status === "running"))
      throw new AppError(
        409,
        "RECOVERY_BUSY",
        "A worker is processing this record. Wait for it to finish before recovery.",
      );
    if (
      current.status === "verified" &&
      current.remote_job_id === remoteJobId &&
      jobs.every((job) => job.status === "done")
    )
      return;
    await tx.query(
      "UPDATE memory_records SET remote_job_id=$1,blob_id=$2,status='verified',verified_at=now(),error=NULL WHERE workspace_id=$3 AND id=$4",
      [remoteJobId, remote.blob_id, workspaceId, recordId],
    );
    for (const job of jobs)
      await tx.query(
        "UPDATE jobs SET status='done',result=$1,error=NULL,lease_owner=NULL,lease_until=NULL WHERE id=$2",
        [
          JSON.stringify({ recordId, blobId: remote.blob_id, recovered: true }),
          job.id,
        ],
      );
    await audit(
      tx,
      currentWorkspace,
      "memory",
      "Existing remote memory verified and recovered without resubmission.",
      {
        recordId,
        remoteJobId,
        blobId: remote.blob_id,
        previous: {
          status: record.status,
          remoteJobId: record.remote_job_id,
          blobId: record.blob_id,
          error: record.error,
          jobs,
        },
      },
    );
  });
  return { ...report, localStatus: "verified", applied: true };
}
