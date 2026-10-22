import assert from "node:assert/strict";
import { readFile, writeFile, rename } from "node:fs/promises";
import {
  addDays,
  daysBetween,
  plan,
  timing,
  type Outcome,
  type PlanningInput,
} from "../packages/domain/src/index.js";
import { hash } from "../apps/server/src/services/state.js";
import { hero } from "../packages/fixtures/src/index.js";

const fixture = JSON.parse(
  await readFile("docs/evaluation-fixture.json", "utf8"),
);
const h = hero();
const rows: any[] = [],
  excluded: any[] = [];
for (const series of fixture.series) {
  const outcomes: Outcome[] = series.delaysDays.map(
    (delay: number, i: number) => {
      const dueDate = `2026-${String(i + 1).padStart(2, "0")}-15`;
      return {
        id: `${series.id}-${i}`,
        invoiceId: `${series.id}-invoice-${i}`,
        clientId: series.id,
        dueDate,
        paidDate: addDays(dueDate, delay),
        amountAtomic: fixture.invoiceAtomic,
        source: "synthetic_replay",
        recordedAt: addDays(dueDate, delay) + "T18:00:00.000Z",
      };
    },
  );
  for (const [i, heldOut] of outcomes.entries()) {
    const forecastAt = heldOut.dueDate + "T00:00:00.000Z";
    const history = outcomes
      .slice(0, i)
      .filter((o) => o.recordedAt < forecastAt);
    const stats = timing(history, series.id);
    if (stats.medianDelay === undefined) {
      excluded.push({
        series: series.id,
        invoiceId: heldOut.invoiceId,
        reason: "insufficient_history",
        sampleCount: history.length,
      });
      continue;
    }
    assert.ok(history.every((o) => o.recordedAt < forecastAt));
    assert.ok(!history.some((o) => o.id === heldOut.id));
    const input: PlanningInput = {
      stateVersion: 1,
      asOf: forecastAt,
      localToday: heldOut.dueDate,
      horizonEnd: addDays(heldOut.dueDate, 10),
      timezone: "UTC",
      confirmedFundsAtomic: fixture.openingAtomic,
      reserveFloorAtomic: fixture.reserveAtomic,
      pendingAtomic: "0",
      expenses: h.expenses.map((e) => ({
        ...e,
        dueDate: addDays(heldOut.dueDate, e.kind === "fixed" ? 3 : 1),
      })),
      invoices: [
        {
          ...h.invoices[0],
          id: heldOut.invoiceId,
          clientId: series.id,
          dueDate: heldOut.dueDate,
        },
      ],
    };
    // Forecast and proposal are fixed before using the held-out actual receipt date.
    const predicted = plan(input, history, "history_median", "postgres");
    const baseline = plan(input, [], "promised", "none");
    const actualInput = {
      ...input,
      invoices: input.invoices.map((inv) => ({
        ...inv,
        dueDate: heldOut.paidDate,
      })),
    };
    const actual = plan(actualInput, [], "promised", "none");
    const apply = (proposal: typeof predicted) =>
      plan(
        {
          ...actualInput,
          expenses: actualInput.expenses.map((e) => {
            const adjustment = proposal.adjustments.find(
              (a) => a.expenseId === e.id,
            );
            return adjustment
              ? { ...e, amountAtomic: adjustment.newAmountAtomic }
              : e;
          }),
        },
        [],
        "promised",
        "none",
      );
    const predictedReplay = apply(predicted),
      baselineReplay = apply(baseline);
    const actualDelay = daysBetween(heldOut.dueDate, heldOut.paidDate);
    rows.push({
      series: series.id,
      invoiceId: heldOut.invoiceId,
      forecastAt,
      trainingIds: history.map((o) => o.id),
      trainingHash: hash(history),
      inputHash: hash(input),
      actualDelayDays: actualDelay,
      predictedDelayDays: stats.medianDelay,
      promisedAbsoluteErrorDays: Math.abs(actualDelay),
      historyAbsoluteErrorDays: Math.abs(stats.medianDelay - actualDelay),
      actualFixedBillExposed: !!actual.firstExposedFixedBill,
      predictedFixedBillExposed: !!predicted.firstExposedFixedBill,
      promisedFixedBillExposed: !!baseline.firstExposedFixedBill,
      historyReductionAtomic: predicted.totalReductionAtomic,
      promisedReductionAtomic: baseline.totalReductionAtomic,
      oracleMinimumReductionAtomic: actual.totalReductionAtomic,
      historyExcessReductionAtomic: (BigInt(predicted.totalReductionAtomic) >
      BigInt(actual.totalReductionAtomic)
        ? BigInt(predicted.totalReductionAtomic) -
          BigInt(actual.totalReductionAtomic)
        : 0n
      ).toString(),
      historyObservedReserveBreach: !!predictedReplay.firstReserveBreach,
      promisedObservedReserveBreach: !!baselineReplay.firstReserveBreach,
    });
  }
}
const mean = (key: string) =>
  rows.reduce((s, r) => s + r[key], 0) / rows.length;
const median = (key: string) => {
  const v = rows.map((r) => r[key]).sort((a, b) => a - b);
  return (v[(v.length - 1) >> 1] + v[v.length >> 1]) / 2;
};
const sum = (key: string) =>
  rows.reduce((s, r) => s + BigInt(r[key]), 0n).toString();
const classification = (key: string) => ({
  truePositive: rows.filter((r) => r.actualFixedBillExposed && r[key]).length,
  falsePositive: rows.filter((r) => !r.actualFixedBillExposed && r[key]).length,
  falseNegative: rows.filter((r) => r.actualFixedBillExposed && !r[key]).length,
  trueNegative: rows.filter((r) => !r.actualFixedBillExposed && !r[key]).length,
});
assert.equal(rows.length, 16);
const report = {
  state: "completed",
  source: "synthetic_replay",
  fixtureHash: hash(fixture),
  evaluatedAt: new Date().toISOString(),
  engineVersion: plan(
    {
      stateVersion: 1,
      asOf: "2026-10-29T10:00:00.000Z",
      localToday: "2026-10-29",
      horizonEnd: "2026-11-04",
      timezone: "UTC",
      confirmedFundsAtomic: "800000000",
      reserveFloorAtomic: "100000000",
      pendingAtomic: "0",
      expenses: h.expenses,
      invoices: h.invoices,
    },
    h.outcomes,
    "history_median",
    "postgres",
  ).engineVersion,
  protocol:
    "Rolling temporal evaluation; minimum four resolved outcomes, latest eight per client, integer ceil median. All trajectories and held-out rows reported. Fixed bills evaluated before uncertain same-day receipts. Actions evaluated against actual receipt dates without optimizing again.",
  counts: {
    trajectories: fixture.series.length,
    eligiblePredictions: rows.length,
    insufficientHistory: excluded.length,
    realParticipants: 0,
    realInvoices: 0,
  },
  metrics: {
    promisedMeanAbsoluteErrorDays: mean("promisedAbsoluteErrorDays"),
    historyMeanAbsoluteErrorDays: mean("historyAbsoluteErrorDays"),
    promisedMedianAbsoluteErrorDays: median("promisedAbsoluteErrorDays"),
    historyMedianAbsoluteErrorDays: median("historyAbsoluteErrorDays"),
    historyExposure: classification("predictedFixedBillExposed"),
    promisedExposure: classification("promisedFixedBillExposed"),
    historyObservedReserveBreaches: rows.filter(
      (r) => r.historyObservedReserveBreach,
    ).length,
    promisedObservedReserveBreaches: rows.filter(
      (r) => r.promisedObservedReserveBreach,
    ).length,
    historyTotalReductionAtomic: sum("historyReductionAtomic"),
    promisedTotalReductionAtomic: sum("promisedReductionAtomic"),
    historyExcessReductionAtomic: sum("historyExcessReductionAtomic"),
  },
  rows,
  excluded,
  limitations: [
    "Authored synthetic trajectories verify engineering behavior, not customer benefit or empirical forecasting accuracy.",
    "No independent redacted user history or observed trial has been supplied. No user held-out evaluation is complete.",
    "Model and engine existed before the fixture. Fixture is frozen before this run but is not a blinded independent benchmark.",
    "All adverse cases are retained, including changing-pattern and alternating delays; unnecessary spending restrictions are reported.",
    "No probabilities, calibration, product-market fit or financial savings claims.",
  ],
};
await writeFile(
  "docs/evaluation.json.tmp",
  JSON.stringify(report, null, 2) + "\n",
);
await rename("docs/evaluation.json.tmp", "docs/evaluation.json");
console.log(
  JSON.stringify({ counts: report.counts, metrics: report.metrics }, null, 2),
);
