# Delivery plan: 21 October–10 November 2026

> Implementation update, 22 October 2026: code and the core deployment are complete. Thirteen synthetic Mainnet records, fresh-process parity and remote correction proof are verified. The [submission package](docs/SUBMISSION.md), published build story and captioned recording are prepared; [synthetic evaluation](docs/EVALUATION.md) retains adverse results. Interviews/trials, owner-authenticated allocation, a funded parser purchase, eligibility/contact review and actual submission remain open. The schedule and checklist below preserve the original plan, not a current completion ledger.

The hard deadline is **10 November, 17:00 UTC / 18:00 Lagos**. Target a complete submission by **9 November, 17:00 UTC**. The plan assumes approximately 120 focused builder hours plus contingency. If capacity is below 80 hours, cut optional awards and follow the reduced scope below.

Execute the detailed [architecture](ARCHITECTURE.md), [frontend specification](DESIGN_SPEC.md) and [work packages](IMPLEMENTATION.md). Frontend composition, logo, copy and original circle motion start on 23–24 October and develop throughout the finance/memory slices; 7–8 November is final polish, not the first design pass.

## Critical path and gates

```text
accounts and compatible APIs
  → completed Mainnet memory write + authenticated Tatum read
  → user-evidence gate + exact dated stress-test prototype
  → invoice reconciliation and constrained action engine
  → same-input historical-memory comparison + correction
  → fresh-runtime continuity + observed user trials
  → held-out evaluation and hosted demo
  → public repo + blog + video + submission
```

Agent payments run only after the finance/memory and user-evidence gates pass. AI Builder must be decided at the beginning if its award matters; a shell generated at the end would not honestly establish “built primarily” there. The [validation protocol](VALIDATION.md) defines evidence that must be collected, not achievements already claimed.

| Dates            | Milestone                                                                                                                             | Exit evidence / time estimate                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **21–22 Oct**    | Validate accounts/rules, recruit interviews and try AI Builder export if pursuing that award.                                         | Authenticated Mainnet Tatum reads; completed MemWal write/recall; versions/transport recorded. **8h**                                                             |
| **23–24 Oct**    | Five interviews/evidence gate, original logo/tokens/copy/landing foundation and stress-test prototype; at most 2h optional MPP spike. | Three consequential episodes, two usable histories, two volunteers; deliberate responsive foundation and exact 150 USDC fixture. Segment gaps documented. **14h** |
| **25–27 Oct**    | Scoped auth, sample mode, invoice/expense UI, versioned action engine, receipt verification and durable jobs.                         | Complete financial browser journey, real small Tatum receipt, exact feasible/infeasible cases and acceptance concurrency. **20h**                                 |
| **28–30 Oct**    | Outcome/action memory, policies, evidence/explanation drawers and controlled A/B/C comparison.                                        | At least 10 completed/recalled memories; same current-input hash; Monday exposure/150 adjustment; exact Walrus/Postgres output parity. **20h**                    |
| **31 Oct–2 Nov** | Fresh-runtime continuity, superseding corrections, reliability and first two volunteer trials. Broad recovery stays optional.         | Fresh history retrieval matches; stale/missing records handled; current policy wins; observed feedback recorded and material issues fixed. **14h**                |
| **3–4 Nov**      | Conditional paid parser with budget/replay/job recovery; otherwise improve user feedback and evaluation.                              | Payment feature ships only if full reliability checks pass within **8h**; cut it if unfinished. Real digest/output required.                                      |
| **5–6 Nov**      | Third user trial, retest feedback fixes and frozen chronological evaluation.                                                          | Two of three users complete decision tasks without coaching; actual results, denominators and synthetic/consented/live split published. **12h**                   |
| **7–8 Nov**      | Finish responsive/motion/copy/logo/favicon quality, deploy demo, write blog/README and record 2–3 minute video.                       | Browser/keyboard/reduced-motion checks, working public routes, real evidence, clean secrets and retention. **16h**                                                |
| **9 Nov**        | Feature freeze, clean-room setup and full submission rehearsal.                                                                       | Fresh clone builds, actual sponsor paths work, links accessible, required IDs ready. **8h**                                                                       |
| **10 Nov**       | Final checks and submission only.                                                                                                     | Submit well before 17:00 UTC; retain confirmation. Keep emergency margin.                                                                                         |

Total planned work: **120h**. Keep approximately **20h additional contingency** for hosted API instability, transport/version differences, deployment and video retakes. These are estimates, not observed build times.

The stronger plan reallocates existing hours: +2h for evidence/prototype work, +2h for the constrained engine and +2h for controlled memory proof, funded by -2h from broad recovery and -4h from payments. Full state export/recovery, service-selection learning and scheduled briefs are stretch work. The 9/10 target comes from a deeper core, not a larger mandatory feature set. If contingency or target-user access is unavailable, resize immediately; do not assume those resources exist.

## Scope decisions with deadlines

**22 October:** If AI Builder export cannot support maintainable server integrations, take the indie path. Keep generation history and exported code if using AI Builder. Its “primarily built” requirement needs an organizer answer; do not self-award eligibility based on one prompt.

**24 October:** Apply the validation commitment gate: three consequential episodes, two usable histories, two volunteers and explicit segment coverage. If records are unavailable, use labeled synthetic replay but do not claim validated customer learning or a 9/10 achieved rating. If the pain gate fails, review the episodes and choose an evidence-supported narrower direction before further UI work. An expense watchdog is a candidate, not an automatic pivot. A failed 2h payment spike removes payments from mandatory scope.

**27 October:** If history indexing is unreliable, limit monitoring to three known sender addresses and known digests, with a durable recent-checkpoint tail. Keep manual receipt association. A working narrow integration is more valuable than an incomplete global indexer.

The checkpoint-tail fallback also needs verified gateway support and a measured call ceiling. If unavailable or over budget, use digest verification only and remove automatic monitoring from the submitted copy.

**30 October:** If same-input A/B/C comparison cannot reproduce the timeline and 150 USDC action, stop optional work. Verify actual historical recall, no hidden database-history fallback, identical Walrus/Postgres engine results and at least ten completed records. Expected invoice income must stay excluded from available-now in every condition.

**2 November:** Require fresh-runtime history continuity, current-policy correction and the first two trials before allocating payment time. Broad recovery/export is optional. Missing records stay visible. If per-user account setup is unfinished, describe hosted memory as operator managed and demonstrate authorized continuity with the dedicated builder-owned account.

**4 November:** If payments lack reliable settlement, replay protection or bounded spending, omit that award. Preserve the rest of the submission. Do not disguise a transfer as a valid MPP/x402 paid resource flow.

**6 November:** Require two of three uncoached decision-task successes, retest any confusion about expected income, and publish held-out results including unfavorable cases. If historical forecasting fails to improve timing error, report it and revise the claim/model using a separate development set; do not alter the held-out split to manufacture improvement.

**9 November:** No new features. Fix only blockers in the complete submitted story.

## Reduced scope for less than 80 hours

Manual invoice/obligation entry, a known-digest receipt verifier, one client timing model, the bounded stress-test/action engine, 10–20 completed Mainnet memories, a citation-based explanation drawer and a fresh-session same-input demo. Keep user interviews, three small trials and the exact numeric fixture. Target Consumer Finance first place and Best Walrus Memory. Defer payments, automated imports, scheduled workers, full recovery, standalone chat and custom contracts. Keep a real tracked receipt and authenticated Tatum read so integration remains consequential.

For a two-person team, split frontend/story/evaluation from backend/memory/reconciliation. A third person can handle payments and user testing. These are human work allocations, not instructions to spawn coding subagents.

## Working budget

| Item                                             |            Planning allowance | Assumption                                                                                                  |
| ------------------------------------------------ | ----------------------------: | ----------------------------------------------------------------------------------------------------------- |
| App hosting and Postgres                         |                         $0–30 | Small demo; familiar free tier if suitable, paid worker only if necessary.                                  |
| LLM calls, parsing and evaluation                |                        $10–40 | Short evidence summaries, cached replays, bounded request volume.                                           |
| Tatum                                            | $0 initially; $20 contingency | Verify current account entitlement and actual method costs; do not assume contingency buys a specific plan. |
| Sui gas/storage fallback and tool-wallet funding |                         $5–20 | Small live transactions; hosted MemWal may front memory storage. No large demo fund transfers.              |
| Domain                                           |                         $0–15 | Optional; platform URL suffices.                                                                            |
| **Planning envelope**                            |                   **$15–125** | Not a vendor quote; excludes labor and optional AI Builder charges.                                         |

Tatum's [pricing page](https://tatum.io/pricing) currently lists 100K lifetime credits and 3 requests/second for free accounts. The [Sui page](https://tatum.io/chain/sui) says many standard methods cost 2 credits, but method weights and entitlement must be checked in the dashboard.

At that illustrative cost, 1 call/minute continuously for 20 days uses 57,600 credits; 2 calls/minute uses 115,200 before development or demos. Batch reads, cache cautiously, reconcile on user actions and use a bounded worker schedule. Streaming semantics may be billed differently and require verification. A free tier is not a license to poll many wallets indefinitely.

The managed MemWal relayer fronts storage per its docs, but quota, rate limits and retention need live checks. Do not budget generic Walrus per-GB prices as if they were the complete price of Memory operations. Keep the tool wallet separately funded and limits fixed.

## Evidence mapped to judging

| Criterion                      | What the reviewer should inspect                                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Walrus/Tatum integration — 30% | Same-input comparison shows referenced outcomes change the client timing/exposure; real Mainnet blobs and fresh recall; actual Tatum receipts/balances determine state. |
| Technical quality — 30%        | Typed boundaries, integer money, scoped auth, versioned corrections, exact receipt matching, durable jobs/cursors, observed failures and focused verification.          |
| Creativity — 20%               | Deadline stress test identifies first exposed bill and minimum permitted reduction; user episodes/trials establish its practical value.                                 |
| Presentation — 20%             | One coherent 2–3 minute story, exact 150 USDC action, working demo, reproducible setup, actual user evidence and clear source labels.                                   |
| Best Walrus Memory             | Controlled comparison, fresh runtime, superseding corrections, outcome-linked action records, Postgres parity and actual evaluation.                                    |
| Best Agent Payments            | 402 challenge → Sui settlement → useful tool output → remembered result, including safe retry behavior.                                                                 |
| Best AI Builder                | Real generation/export history and clear account of which parts were primarily built there, if eligible.                                                                |

Never assign predicted judge scores as measured achievements. Our internal candidate comparison is a selection tool.

## Submission package

- [ ] One primary track selected; no duplicate submissions per person.
- [ ] Organizer clarification obtained or ambiguity disclosed for the conflicting mission paragraph, bonus stacking, AI Builder qualification and optional Sui payment implementation.
- [ ] Public repository contains code materially advanced during 20 Oct–10 Nov, accurate license/attribution, lockfile, example environment variables without secrets, and clean setup instructions.
- [ ] Hosted working demo has a deterministic synthetic scenario plus accessible real sponsor evidence.
- [ ] Original frontend passes responsive/keyboard/reduced-motion review; authored product copy has no em dashes/emoji; original logo/favicon/manifest assets verified across routes and browser tabs.
- [ ] Actual interview/trial counts and segment coverage documented; consented evidence only; unmet validation gates disclosed.
- [ ] Same-input A/B/C fixture reproduces; fresh Walrus recall and current-policy correction verified; timing/action evaluation reports denominators and failures.
- [ ] At least 10 distinct completed Mainnet Walrus Memory records remain available during judging; report actual count and referenced blobs.
- [ ] Tatum Sui reads succeed on the submitted flow; no silent public-RPC fallback presented as Tatum.
- [ ] Blog published with product problem, implementation roles, chronological learning example, actual evaluation and trust boundaries.
- [ ] **2–3 minute demo video** published and tested without sign-in.
- [ ] Tatum dashboard account ID, Sui address, required Memory account information and `MEMWAL_AGENT_ID` delegate public key available for the form. No private keys included.
- [ ] Required contact fields, project description and build-experience fields completed.
- [ ] Blog/demo/repo links included in the description/README if no dedicated form field exists; current form rechecked before submission.
- [ ] If pursuing payments: protocol named correctly, real Sui digest, priced useful endpoint and reliable paid-job result.
- [ ] If pursuing AI Builder: actual build provenance and qualification statement ready.
- [ ] Optional X/LinkedIn post published by the builder with demo evidence. Optional tags: @Tatum_io and @WalrusFoundation. No automated outreach assumed.
- [ ] Submission sent before 10 Nov, 17:00 UTC and confirmation retained.
- [ ] Demo credentials/retention/hosting remain functional during 11–16 Nov judging and after the 17 Nov announcement.

## Blog outline and positioning

Suggested title: **“My client said Friday. Runway remembered when they actually paid.”**

Start with a consented real user episode and actual research counts. Show current money versus expected receipts, then the separately labeled synthetic timeline: Friday promise, Tuesday estimate, Monday rent and the 150 USDC adjustment. Explain its history and permitted-expense constraints. Show same-input comparison, completed memories and fresh-session correction. Report actual replay results and Postgres parity, then link live Tatum proof. Limits include small samples, manually supplied obligations, unvalidated Sui adoption where applicable and managed-relayer trust.

Suggested submission pitch:

> Your client says Friday. Your payment history says Tuesday. Runway shows which bill the delay exposes and the smallest spending adjustment your rules permit. It reconciles Sui invoice receipts through Tatum and carries timing lessons, corrections and decision evidence across sessions with Walrus Memory. Confirmed funds stay separate from expected income. Its optional bounded tool wallet buys invoice parsing through Sui MPP.

Revise the pitch to the final implemented behavior. Remove any capability that did not pass verification.

## Organizer questions to resolve

Prepare these for the builder to ask in official office hours; this planning task does not send messages externally:

1. The Event Rules opening mentions a feedback/form platform while the detailed tracks describe memory apps. Which mission controls eligibility?
2. Can one submission win a sector prize plus more than one special award? Can one submission be judged in more than one sector track?
3. What evidence establishes that an app is built primarily with ai.tatum.io when exported code receives manual backend integrations?
4. Is the current Sui MPP reference implementation accepted for the payment award, and must those payments be Mainnet? We plan Mainnet regardless where feasible.
5. Which exact Sui Data API/history endpoint is supported today, and are Tatum gRPC integration and bounded indexing sufficient?

The next engineering step is the **22 October integration gate**: one authenticated Tatum read and one completed Mainnet Memory write/recall, alongside interview recruitment. The optional MPP spike has a two-hour cap on 23–24 October. Pass user-evidence and exact stress-test gates before expanding the interface or payments.
