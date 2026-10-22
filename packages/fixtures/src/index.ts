import {
  addDays,
  parseMoney,
  type Account,
  type Client,
  type Expense,
  type Invoice,
  type Outcome,
  type Policy,
} from "../../domain/src/index.js";
export const FIXTURE_CLOCK = "2026-10-29T10:00:00.000Z";
export function hero() {
  const accounts: Account[] = [
    {
      id: "sample-funds",
      alias: "Confirmed funds",
      kind: "manual",
      amountAtomic: parseMoney("800"),
      included: true,
      confirmedAt: FIXTURE_CLOCK,
      version: 1,
      source: "synthetic_replay",
    },
  ];
  const clients: Client[] = [
    { id: "cedar", alias: "Cedar Studio", version: 1 },
  ];
  const invoices: Invoice[] = [
    {
      id: "cedar-oct",
      clientId: "cedar",
      invoiceReference: "CED-2026-10",
      amountAtomic: parseMoney("1200"),
      paidAtomic: "0",
      dueDate: "2026-10-30",
      timezone: "Africa/Lagos",
      version: 1,
      status: "expected",
    },
  ];
  const expenses: Expense[] = [
    {
      id: "purchase",
      label: "Saturday's purchase",
      amountAtomic: parseMoney("250"),
      dueDate: "2026-10-31",
      kind: "flexible",
      maxReductionAtomic: parseMoney("250"),
      status: "planned",
      version: 1,
    },
    {
      id: "rent",
      label: "Rent",
      amountAtomic: parseMoney("600"),
      dueDate: "2026-11-02",
      kind: "fixed",
      maxReductionAtomic: "0",
      status: "planned",
      version: 1,
    },
  ];
  const outcomes: Outcome[] = [3, 4, 4, 5].map((delay, i) => {
    const dueDate = ["2026-07-24", "2026-08-21", "2026-09-18", "2026-10-16"][i];
    return {
      id: `cedar-outcome-${i + 1}`,
      invoiceId: `cedar-history-${i + 1}`,
      clientId: "cedar",
      dueDate,
      paidDate: addDays(dueDate, delay),
      amountAtomic: parseMoney("1200"),
      source: "synthetic_replay",
      recordedAt: FIXTURE_CLOCK,
    };
  });
  const policy: Policy = {
    reserveAtomic: parseMoney("100"),
    horizonDays: 14,
    timezone: "Africa/Lagos",
    version: 1,
  };
  return { accounts, clients, invoices, expenses, outcomes, policy };
}
