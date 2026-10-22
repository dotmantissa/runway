import { Challenge, Receipt } from "mppx";
import { z } from "zod";
import type { Database, SQL } from "../db/index.js";
import type { ChainAdapter } from "../adapters/tatum/index.js";
import { config } from "../config.js";
import {
  AppError,
  audit,
  hash,
  id,
  load,
  queueJob,
  type Workspace,
} from "./state.js";
import {
  extractInvoiceText,
  invoiceDraft,
  parserInput,
} from "../adapters/parser/index.js";
import {
  HttpParserTransport,
  NETWORK,
  PARSE_PRICE,
  SuiToolWallet,
  validateChallenge,
  type ParserTransport,
  type PreparedPayment,
  type ToolWallet,
} from "../adapters/parser/payment.js";
import { USDC } from "../../../../packages/domain/src/index.js";

export const toolPolicyInput = z
  .object({
    enabled: z.boolean(),
    perCallAtomic: z
      .string()
      .regex(/^\d+$/)
      .refine((v) => BigInt(v) >= 10000n && BigInt(v) <= 50000n),
    dailyAtomic: z
      .string()
      .regex(/^\d+$/)
      .refine((v) => BigInt(v) >= 10000n && BigInt(v) <= 200000n),
  })
  .strict();
export const SAMPLE_INVOICE =
  "Client: Cedar Studio\nInvoice: CEDAR-105\nTotal: 1200.00 USDC\nDue date: 2026-10-30";
const terminal = new Set([
  "result_ready",
  "user_confirmed",
  "failed",
  "cancelled",
  "expired",
  "service_failed_paid",
  "needs_review",
]);

export class InvoiceAgent {
  private walletValue?: ToolWallet;
  constructor(
    readonly db: Database,
    readonly chain: ChainAdapter,
    private options: {
      wallet?: ToolWallet;
      transport?: ParserTransport;
      now?: () => Date;
    } = {},
  ) {}
  private get wallet() {
    return this.options.wallet || (this.walletValue ??= new SuiToolWallet());
  }
  private get transport() {
    return this.options.transport || new HttpParserTransport();
  }
  private now() {
    return this.options.now?.() || new Date();
  }
  eligible(w: Workspace) {
    return (
      config.agentPayments &&
      w.kind === "personal" &&
      !!w.wallet_address &&
      config.toolAllowedWallets.includes(w.wallet_address.toLowerCase())
    );
  }
  private requireEligible(w: Workspace) {
    if (!this.eligible(w))
      throw new AppError(
        403,
        "TOOL_DISABLED",
        "Paid parsing is available only to the configured tool-wallet owner. You can use the sample or enter an invoice manually.",
      );
    if (
      this.wallet.address === w.wallet_address ||
      this.wallet.address === config.parserRecipient ||
      w.data.accounts.some(
        (a) => a.address === this.wallet.address && a.included,
      )
    )
      throw new AppError(
        403,
        "WALLET_ISOLATION",
        "Configure a separate tool wallet, excluded from personal funds and distinct from the service recipient.",
      );
  }
  async settings(w: Workspace) {
    const policy = (
      await this.db.query(
        "SELECT enabled,per_call_atomic,daily_atomic FROM tool_policies WHERE workspace_id=$1",
        [w.id],
      )
    ).rows[0];
    return {
      available: this.eligible(w),
      policy: policy
        ? {
            enabled: policy.enabled,
            perCallAtomic: policy.per_call_atomic,
            dailyAtomic: policy.daily_atomic,
          }
        : { enabled: false, perCallAtomic: "10000", dailyAtomic: "200000" },
      amountAtomic: PARSE_PRICE,
      currency: USDC,
      network: NETWORK,
      serviceUrl: config.parserUrl,
      recipient: config.parserRecipient || null,
      provider: "structured_text",
      maxGasMist: String(config.toolMaxGas),
      dailyGasMist: String(config.toolDailyGas),
      walletAddress: this.eligible(w) ? this.wallet.address : null,
    };
  }
  async setPolicy(
    tx: SQL,
    w: Workspace,
    input: z.infer<typeof toolPolicyInput>,
  ) {
    if (input.enabled) this.requireEligible(w);
    await tx.query(
      "INSERT INTO tool_policies(workspace_id,enabled,per_call_atomic,daily_atomic) VALUES($1,$2,$3,$4) ON CONFLICT(workspace_id) DO UPDATE SET enabled=$2,per_call_atomic=$3,daily_atomic=$4,updated_at=now()",
      [w.id, input.enabled, input.perCallAtomic, input.dailyAtomic],
    );
    await audit(
      tx,
      w,
      "tool",
      input.enabled
        ? "Invoice agent spending limits approved."
        : "New invoice agent spending stopped.",
      input,
    );
    return { updated: true };
  }
  async quote(w: Workspace, input: unknown, retryKey: string = id()) {
    this.requireEligible(w);
    const text = await extractInvoiceText(parserInput.parse(input));
    const requestHash = hash(text);
    const existing = (
      await this.db.query(
        "SELECT id,request_hash FROM tool_orders WHERE workspace_id=$1 AND idempotency_key=$2",
        [w.id, retryKey],
      )
    ).rows[0];
    if (existing) {
      if (existing.request_hash !== requestHash)
        throw new AppError(
          409,
          "RETRY_CONFLICT",
          "This quote retry key belongs to different invoice content.",
        );
      return this.get(w.id, existing.id);
    }
    const outstanding = (
      await this.db.query(
        "SELECT count(*)::int AS count FROM tool_orders WHERE workspace_id=$1 AND status='quoted' AND expires_at>now()",
        [w.id],
      )
    ).rows[0].count;
    if (outstanding >= 5)
      throw new AppError(
        429,
        "QUOTE_LIMIT",
        "Review or let your existing invoice quotes expire before creating another.",
      );
    const requestId = id();
    const header = await this.transport.quote(requestId, requestHash);
    const challenge = Challenge.deserialize(header);
    validateChallenge(challenge, requestId, requestHash);
    if (
      Date.parse(challenge.expires!) <= this.now().getTime() ||
      Date.parse(challenge.expires!) > this.now().getTime() + 10 * 60000
    )
      throw new AppError(
        422,
        "QUOTE_EXPIRED",
        "The parser quote has expired or has an unsupported lifetime. Request a fresh quote.",
      );
    await this.db.query(
      "INSERT INTO tool_orders(id,workspace_id,request_hash,input_text,challenge,service_url,recipient,wallet_address,amount_atomic,expires_at,input_expires_at,idempotency_key,gas_budget) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT(workspace_id,idempotency_key) DO NOTHING",
      [
        requestId,
        w.id,
        requestHash,
        text,
        header,
        config.parserUrl,
        config.parserRecipient,
        this.wallet.address,
        PARSE_PRICE,
        challenge.expires,
        new Date(this.now().getTime() + 3600000).toISOString(),
        retryKey,
        config.toolMaxGas,
      ],
    );
    const saved = (
      await this.db.query(
        "SELECT id,request_hash FROM tool_orders WHERE workspace_id=$1 AND idempotency_key=$2",
        [w.id, retryKey],
      )
    ).rows[0];
    if (saved.request_hash !== requestHash)
      throw new AppError(
        409,
        "RETRY_CONFLICT",
        "This quote retry key belongs to different invoice content.",
      );
    return this.get(w.id, saved.id);
  }
  async get(workspaceId: string, orderId: string) {
    const order = (
      await this.db.query(
        "SELECT id,status,amount_atomic,service_url,recipient,wallet_address,reservation_day,budget_state,gas_budget,result,receipt,invoice_id,error,expires_at,created_at,CASE WHEN status='quoted' AND expires_at>now() THEN input_text ELSE NULL END AS input_preview,(SELECT digest FROM tool_payment_attempts WHERE order_id=tool_orders.id) AS payment_digest FROM tool_orders WHERE workspace_id=$1 AND id=$2",
        [workspaceId, orderId],
      )
    ).rows[0];
    if (!order)
      throw new AppError(
        404,
        "NOT_FOUND",
        "This tool order is not in your workspace.",
      );
    return { order: { ...order, network: NETWORK, currency: USDC } };
  }
  async approve(tx: SQL, w: Workspace, orderId: string) {
    this.requireEligible(w);
    const order = (
      await tx.query(
        "SELECT * FROM tool_orders WHERE id=$1 AND workspace_id=$2 FOR UPDATE",
        [orderId, w.id],
      )
    ).rows[0];
    if (!order)
      throw new AppError(
        404,
        "NOT_FOUND",
        "This tool order is not in your workspace.",
      );
    if (order.status !== "quoted")
      throw new AppError(
        409,
        "ORDER_EXISTS",
        "This order already has an approval state. Open its existing result.",
      );
    if (new Date(order.expires_at).getTime() <= this.now().getTime())
      throw new AppError(
        409,
        "QUOTE_EXPIRED",
        "This quote expired. Request a fresh quote before approving payment.",
      );
    const policy = (
      await tx.query(
        "SELECT * FROM tool_policies WHERE workspace_id=$1 FOR UPDATE",
        [w.id],
      )
    ).rows[0];
    if (
      !policy?.enabled ||
      BigInt(order.amount_atomic) > BigInt(policy.per_call_atomic)
    )
      throw new AppError(
        403,
        "BUDGET_APPROVAL",
        "Approve spending limits that cover this quote before continuing.",
      );
    if (
      order.wallet_address !== this.wallet.address ||
      order.service_url !== config.parserUrl ||
      order.recipient !== config.parserRecipient ||
      Number(order.gas_budget) > config.toolMaxGas
    )
      throw new AppError(
        409,
        "QUOTE_CHANGED",
        "The tool configuration changed. Request a fresh quote.",
      );
    validateChallenge(
      Challenge.deserialize(order.challenge),
      order.id,
      order.request_hash,
    );
    const day = this.now().toISOString().slice(0, 10),
      gas = Number(order.gas_budget);
    await tx.query(
      "INSERT INTO tool_wallets(address) VALUES($1) ON CONFLICT DO NOTHING",
      [order.wallet_address],
    );
    await tx.query(
      "INSERT INTO tool_budget_days(wallet_address,day) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [order.wallet_address, day],
    );
    const budget = (
      await tx.query(
        "SELECT * FROM tool_budget_days WHERE wallet_address=$1 AND day=$2 FOR UPDATE",
        [order.wallet_address, day],
      )
    ).rows[0];
    const workspaceTotal = (
      await tx.query(
        "SELECT COALESCE(sum(amount_atomic),0)::text AS amount FROM tool_orders WHERE workspace_id=$1 AND reservation_day=$2 AND budget_state IN ('reserved','spent')",
        [w.id, day],
      )
    ).rows[0].amount;
    if (
      BigInt(budget.reserved_atomic) +
        BigInt(budget.spent_atomic) +
        BigInt(order.amount_atomic) >
        200000n ||
      BigInt(workspaceTotal) + BigInt(order.amount_atomic) >
        BigInt(policy.daily_atomic) ||
      BigInt(budget.reserved_gas) + BigInt(budget.spent_gas) + BigInt(gas) >
        BigInt(config.toolDailyGas)
    )
      throw new AppError(
        422,
        "TOOL_BUDGET",
        "This purchase exceeds the remaining daily USDC or gas allowance. Existing reservations stay counted.",
      );
    await tx.query(
      "UPDATE tool_budget_days SET reserved_atomic=reserved_atomic+$1,reserved_gas=reserved_gas+$2 WHERE wallet_address=$3 AND day=$4",
      [order.amount_atomic, gas, order.wallet_address, day],
    );
    await tx.query(
      "UPDATE tool_orders SET status='budget_reserved',budget_state='reserved',reservation_day=$1,gas_budget=$2 WHERE id=$3",
      [day, gas, order.id],
    );
    const jobId = await queueJob(tx, w, "invoice_parse", { orderId: order.id });
    await audit(
      tx,
      w,
      "tool",
      "Invoice parser purchase approved from the separate tool wallet.",
      {
        orderId: order.id,
        amountAtomic: order.amount_atomic,
        reservationDay: day,
      },
    );
    return { orderId: order.id, jobId };
  }
  private async account(orderId: string, settled: boolean, gasUsed: boolean) {
    await this.db.transaction(async (tx) => {
      const order = (
        await tx.query("SELECT * FROM tool_orders WHERE id=$1 FOR UPDATE", [
          orderId,
        ])
      ).rows[0];
      if (order.budget_state === "reserved") {
        await tx.query(
          "UPDATE tool_budget_days SET reserved_atomic=reserved_atomic-$1,spent_atomic=spent_atomic+$2,reserved_gas=reserved_gas-$3,spent_gas=spent_gas+$4 WHERE wallet_address=$5 AND day=$6",
          [
            order.amount_atomic,
            settled ? order.amount_atomic : "0",
            order.gas_budget,
            gasUsed ? order.gas_budget : "0",
            order.wallet_address,
            order.reservation_day,
          ],
        );
        await tx.query("UPDATE tool_orders SET budget_state=$1 WHERE id=$2", [
          settled ? "spent" : "released",
          order.id,
        ]);
      }
      await tx.query(
        "UPDATE tool_wallets SET active_order_id=NULL WHERE address=$1 AND active_order_id=$2",
        [order.wallet_address, orderId],
      );
    });
  }
  async retry(tx: SQL, w: Workspace, orderId: string, input?: unknown) {
    const order = (
      await tx.query(
        "SELECT * FROM tool_orders WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
        [w.id, orderId],
      )
    ).rows[0];
    if (
      !order ||
      !["service_failed_paid", "settlement_unknown", "needs_review"].includes(
        order.status,
      )
    )
      throw new AppError(
        409,
        "RETRY_UNAVAILABLE",
        "Only an existing uncertain payment or failed paid job can be resumed.",
      );
    const attempt = (
      await tx.query(
        "SELECT digest FROM tool_payment_attempts WHERE order_id=$1",
        [orderId],
      )
    ).rows[0];
    if (!attempt)
      throw new AppError(
        409,
        "NO_PAYMENT",
        "This order has no prepared payment. Request a new quote.",
      );
    if (input !== undefined) {
      const text = await extractInvoiceText(parserInput.parse(input));
      if (hash(text) !== order.request_hash)
        throw new AppError(
          409,
          "CONTENT_CHANGED",
          "Retry with the original invoice. A paid job cannot parse different content.",
        );
      await tx.query(
        "UPDATE tool_orders SET input_text=$1,input_expires_at=$2 WHERE id=$3",
        [text, new Date(this.now().getTime() + 3600000).toISOString(), orderId],
      );
    }
    const active = (
      await tx.query(
        "SELECT id,status,lease_until FROM jobs WHERE workspace_id=$1 AND kind='invoice_parse' AND payload->>'orderId'=$2 AND status IN ('queued','running') FOR UPDATE",
        [w.id, orderId],
      )
    ).rows[0];
    if (
      active?.status === "running" &&
      active.lease_until &&
      new Date(active.lease_until).getTime() > Date.now()
    )
      return { orderId, jobId: active.id };
    await tx.query("UPDATE tool_orders SET status=$1,error=NULL WHERE id=$2", [
      order.receipt ? "settled" : "payment_prepared",
      orderId,
    ]);
    await audit(
      tx,
      w,
      "tool",
      "Existing paid invoice job resumed with the same payment.",
      { orderId, digest: attempt.digest },
    );
    if (active) {
      await tx.query(
        "UPDATE jobs SET status='queued',run_after=now(),lease_owner=NULL,lease_until=NULL WHERE id=$1",
        [active.id],
      );
      return { orderId, jobId: active.id };
    }
    return {
      orderId,
      jobId: await queueJob(tx, w, "invoice_parse", { orderId }),
    };
  }
  async run(orderId: string): Promise<boolean> {
    const claimed = await this.db.transaction(async (tx) => {
      const order = (
        await tx.query("SELECT * FROM tool_orders WHERE id=$1 FOR UPDATE", [
          orderId,
        ])
      ).rows[0];
      if (!order || terminal.has(order.status)) return { done: true };
      if (
        order.lease_until &&
        new Date(order.lease_until).getTime() > Date.now()
      )
        return { done: false };
      await tx.query(
        "UPDATE tool_orders SET lease_until=now()+interval '5 minutes' WHERE id=$1",
        [orderId],
      );
      return { order };
    });
    if (!claimed.order) return claimed.done!;
    const order = claimed.order;
    try {
      let attempt = (
        await this.db.query(
          "SELECT * FROM tool_payment_attempts WHERE order_id=$1",
          [orderId],
        )
      ).rows[0];
      if (!attempt) {
        if (
          order.budget_state !== "reserved" ||
          !order.reservation_day ||
          !order.gas_budget
        )
          throw new Error("No approved budget reservation");
        const w = await load(this.db, order.workspace_id);
        const policy = (
          await this.db.query(
            "SELECT enabled FROM tool_policies WHERE workspace_id=$1",
            [w.id],
          )
        ).rows[0];
        if (
          !this.eligible(w) ||
          !policy?.enabled ||
          !order.input_text ||
          new Date(order.input_expires_at).getTime() <= this.now().getTime() ||
          new Date(order.expires_at).getTime() <= this.now().getTime()
        ) {
          await this.account(orderId, false, false);
          await this.db.query(
            "UPDATE tool_orders SET status='cancelled',input_text=NULL,error='Approval expired or new spending was stopped before signing.' WHERE id=$1",
            [orderId],
          );
          return true;
        }
        this.requireEligible(w);
        if (
          order.wallet_address !== this.wallet.address ||
          order.service_url !== config.parserUrl ||
          order.recipient !== config.parserRecipient ||
          Number(order.gas_budget) > config.toolMaxGas
        )
          throw new Error(
            "The approved tool configuration changed before signing",
          );
        validateChallenge(
          Challenge.deserialize(order.challenge),
          order.id,
          order.request_hash,
        );
        const locked = await this.db.transaction(async (tx) => {
          const lock = (
            await tx.query(
              "SELECT * FROM tool_wallets WHERE address=$1 FOR UPDATE",
              [order.wallet_address],
            )
          ).rows[0];
          if (lock.active_order_id && lock.active_order_id !== orderId)
            return false;
          await tx.query(
            "UPDATE tool_wallets SET active_order_id=$1 WHERE address=$2",
            [orderId, order.wallet_address],
          );
          return true;
        });
        if (!locked) return false;
        const payment = await this.wallet.prepare(
          Challenge.deserialize(order.challenge),
          Number(order.gas_budget),
        );
        await this.db.transaction(async (tx) => {
          await tx.query(
            "INSERT INTO tool_payment_attempts(order_id,digest,transaction_bytes,signature,credential) VALUES($1,$2,$3,$4,$5)",
            [
              orderId,
              payment.digest,
              payment.transactionBytes,
              payment.signature,
              payment.credential,
            ],
          );
          await tx.query(
            "UPDATE tool_orders SET status='payment_prepared' WHERE id=$1",
            [orderId],
          );
        });
        attempt = (
          await this.db.query(
            "SELECT * FROM tool_payment_attempts WHERE order_id=$1",
            [orderId],
          )
        ).rows[0];
      }
      if (!order.receipt) {
        let state = await this.wallet.state(attempt.digest);
        if (
          state === "unknown" &&
          (!attempt.broadcast_started_at || order.status === "payment_prepared")
        ) {
          await this.db.query(
            "UPDATE tool_payment_attempts SET broadcast_started_at=COALESCE(broadcast_started_at,now()) WHERE order_id=$1",
            [orderId],
          );
          await this.db.query(
            "UPDATE tool_orders SET status='submitted' WHERE id=$1",
            [orderId],
          );
          try {
            await this.wallet.broadcast({
              digest: attempt.digest,
              transactionBytes: attempt.transaction_bytes,
              signature: attempt.signature,
              credential: attempt.credential,
            });
          } catch {
            /* Query the same digest; a timeout never authorizes new signing. */
          }
          state = await this.wallet.state(attempt.digest);
        }
        if (state === "unknown") {
          await this.db.query(
            "UPDATE tool_orders SET status='settlement_unknown',error='Settlement is not confirmed. The original budget stays reserved.' WHERE id=$1",
            [orderId],
          );
          return false;
        }
        if (state === "failed") {
          await this.account(orderId, false, true);
          await this.db.query(
            "UPDATE tool_orders SET status='failed',input_text=NULL,error='The original transaction failed on chain. Its gas allowance remains counted.' WHERE id=$1",
            [orderId],
          );
          return true;
        }
        const facts = await this.chain.receipt(attempt.digest, order.recipient);
        if (
          facts.digest !== attempt.digest ||
          facts.sender !== order.wallet_address ||
          facts.recipient !== order.recipient ||
          facts.coinType !== USDC ||
          facts.amountAtomic !== order.amount_atomic
        )
          throw new AppError(
            422,
            "SETTLEMENT_MISMATCH",
            "The tool payment does not match the approved exact settlement.",
          );
        await this.db.query(
          "UPDATE tool_orders SET receipt=$1,status='settled',error=NULL WHERE id=$2",
          [JSON.stringify(facts), orderId],
        );
        await this.db.query(
          "UPDATE tool_payment_attempts SET settled_at=now() WHERE order_id=$1",
          [orderId],
        );
      }
      await this.account(orderId, true, true);
      if (
        order.service_url !== config.parserUrl ||
        order.recipient !== config.parserRecipient ||
        order.wallet_address !== this.wallet.address
      )
        throw new Error("Configuration changed after payment");
      if (
        !order.input_text ||
        new Date(order.input_expires_at).getTime() <= this.now().getTime()
      )
        throw new Error("Original input expired");
      await this.db.query(
        "UPDATE tool_orders SET status='service_running' WHERE id=$1",
        [orderId],
      );
      const response = await this.transport.parse(
        orderId,
        order.request_hash,
        order.input_text,
        attempt.credential,
      );
      if (response.status === 202) return false;
      if (response.status !== 200 || !response.receipt)
        throw new Error("Paid service unavailable");
      const receipt = Receipt.deserialize(response.receipt);
      if (receipt.reference !== attempt.digest || receipt.method !== "sui")
        throw new Error("Wrong service receipt");
      const result = invoiceDraft.parse(
        (response.body as { draft?: unknown }).draft,
      );
      await this.db.query(
        "UPDATE tool_orders SET result=$1,status='result_ready',input_text=NULL,error=NULL WHERE id=$2",
        [JSON.stringify(result), orderId],
      );
      await this.db.transaction(async (tx) => {
        await audit(
          tx,
          await load(tx, order.workspace_id),
          "tool",
          "Paid invoice draft is ready for review.",
          { orderId, digest: attempt.digest, resultHash: hash(result) },
        );
      });
      return true;
    } catch {
      const current = (
        await this.db.query("SELECT receipt FROM tool_orders WHERE id=$1", [
          orderId,
        ])
      ).rows[0];
      const attempt = (
        await this.db.query(
          "SELECT digest FROM tool_payment_attempts WHERE order_id=$1",
          [orderId],
        )
      ).rows[0];
      const status = current.receipt
        ? "service_failed_paid"
        : attempt
          ? "needs_review"
          : "failed";
      if (!attempt) await this.account(orderId, false, false);
      await this.db.query(
        "UPDATE tool_orders SET status=$1,error=$2 WHERE id=$3",
        [
          status,
          current.receipt
            ? "Payment received. Parsing failed. Retry this job with the original invoice."
            : attempt
              ? "The prepared payment needs review. Its budget stays reserved; no replacement was signed."
              : "Payment preparation failed before broadcast. No purchase was submitted.",
          orderId,
        ],
      );
      return true;
    } finally {
      await this.db.query(
        "UPDATE tool_orders SET lease_until=NULL WHERE id=$1",
        [orderId],
      );
    }
  }
}
