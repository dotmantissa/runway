import { mkdir, rename, writeFile } from "node:fs/promises";
import { TatumAdapter } from "../apps/server/src/adapters/tatum/index.js";
import { config } from "../apps/server/src/config.js";
const adapter = new TatumAdapter();
try {
  const metadata = await adapter.metadata();
  const address =
    process.env.SMOKE_SUI_ADDRESS ||
    "0x0000000000000000000000000000000000000000000000000000000000000001";
  const balance = await adapter.balance(address);
  const receipt = process.env.SMOKE_RECEIPT_DIGEST
    ? await adapter.receipt(process.env.SMOKE_RECEIPT_DIGEST, address)
    : null;
  const evidence = {
    checkedAt: new Date().toISOString(),
    provider: config.tatumUrl,
    network: "mainnet",
    transport: "native-grpc-http2",
    authenticated: true,
    metadata,
    balance,
    receipt,
    discovery: "known-digest only; automatic discovery disabled",
  };
  await mkdir("research", { recursive: true });
  await writeFile(
    "research/tatum-smoke.json.tmp",
    JSON.stringify(evidence, null, 2) + "\n",
    { mode: 0o600 },
  );
  await rename("research/tatum-smoke.json.tmp", "research/tatum-smoke.json");
  const publicEvidence = {
    ...evidence,
    balance: {
      state: "verified",
      checkedAt: balance.checkedAt,
      source: balance.source,
      provider: balance.provider,
    },
    receipt: receipt
      ? {
          state: "verified",
          checkedAt: evidence.checkedAt,
          coinType: receipt.coinType,
          source: receipt.source,
          provider: receipt.provider,
          checks: [
            "Requested digest matches a successful checkpointed transaction",
            "Positive net native-USDC credit to the supplied recipient",
            "Sender, effects and settlement timestamp present",
          ],
          scope:
            "Adapter verification; authenticated invoice allocation pending",
        }
      : null,
    privacy:
      "Wallet identifiers and financial details are retained only in ignored local evidence",
  };
  await mkdir("docs", { recursive: true });
  await writeFile(
    "docs/tatum-gate.json.tmp",
    JSON.stringify(publicEvidence, null, 2) + "\n",
  );
  await rename("docs/tatum-gate.json.tmp", "docs/tatum-gate.json");
  console.log(JSON.stringify(evidence, null, 2));
} catch (e) {
  console.error(e instanceof Error ? e.message : "Tatum smoke failed.");
  process.exitCode = 1;
}
