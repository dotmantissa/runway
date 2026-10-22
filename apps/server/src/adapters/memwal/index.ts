import { MemWal } from "@mysten-incubation/memwal";
import { z } from "zod";
import {
  canonical,
  normalizeHistory,
  type Outcome,
} from "../../../../../packages/domain/src/index.js";
import { config } from "../../config.js";
import { date, atomic } from "../../../../../packages/contracts/src/index.js";
import { AppError, hash } from "../../services/state.js";
const envelopeSchema = z.object({
  schemaVersion: z.literal(1),
  recordId: z.string(),
  recordType: z.string(),
  workspaceScopeAlias: z.string(),
  recordedAt: z.iso.datetime(),
  eventAt: date,
  payloadHash: z.string().length(64),
  payload: z.unknown(),
  supersedesId: z.string().optional(),
});
export type Envelope = z.infer<typeof envelopeSchema>;
export interface ManifestRecord {
  id: string;
  record_type: string;
  payload_hash: string;
  blob_id: string | null;
}
export function namespace(workspaceId: string) {
  return "runway-" + hash(workspaceId).slice(0, 24);
}
export function encodeMemory(summary: string, envelope: Envelope) {
  return `${summary}\n<runway-memory>\n${canonical(envelope)}\n</runway-memory>`;
}
export function decodeMemory(text: string): Envelope {
  const m = text.match(/<runway-memory>\s*([\s\S]*?)\s*<\/runway-memory>/);
  if (!m) throw new Error("No structured memory envelope.");
  const value = envelopeSchema.parse(JSON.parse(m[1]));
  if (hash(value.payload) !== value.payloadHash)
    throw new Error("Memory content hash mismatch.");
  return value;
}
export class MemoryAdapter {
  create(scope: string) {
    if (!config.memoryKey || !config.memoryAccount)
      throw new AppError(
        503,
        "MEMORY_UNCONFIGURED",
        "Walrus Memory needs its delegate and account configuration.",
      );
    return MemWal.create({
      key: config.memoryKey,
      accountId: config.memoryAccount,
      serverUrl: config.memoryUrl,
      namespace: scope,
      requestTimeoutMs: 20000,
      recallTimeoutMs: 20000,
    });
  }
  async recall(
    workspaceId: string,
    manifest: ManifestRecord[],
  ): Promise<{
    outcomes: Outcome[];
    historyHash: string;
    records: Envelope[];
    verifiedAt: string;
  }> {
    if (manifest.length > 30)
      throw new AppError(
        422,
        "HISTORY_LIMIT",
        "This workspace has more than 30 required memory records. Select a bounded history before continuing.",
      );
    if (!manifest.length)
      return {
        outcomes: [],
        historyHash: hash([]),
        records: [],
        verifiedAt: new Date().toISOString(),
      };
    const scope = namespace(workspaceId),
      client = this.create(scope),
      found = new Map<string, Envelope>();
    try {
      // Exact logical IDs and content hashes are required; semantic ranking never establishes completeness.
      const queries = [
        "Runway payment outcomes corrections client policy",
        ...manifest.map((m) => `Runway record ${m.id}`),
      ];
      const deadline = Date.now() + 60000;
      for (const query of queries) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) break;
        const result = await client.recall({
          query,
          namespace: scope,
          limit: Math.min(100, Math.max(10, manifest.length * 2)),
          timeoutMs: Math.min(15000, remaining),
        });
        for (const hit of result.results) {
          try {
            const e = decodeMemory(hit.text),
              expected = manifest.find((m) => m.id === e.recordId);
            if (
              expected &&
              e.workspaceScopeAlias === scope &&
              expected.payload_hash === e.payloadHash &&
              (!expected.blob_id || expected.blob_id === hit.blob_id)
            )
              found.set(e.recordId, e);
          } catch {
            /* Unrelated or invalid content is never trusted. */
          }
        }
        if (found.size === manifest.length) break;
      }
      if (found.size !== manifest.length)
        throw new AppError(
          503,
          "HISTORY_INCOMPLETE",
          `History is incomplete. Retrieved ${found.size} of ${manifest.length} required records.`,
        );
      const records = [...found.values()];
      const outcomes = records
        .filter((r) => r.recordType === "outcome")
        .map((r) => r.payload as Outcome);
      const outcome = z.object({
        id: z.string(),
        invoiceId: z.string(),
        clientId: z.string(),
        dueDate: date,
        paidDate: date,
        amountAtomic: atomic,
        source: z.enum([
          "tatum_verified",
          "user_confirmed",
          "synthetic_replay",
        ]),
        recordedAt: z.iso.datetime(),
        supersedesId: z.string().optional(),
        receiptDigest: z.string().optional(),
      });
      outcomes.forEach((o) => outcome.parse(o));
      return {
        outcomes,
        records,
        historyHash: hash(normalizeHistory(outcomes)),
        verifiedAt: new Date().toISOString(),
      };
    } finally {
      client.destroy();
    }
  }
}
