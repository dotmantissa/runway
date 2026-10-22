import { Challenge, Credential, Receipt } from "mppx";
import { sui, USDC as currency } from "@suimpp/mpp/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64, toBase64, normalizeSuiAddress } from "@mysten/sui/utils";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { config } from "../../config.js";
import { TatumAdapter } from "../tatum/index.js";
import { AppError, hash } from "../../services/state.js";
import { USDC } from "../../../../../packages/domain/src/index.js";

export const PARSE_PRICE = "10000";
export const PARSE_AMOUNT = "0.01";
export const NETWORK = "sui:mainnet";
export interface PreparedPayment {
  digest: string;
  transactionBytes: string;
  signature: string;
  credential: string;
}
export interface ToolWallet {
  address: string;
  prepare(
    challenge: Challenge.Challenge,
    gasBudget: number,
  ): Promise<PreparedPayment>;
  broadcast(payment: PreparedPayment): Promise<void>;
  state(digest: string): Promise<"settled" | "failed" | "unknown">;
}

// suimpp v0.9 payment-proof domain and canonical field order, matching its MIT
// reference implementation (mission69b/suimpp, packages/mpp/src/proof.ts).
export function paymentProofBytes(
  challenge: Challenge.Challenge,
  digest: string,
) {
  return new TextEncoder().encode(
    JSON.stringify({
      domain: "suimpp.sui.payment-proof",
      version: 1,
      method: challenge.method,
      intent: challenge.intent,
      challengeId: challenge.id,
      amount: challenge.request.amount,
      currency: challenge.request.currency,
      recipient: challenge.request.recipient,
      digest,
    }),
  );
}
export async function recoverPaymentSigner(
  challenge: Challenge.Challenge,
  digest: string,
  signature: string,
  chain?: TatumAdapter,
) {
  const key = await verifyPersonalMessageSignature(
    paymentProofBytes(challenge, digest),
    signature,
    chain ? { client: chain.coreClient() } : undefined,
  );
  return normalizeSuiAddress(key.toSuiAddress());
}
export function validateChallenge(
  challenge: Challenge.Challenge,
  requestId: string,
  requestHash: string,
  serviceUrl = config.parserUrl,
  recipient = config.parserRecipient,
) {
  if (
    challenge.method !== "sui" ||
    challenge.intent !== "charge" ||
    challenge.realm !== new URL(serviceUrl).host ||
    challenge.request.amount !== PARSE_AMOUNT ||
    challenge.request.currency !== USDC ||
    challenge.request.recipient !== recipient ||
    challenge.opaque?.network !== NETWORK ||
    challenge.opaque?.requestId !== requestId ||
    challenge.opaque?.requestHash !== requestHash ||
    !challenge.expires ||
    !Number.isFinite(Date.parse(challenge.opaque?.issuedAt || "")) ||
    Date.parse(challenge.expires) <= Date.parse(challenge.opaque!.issuedAt) ||
    Date.parse(challenge.expires) - Date.parse(challenge.opaque!.issuedAt) >
      5 * 60000
  )
    throw new AppError(
      422,
      "UNSAFE_QUOTE",
      "The parser quote does not match the approved service, recipient, network, token and price.",
    );
}
export function makeChallenge(
  requestId: string,
  requestHash: string,
  now = Date.now(),
) {
  return Challenge.from({
    secretKey: config.parserSecret,
    realm: new URL(config.origin).host,
    method: "sui",
    intent: "charge",
    expires: new Date(now + 5 * 60000).toISOString(),
    description: "Runway invoice draft extraction",
    request: {
      amount: PARSE_AMOUNT,
      currency: USDC,
      recipient: config.parserRecipient,
    },
    meta: {
      requestId,
      requestHash,
      network: NETWORK,
      issuedAt: new Date(now).toISOString(),
    },
  });
}
export function serializeReceipt(digest: string) {
  return Receipt.serialize(
    Receipt.from({
      method: "sui",
      reference: digest,
      status: "success",
      timestamp: new Date().toISOString(),
    }),
  );
}
export class SuiToolWallet implements ToolWallet {
  private signer = Ed25519Keypair.fromSecretKey(config.toolWalletKey);
  private chain = new TatumAdapter();
  readonly address = this.signer.toSuiAddress();
  async prepare(challenge: Challenge.Challenge, gasBudget: number) {
    let prepared: Omit<PreparedPayment, "credential"> | undefined;
    const client = this.chain.coreClient();
    const method = sui({
      client,
      signer: this.signer,
      currency,
      execute: async (transaction) => {
        transaction.setGasBudget(gasBudget);
        const bytes = await transaction.build({ client });
        const signed = await this.signer.signTransaction(bytes);
        const digest = await Transaction.from(bytes).getDigest();
        prepared = {
          digest,
          transactionBytes: toBase64(bytes),
          signature: signed.signature,
        };
        // The reference client generates its grief-protection proof from this
        // digest. The coordinator persists ALL signed material before broadcast.
        return { digest };
      },
    });
    const credential = await method.createCredential({
      challenge: challenge as Parameters<
        typeof method.createCredential
      >[0]["challenge"],
    });
    if (!prepared) throw new Error("Payment was not prepared");
    const proof = Credential.deserialize<{ digest: string }>(credential);
    if (proof.payload.digest !== prepared.digest)
      throw new Error("Prepared digest mismatch");
    return { ...prepared, credential };
  }
  async broadcast(payment: PreparedPayment) {
    await this.chain.coreClient().executeTransaction({
      transaction: fromBase64(payment.transactionBytes),
      signatures: [payment.signature],
      include: { effects: true },
    });
  }
  async state(digest: string): Promise<"settled" | "failed" | "unknown"> {
    try {
      const result = await this.chain
        .coreClient()
        .getTransaction({ digest, include: { effects: true } });
      const tx = result.Transaction || result.FailedTransaction;
      if (tx.digest !== digest || !tx.checkpoint) return "unknown";
      return tx.status.success ? "settled" : "failed";
    } catch {
      return "unknown";
    }
  }
}

export interface ParserTransport {
  quote(requestId: string, requestHash: string): Promise<string>;
  parse(
    requestId: string,
    requestHash: string,
    text: string,
    credential: string,
  ): Promise<{ status: number; body: unknown; receipt: string | null }>;
}
export class HttpParserTransport implements ParserTransport {
  private async post(body: unknown, credential?: string) {
    const response = await fetch(config.parserUrl, {
      method: "POST",
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        ...(credential ? { Authorization: credential } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    return response;
  }
  async quote(requestId: string, requestHash: string) {
    const response = await this.post({ requestId, requestHash });
    const challenge = response.headers.get("www-authenticate");
    await response.body?.cancel();
    if (response.status !== 402 || !challenge)
      throw new AppError(
        503,
        "PARSER_QUOTE",
        "The parser did not return a priced payment challenge. No funds were reserved.",
      );
    return challenge;
  }
  async parse(
    requestId: string,
    requestHash: string,
    text: string,
    credential: string,
  ) {
    if (hash(text) !== requestHash) throw new Error("Request content changed");
    const response = await this.post(
      { requestId, requestHash, text },
      credential,
    );
    const bodyText = await response.text();
    if (bodyText.length > 20000)
      throw new Error("Parser response limit exceeded");
    return {
      status: response.status,
      body: JSON.parse(bodyText),
      receipt: response.headers.get("payment-receipt"),
    };
  }
}
