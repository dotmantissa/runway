import { Challenge, Credential } from "mppx";
import { z } from "zod";
import type { Database } from "../db/index.js";
import { TatumAdapter, type ChainAdapter } from "../adapters/tatum/index.js";
import { config } from "../config.js";
import { AppError, hash } from "./state.js";
import {
  parseInvoiceText,
  invoiceDraft,
  type InvoiceDraft,
} from "../adapters/parser/index.js";
import {
  makeChallenge,
  PARSE_PRICE,
  serializeReceipt,
  validateChallenge,
  recoverPaymentSigner,
} from "../adapters/parser/payment.js";
import { USDC } from "../../../../packages/domain/src/index.js";

const requestInput = z
  .object({
    requestId: z.uuid(),
    requestHash: z.string().regex(/^[0-9a-f]{64}$/),
    text: z.string().min(10).max(20000).optional(),
  })
  .strict();
const proofInput = z
  .object({
    digest: z.string().min(20).max(100),
    signature: z.string().min(20).max(10000),
  })
  .strict();
export class PaidParser {
  constructor(
    private db: Database,
    private chain: ChainAdapter,
    private parse: (
      text: string,
    ) => InvoiceDraft | Promise<InvoiceDraft> = parseInvoiceText,
  ) {}
  async handle(body: unknown, authorization?: string) {
    if (!config.parserEnabled)
      throw new AppError(
        503,
        "PARSER_DISABLED",
        "The paid parser service is not enabled.",
      );
    const input = requestInput.parse(body);
    if (!authorization) {
      const challenge = makeChallenge(input.requestId, input.requestHash);
      return {
        status: 402,
        challenge: Challenge.serialize(challenge),
        body: {
          paymentRequired: true,
          amountAtomic: PARSE_PRICE,
          network: "sui:mainnet",
          provider: "structured_text",
        },
      };
    }
    let credential: ReturnType<
      typeof Credential.deserialize<z.infer<typeof proofInput>>
    >;
    try {
      credential = Credential.deserialize(authorization);
      proofInput.parse(credential.payload);
      const challenge = credential.challenge;
      validateChallenge(
        challenge,
        input.requestId,
        input.requestHash,
        config.origin + "/api/v1/paid/invoice-parse",
      );
      if (!Challenge.verify(challenge, { secretKey: config.parserSecret }))
        throw new Error("Challenge authentication failed");
    } catch {
      throw new AppError(
        403,
        "PAYMENT_PROOF",
        "The payment credential or request binding is invalid.",
      );
    }
    if (!input.text || hash(input.text) !== input.requestHash)
      throw new AppError(
        409,
        "CONTENT_CHANGED",
        "The paid request must contain the original invoice text.",
      );
    const { challenge, payload } = credential;
    let proofSigner: string;
    try {
      // Reject invalid proofs before a paid chain lookup (grief protection).
      proofSigner = await recoverPaymentSigner(
        challenge,
        payload.digest,
        payload.signature,
        this.chain instanceof TatumAdapter ? this.chain : undefined,
      );
    } catch {
      throw new AppError(403, "PAYMENT_PROOF", "The payment proof is invalid.");
    }
    const prior = (
      await this.db.query(
        "SELECT * FROM parser_paid_jobs WHERE digest=$1 OR request_id=$2",
        [payload.digest, input.requestId],
      )
    ).rows[0];
    if (
      prior &&
      (prior.digest !== payload.digest ||
        prior.request_id !== input.requestId ||
        prior.request_hash !== input.requestHash ||
        prior.challenge_id !== challenge.id)
    )
      throw new AppError(
        409,
        "PAYMENT_REUSED",
        "This payment belongs to a different invoice request.",
      );
    let sender: string, receipt: unknown;
    if (prior) {
      sender = prior.sender;
      receipt = prior.receipt;
    } else {
      const facts = await this.chain.receipt(
        payload.digest,
        config.parserRecipient,
      );
      const issued = Date.parse(challenge.opaque?.issuedAt || ""),
        expires = Date.parse(challenge.expires || ""),
        paidAt = Date.parse(facts.settledAt);
      if (
        facts.digest !== payload.digest ||
        facts.recipient !== config.parserRecipient ||
        facts.amountAtomic !== PARSE_PRICE ||
        facts.coinType !== USDC ||
        !Number.isFinite(issued) ||
        !Number.isFinite(expires) ||
        !Number.isFinite(paidAt) ||
        paidAt < issued ||
        paidAt > expires ||
        expires - issued > 5 * 60000
      )
        throw new AppError(
          422,
          "WRONG_PAYMENT",
          "The payment does not match the exact amount, token, recipient and challenge lifetime.",
        );
      sender = facts.sender;
      receipt = facts;
    }
    if (proofSigner !== sender) {
      throw new AppError(
        403,
        "PAYMENT_PROOF",
        "The payment proof must be signed by the onchain sender.",
      );
    }
    const claim = await this.db.transaction(async (tx) => {
      await tx.query(
        "INSERT INTO parser_paid_jobs(digest,request_id,request_hash,challenge_id,sender,receipt,status) VALUES($1,$2,$3,$4,$5,$6,'accepted') ON CONFLICT DO NOTHING",
        [
          payload.digest,
          input.requestId,
          input.requestHash,
          challenge.id,
          sender,
          JSON.stringify(receipt),
        ],
      );
      const job = (
        await tx.query(
          "SELECT * FROM parser_paid_jobs WHERE digest=$1 OR request_id=$2 FOR UPDATE",
          [payload.digest, input.requestId],
        )
      ).rows[0];
      if (
        !job ||
        job.digest !== payload.digest ||
        job.request_id !== input.requestId ||
        job.request_hash !== input.requestHash ||
        job.challenge_id !== challenge.id
      )
        throw new AppError(
          409,
          "PAYMENT_REUSED",
          "This payment belongs to another invoice. No second paid job was started.",
        );
      if (job.status === "done")
        return { kind: "done" as const, result: job.result };
      if (
        job.status === "running" &&
        new Date(job.lease_until).getTime() > Date.now()
      )
        return { kind: "running" as const };
      await tx.query(
        "UPDATE parser_paid_jobs SET status='running',error=NULL,lease_until=now()+interval '1 minute' WHERE digest=$1",
        [payload.digest],
      );
      return { kind: "parse" as const };
    });
    if (claim.kind === "running")
      return {
        status: 202,
        body: { status: "running", digest: payload.digest },
        receipt: serializeReceipt(payload.digest),
      };
    let draft = claim.kind === "done" ? claim.result : undefined;
    if (claim.kind === "parse") {
      try {
        draft = invoiceDraft.parse(await this.parse(input.text));
        await this.db.query(
          "UPDATE parser_paid_jobs SET status='done',result=$1,error=NULL,lease_until=NULL WHERE digest=$2",
          [JSON.stringify(draft), payload.digest],
        );
      } catch {
        await this.db.query(
          "UPDATE parser_paid_jobs SET status='failed',error='Extraction failed after payment; retry this paid job.',lease_until=NULL WHERE digest=$1",
          [payload.digest],
        );
        return {
          status: 422,
          receipt: serializeReceipt(payload.digest),
          body: {
            paid: true,
            digest: payload.digest,
            error: {
              code: "PAID_PARSE_FAILED",
              message: "Payment received. Parsing failed. Retry this job.",
            },
          },
        };
      }
    }
    return {
      status: 200,
      receipt: serializeReceipt(payload.digest),
      body: {
        draft,
        digest: payload.digest,
        requestId: input.requestId,
        requestHash: input.requestHash,
      },
    };
  }
}
