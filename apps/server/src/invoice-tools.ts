import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { Database, SQL } from "./db/index.js";
import {
  InvoiceAgent,
  SAMPLE_INVOICE,
  toolPolicyInput,
} from "./services/invoice-agent.js";
import { PaidParser } from "./services/paid-parser.js";
import {
  AppError,
  audit,
  checkVersion,
  hash,
  id,
  memory,
  save,
  type Workspace,
} from "./services/state.js";
import { parseInvoiceText } from "./adapters/parser/index.js";
import * as dto from "../../../packages/contracts/src/index.js";

const API = "/api/v1";
export function registerInvoiceTools(
  app: FastifyInstance,
  context: {
    db: Database;
    agent: InvoiceAgent;
    paidParser: PaidParser;
    workspace: (req: FastifyRequest) => Promise<Workspace>;
    command: (
      req: FastifyRequest,
      body: unknown,
      fn: (tx: SQL, w: Workspace) => Promise<unknown>,
    ) => Promise<unknown>;
  },
) {
  const { agent, paidParser, command, workspace } = context;
  app.post(
    API + "/paid/invoice-parse",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const response = await paidParser.handle(
        req.body,
        req.headers.authorization,
      );
      if (response.challenge)
        reply.header("WWW-Authenticate", response.challenge);
      if (response.receipt) reply.header("Payment-Receipt", response.receipt);
      return reply.code(response.status).send(response.body);
    },
  );
  app.get(API + "/tools/invoice-parse/config", async (req) =>
    agent.settings(await workspace(req)),
  );
  app.get(API + "/tools/invoice-parse/sample", async () => ({
    text: SAMPLE_INVOICE,
    draft: parseInvoiceText(SAMPLE_INVOICE),
    source: "synthetic_replay",
    paid: false,
  }));
  app.put(API + "/tools/policy", async (req) => {
    const body = toolPolicyInput.parse(req.body);
    return command(req, body, (tx, w) => agent.setPolicy(tx, w, body));
  });
  app.post(
    API + "/tools/invoice-parse/quote",
    {
      bodyLimit: 2850000,
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    async (req) => {
      const key = z
        .string()
        .min(8)
        .max(200)
        .parse(req.headers["idempotency-key"]);
      return agent.quote(await workspace(req), req.body, key);
    },
  );
  app.post(API + "/tools/invoice-parse/orders", async (req, reply) => {
    const body = z
      .object({
        quoteId: z.uuid(),
        approvedAmountAtomic: z.literal("10000"),
        approvedMaxGasMist: dto.positiveAtomic,
        recipient: dto.address,
        network: z.literal("sui:mainnet"),
        consentToShare: z.literal(true),
        expectedStateVersion: dto.version,
      })
      .strict()
      .parse(req.body);
    const result = await command(req, body, async (tx, w) => {
      checkVersion(w, body.expectedStateVersion);
      const quote = (
        await tx.query(
          "SELECT recipient,gas_budget FROM tool_orders WHERE id=$1 AND workspace_id=$2",
          [body.quoteId, w.id],
        )
      ).rows[0];
      if (
        quote?.recipient !== body.recipient ||
        quote?.gas_budget !== body.approvedMaxGasMist
      )
        throw new AppError(
          409,
          "QUOTE_CHANGED",
          "Review the exact service recipient before approval.",
        );
      return agent.approve(tx, w, body.quoteId);
    });
    return reply.code(202).send(result);
  });
  app.get(API + "/tools/orders/:id", async (req) =>
    agent.get((await workspace(req)).id, (req.params as { id: string }).id),
  );
  app.post(
    API + "/tools/orders/:id/retry",
    { bodyLimit: 2850000 },
    async (req, reply) => {
      const body = z
        .object({ input: z.unknown().optional() })
        .strict()
        .parse(req.body || {});
      return reply
        .code(202)
        .send(
          await command(req, body, (tx, w) =>
            agent.retry(tx, w, (req.params as { id: string }).id, body.input),
          ),
        );
    },
  );
  app.post(API + "/tools/orders/:id/confirm", async (req) => {
    const body = z
      .object({
        clientAlias: dto.name,
        invoiceReference: dto.name,
        amountAtomic: dto.positiveAtomic,
        dueDate: dto.date,
        timezone: dto.timezone,
        expectedStateVersion: dto.version,
      })
      .strict()
      .parse(req.body);
    return command(req, body, async (tx, w) => {
      checkVersion(w, body.expectedStateVersion);
      const order = (
        await tx.query(
          "SELECT * FROM tool_orders WHERE id=$1 AND workspace_id=$2 FOR UPDATE",
          [(req.params as { id: string }).id, w.id],
        )
      ).rows[0];
      if (
        !order ||
        order.status !== "result_ready" ||
        !order.receipt ||
        !order.result
      )
        throw new AppError(
          409,
          "DRAFT_UNAVAILABLE",
          "This paid draft is unavailable or was already saved.",
        );
      if (w.data.invoices.length >= 50)
        throw new AppError(
          422,
          "INVOICE_LIMIT",
          "This workspace supports up to 50 invoices.",
        );
      let client = w.data.clients.find(
        (c) => c.alias.toLowerCase() === body.clientAlias.toLowerCase(),
      );
      if (!client) {
        if (w.data.clients.length >= 50)
          throw new AppError(
            422,
            "CLIENT_LIMIT",
            "This workspace supports up to 50 clients.",
          );
        client = { id: id(), alias: body.clientAlias, version: 1 };
        w.data.clients.push(client);
      }
      if (
        w.data.invoices.some(
          (i) =>
            i.clientId === client.id &&
            i.invoiceReference === body.invoiceReference,
        )
      )
        throw new AppError(
          409,
          "DUPLICATE_INVOICE",
          "This invoice reference is already saved for this client.",
        );
      const invoice = {
        id: id(),
        clientId: client.id,
        invoiceReference: body.invoiceReference,
        amountAtomic: body.amountAtomic,
        paidAtomic: "0",
        dueDate: body.dueDate,
        timezone: body.timezone,
        version: 1,
        status: "expected" as const,
      };
      w.data.invoices.push(invoice);
      await memory(
        tx,
        w,
        "expectation",
        invoice,
        "Invoice expected: " + invoice.invoiceReference,
        invoice.dueDate,
      );
      const { expectedStateVersion, ...confirmed } = body;
      await memory(
        tx,
        w,
        "tool_receipt",
        {
          orderId: order.id,
          digest: order.receipt.digest,
          priceAtomic: order.amount_atomic,
          source: "tatum_verified",
          outputHash: hash(order.result),
          confirmed,
          correctedFields: Object.keys(confirmed).filter(
            (key) =>
              key in order.result &&
              (confirmed as Record<string, unknown>)[key] !== order.result[key],
          ),
        },
        "Paid invoice draft reviewed and saved.",
        new Date().toISOString().slice(0, 10),
      );
      await tx.query(
        "UPDATE tool_orders SET status='user_confirmed',invoice_id=$1 WHERE id=$2",
        [invoice.id, order.id],
      );
      await save(tx, w);
      await audit(tx, w, "tool", "Reviewed invoice saved as expected income.", {
        orderId: order.id,
        invoiceId: invoice.id,
      });
      return { invoice, stateVersion: w.state_version };
    });
  });
}
