import { mkdir, writeFile } from "node:fs/promises";
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
  await mkdir("docs", { recursive: true });
  await writeFile(
    "docs/tatum-gate.json",
    JSON.stringify(evidence, null, 2) + "\n",
  );
  console.log(JSON.stringify(evidence, null, 2));
} catch (e) {
  console.error(e instanceof Error ? e.message : "Tatum smoke failed.");
  process.exitCode = 1;
}
