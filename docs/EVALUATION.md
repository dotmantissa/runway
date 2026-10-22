# Synthetic temporal replay

This is an engineering evaluation using authored trajectories, not a user study. The model and engine predate the fixture. The fixture was saved before execution; it is not a blinded independent benchmark. No tuning followed these results.

Reproduce with `pnpm evaluate`. Frozen inputs: [evaluation-fixture.json](evaluation-fixture.json). Complete predictions and exclusions: [evaluation.json](evaluation.json). The report hashes its fixture and each forecast's training/current inputs.

There are five trajectories: persistent delay, punctual payment, improving timing, alternating delay and sparse history. For each prospective invoice, only outcomes resolved before that invoice's forecast instant are eligible. The engine uses the latest eight active outcomes, requires four and rounds a two-value median up to an integer day. All 35 opportunities are reported: 16 predictions and 19 cases without enough history. The sparse series contributes no eligible forecasts.

| Metric                                             | Promised-date baseline | History median |
| -------------------------------------------------- | ---------------------: | -------------: |
| Mean absolute timing error                         |            1.9375 days |    2.1875 days |
| Median absolute timing error                       |               0.5 days |       2.5 days |
| True fixed-bill exposure detections                |                      0 |              3 |
| False exposure alarms                              |                      0 |              7 |
| Missed actual exposures                            |                      5 |              2 |
| Correct non-exposure cases                         |                     11 |              4 |
| Observed reserve breaches after proposed actions   |                 5 / 16 |         2 / 16 |
| Total proposed reductions across independent cases |                 0 USDC |     1,500 USDC |
| Reduction beyond hindsight minimum                 |                 0 USDC |     1,050 USDC |

For each prediction, the proposed action is fixed before revealing the held-out receipt date. The replay then applies that same proposal to the realized synthetic receipt timing. It does not optimize again and call the new answer the original proposal. The hindsight minimum is reported only as a restriction-cost comparator. A zero reduction can have zero excess restriction while still breaching the reserve.

History performs worse on average timing error in this mixture. It catches more exposures and reduces simulated breaches at the cost of false alarms and unnecessary spending restrictions. These tradeoffs matter: a method that always cuts spending can look protective while being unhelpful. No claim of improved forecasting, customer savings, calibrated probabilities or product-market fit follows from these results.

Real-user evaluation remains pending. Intake and observation materials are ready in [USER_STUDY_KIT.md](USER_STUDY_KIT.md). Temporal splits must be frozen before inspecting usable redacted histories, with consent and source labels preserved. Do not relabel synthetic rows as users or discard adverse trajectories to improve the reported metric.
