import Fastify, { type FastifyRequest, type FastifyReply } from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import staticFiles from "@fastify/static";
import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { parse } from "csv-parse/sync";
import { Database, type SQL } from "./db/index.js";
import { config } from "./config.js";
import * as dto from "../../../packages/contracts/src/index.js";
import {
  plan,
  timing,
  canonical,
  normalizeHistory,
  parseMoney,
  localDate,
  type Outcome,
  type PlanResult,
} from "../../../packages/domain/src/index.js";
import {
  AppError,
  id,
  hash,
  load,
  save,
  audit,
  find,
  queueJob,
  memory,
  planningInput,
  inputHash,
  checkVersion,
  emptyState,
  sampleState,
  freshness,
  type Workspace,
} from "./services/state.js";
import { MemoryAdapter } from "./adapters/memwal/index.js";
import { TatumAdapter, type ChainAdapter } from "./adapters/tatum/index.js";
import { explain } from "./adapters/llm/index.js";
import { runJobs } from "./jobs.js";
import { scheduledJobs } from "./scheduled-jobs.js";

type Session = { workspace_id: string; csrf: string; token_hash: string };
const API = "/api/v1";
const receiptInput = z.object({
  digest: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{43,44}$/),
  expectedStateVersion: dto.version,
});
const clientInput = z.object({
  alias: dto.name,
  sender: dto.address.optional(),
  expectedStateVersion: dto.version,
});
const manualInput = z.object({
  alias: dto.name,
  amountAtomic: dto.atomic,
  expectedStateVersion: dto.version,
});
const correctionInput = z.object({
  clientId: dto.name,
  paidDate: dto.date,
  dueDate: dto.date,
  reason: z.string().trim().min(3).max(300),
  expectedStateVersion: dto.version,
});

export async function createApp(
  options: {
    db?: Database;
    chain?: ChainAdapter;
    worker?: boolean;
    serveStatic?: boolean;
    background?: (operation: Promise<unknown>) => void;
  } = {},
) {
  const db = options.db || new Database();
  await db.initialize();
  const chain = options.chain || new TatumAdapter(),
    mem = new MemoryAdapter();
  const drainJobs = scheduledJobs(db, chain, mem);
  const app = Fastify({
    logger: false,
    bodyLimit: 300000,
    requestIdHeader: false,
  });
  await app.register(cookie);
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
  const sessions = new WeakMap<FastifyRequest, Session>();
  app.addHook("onSend", async (req, reply, payload) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header("X-Frame-Options", "DENY");
    if (req.url.startsWith("/api/")) reply.header("Cache-Control", "no-store");
    return payload;
  });
  const data = (req: FastifyRequest, value: unknown) => ({
    ...(value as object),
    requestId: req.id,
  });
  app.setErrorHandler((e, req, reply) => {
    const validation = e instanceof z.ZodError;
    const status =
      e instanceof AppError
        ? e.status
        : validation
          ? 400
          : e.statusCode && e.statusCode < 500
            ? e.statusCode
            : 500;
    reply.code(status).send({
      error: {
        code:
          e instanceof AppError
            ? e.code
            : validation
              ? "INVALID_INPUT"
              : status === 429
                ? "RATE_LIMIT"
                : "REQUEST_FAILED",
        message:
          e instanceof AppError
            ? e.message
            : validation
              ? "Check the highlighted fields and try again."
              : status === 500
                ? "We could not complete this request. Try again."
                : e.message,
        fieldErrors: validation
          ? e.issues.map((i) => ({
              field: i.path.join("."),
              message: i.message,
            }))
          : [],
        retryable: status >= 500,
      },
      requestId: req.id,
    });
  });
  app.addHook("preHandler", async (req) => {
    if (!req.url.startsWith(API)) return;
    const path = req.url.split("?")[0];
    if (path === API + "/internal/jobs") {
      const supplied = Buffer.from(req.headers.authorization || "");
      const expected = Buffer.from("Bearer " + config.cronSecret);
      if (
        !config.cronSecret ||
        supplied.length !== expected.length ||
        !timingSafeEqual(supplied, expected)
      )
        throw new AppError(
          401,
          "JOB_AUTH",
          "Background processing requires its service credential.",
        );
      return;
    }
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin !== config.origin
    )
      throw new AppError(
        403,
        "ORIGIN",
        "Open Runway from its configured address before continuing.",
      );
    if (
      path.startsWith(API + "/health/") ||
      path === API + "/evidence" ||
      [
        API + "/demo/session",
        API + "/auth/challenge",
        API + "/auth/verify",
      ].includes(path)
    )
      return;
    const token = req.cookies.runway;
    if (!token)
      throw new AppError(
        401,
        "SESSION_EXPIRED",
        "Your session expired. Sign in again.",
      );
    const result = await db.query<Session>(
      "SELECT s.workspace_id,s.csrf,s.token_hash FROM sessions s JOIN workspaces w ON w.id=s.workspace_id WHERE s.token_hash=$1 AND s.expires_at>now() AND s.last_seen_at>now()-interval '2 hours' AND (w.expires_at IS NULL OR w.expires_at>now())",
      [hash(token)],
    );
    const session = result.rows[0];
    if (!session)
      throw new AppError(
        401,
        "SESSION_EXPIRED",
        "Your session expired. Sign in again.",
      );
    if (
      !["GET", "HEAD"].includes(req.method) &&
      req.headers["x-csrf-token"] !== session.csrf
    )
      throw new AppError(403, "CSRF", "Refresh this view before saving.");
    sessions.set(req, session);
    await db.query(
      "UPDATE sessions SET last_seen_at=now() WHERE token_hash=$1",
      [session.token_hash],
    );
  });
  const scope = (req: FastifyRequest) => sessions.get(req)!.workspace_id;
  const workspace = (req: FastifyRequest) => load(db, scope(req));
  async function issueSession(tx: SQL, w: Workspace, reply: FastifyReply) {
    const token = randomBytes(32).toString("hex"),
      csrf = randomBytes(32).toString("hex");
    await tx.query(
      "INSERT INTO sessions(token_hash,workspace_id,csrf,expires_at) VALUES($1,$2,$3,now()+interval '12 hours')",
      [hash(token), w.id, csrf],
    );
    reply.setCookie("runway", token, {
      httpOnly: true,
      secure: config.production,
      sameSite: "lax",
      path: "/",
      maxAge: 43200,
    });
    return { csrf, kind: w.kind, stateVersion: w.state_version };
  }
  async function command(
    req: FastifyRequest,
    body: unknown,
    fn: (tx: SQL, w: Workspace) => Promise<unknown>,
  ) {
    const key = req.headers["idempotency-key"];
    if (typeof key !== "string" || !/^[\x21-\x7E]{1,128}$/.test(key))
      throw new AppError(
        400,
        "IDEMPOTENCY_KEY",
        "This request needs a valid retry key.",
      );
    const route = req.method + " " + req.url.split("?")[0],
      requestHash = hash(body);
    return db.transaction(async (tx) => {
      const w = await load(tx, scope(req), true);
      const prior = (
        await tx.query(
          "SELECT * FROM idempotency_keys WHERE workspace_id=$1 AND route=$2 AND key=$3",
          [w.id, route, key],
        )
      ).rows[0];
      if (prior) {
        if (prior.request_hash !== requestHash)
          throw new AppError(
            409,
            "RETRY_CONFLICT",
            "That retry key was already used for different changes.",
          );
        return data(req, prior.response);
      }
      const response = await fn(tx, w);
      await tx.query(
        "INSERT INTO idempotency_keys(workspace_id,route,key,request_hash,response) VALUES($1,$2,$3,$4,$5)",
        [w.id, route, key, requestHash, JSON.stringify(response)],
      );
      return data(req, response);
    });
  }
  function version(w: Workspace, b: { expectedStateVersion: number }) {
    checkVersion(w, b.expectedStateVersion);
  }
  async function finish(
    tx: SQL,
    w: Workspace,
    kind: string,
    summary: string,
    details: unknown = {},
  ) {
    await save(tx, w);
    await audit(tx, w, kind, summary, details);
    return { stateVersion: w.state_version };
  }
  async function seed(tx: SQL, w: Workspace) {
    for (const o of w.data.outcomes)
      await memory(
        tx,
        w,
        "outcome",
        o,
        "Cedar Studio payment outcome, synthetic example.",
        o.paidDate,
      );
    await memory(
      tx,
      w,
      "policy",
      w.data.policy,
      "Reserve rule, synthetic example.",
      "2026-10-29",
    );
  }
  app.get(API + "/health/live", async () => ({ status: "alive" }));
  app.get(API + "/health/ready", async () => {
    await db.query("SELECT 1");
    const migrations = (
      await db.query("SELECT max(version)::int AS version FROM migrations")
    ).rows[0].version;
    if (config.production && config.jobMode === "inline") {
      const heartbeat = (
        await db.query(
          "SELECT 1 FROM worker_heartbeats WHERE seen_at>now()-interval '30 seconds' LIMIT 1",
        )
      ).rows.length;
      if (!heartbeat)
        throw new AppError(
          503,
          "WORKER_UNAVAILABLE",
          "Background processing is unavailable.",
        );
    }
    return { status: "ready", database: db.mode, migrations };
  });
  app.get(API + "/internal/jobs", async () => ({
    processed: await drainJobs(),
  }));
  if (options.background)
    app.addHook("onResponse", async (req, reply) => {
      const path = req.url.split("?")[0];
      if (
        reply.statusCode < 400 &&
        path.startsWith(API) &&
        !path.startsWith(API + "/health/") &&
        path !== API + "/internal/jobs"
      )
        options.background!(drainJobs().catch(() => {}));
    });
  app.get(API + "/evidence", async (req) => {
    const read = (file: string) => {
      try {
        return JSON.parse(readFileSync(resolve("docs", file), "utf8"));
      } catch {
        return { state: "not_verified" };
      }
    };
    return data(req, {
      tatum: read("tatum-gate.json"),
      memory: read("memory-gate.json"),
      comparison: read("comparison.json"),
      completedMainnetRecords:
        read("memory-manifest.json").records?.filter(
          (r: any) => r.status === "verified",
        ).length || 0,
    });
  });
  app.post(
    API + "/demo/session",
    { config: { rateLimit: { max: 12, timeWindow: "1 minute" } } },
    async (req, reply) => {
      z.object({ fixtureId: z.literal("hero").optional() }).parse(
        req.body || {},
      );
      return db.transaction(async (tx) => {
        const w: Workspace = {
          id: id(),
          wallet_address: null,
          kind: "sample",
          state_version: 1,
          data: sampleState(),
        };
        await tx.query(
          "INSERT INTO workspaces(id,kind,data,expires_at) VALUES($1,$2,$3,now()+interval '24 hours')",
          [w.id, w.kind, JSON.stringify(w.data)],
        );
        if (req.cookies.runway)
          await tx.query("DELETE FROM sessions WHERE token_hash=$1", [
            hash(req.cookies.runway),
          ]);
        await seed(tx, w);
        return data(req, await issueSession(tx, w, reply));
      });
    },
  );
  app.post(
    API + "/auth/challenge",
    { config: { rateLimit: { max: 12, timeWindow: "1 minute" } } },
    async (req) => {
      const b = z
          .object({ address: dto.address, network: z.literal("mainnet") })
          .parse(req.body),
        challengeId = id(),
        expiresAt = new Date(Date.now() + 300000).toISOString();
      const message = `Sign in to Runway\nOrigin: ${config.origin}\nWallet: ${b.address}\nNetwork: mainnet\nIssued: ${new Date().toISOString()}\nExpires: ${expiresAt}\nNonce: ${randomBytes(32).toString("hex")}\nThis signs you in. It does not move funds.`;
      await db.query(
        "INSERT INTO challenges(id,wallet_address,message,expires_at) VALUES($1,$2,$3,$4)",
        [challengeId, b.address, message, expiresAt],
      );
      return data(req, { challengeId, message, expiresAt });
    },
  );
  app.post(API + "/auth/verify", async (req, reply) => {
    const b = z
      .object({
        challengeId: dto.name,
        bytes: z.string().max(3000),
        signature: z.string().max(3000),
      })
      .parse(req.body);
    const challenge = (
      await db.query(
        "SELECT * FROM challenges WHERE id=$1 AND used=false AND expires_at>now()",
        [b.challengeId],
      )
    ).rows[0];
    if (
      !challenge ||
      Buffer.from(b.bytes, "base64").toString("utf8") !== challenge.message
    )
      throw new AppError(
        401,
        "INVALID_CHALLENGE",
        "This sign-in request expired or does not match. Try again.",
      );
    try {
      await verifyPersonalMessageSignature(
        new TextEncoder().encode(challenge.message),
        b.signature,
        { address: challenge.wallet_address },
      );
    } catch {
      throw new AppError(
        401,
        "SIGNATURE_UNSUPPORTED",
        "We could not verify this wallet signature. Try another supported Sui wallet or open the example.",
      );
    }
    return db.transaction(async (tx) => {
      const consumed = (
        await tx.query(
          "UPDATE challenges SET used=true WHERE id=$1 AND used=false AND expires_at>now() RETURNING id",
          [b.challengeId],
        )
      ).rows[0];
      if (!consumed)
        throw new AppError(
          401,
          "NONCE_USED",
          "This sign-in request was already used. Try again.",
        );
      await tx.query(
        "INSERT INTO workspaces(id,wallet_address,kind,data) VALUES($1,$2,$3,$4) ON CONFLICT(wallet_address) DO NOTHING",
        [
          id(),
          challenge.wallet_address,
          "personal",
          JSON.stringify(emptyState(challenge.wallet_address)),
        ],
      );
      const w = (
        await tx.query<Workspace>(
          "SELECT * FROM workspaces WHERE wallet_address=$1",
          [challenge.wallet_address],
        )
      ).rows[0];
      if (req.cookies.runway)
        await tx.query("DELETE FROM sessions WHERE token_hash=$1", [
          hash(req.cookies.runway),
        ]);
      return data(req, await issueSession(tx, w, reply));
    });
  });
  app.post(API + "/auth/logout", async (req, reply) => {
    await db.query("DELETE FROM sessions WHERE token_hash=$1", [
      sessions.get(req)!.token_hash,
    ]);
    reply.clearCookie("runway", { path: "/" });
    return data(req, { signedOut: true });
  });
  app.get(API + "/bootstrap", async (req) => {
    const w = await workspace(req);
    return data(req, {
      workspace: { id: w.id, kind: w.kind, address: w.wallet_address },
      state: w.data,
      stateVersion: w.state_version,
      asOf: w.data.clock || new Date().toISOString(),
      csrf: sessions.get(req)!.csrf,
      capabilities: {
        tatum: !!config.tatumKey,
        memory: !!config.memoryKey && !!config.memoryAccount,
        memoryWrites: config.memoryWrites,
        automaticDiscovery: false,
      },
      freshness: freshness(w),
    });
  });
  app.get(API + "/overview", async (req) => {
    const w = await workspace(req);
    return data(req, {
      result: plan(planningInput(w), [], "no_receipt", "none"),
      stateVersion: w.state_version,
      asOf: w.data.clock || new Date().toISOString(),
      freshness: freshness(w),
    });
  });
  app.post(API + "/demo/reset", async (req) =>
    command(req, req.body, async (tx, w) => {
      if (w.kind !== "sample")
        throw new AppError(
          403,
          "SAMPLE_ONLY",
          "Only the example workspace can be reset.",
        );
      version(
        w,
        z.object({ expectedStateVersion: dto.version }).parse(req.body),
      );
      w.data = sampleState();
      await tx.query("DELETE FROM payment_events WHERE workspace_id=$1", [
        w.id,
      ]);
      await tx.query("DELETE FROM memory_records WHERE workspace_id=$1", [
        w.id,
      ]);
      await seed(tx, w);
      return finish(tx, w, "reset", "Example restored.");
    }),
  );
  for (const list of [
    "accounts",
    "clients",
    "invoices",
    "expenses",
    "outcomes",
  ] as const)
    app.get(API + "/" + list, async (req) => {
      const w = await workspace(req);
      return data(req, { items: w.data[list], stateVersion: w.state_version });
    });
  app.get(API + "/policy", async (req) => {
    const w = await workspace(req);
    return data(req, { policy: w.data.policy, stateVersion: w.state_version });
  });
  app.post(API + "/accounts/manual", async (req) => {
    const b = manualInput.parse(req.body);
    return command(req, b, async (tx, w) => {
      version(w, b);
      if (w.data.accounts.length >= 8)
        throw new AppError(
          422,
          "ACCOUNT_LIMIT",
          "This workspace supports up to eight included accounts.",
        );
      const row = {
        id: id(),
        alias: b.alias,
        kind: "manual" as const,
        amountAtomic: b.amountAtomic,
        included: true,
        confirmedAt: new Date().toISOString(),
        version: 1,
        source: "user_confirmed" as const,
      };
      w.data.accounts.push(row);
      return {
        ...(await finish(tx, w, "account", "Confirmed funds saved.")),
        account: row,
      };
    });
  });
  app.patch(API + "/accounts/:id", async (req) => {
    const b = z
      .object({
        alias: dto.name.optional(),
        included: z.boolean().optional(),
        amountAtomic: dto.atomic.optional(),
        expectedVersion: dto.version,
        expectedStateVersion: dto.version,
      })
      .parse(req.body);
    return command(req, b, async (tx, w) => {
      version(w, b);
      const a = find(w.data.accounts, (req.params as any).id);
      if (a.version !== b.expectedVersion)
        throw new AppError(
          409,
          "STATE_CONFLICT",
          "This account changed. Refresh before saving.",
        );
      if (a.kind === "sui" && b.amountAtomic !== undefined)
        throw new AppError(
          422,
          "CHAIN_BALANCE",
          "Refresh this wallet to verify its balance through Tatum.",
        );
      if (b.alias !== undefined) a.alias = b.alias;
      if (b.included !== undefined) a.included = b.included;
      if (b.amountAtomic !== undefined) {
        a.amountAtomic = b.amountAtomic;
        a.confirmedAt = new Date().toISOString();
        a.reconciliationPending = false;
      }
      a.version++;
      return finish(tx, w, "account", "Included funds updated.");
    });
  });
  app.post(API + "/accounts/:id/refresh", async (req, reply) => {
    const b = z.object({ expectedStateVersion: dto.version }).parse(req.body);
    const value = await command(req, b, async (tx, w) => {
      version(w, b);
      const a = find(w.data.accounts, (req.params as any).id);
      if (a.kind !== "sui")
        throw new AppError(
          422,
          "MANUAL_ACCOUNT",
          "Confirm this amount manually.",
        );
      return { jobId: await queueJob(tx, w, "balance", { accountId: a.id }) };
    });
    return reply.code(202).send(value);
  });
  app.post(API + "/clients", async (req) => {
    const b = clientInput.parse(req.body);
    return command(req, b, async (tx, w) => {
      version(w, b);
      if (w.data.clients.length >= 50)
        throw new AppError(
          422,
          "CLIENT_LIMIT",
          "This workspace supports up to 50 clients.",
        );
      if (b.sender && w.data.clients.filter((c) => c.sender).length >= 3)
        throw new AppError(
          422,
          "ADDRESS_LIMIT",
          "This workspace supports three tracked sender addresses.",
        );
      const row = { id: id(), alias: b.alias, sender: b.sender, version: 1 };
      w.data.clients.push(row);
      return {
        ...(await finish(tx, w, "client", "Client saved.")),
        client: row,
      };
    });
  });
  app.post(API + "/invoices", async (req) => {
    const b = dto.invoiceCreate.parse(req.body);
    return command(req, b, async (tx, w) => {
      version(w, b);
      find(w.data.clients, b.clientId);
      if (w.data.invoices.length >= 50)
        throw new AppError(
          422,
          "INVOICE_LIMIT",
          "This workspace supports up to 50 invoices.",
        );
      if (
        w.data.invoices.some(
          (i) =>
            i.invoiceReference === b.invoiceReference &&
            i.clientId === b.clientId,
        )
      )
        throw new AppError(
          409,
          "DUPLICATE_INVOICE",
          "This invoice reference is already saved for this client.",
        );
      const { expectedStateVersion, ...fields } = b,
        row = {
          ...fields,
          id: id(),
          paidAtomic: "0",
          version: 1,
          status: "expected" as const,
        };
      w.data.invoices.push(row);
      await memory(
        tx,
        w,
        "expectation",
        row,
        "Invoice expected: " + row.invoiceReference,
        row.dueDate,
      );
      return {
        ...(await finish(tx, w, "invoice", "Invoice saved.")),
        invoice: row,
      };
    });
  });
  app.get(API + "/invoices/:id", async (req) => {
    const w = await workspace(req),
      invoice = find(w.data.invoices, (req.params as any).id);
    return data(req, {
      invoice,
      client: find(w.data.clients, invoice.clientId),
      timing: timing(w.data.outcomes, invoice.clientId),
      outcomes: w.data.outcomes.filter((o) => o.clientId === invoice.clientId),
      allocations: (
        await db.query(
          "SELECT * FROM allocations WHERE workspace_id=$1 AND invoice_id=$2",
          [w.id, invoice.id],
        )
      ).rows,
      stateVersion: w.state_version,
    });
  });
  app.patch(API + "/invoices/:id", async (req) => {
    const b = dto.invoiceCreate
      .extend({
        expectedVersion: dto.version,
        status: z.enum(["expected", "cancelled"]).optional(),
      })
      .parse(req.body);
    return command(req, b, async (tx, w) => {
      version(w, b);
      const i = find(w.data.invoices, (req.params as any).id);
      find(w.data.clients, b.clientId);
      if (i.version !== b.expectedVersion)
        throw new AppError(
          409,
          "STATE_CONFLICT",
          "This invoice changed. Refresh before saving.",
        );
      if (BigInt(i.paidAtomic) > 0n)
        throw new AppError(
          422,
          "RESOLVED_INVOICE",
          "Correct the recorded payment outcome instead of rewriting a received invoice.",
        );
      if (
        w.data.invoices.some(
          (x) =>
            x.id !== i.id &&
            x.clientId === b.clientId &&
            x.invoiceReference === b.invoiceReference,
        )
      )
        throw new AppError(
          409,
          "DUPLICATE_INVOICE",
          "This invoice reference is already saved.",
        );
      const { expectedVersion, expectedStateVersion, ...fields } = b;
      Object.assign(i, fields, { version: i.version + 1 });
      await memory(
        tx,
        w,
        "expectation_correction",
        i,
        "Invoice expectation corrected.",
        i.dueDate,
      );
      return finish(tx, w, "invoice", "Invoice updated.");
    });
  });
  app.post(API + "/expenses", async (req) => {
    const b = dto.expenseCreate.parse(req.body);
    return command(req, b, async (tx, w) => {
      version(w, b);
      if (w.data.expenses.length >= 8)
        throw new AppError(
          422,
          "EXPENSE_LIMIT",
          "This focused plan supports up to eight expenses.",
        );
      const { expectedStateVersion, ...fields } = b,
        row = { ...fields, id: id(), status: "planned" as const, version: 1 };
      w.data.expenses.push(row);
      await memory(
        tx,
        w,
        "obligation",
        row,
        "Spending rule saved: " + row.label,
        row.dueDate,
      );
      return {
        ...(await finish(tx, w, "expense", "Expense saved.")),
        expense: row,
      };
    });
  });
  app.patch(API + "/expenses/:id", async (req) => {
    const b = dto.expenseCreate
      .and(
        z.object({
          expectedVersion: dto.version,
          status: z.enum(["planned", "paid", "cancelled", "pending"]),
        }),
      )
      .parse(req.body);
    return command(req, b, async (tx, w) => {
      version(w, b);
      const e = find(w.data.expenses, (req.params as any).id);
      if (e.version !== b.expectedVersion)
        throw new AppError(
          409,
          "STATE_CONFLICT",
          "This expense changed. Refresh before saving.",
        );
      if (e.status === "pending" && b.status !== "paid")
        throw new AppError(
          422,
          "PENDING_EXPENSE",
          "A pending expense cannot be reduced or cancelled.",
        );
      if (e.status === "paid")
        throw new AppError(
          422,
          "PAID_EXPENSE",
          "A paid expense cannot be rewritten as a future commitment.",
        );
      if (b.status === "paid")
        w.data.accounts
          .filter((a) => a.included)
          .forEach((a) => (a.reconciliationPending = true));
      const { expectedVersion, expectedStateVersion, ...fields } = b;
      Object.assign(e, fields, { version: e.version + 1 });
      await memory(
        tx,
        w,
        "obligation_correction",
        e,
        "Spending rule corrected: " + e.label,
        e.dueDate,
      );
      return finish(tx, w, "expense", "Expense updated.");
    });
  });
  app.put(API + "/policy", async (req) => {
    const b = dto.policyUpdate.parse(req.body);
    return command(req, b, async (tx, w) => {
      version(w, b);
      const { expectedStateVersion, ...fields } = b;
      w.data.policy = { ...fields, version: w.data.policy.version + 1 };
      await memory(
        tx,
        w,
        "policy",
        w.data.policy,
        "Reserve and planning horizon confirmed.",
        localDate(w.data.clock || new Date().toISOString(), b.timezone),
      );
      return finish(tx, w, "policy", "Spending rules updated.");
    });
  });
  app.post(API + "/invoices/:id/confirm-offchain", async (req) => {
    const b = dto.offchain.parse(req.body);
    return command(req, b, async (tx, w) => {
      version(w, b);
      const i = find(w.data.invoices, (req.params as any).id);
      if (
        ["cancelled", "paid"].includes(i.status) ||
        BigInt(b.amountAtomic) > BigInt(i.amountAtomic) - BigInt(i.paidAtomic)
      )
        throw new AppError(
          422,
          "PAYMENT_AMOUNT",
          "This payment exceeds the remaining invoice amount.",
        );
      if (
        b.paidDate >
        localDate(w.data.clock || new Date().toISOString(), i.timezone)
      )
        throw new AppError(
          422,
          "FUTURE_PAYMENT",
          "A received payment cannot be dated in the future.",
        );
      await tx.query(
        "INSERT INTO payment_events(id,workspace_id,invoice_id,amount_atomic,paid_date,source) VALUES($1,$2,$3,$4,$5,$6)",
        [id(), w.id, i.id, b.amountAtomic, b.paidDate, "user_confirmed"],
      );
      i.paidAtomic = (BigInt(i.paidAtomic) + BigInt(b.amountAtomic)).toString();
      i.status = i.paidAtomic === i.amountAtomic ? "paid" : "partial";
      i.version++;
      w.data.accounts
        .filter((a) => a.included)
        .forEach((a) => (a.reconciliationPending = true));
      if (i.status === "paid") {
        const paidDate = (
          await tx.query(
            "SELECT max(paid_date) AS date FROM payment_events WHERE workspace_id=$1 AND invoice_id=$2",
            [w.id, i.id],
          )
        ).rows[0].date;
        const o: Outcome = {
          id: id(),
          invoiceId: i.id,
          clientId: i.clientId,
          dueDate: i.dueDate,
          paidDate,
          amountAtomic: i.amountAtomic,
          source: "user_confirmed",
          recordedAt: new Date().toISOString(),
        };
        w.data.outcomes.push(o);
        await memory(
          tx,
          w,
          "outcome",
          o,
          "User confirmed invoice payment: " + i.invoiceReference,
          b.paidDate,
        );
      }
      return finish(
        tx,
        w,
        "payment",
        "Offchain payment recorded. Confirm your included funds before relying on the plan.",
      );
    });
  });
  app.post(API + "/outcomes/:id/correct", async (req) => {
    const b = correctionInput.parse(req.body);
    return command(req, b, async (tx, w) => {
      version(w, b);
      const old = find(w.data.outcomes, (req.params as any).id);
      if (w.data.outcomes.some((o) => o.supersedesId === old.id))
        throw new AppError(
          409,
          "SUPERSEDED",
          "This outcome was already corrected. Open its current version.",
        );
      find(w.data.clients, b.clientId);
      if (old.source === "tatum_verified" && b.paidDate !== old.paidDate)
        throw new AppError(
          422,
          "VERIFIED_DATE",
          "The confirmed chain date cannot be changed.",
        );
      if (
        b.paidDate >
        localDate(
          w.data.clock || new Date().toISOString(),
          w.data.policy.timezone,
        )
      )
        throw new AppError(
          422,
          "FUTURE_PAYMENT",
          "A received payment cannot be dated in the future.",
        );
      const row = {
        ...old,
        id: id(),
        supersedesId: old.id,
        clientId: b.clientId,
        paidDate: b.paidDate,
        dueDate: b.dueDate,
        recordedAt: new Date().toISOString(),
      };
      w.data.outcomes.push(row);
      await memory(
        tx,
        w,
        "outcome",
        row,
        "Payment outcome corrected: " + b.reason,
        row.paidDate,
        old.id,
      );
      return {
        ...(await finish(tx, w, "correction", "Payment history corrected.")),
        outcome: row,
      };
    });
  });
  app.post(API + "/plans/preview", async (req) => {
    const b = dto.planPreview.parse(req.body),
      initial = await workspace(req);
    version(initial, b);
    let history = initial.data.outcomes;
    if (b.historyMode === "none") history = [];
    if (b.historyMode === "walrus") {
      const required = (
        await db.query(
          "SELECT id,record_type,payload_hash,blob_id,status FROM memory_records WHERE workspace_id=$1 AND record_type='outcome'",
          [initial.id],
        )
      ).rows;
      if (!required.length || required.some((r) => r.status !== "verified"))
        throw new AppError(
          503,
          "HISTORY_INCOMPLETE",
          "Required payment history has not been stored and retrieved on Mainnet.",
        );
      history = (await mem.recall(initial.id, required)).outcomes;
    }
    return command(req, b, async (tx, w) => {
      version(w, b);
      const input = planningInput(w);
      let result: PlanResult;
      try {
        result = plan(input, history, b.scenario, b.historyMode);
      } catch (e) {
        throw new AppError(422, "HISTORY_REQUIRED", (e as Error).message);
      }
      result.freshness = freshness(w);
      const planId = id(),
        h = inputHash(input);
      await tx.query(
        "INSERT INTO plans(id,workspace_id,state_version,input_hash,history_hash,result,input_snapshot,history_snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          planId,
          w.id,
          w.state_version,
          h,
          hash(normalizeHistory(history)),
          JSON.stringify(result),
          JSON.stringify(input),
          JSON.stringify(history),
        ],
      );
      return {
        id: planId,
        inputHash: h,
        historyHash: hash(normalizeHistory(history)),
        result,
        stateVersion: w.state_version,
      };
    });
  });
  async function getPlan(tx: SQL, w: Workspace, planId: string) {
    const p = (
      await tx.query("SELECT * FROM plans WHERE id=$1 AND workspace_id=$2", [
        planId,
        w.id,
      ])
    ).rows[0];
    if (!p)
      throw new AppError(
        404,
        "NOT_FOUND",
        "This plan is not in your workspace.",
      );
    return p;
  }
  app.get(API + "/plans/:id", async (req) => {
    const w = await workspace(req),
      p = await getPlan(db, w, (req.params as any).id);
    return data(req, {
      ...p,
      current:
        p.state_version === w.state_version &&
        p.input_snapshot.localToday === planningInput(w).localToday,
      stateVersion: w.state_version,
    });
  });
  app.post(API + "/plans/:id/accept", async (req) => {
    const b = dto.planAccept.parse(req.body);
    return command(req, b, async (tx, w) => {
      const p = await getPlan(tx, w, (req.params as any).id);
      if (p.status === "accepted")
        return { accepted: true, stateVersion: w.state_version };
      version(w, b);
      if (
        p.status !== "proposed" ||
        p.state_version !== w.state_version ||
        p.input_hash !== b.currentInputHash ||
        p.input_snapshot.localToday !== planningInput(w).localToday
      )
        throw new AppError(
          409,
          "STATE_CONFLICT",
          "Your numbers changed. Review the updated plan.",
        );
      if (freshness(w) !== "fresh")
        throw new AppError(
          409,
          "STALE_FUNDS",
          "Confirm your included funds before saving these changes.",
        );
      const r = p.result as PlanResult;
      if (!r.feasible || !r.adjustments.length)
        throw new AppError(
          422,
          "NO_ACTION",
          "This plan has no feasible spending change to save.",
        );
      const exact = r.adjustments.map((a) => ({
        expenseId: a.expenseId,
        expectedExpenseVersion: a.expectedExpenseVersion,
        newAmountAtomic: a.newAmountAtomic,
      }));
      if (
        canonical(
          [...b.confirmedAdjustments].sort((a, b) =>
            a.expenseId.localeCompare(b.expenseId),
          ),
        ) !==
        canonical(exact.sort((a, b) => a.expenseId.localeCompare(b.expenseId)))
      )
        throw new AppError(
          422,
          "ACTION_MISMATCH",
          "Review every proposed spending change before saving.",
        );
      for (const a of r.adjustments) {
        const e = find(w.data.expenses, a.expenseId);
        if (
          e.version !== a.expectedExpenseVersion ||
          e.kind !== "flexible" ||
          e.status !== "planned"
        )
          throw new AppError(
            409,
            "STATE_CONFLICT",
            "This spending rule changed. Recalculate the plan.",
          );
        e.amountAtomic = a.newAmountAtomic;
        e.maxReductionAtomic = (
          BigInt(e.maxReductionAtomic) < BigInt(e.amountAtomic)
            ? BigInt(e.maxReductionAtomic)
            : BigInt(e.amountAtomic)
        ).toString();
        if (e.amountAtomic === "0") e.status = "cancelled";
        e.version++;
      }
      await tx.query("UPDATE plans SET status='accepted' WHERE id=$1", [p.id]);
      await memory(
        tx,
        w,
        "accepted_action",
        { planId: p.id, adjustments: r.adjustments },
        "Reviewed spending changes saved.",
        planningInput(w).localToday,
      );
      return {
        ...(await finish(
          tx,
          w,
          "plan",
          "Spending changes saved. No funds moved.",
          { planId: p.id },
        )),
        accepted: true,
      };
    });
  });
  app.post(API + "/plans/:id/reject", async (req) =>
    command(req, req.body, async (tx, w) => {
      const p = await getPlan(tx, w, (req.params as any).id);
      if (p.status === "accepted")
        throw new AppError(
          409,
          "PLAN_ACCEPTED",
          "These spending changes were already saved.",
        );
      await tx.query("UPDATE plans SET status='rejected' WHERE id=$1", [p.id]);
      await audit(tx, w, "plan", "Current plan kept.");
      return { rejected: true, stateVersion: w.state_version };
    }),
  );
  app.post(API + "/plans/:id/explain", async (req) => {
    z.object({ question: z.string().max(500).optional() }).parse(
      req.body || {},
    );
    const w = await workspace(req),
      p = await getPlan(db, w, (req.params as any).id);
    return data(req, {
      ...explain(p.result),
      current: p.state_version === w.state_version,
    });
  });
  app.post(API + "/receipts/verify", async (req, reply) => {
    const b = receiptInput.parse(req.body);
    return reply.code(202).send(
      await command(req, b, async (tx, w) => {
        version(w, b);
        if (w.kind === "sample")
          throw new AppError(
            403,
            "PERSONAL_ONLY",
            "Receipt verification uses your connected wallet.",
          );
        return {
          jobId: await queueJob(tx, w, "receipt", {
            digest: b.digest,
            address: w.wallet_address,
          }),
        };
      }),
    );
  });
  app.get(API + "/receipts/:id", async (req) => {
    const r = (
      await db.query("SELECT * FROM receipts WHERE id=$1 AND workspace_id=$2", [
        (req.params as any).id,
        scope(req),
      ])
    ).rows[0];
    if (!r)
      throw new AppError(
        404,
        "NOT_FOUND",
        "This receipt is not in your workspace.",
      );
    return data(req, { receipt: r });
  });
  app.post(API + "/receipts/:id/allocate", async (req) => {
    const b = z
      .object({
        invoiceId: dto.name,
        amountAtomic: dto.positiveAtomic,
        expectedStateVersion: dto.version,
      })
      .parse(req.body);
    return command(req, b, async (tx, w) => {
      version(w, b);
      const r = (
        await tx.query(
          "SELECT * FROM receipts WHERE id=$1 AND workspace_id=$2 FOR UPDATE",
          [(req.params as any).id, w.id],
        )
      ).rows[0];
      if (!r)
        throw new AppError(
          404,
          "NOT_FOUND",
          "This receipt is not in your workspace.",
        );
      const i = find(w.data.invoices, b.invoiceId);
      if (["paid", "cancelled"].includes(i.status))
        throw new AppError(
          422,
          "INVOICE_CLOSED",
          "Choose an unresolved invoice.",
        );
      const amount = BigInt(b.amountAtomic);
      if (
        amount > BigInt(r.facts.amountAtomic) - BigInt(r.allocated_atomic) ||
        amount > BigInt(i.amountAtomic) - BigInt(i.paidAtomic)
      )
        throw new AppError(
          409,
          "ALLOCATION_LIMIT",
          "The amount exceeds the unallocated receipt or remaining invoice.",
        );
      const client = find(w.data.clients, i.clientId);
      if (client.sender && client.sender !== r.facts.sender)
        throw new AppError(
          422,
          "SENDER_MISMATCH",
          "The receipt sender differs from the sender recorded for this client.",
        );
      if (
        (
          await tx.query(
            "SELECT 1 FROM allocations WHERE receipt_id=$1 AND invoice_id=$2",
            [r.id, i.id],
          )
        ).rows.length
      )
        throw new AppError(
          409,
          "ALREADY_ALLOCATED",
          "This receipt was already allocated to this invoice.",
        );
      await tx.query(
        "INSERT INTO allocations(id,workspace_id,receipt_id,invoice_id,amount_atomic) VALUES($1,$2,$3,$4,$5)",
        [id(), w.id, r.id, i.id, b.amountAtomic],
      );
      await tx.query(
        "UPDATE receipts SET allocated_atomic=allocated_atomic+$1 WHERE id=$2",
        [b.amountAtomic, r.id],
      );
      await tx.query(
        "INSERT INTO payment_events(id,workspace_id,invoice_id,amount_atomic,paid_date,source,receipt_id) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          id(),
          w.id,
          i.id,
          b.amountAtomic,
          localDate(r.facts.settledAt, i.timezone),
          "tatum_verified",
          r.id,
        ],
      );
      i.paidAtomic = (BigInt(i.paidAtomic) + amount).toString();
      i.status = i.paidAtomic === i.amountAtomic ? "paid" : "partial";
      i.version++;
      w.data.accounts
        .filter((a) => a.included)
        .forEach((a) => (a.reconciliationPending = true));
      if (i.status === "paid") {
        const events = (
          await tx.query(
            "SELECT paid_date,source FROM payment_events WHERE workspace_id=$1 AND invoice_id=$2",
            [w.id, i.id],
          )
        ).rows;
        const date = events
          .map((e) => e.paid_date)
          .sort()
          .at(-1)!;
        const o: Outcome = {
          id: id(),
          invoiceId: i.id,
          clientId: i.clientId,
          dueDate: i.dueDate,
          paidDate: date,
          amountAtomic: i.amountAtomic,
          source: events.every((e) => e.source === "tatum_verified")
            ? "tatum_verified"
            : "user_confirmed",
          recordedAt: new Date().toISOString(),
          receiptDigest: r.digest,
        };
        w.data.outcomes.push(o);
        await memory(
          tx,
          w,
          "outcome",
          o,
          "Invoice payment reconciled: " + i.invoiceReference,
          date,
        );
      }
      return finish(
        tx,
        w,
        "payment",
        "Verified receipt allocated. Refresh funds before relying on the plan.",
      );
    });
  });
  app.get(API + "/activity", async (req) =>
    data(req, {
      items: (
        await db.query(
          "SELECT * FROM audit WHERE workspace_id=$1 ORDER BY created_at DESC,id DESC LIMIT 100",
          [scope(req)],
        )
      ).rows,
    }),
  );
  app.get(API + "/memory", async (req) =>
    data(req, {
      items: (
        await db.query(
          "SELECT * FROM memory_records WHERE workspace_id=$1 ORDER BY recorded_at DESC,id DESC LIMIT 100",
          [scope(req)],
        )
      ).rows,
    }),
  );
  app.get(API + "/memory/:id", async (req) => {
    const r = (
      await db.query(
        "SELECT * FROM memory_records WHERE id=$1 AND workspace_id=$2",
        [(req.params as any).id, scope(req)],
      )
    ).rows[0];
    if (!r)
      throw new AppError(
        404,
        "NOT_FOUND",
        "This memory is not in your workspace.",
      );
    return data(req, { record: r });
  });
  app.post(API + "/memory/consent", async (req) => {
    const b = z
      .object({
        accepted: z.boolean(),
        consentVersion: z.literal("1"),
        expectedStateVersion: dto.version,
      })
      .parse(req.body);
    return command(req, b, async (tx, w) => {
      version(w, b);
      if (w.kind === "sample")
        throw new AppError(
          403,
          "SAMPLE_READ_ONLY",
          "The example cannot publish to the hosted memory account.",
        );
      w.data.consent = b.accepted;
      return finish(
        tx,
        w,
        "memory",
        b.accepted
          ? "Future memory publication enabled."
          : "Future memory publication stopped.",
      );
    });
  });
  app.post(API + "/memory/verify", async (req, reply) =>
    reply.code(202).send(
      await command(req, req.body || {}, async (tx, w) => {
        const records = (
          await tx.query(
            "SELECT id FROM memory_records WHERE workspace_id=$1 AND status IN ('uploaded','verified')",
            [w.id],
          )
        ).rows;
        if (!records.length)
          throw new AppError(
            422,
            "NO_STORED_MEMORY",
            "No uploaded memories are available to verify yet.",
          );
        return { jobId: await queueJob(tx, w, "memory_verify", {}) };
      }),
    ),
  );
  app.post(API + "/memory/:id/publish", async (req, reply) => {
    const b = z.object({ expectedStateVersion: dto.version }).parse(req.body);
    return reply.code(202).send(
      await command(req, b, async (tx, w) => {
        version(w, b);
        if (w.kind === "sample" || !w.data.consent || !config.memoryWrites)
          throw new AppError(
            403,
            "PUBLICATION_DISABLED",
            "Enable memory consent and server publication before publishing this record.",
          );
        const r = (
          await tx.query(
            "SELECT * FROM memory_records WHERE id=$1 AND workspace_id=$2 FOR UPDATE",
            [(req.params as any).id, w.id],
          )
        ).rows[0];
        if (!r)
          throw new AppError(
            404,
            "NOT_FOUND",
            "This memory is not in your workspace.",
          );
        if (r.status !== "local")
          throw new AppError(
            409,
            "PUBLICATION_EXISTS",
            "This record already has a publication state. Inspect its existing job before retrying.",
          );
        await tx.query(
          "UPDATE memory_records SET status='queued' WHERE id=$1",
          [r.id],
        );
        const jobId = await queueJob(tx, w, "memory_publish", {
          recordId: r.id,
        });
        await audit(
          tx,
          w,
          "memory",
          "Existing local record approved for publication.",
          { recordId: r.id },
        );
        return { jobId, stateVersion: w.state_version };
      }),
    );
  });
  app.get(API + "/jobs/:id", async (req) => {
    const job = (
      await db.query(
        "SELECT id,kind,status,result,error,created_at FROM jobs WHERE id=$1 AND workspace_id=$2",
        [(req.params as any).id, scope(req)],
      )
    ).rows[0];
    if (!job)
      throw new AppError(
        404,
        "NOT_FOUND",
        "This job is not in your workspace.",
      );
    return data(req, { job });
  });
  app.post(API + "/invoices/import/preview", async (req) => {
    const b = z.object({ csv: z.string().max(262144) }).parse(req.body);
    let rows: any[];
    try {
      rows = parse(b.csv, {
        columns: true,
        skip_empty_lines: true,
        max_record_size: 20000,
      });
    } catch {
      throw new AppError(
        400,
        "CSV_INVALID",
        "Use a CSV file with a header row and consistent columns.",
      );
    }
    if (rows.length > 50)
      throw new AppError(422, "CSV_LIMIT", "Import up to 50 rows at once.");
    const w = await workspace(req);
    const preview = rows.map((r, index) => {
      try {
        const c = dto.csvRow.parse(r);
        const amountAtomic = parseMoney(c.amount_usdc);
        dto.positiveAtomic.parse(amountAtomic);
        if (c.paid_date && c.source !== "user_confirmed")
          throw new Error(
            "Historical payments must be labeled user_confirmed.",
          );
        if (c.paid_date > planningInput(w).localToday)
          throw new Error("Payment date cannot be in the future.");
        return { row: index + 2, valid: true, data: { ...c, amountAtomic } };
      } catch (e) {
        return {
          row: index + 2,
          valid: false,
          error:
            e instanceof z.ZodError
              ? e.issues[0].message
              : (e as Error).message,
        };
      }
    });
    return data(req, {
      rows: preview,
      previewHash: hash(b.csv),
      stateVersion: w.state_version,
      timezone: w.data.policy.timezone,
    });
  });
  app.post(API + "/invoices/import/confirm", async (req) => {
    const b = z
      .object({
        csv: z.string().max(262144),
        previewHash: z.string().length(64),
        expectedStateVersion: dto.version,
      })
      .parse(req.body);
    if (hash(b.csv) !== b.previewHash)
      throw new AppError(
        409,
        "CSV_CHANGED",
        "Preview the updated CSV before importing.",
      );
    return command(req, b, async (tx, w) => {
      version(w, b);
      let rows: any[];
      try {
        rows = parse(b.csv, {
          columns: true,
          skip_empty_lines: true,
          max_record_size: 20000,
        });
      } catch {
        throw new AppError(400, "CSV_INVALID", "This CSV could not be read.");
      }
      if (!rows.length || rows.length + w.data.invoices.length > 50)
        throw new AppError(
          422,
          "CSV_LIMIT",
          "This workspace supports up to 50 invoices.",
        );
      for (const raw of rows) {
        const r = dto.csvRow.parse(raw),
          amountAtomic = parseMoney(r.amount_usdc);
        dto.positiveAtomic.parse(amountAtomic);
        let client = w.data.clients.find((c) => c.alias === r.client_alias);
        if (!client) {
          client = { id: id(), alias: r.client_alias, version: 1 };
          w.data.clients.push(client);
        }
        if (
          w.data.invoices.some(
            (i) =>
              i.clientId === client!.id &&
              i.invoiceReference === r.invoice_reference,
          )
        )
          throw new AppError(
            409,
            "DUPLICATE_INVOICE",
            "Duplicate invoice reference: " + r.invoice_reference,
          );
        if (
          r.paid_date &&
          (r.source !== "user_confirmed" ||
            r.paid_date > planningInput(w).localToday)
        )
          throw new AppError(
            422,
            "CSV_SOURCE",
            "Use a past payment date and user_confirmed source for historical rows.",
          );
        const invoice = {
          id: id(),
          clientId: client.id,
          invoiceReference: r.invoice_reference,
          amountAtomic,
          paidAtomic: r.paid_date ? amountAtomic : "0",
          dueDate: r.due_date,
          timezone: w.data.policy.timezone,
          version: 1,
          status: r.paid_date ? ("paid" as const) : ("expected" as const),
        };
        w.data.invoices.push(invoice);
        await memory(
          tx,
          w,
          "expectation",
          invoice,
          "Imported invoice expectation.",
          invoice.dueDate,
        );
        if (r.paid_date) {
          const o: Outcome = {
            id: id(),
            invoiceId: invoice.id,
            clientId: client.id,
            dueDate: invoice.dueDate,
            paidDate: r.paid_date,
            amountAtomic,
            source: "user_confirmed",
            recordedAt: new Date().toISOString(),
          };
          w.data.outcomes.push(o);
          await memory(
            tx,
            w,
            "outcome",
            o,
            "Imported user-confirmed payment outcome.",
            o.paidDate,
          );
        }
      }
      return {
        ...(await finish(
          tx,
          w,
          "invoice",
          "CSV invoices imported after review.",
        )),
        imported: rows.length,
      };
    });
  });
  const serve =
    options.serveStatic !== false && existsSync(resolve("dist/web/index.html"));
  if (serve) {
    await app.register(staticFiles, { root: resolve("dist/web"), prefix: "/" });
    app.setNotFoundHandler((req, reply) =>
      req.url.startsWith("/api/")
        ? reply.code(404).send({
            error: {
              code: "NOT_FOUND",
              message: "This API route is not here.",
            },
          })
        : reply.type("text/html").sendFile("index.html"),
    );
  }
  let running = false;
  const interval =
    (options.worker ?? (config.inlineWorker && config.jobMode === "inline"))
      ? setInterval(async () => {
          if (running) return;
          running = true;
          try {
            await runJobs(db, chain, mem);
          } catch {
          } finally {
            running = false;
          }
        }, 1000)
      : undefined;
  interval?.unref();
  app.addHook("onClose", async () => {
    if (interval) clearInterval(interval);
    while (running) await new Promise((r) => setTimeout(r, 20));
    await db.close();
  });
  return app;
}
