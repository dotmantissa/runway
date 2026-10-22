import { z } from "zod";
import { validDate } from "../../domain/src/index.js";
export const atomic = z
  .string()
  .regex(/^(0|[1-9]\d*)$/)
  .max(24);
export const positiveAtomic = atomic.refine(
  (v) => BigInt(v) > 0n,
  "Amount must be greater than zero.",
);
export const date = z
  .string()
  .refine(validDate, "Enter a valid calendar date.");
export const timezone = z.string().refine((v) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: v });
    return true;
  } catch {
    return false;
  }
}, "Choose a valid timezone.");
export const name = z.string().trim().min(1).max(80);
export const version = z.number().int().positive();
export const address = z
  .string()
  .regex(/^0x[0-9a-fA-F]{1,64}$/)
  .transform((v) => "0x" + v.slice(2).toLowerCase().padStart(64, "0"));
export const invoiceCreate = z.object({
  clientId: name,
  invoiceReference: name,
  amountAtomic: positiveAtomic,
  dueDate: date,
  timezone,
  expectedStateVersion: version,
});
export const expenseCreate = z
  .object({
    label: name,
    amountAtomic: positiveAtomic,
    dueDate: date,
    kind: z.enum(["fixed", "flexible"]),
    maxReductionAtomic: atomic,
    hasNotOccurredToday: z.boolean().optional(),
    expectedStateVersion: version,
  })
  .refine(
    (v) => BigInt(v.maxReductionAtomic) <= BigInt(v.amountAtomic),
    "The permitted reduction cannot exceed the amount.",
  )
  .refine(
    (v) => v.kind !== "fixed" || v.maxReductionAtomic === "0",
    "Fixed bills cannot be reduced.",
  );
export const policyUpdate = z.object({
  reserveAtomic: atomic,
  horizonDays: z.number().int().min(1).max(14),
  timezone,
  expectedStateVersion: version,
});
export const planPreview = z.object({
  scenario: z.enum([
    "promised",
    "history_median",
    "observed_latest",
    "no_receipt",
  ]),
  historyMode: z.enum(["none", "walrus", "postgres"]),
  expectedStateVersion: version,
});
export const planAccept = z.object({
  expectedStateVersion: version,
  currentInputHash: z.string().length(64),
  confirmedAdjustments: z
    .array(
      z.object({
        expenseId: name,
        expectedExpenseVersion: version,
        newAmountAtomic: atomic,
      }),
    )
    .max(8),
});
export const offchain = z.object({
  amountAtomic: positiveAtomic,
  paidDate: date,
  source: z.literal("user_confirmed"),
  expectedStateVersion: version,
});
export const csvRow = z.object({
  client_alias: name,
  invoice_reference: name,
  amount_usdc: z.string(),
  due_date: date,
  paid_date: z.union([date, z.literal("")]).default(""),
  source: z.enum(["user_confirmed", ""]).default(""),
});
