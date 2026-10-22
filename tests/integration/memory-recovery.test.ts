import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Database } from "../../apps/server/src/db/index.js";
import {
  MemoryAdapter,
  encodeMemory,
  namespace,
} from "../../apps/server/src/adapters/memwal/index.js";
import { recoverMemory } from "../../apps/server/src/services/memory-recovery.js";
import { hash, id, sampleState } from "../../apps/server/src/services/state.js";

const db = new Database(undefined, "memory://");
beforeAll(() => db.initialize());
afterAll(() => db.close());

async function fixture() {
  const workspaceId = id(),
    recordId = id(),
    jobId = id(),
    remoteJobId = id();
  const payload = {
    synthetic: true,
    lesson: "Confirmed funds exclude expected income.",
  };
  const scope = namespace(workspaceId);
  const envelope = {
    schemaVersion: 1 as const,
    recordId,
    recordType: "lesson",
    workspaceScopeAlias: scope,
    recordedAt: "2026-10-22T00:00:00.000Z",
    eventAt: "2026-10-21",
    payloadHash: hash(payload),
    payload,
  };
  await db.query(
    "INSERT INTO workspaces(id,kind,data) VALUES($1,'personal',$2)",
    [workspaceId, JSON.stringify(sampleState())],
  );
  await db.query(
    "INSERT INTO memory_records(id,workspace_id,record_type,payload,payload_hash,summary,event_at,recorded_at,status,error) VALUES($1,$2,'lesson',$3,$4,'Synthetic recovery lesson',$5,$6,'needs_review','Submission response interrupted')",
    [
      recordId,
      workspaceId,
      JSON.stringify(payload),
      hash(payload),
      envelope.eventAt,
      envelope.recordedAt,
    ],
  );
  await db.query(
    "INSERT INTO jobs(id,workspace_id,kind,payload,status,error,result) VALUES($1,$2,'memory_publish',$3,'needs_review','Submission response interrupted',$4)",
    [
      jobId,
      workspaceId,
      JSON.stringify({ recordId }),
      JSON.stringify({ priorAttempt: true }),
    ],
  );
  const remote = {
    job_id: remoteJobId,
    namespace: scope,
    status: "done" as string,
    blob_id: "synthetic-blob-" + recordId,
  };
  const remember = vi.fn();
  const destroy = vi.fn();
  const adapter = new MemoryAdapter();
  vi.spyOn(adapter, "create").mockReturnValue({
    getRememberStatus: vi.fn(async () => remote),
    remember,
    destroy,
  } as any);
  const recall = vi.spyOn(adapter, "recall").mockImplementation(async () => ({
    records: [envelope],
    outcomes: [],
    historyHash: hash([]),
    verifiedAt: new Date().toISOString(),
  }));
  const request = { workspaceId, recordId, remoteJobId };
  const read = async () =>
    (await db.query("SELECT * FROM memory_records WHERE id=$1", [recordId]))
      .rows[0];
  return {
    workspaceId,
    recordId,
    jobId,
    remoteJobId,
    envelope,
    remote,
    adapter,
    recall,
    request,
    read,
    remember,
    destroy,
  };
}

describe("explicit existing-job memory recovery", () => {
  it("inspects without mutation, then atomically recovers with preserved evidence and no resubmission", async () => {
    const f = await fixture();
    const before = await f.read();
    expect(await recoverMemory(db, f.adapter, f.request)).toMatchObject({
      contentVerified: true,
      applied: false,
    });
    expect(await f.read()).toEqual(before);
    expect(
      (
        await db.query("SELECT * FROM audit WHERE workspace_id=$1", [
          f.workspaceId,
        ])
      ).rows,
    ).toHaveLength(0);

    expect(
      await recoverMemory(db, f.adapter, { ...f.request, apply: true }),
    ).toMatchObject({
      contentVerified: true,
      localStatus: "verified",
      applied: true,
    });
    expect(await f.read()).toMatchObject({
      status: "verified",
      remote_job_id: f.remoteJobId,
      blob_id: f.remote.blob_id,
      error: null,
    });
    const job = (await db.query("SELECT * FROM jobs WHERE id=$1", [f.jobId]))
      .rows[0];
    expect(job).toMatchObject({
      status: "done",
      error: null,
      result: { recovered: true },
    });
    const events = (
      await db.query("SELECT * FROM audit WHERE workspace_id=$1", [
        f.workspaceId,
      ])
    ).rows;
    expect(events).toHaveLength(1);
    expect(events[0].details.previous).toMatchObject({
      status: "needs_review",
      error: "Submission response interrupted",
      jobs: [
        { id: f.jobId, status: "needs_review", result: { priorAttempt: true } },
      ],
    });
    // Consent and server publication remain disabled; recovering existing content is a read, not a new publication.
    const workspace = (
      await db.query("SELECT * FROM workspaces WHERE id=$1", [f.workspaceId])
    ).rows[0];
    expect(workspace.data.consent).toBe(false);
    expect(workspace.state_version).toBe(1);
    await recoverMemory(db, f.adapter, { ...f.request, apply: true });
    expect(
      (
        await db.query("SELECT * FROM audit WHERE workspace_id=$1", [
          f.workspaceId,
        ])
      ).rows,
    ).toHaveLength(1);
    expect(f.remember).not.toHaveBeenCalled();
    expect(f.destroy).toHaveBeenCalledTimes(3);
  });

  it("requires the matching workspace and existing job and refuses replacement", async () => {
    const f = await fixture();
    await expect(
      recoverMemory(db, f.adapter, { ...f.request, workspaceId: id() }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      recoverMemory(db, f.adapter, { ...f.request, remoteJobId: undefined }),
    ).rejects.toMatchObject({ code: "JOB_REQUIRED" });
    await db.query("UPDATE memory_records SET remote_job_id=$1 WHERE id=$2", [
      id(),
      f.recordId,
    ]);
    await expect(recoverMemory(db, f.adapter, f.request)).rejects.toMatchObject(
      { code: "JOB_CONFLICT" },
    );
    expect(f.adapter.create).not.toHaveBeenCalled();
  });

  it.each(["pending", "running", "uploaded", "failed", "not_found"])(
    "preserves local evidence when the remote job is %s",
    async (status) => {
      const f = await fixture();
      f.remote.status = status;
      const before = await f.read();
      expect(await recoverMemory(db, f.adapter, f.request)).toMatchObject({
        remoteStatus: status,
        contentVerified: false,
        applied: false,
      });
      await expect(
        recoverMemory(db, f.adapter, { ...f.request, apply: true }),
      ).rejects.toMatchObject({ code: "REMOTE_NOT_COMPLETE" });
      expect(await f.read()).toEqual(before);
      expect(f.recall).not.toHaveBeenCalled();
      expect(f.remember).not.toHaveBeenCalled();
    },
  );

  it.each(["job", "namespace", "blob", "content", "metadata"])(
    "rejects mismatched %s evidence without changing the record",
    async (field) => {
      const f = await fixture();
      const before = await f.read();
      if (field === "job") f.remote.job_id = id();
      if (field === "namespace") f.remote.namespace = namespace(id());
      if (field === "blob") f.remote.blob_id = "";
      if (field === "content") f.envelope.payload.lesson = "Changed content";
      if (field === "metadata") f.envelope.eventAt = "2026-10-20";
      await expect(
        recoverMemory(db, f.adapter, { ...f.request, apply: true }),
      ).rejects.toBeInstanceOf(Error);
      expect(await f.read()).toEqual(before);
      expect(f.remember).not.toHaveBeenCalled();
    },
  );

  it("detects a concurrent record change after remote verification", async () => {
    const f = await fixture();
    f.recall.mockImplementationOnce(async () => {
      await db.query(
        "UPDATE memory_records SET error='Concurrent worker updated this record' WHERE id=$1",
        [f.recordId],
      );
      return {
        records: [f.envelope],
        outcomes: [],
        historyHash: hash([]),
        verifiedAt: new Date().toISOString(),
      };
    });
    await expect(
      recoverMemory(db, f.adapter, { ...f.request, apply: true }),
    ).rejects.toMatchObject({ code: "RECOVERY_CONFLICT" });
    expect(await f.read()).toMatchObject({
      status: "needs_review",
      remote_job_id: null,
      error: "Concurrent worker updated this record",
    });
  });

  it("refuses to finalize while a worker owns a running job", async () => {
    const f = await fixture();
    await db.query(
      "UPDATE jobs SET status='running',lease_owner='other-worker',lease_until=now()+interval '20 minutes' WHERE id=$1",
      [f.jobId],
    );
    await expect(
      recoverMemory(db, f.adapter, { ...f.request, apply: true }),
    ).rejects.toMatchObject({ code: "RECOVERY_BUSY" });
    expect(await f.read()).toMatchObject({
      status: "needs_review",
      remote_job_id: null,
    });
  });

  it.each(["sample", "live_exercise"])(
    "refuses recovery in a %s workspace",
    async (kind) => {
      const f = await fixture();
      await db.query("UPDATE workspaces SET kind=$1 WHERE id=$2", [
        kind,
        f.workspaceId,
      ]);
      await expect(
        recoverMemory(db, f.adapter, f.request),
      ).rejects.toMatchObject({ code: "RECOVERY_DISABLED" });
      expect(f.adapter.create).not.toHaveBeenCalled();
    },
  );

  it("does not create a publication for an unsubmitted local record", async () => {
    const f = await fixture();
    await db.query("UPDATE memory_records SET status='local' WHERE id=$1", [
      f.recordId,
    ]);
    await expect(recoverMemory(db, f.adapter, f.request)).rejects.toMatchObject(
      { code: "NOT_SUBMITTED" },
    );
    expect(f.adapter.create).not.toHaveBeenCalled();
  });

  it("requires the manifest record type during actual adapter recall", async () => {
    const f = await fixture();
    const adapter = new MemoryAdapter();
    const recall = vi.fn(async () => ({
      results: [
        {
          blob_id: f.remote.blob_id,
          text: encodeMemory("Synthetic lesson", {
            ...f.envelope,
            recordType: "outcome",
          }),
        },
      ],
    }));
    vi.spyOn(adapter, "create").mockReturnValue({
      recall,
      destroy: vi.fn(),
    } as any);
    await expect(
      adapter.recall(f.workspaceId, [
        {
          id: f.recordId,
          record_type: "lesson",
          payload_hash: f.envelope.payloadHash,
          blob_id: f.remote.blob_id,
        },
      ]),
    ).rejects.toMatchObject({ code: "HISTORY_INCOMPLETE" });
  });
});
