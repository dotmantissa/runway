import { expect, it } from "vitest";
import { TatumAdapter } from "./index.js";
import { USDC } from "../../../../../packages/domain/src/index.js";
const address = "0x" + "1".repeat(64),
  sender = "0x" + "2".repeat(64);
function adapter(tx: unknown) {
  const a = new TatumAdapter();
  (a as any).metadataVerified = true;
  (a as any).getClient = () => ({
    getTransaction: async () => tx,
    getBalance: async () => ({ balance: { balance: "1234567" } }),
  });
  return a;
}
function transaction() {
  return {
    $kind: "Transaction",
    Transaction: {
      digest: "test-digest",
      status: { success: true },
      checkpoint: "123",
      timestampMs: 1760000000000,
      effects: {},
      transaction: { sender },
      balanceChanges: [{ address, coinType: USDC, amount: "1000000" }],
    },
  };
}
it("counts total balance once and proves only positive native USDC credit", async () => {
  const tx = transaction();
  tx.Transaction.balanceChanges.push({
    address,
    coinType: USDC,
    amount: "-400000",
  });
  const a = adapter(tx);
  expect((await a.balance(address)).amountAtomic).toBe("1234567");
  expect((await a.receipt("test-digest", address)).amountAtomic).toBe("600000");
});
it("rejects missing effects, failed execution, wrong token and wrong recipient", async () => {
  const tx = transaction();
  tx.Transaction.status.success = false;
  await expect(adapter(tx).receipt("test-digest", address)).rejects.toThrow(
    "did not complete",
  );
  const incomplete = transaction();
  delete (incomplete.Transaction as any).effects;
  await expect(
    adapter(incomplete).receipt("test-digest", address),
  ).rejects.toThrow("enough confirmed");
  const wrong = transaction();
  wrong.Transaction.balanceChanges[0].coinType = "0x2::sui::SUI";
  await expect(adapter(wrong).receipt("test-digest", address)).rejects.toThrow(
    "incoming native USDC",
  );
  await expect(
    adapter(transaction()).receipt("test-digest", sender),
  ).rejects.toThrow("incoming native USDC");
});
