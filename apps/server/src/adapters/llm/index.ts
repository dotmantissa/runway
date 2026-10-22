import { formatMoney, type PlanResult } from '../../../../../packages/domain/src/index.js';
export function explain(result:PlanResult) {
  const t=result.uncertainty;
  const history=t.medianDelay!==undefined?`The latest ${t.sampleCount} resolved payments have a median delay of ${t.medianDelay} days. `:'';
  const action=result.adjustments.length?`Reducing ${result.adjustments.map(a=>`${a.label} by ${formatMoney(a.reductionAtomic)} USDC`).join(' and ')} ${result.feasible?'preserves your reserve at every modeled date':'improves the later balance, but leaves an earlier gap'}. `:result.feasible?'No spending change is needed for this scenario. ':'The permitted spending changes cannot cover this gap. ';
  return {answer:history+action+`Expected payments are separate from your ${formatMoney(result.confirmedFundsAtomic)} USDC in confirmed funds.`,citedRecordIds:result.selectedHistoryRecordIds,provider:'deterministic',suggestedScenario:result.dependsOnUnsettledReceipt?'no_receipt':undefined};
}
