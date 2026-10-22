# Runway: evidence required for the 9/10 target

This is a protocol for future work. **No interviews, prototype trials, forecasting evaluation or live integration tests have been completed.** A feature list alone does not justify raising the earlier 7/10 assessment. The 9/10 target is a subjective judgment of competitiveness after evidence, not a 90% chance of winning.

## 1. Validate the decision before expanding the product

By **24 October**, conduct five 20–30 minute interviews. Seek stablecoin-paid freelancers first; record which participants actually use stablecoins and which use Sui. Broader freelancers can validate payment-timing pain, but not demand for this settlement rail. These are builder-run research tasks; this plan does not authorize automated outreach.

Ask about behavior before showing the concept:

1. “Show me the last invoice that arrived after you expected it.” Capture the promised date, received date and current workaround.
2. “What bill or spending decision overlapped that delay?” Capture a concrete consequence: fee, borrowing, postponed purchase, missed obligation or time spent coordinating. A remembered worry alone is weaker evidence than a dated decision.
3. “What information did you use when deciding what to spend?” Look for wallet balances, invoice sheets, calendar reminders or client-specific rules.
4. “What could you actually have reduced, and what could not move?” Record explicit constraints rather than suggesting that rent can wait.
5. “Would you share a redacted history and try the prototype on that episode?” Ask separately for permission to quote or publish any record. Participation is not consent to put financial data on Mainnet.

Maintain an anonymized evidence table: participant alias, segment/rail, delay episode, financial consequence, existing workaround, permitted adjustment, record availability and consent scope. Store raw/redacted records privately; publish only explicitly consented aggregates or quotes. A local redacted replay does not require writing personal records to the managed relayer. Explain its plaintext visibility before any real-data memory write.

**Commitment gate:** at least three of the five participants can describe a concrete delay that affected a dated obligation or spending decision; at least two provide usable redacted histories; at least two agree to a prototype trial. Each usable history needs promised and actual dates for at least four resolved invoices for one client, a dated obligation and a plausible flexible-spend constraint. Seek at least five, preferably eight, resolved invoices so a four-outcome history can predict a held-out outcome. Four total invoices support descriptive timing, not a persuasive held-out performance claim. Evidence can be onchain or user-confirmed offchain, with that distinction retained.

For the stronger stablecoin-specific claim, those consequential episodes must include at least three actual stablecoin-paid participants. If Sui users cannot be reached, state that Sui adoption remains unvalidated. If only broader freelancer evidence is available, ship with an explicitly broader segment hypothesis and retain the lower confidence in the 9/10 target. These small-sample thresholds guide build allocation; they do not establish market size or product-market fit.

If the pain gate fails, review the actual episodes before committing to a pivot. An expense watchdog is a candidate only if the evidence supports it. Missing records means a synthetic demo is still possible, but it cannot substantiate customer learning or savings.

## 2. Test whether the distinctive feature changes a usable decision

By **6 November**, run three observed prototype sessions, recruiting the two initial volunteers and a third participant. Use their redacted episode where permitted; otherwise clearly label the supplied scenario. Keep the same script and avoid explaining the answer first.

Ask each participant to identify the exposed obligation/date, explain confirmed money versus forecast income, choose an allowed adjustment, and explain why the recommendation changed. Record completion, errors, whether coaching was needed, time taken and why they accept or reject the proposed action. Acceptance alone is insufficient: a reasonable user can reject a feasible proposal because an unmodeled preference matters.

**Usability gate:** at least two of three complete all four tasks without coaching, propose or recognize a feasible action, and correctly say that a future invoice is not spendable cash. Both initial volunteers must review their own constraints and identify whether the prototype missed anything material. Capture at least one change made in response to feedback and retest that issue. A user who thinks anticipated receipts are confirmed funds is a release-blocking presentation problem; fix it before the final demo.

Publish actual counts and representative consented evidence. Three trial users cannot establish retention, sustained savings or adoption. Do not convert a simulated gap into money saved for a customer.

## 3. Isolate the value of historical memory

Freeze a fixture's current confirmed funds, unpaid expenses, invoice promise, planning horizon, reserve/reduction rules, account scope, model/prompt and engine versions. Derived client statistics and historical chat are excluded from these current inputs. The history manifest contains required IDs/version metadata, not precomputed forecasts.

| Condition | History supplied | Expected interpretation |
| --- | --- | --- |
| **A: no history** | None; no chat or historical cache. | Insufficient-history label; show the client's promised-date scenario and no-receipt stress separately. |
| **B: Walrus history** | Required records recalled from completed Mainnet memories with versions/provenance checked. | Client timing estimate, exposure and proposal derived from those records. |
| **C: Postgres history** | Exactly the same normalized records supplied directly from the database. | Identical deterministic statistics, timeline and action to B. |

Run B in a fresh process/session without the original chat or cached historical outcomes. It may read the identical current financial state from Postgres; it must obtain its historical evidence through Walrus. Capture current-input hash, engine version, retrieved record IDs/content hashes, timing estimate, timeline, gap and action. Compare engine outputs, not whether LLM prose happens to be identical. Missing history is an incomplete-retrieval failure, not condition A.

**Controlled-demo gate:** A and B use identical current-input hashes; the hero shows Friday versus Tuesday and the 150 USDC action using the referenced history; B and C match exactly; the fresh B runtime matches the first B runtime; correcting a policy supersedes its old version even when recall returns both. All required memories must be completed and verifiably recalled. This establishes useful historical context and cross-runtime continuity. It does not prove that Walrus is intrinsically more predictive than another store containing the same data.

The no-history no-receipt stress also proposes 150 USDC in the hero. The memory advantage is a client-specific reason to take the delay seriously, not exclusive ability to perform conservative arithmetic. Evaluate whether this specificity helps users act and avoids unnecessary adjustments for reliably punctual clients.

## 4. Verify money and correction behavior with exact cases

Use the dated [hero scenario](BUILD_PLAN.md#the-hero-demo). Its horizon is 29 October–4 November 2026. It is a synthetic fixture, distinct from live Mainnet funds.

| Case | Required output |
| --- | --- |
| Promised Friday receipt | After Monday rent: 1,150 USDC projected; no action needed for that scenario; available-now still 0 and commitment shortage 150. |
| Median four-day delay | Tuesday receipt; Monday balance -50; rent gap 50; reserve-floor gap 150; reduce purchase 250→100. |
| No receipt through 4 November | Same 150 reduction preserves floor throughout this supplied horizon; does not claim coverage of later undisclosed bills. |
| Purchase reduction capped at 100 | Proposed maximum leaves Monday at 50; reserve-floor gap 50 remains; no feasible plan under the current rules. |
| Reserve corrected 100→50 | Proposed reduction becomes 100; Monday ends at 50. Latest confirmed version applies, available-now remains 0. |
| Reliable on-time client | History does not invent a delay; expected invoice still excluded from available-now; no-receipt stress remains visible. |
| New client | Insufficient history; no precise personalized arrival probability; no invented late-payment memory. |
| Receipt and rent on same date, time unknown | Evaluate outflow first; do not presume the uncertain receipt can fund the earlier obligation. |
| Wrong client association corrected | Remove the superseded association from that client's timing statistics and recompute both affected clients. |
| Missing required memory/stale RPC | Incomplete-history/stale-state message; no fresh claim of verified money or reconstructed history. |

Engine verification also covers receipt allocation once, partial and ambiguous payments, pending-transfer reservations, wrong token/recipient and accepted-versus-proposed actions. Authentication and invoice prompt-injection checks remain part of the [technical acceptance cases](BUILD_PLAN.md#evaluate-improvement-honestly). Optional payment/recovery cases apply only if those features ship.

## 5. Measure forecasting and action quality without overstating it

Freeze a temporal evaluation split before tuning. For each held-out invoice, use only outcomes already resolved at the forecast time. Start with the exact scenario cases above, then replay all usable redacted histories; never select only favorable delayed payments. Add labeled synthetic punctual, delayed, sparse-history and correction trajectories for coverage. Record forecasts before revealing the replay outcome. Imported historical event times and current Mainnet write times remain separate.

Report median-lateness prediction error against the promised-date baseline, exposed-obligation detection, observed-timeline reserve breaches, and total recommended spending reductions. A model that always cuts spending may avoid gaps while imposing needless restrictions; show both coverage and adjustment cost. Brier scores require an explicitly defined comparable probability baseline and paid-by-date resolution rule. The four-delay example alone cannot demonstrate calibration or meaningful statistical generalization.

For a favorable stronger assessment, the held-out replay should show lower timing error than the promised-date baseline and at least one correctly detected delay exposure with a feasible action, while the punctual control avoids unnecessary cuts in its history-based scenario. Publish denominators, every failed case and the data's synthetic/consented source. If the empirical model fails to improve, change it or report that result and keep the competitiveness assessment conditional. Do not tune against the test set and relabel it held out.

## 6. Assemble the evidence a judge can inspect

The final package should contain anonymized interview/trial counts, the same-input comparison, reproducible scenario fixtures, actual replay results, versioned decision references, at least ten completed Mainnet memory IDs, and a separate small invoice settlement verified through Tatum. Add paid-tool evidence only if it passes its own reliability gate.

The 9/10 target becomes defensible only when the product-specific user evidence, usable stress-test action, controlled continuity proof and required sponsor integrations all pass. Until then, describe Runway as a stronger proposed concept. Competitor quality and judging remain unknown.
