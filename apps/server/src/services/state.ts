import { randomUUID, createHash } from "node:crypto";
import {
  canonical,
  addDays,
  localDate,
  normalizeInput,
  type Account,
  type Client,
  type Expense,
  type Invoice,
  type Outcome,
  type Policy,
  type PlanningInput,
} from "../../../../packages/domain/src/index.js";
import {
  hero,
  FIXTURE_CLOCK,
} from "../../../../packages/fixtures/src/index.js";
import type { SQL } from "../db/index.js";
import { config } from "../config.js";
export interface State {
  accounts: Account[];
  clients: Client[];
  invoices: Invoice[];
  expenses: Expense[];
  outcomes: Outcome[];
  policy: Policy;
  consent: boolean;
  clock?: string;
  pendingAtomic: string;
  onboardingComplete: boolean;
}
export interface Workspace {
  id: string;
  wallet_address: string | null;
  kind: "sample" | "personal" | "live_exercise";
  state_version: number;
  data: State;
}
export const id = () => randomUUID();
export const hash = (v: unknown) =>
  createHash("sha256")
    .update(typeof v === "string" ? v : canonical(v))
    .digest("hex");
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function emptyState(wallet?: string): State {
  return {
    accounts: wallet
      ? [
          {
            id: id(),
            alias: "Sui wallet",
            kind: "sui",
            address: wallet,
            amountAtomic: "0",
            included: true,
            confirmedAt: "1970-01-01T00:00:00.000Z",
            version: 1,
            source: "unverified",
          },
        ]
      : [],
    clients: [],
    invoices: [],
    expenses: [],
    outcomes: [],
    policy: {
      reserveAtomic: "100000000",
      horizonDays: 14,
      timezone: "Africa/Lagos",
      version: 1,
    },
    consent: false,
    pendingAtomic: "0",
    onboardingComplete: false,
  };
}
export function sampleState(): State {
  return {
    ...hero(),
    consent: false,
    clock: FIXTURE_CLOCK,
    pendingAtomic: "0",
    onboardingComplete: true,
  };
}
export async function load(
  tx: SQL,
  workspaceId: string,
  lock = false,
): Promise<Workspace> {
  const row = (
    await tx.query<Workspace>(
      "SELECT * FROM workspaces WHERE id=$1" + (lock ? " FOR UPDATE" : ""),
      [workspaceId],
    )
  ).rows[0];
  if (!row)
    throw new AppError(
      401,
      "SESSION_EXPIRED",
      "Your session expired. Sign in again.",
    );
  return row;
}
export async function save(tx: SQL, w: Workspace) {
  w.state_version++;
  await tx.query("UPDATE workspaces SET data=$1,state_version=$2 WHERE id=$3", [
    JSON.stringify(w.data),
    w.state_version,
    w.id,
  ]);
}
export function checkVersion(w: Workspace, expected: number) {
  if (expected !== w.state_version)
    throw new AppError(
      409,
      "STATE_CONFLICT",
      "Your numbers changed. Review the updated plan.",
    );
}
export function find<T extends { id: string }>(list: T[], entityId: string): T {
  const row = list.find((x) => x.id === entityId);
  if (!row)
    throw new AppError(
      404,
      "NOT_FOUND",
      "This record is not in your workspace.",
    );
  return row;
}
export async function audit(
  tx: SQL,
  w: Workspace,
  kind: string,
  summary: string,
  details: unknown = {},
) {
  await tx.query(
    "INSERT INTO audit(id,workspace_id,kind,summary,details) VALUES($1,$2,$3,$4,$5)",
    [id(), w.id, kind, summary, JSON.stringify(details)],
  );
}
export async function queueJob(
  tx: SQL,
  w: Workspace,
  kind: string,
  payload: unknown,
) {
  const jobId = id();
  await tx.query(
    "INSERT INTO jobs(id,workspace_id,kind,payload) VALUES($1,$2,$3,$4)",
    [jobId, w.id, kind, JSON.stringify(payload)],
  );
  return jobId;
}
export async function memory(
  tx: SQL,
  w: Workspace,
  type: string,
  payload: unknown,
  summary: string,
  eventAt: string,
  supersedesId?: string,
) {
  const recordId = id();
  const publish = w.kind !== "sample" && w.data.consent && config.memoryWrites;
  await tx.query(
    "INSERT INTO memory_records(id,workspace_id,record_type,payload,payload_hash,summary,event_at,supersedes_id,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [
      recordId,
      w.id,
      type,
      JSON.stringify(payload),
      hash(payload),
      summary,
      eventAt,
      supersedesId || null,
      publish ? "queued" : "local",
    ],
  );
  if (publish) await queueJob(tx, w, "memory_publish", { recordId });
  return recordId;
}
export function planningInput(w: Workspace): PlanningInput {
  const asOf = w.data.clock || new Date().toISOString(),
    today = localDate(asOf, w.data.policy.timezone);
  return {
    stateVersion: w.state_version,
    asOf,
    localToday: today,
    horizonEnd: addDays(today, w.data.policy.horizonDays - 1),
    timezone: w.data.policy.timezone,
    confirmedFundsAtomic: w.data.accounts
      .filter((a) => a.included)
      .reduce((s, a) => s + BigInt(a.amountAtomic), 0n)
      .toString(),
    reserveFloorAtomic: w.data.policy.reserveAtomic,
    pendingAtomic: w.data.pendingAtomic,
    expenses: w.data.expenses,
    invoices: w.data.invoices,
  };
}
export function inputHash(input: PlanningInput) {
  return hash(normalizeInput(input));
}
export function freshness(w: Workspace) {
  if (
    w.data.accounts.some(
      (a) =>
        a.included &&
        (a.reconciliationPending ||
          (a.kind === "sui" &&
            Date.now() - Date.parse(a.confirmedAt) > 300000)),
    )
  )
    return "stale" as const;
  return "fresh" as const;
}
