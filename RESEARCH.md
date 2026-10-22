# Research dossier: what to borrow from previous winners

Research date: 21 October 2026. Recommendation and severity ratings below are engineering/product judgments, not disclosed judge scores or guarantees of placement.

## What this competition actually rewards

The [official event](https://tatum.io/hackathon/total-recall) assigns 30% to Walrus/Tatum integration, 30% to technical quality, 20% to creativity, and 20% to presentation. The first two categories make a beautiful prototype with decorative sponsor calls a weak strategy. The special memory award makes observable improvement over repeated sessions particularly valuable.

There is no listed overall grand prize. There are three sector tracks, each with $500/$300/$200 awards, and three $500 special awards. The rules modal limits participants to one submission per person. We should choose one primary track and make the same product demonstrate other relevant capabilities. The site presents bonuses as additional awards, but exhaustive stacking rules and eligibility for multiple sector awards are not explicit.

The official rules contain a contradictory opening mission paragraph about a community feedback/form platform. The rest of the site and detailed rules describe memory applications in the three supplied tracks. This appears to be a template inconsistency; that explanation is an inference. Resolve it with the organizers before locking submission positioning. It is not a reason to build an unrelated forms product.

The official form/rules add a **2–3 minute demo video**, Tatum account ID, Sui address, Walrus Memory account information, and delegate public key to the obvious deliverables. The delegate public key is the submission's `MEMWAL_AGENT_ID`; the private delegate key must remain private. Deadline: **10 November 2026, 17:00 UTC**, or **18:00 in Lagos**. Claims about event rules here derive from the official page and its Event Rules modal, retrieved through its embedded public client bundle.

## Method and limits

The research covers the prior Tatum/Walrus event, Sui Overflow 2026, ETHGlobal Taipei/New York/Buenos Aires 2025, and Cannes 2026. Sponsor announcements establish awards; event showcase pages and author repositories establish what teams said they built. Representative source files were inspected for Sui-Index, MemWal, and the Sui MPP implementation. No external project code was executed.

This is a purposive sample of relevant winners, not a census of all hackathons. It has survivorship bias, and public descriptions are often marketing. A winner page proves a result, not the causal reason judges chose it, production security, product-market fit, or every implementation claim. Severity here means how costly the problem appears to the target user and how central it was to the sponsor's challenge; it is not a measured ranking of all social problems.

## Closest benchmark: the previous Tatum × Walrus event

Tatum's own announcement records 163 submissions and ranks Sui-Index first, Walytics second, Verigen third, Nexus fourth, and Memorus fifth. VeraAudit won Best Tatum and Sealed Pair won Best Walrus. Award evidence: [Tatum's winner announcement](https://www.linkedin.com/posts/tatumio_hackathon-winners-activity-7469782485489377280-Ot6j).

| Project / verified result | Pain and relative severity | Implementation reported by the builder | Lesson for Total Recall |
| --- | --- | --- | --- |
| **Sui-Index — rank 1** | Market conviction is reduced to simplistic wagers; strategies and performance are difficult to compare. High relevance to market applications, moderate everyday necessity. | Weighted crypto-index duels, frozen compositions, price snapshots and outcome records on Walrus, Sui settlement and Tatum calls. | Give history a consequence: compare a committed prediction with a resolved result. Turn the outcome into the next decision. |
| **Walytics — rank 2** | Walrus activity is hard to inspect without assembling chain data. High severity for ecosystem operators/developers, narrower general consumer audience. | Mainnet event analytics, blob explorer, data-grounded AI chat, analytics snapshots written back to Walrus. | Tatum gathers observed facts; Walrus retains useful interpretation. Avoid an AI answer detached from live data. |
| **Memorus — rank 5** | Personal memories are fragmented or lost; AI companions lack durable context. Strong relevance to Walrus, variable consumer urgency. | Rich-text/image memories stored on Walrus and owned as Sui objects; AI tools create and recall narratives through a server-side Tatum proxy. | A normal consumer interaction can drive both sponsor integrations. Make continuity easy to understand. |
| **Sealed Pair — Best Walrus** | Public negotiation exposes OTC terms; execution can diverge from agreed terms. High financial consequence for counterparties and direct sponsor relevance. | Encrypted quote content, blob reference used as a commitment, Sui lifecycle, settlement ceremony and inspectable chain evidence. | The stored object should constrain or explain a later action. Make its reference inspectable. |

Sources for implementation: [Sui-Index repository](https://github.com/Rohitamalraj/Sui-Index), [Walytics author's technical post](https://www.linkedin.com/posts/edcriptofi_walrus-sui-tatum-activity-7465131659038744577-RsX0), [Memorus repository](https://github.com/dante4rt/memorus), [Sealed Pair repository](https://github.com/PugarHuda/sealed-pair).

Award rankings for Verigen, Nexus, and VeraAudit are verified, but accessible primary implementation evidence was insufficient for a defensible technical teardown. Their names do not justify inventing a security, identity, or memory architecture. They remain award observations, not candidate templates.

**Repository inspection changes how we should copy these patterns.** At inspected Sui-Index commit `e421783eebdb6d1f73f37e87c3ccb7df579e6642`, its browser Tatum adapter defaults to a public fullnode because of CORS, while its Walrus adapter permits a local content-hash fallback. That does not establish what ran during judging or invalidate its award. It does establish that README statements are insufficient evidence of sponsor routing or durable storage. Our build should show actual upstream routing and treat failed memory writes as failures. See [Tatum adapter](https://github.com/Rohitamalraj/Sui-Index/blob/e421783eebdb6d1f73f37e87c3ccb7df579e6642/frontend/src/lib/tatum.ts) and [Walrus adapter](https://github.com/Rohitamalraj/Sui-Index/blob/e421783eebdb6d1f73f37e87c3ccb7df579e6642/frontend/src/lib/walrus.ts).

Sealed Pair's current README distinguishes implemented behavior and future work, including escrow-only V1 and future generic atomic settlement. We borrow its commitment/inspection pattern without treating its aspirational architecture as proven production behavior. Likewise, storing prices immutably does not prove an external price feed was truthful, and describing a game as skill-based does not determine its legal status.

## Sui Overflow 2026: stronger evidence of sponsor priorities

The official Sui announcement verifies 747 projects and the placements below. To keep the comparison useful, we selected projects close to memory, agent spending, or everyday finance. [Official Sui Overflow 2026 results](https://www.sui.io/blog/sui-overflow-2026-winners).

| Winner | Pain severity in that event | Mechanism worth adapting |
| --- | --- | --- |
| **Sup Wallet — Agentic Web 1st** | High: agents need financial authority without unrestricted control of user keys. | User-set spending boundaries. Our agent receives a small tool budget, with monetary checks outside the LLM. |
| **Quay — DeFi & Payments 1st** | High: merchants need settlement without learning token plumbing. | Present money in familiar terms and reserve chain details for evidence inspection. |
| **Kraterion — Walrus 1st** | High for builders: storage ownership and revocable access are often platform promises. | Ownership must be grounded in actual account/control architecture; namespaces alone are not user ownership. |
| **Carry — Walrus 3rd** | High: shared memories can be accessed without authorization or cited without traceable provenance. | Check access before retrieval and attach memory references to decisions. |
| **Praxis — Walrus 4th** | High: an autonomous spend can be risky before anybody notices. | Simulate/gate actions and persist refusals as well as successes. |

The table adapts mechanisms; it does not propose reproducing these larger platforms. The best corroborating implementation story is [Walrus's Carry teardown](https://walrus.xyz/blog/carry-verifiable-agent-answers-built-on-walrus-memory/): it describes encrypted memory, an access gate, and answer receipts checked against onchain policy. An important limit remains: a receipt can establish recorded inputs and authorization without proving a model's answer is correct or that those inputs causally determined its internal reasoning.

For Runway, an evidence card should reconstruct an explicit calculation from referenced memories and confirmed receipts. This is a narrower, achievable guarantee than “trustworthy AI.”

## Prediction, consumer finance, and payment winners outside Sui

| Project / actual award | Pain and relative severity | Noteworthy implementation | Transfer to our build |
| --- | --- | --- | --- |
| **Signals — ETHGlobal Taipei 2025 finalist** | Binary markets discard nuanced forecasts. Medium user urgency, high prediction-track relevance. | Interval forecasts and probability-based pricing. | Use meaningful, testable forecasts with confidence instead of a vague “AI prediction.” |
| **DynaVest — Taipei finalist; Celo pool prize** | DeFi strategy execution and risk explanations require many steps. High financial consequence and ecosystem relevance. | Risk profile, conversational explanations and bundled strategy execution. | One decision screen with understandable reasoning; avoid replicating a multi-protocol trading engine. |
| **Pumpkin Spice Latte — New York finalist; Flare main track 1st** | Saving is less engaging than speculation. Medium-to-high consumer importance. | Prize-linked pooled yield with randomness and interchangeable yield adapters. | Give consumers one compelling reason to return. Its “principal safe” marketing does not eliminate contract or yield-protocol risks. |
| **JetLagged — Buenos Aires finalist** | Travel uncertainty has a direct personal cost. High urgency at the moment of travel. | Flight-specific markets and an automated flight-status resolver. | Prefer events with a clear resolution rule and an observable real-world consequence. |
| **Payload Exchange — Buenos Aires finalist; Polygon payments 2nd; vlayer proving 1st; CDP award** | Access to a small resource should not require a subscription or constant wallet interaction. Medium per call, high agent-commerce relevance. | An x402 proxy enables sponsors to fund resource access in exchange for verified actions. | Payment should unlock an actual tool result. A token transfer added to a chatbot is weaker. |
| **C.E.S.T.A Agent — Cannes 2026 Arc agentic nanopayments 2nd** | Group trips fragment booking, payment and budget coordination. High inconvenience during the workflow. | Shared treasury, spending boundaries, conversational interface, durable trip records and paid tools. | Finance, memory and agent actions can share one coherent consumer task. Cut voice, cards and travel automation from our MVP. |

Primary event pages: [Signals](https://ethglobal.com/showcase/signals-2o4fp), [DynaVest](https://ethglobal.com/showcase/dynavest-8noha), [Pumpkin Spice Latte](https://ethglobal.com/showcase/pumpkin-spice-latte-ayjrg), [JetLagged](https://ethglobal.com/showcase/jetlagged-kt8i0), [Payload Exchange](https://ethglobal.com/showcase/payload-exchange-x07pi), [C.E.S.T.A Agent](https://ethglobal.com/showcase/c-e-s-t-a-agent-wkud7). The [Arc sponsor recap](https://www.arc.io/blog/meet-the-arc-track-winners-from-ethglobal-cannes-hackathon-and-what-we-learned) independently names C.E.S.T.A among its track winners.

An ETHGlobal finalist is not automatically first place or an overall champion. Descriptions above are deliberately labeled with the award that can be verified.

## Existing work that weakens an easy novelty claim

[Veritas at Cannes 2026](https://ethglobal.com/showcase/veritas-sejjx) already describes agent prediction reputation, immutable records and Brier scoring. Its accessible showcase page did not display an award, so it is **a comparable entrant, not a verified winner**. A generic “rank AI forecasters by accuracy” concept is already crowded and closely resembles this hackathon's own suggestions.

[Monarch](https://www.monarch.com/features/tracking) already provides recurring-bill detection, cash-flow reports and AI categorization. [YNAB](https://www.ynab.com/guide/irregular-income) explicitly addresses irregular income, including timing uncertainty. We cannot credibly pitch “the first budget that remembers” or claim existing apps never adapt.

The narrower hypothesis to validate is: **a freelancer needs to know which dated bill a client's likely payment delay exposes, the smallest permitted adjustment, and the receipts/rules behind that decision across assistants.** This combines invoice-to-chain reconciliation, deadline stress testing and portable outcome history. Neither the source survey nor this competitor review establishes exclusive novelty or demand in that exact segment. Apply the [five-interview evidence gate](VALIDATION.md#1-validate-the-decision-before-expanding-the-product) before committing to that wedge.

## The pain point we should select

**A freelancer treats an expected invoice payment as available money; it arrives late, after a fixed obligation. A normal balance and a monthly budget conceal the timing risk.** Repeated client behavior can make the forecast less naive, while confirmed receipts give us observable ground truth.

This has evidence beyond hackathon language. The Federal Reserve's May 2026 report says 58% of self-employed U.S. adults experienced monthly income variability in 2025, and 22% struggled to pay bills because of it. These figures apply to surveyed U.S. self-employed adults, not Nigerian freelancers or the stablecoin-paid segment. [Federal Reserve, Income and Expenses](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-income-and-expenses.htm). The [CFPB emergency-fund guide](https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/) also identifies managing the timing of cash flow as useful for fluctuating pay.

Relative to Total Recall, this pain has four advantages: it repeats, has a costly consequence, improves with remembered outcomes, and has a necessary onchain read when invoices are paid on Sui. Stablecoin receipt data cannot reveal rent, taxes, or bank balances automatically; users must explicitly supply those obligations and any additional account balances. That limitation belongs in the product model.

## Candidate comparison

Scores are subjective estimates of execution potential on a 1–5 scale. The weighted value applies the actual event rubric: `0.30 integration + 0.30 technical + 0.20 creativity + 0.20 presentation`. It is not a predicted judge score or win probability. Technical scoring includes delivery risk for a solo builder.

| Candidate | Integration | Technical | Creativity | Presentation | Weighted / 5 | Key weakness |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| **Runway: invoice timing + deadline stress test** | 5 | 4 | 4 | 5 | **4.5** | Target-user demand, small-data forecasts and usable adjustments still need evidence. |
| Evidence-ranked sports forecaster | 4 | 4 | 3 | 5 | 4.0 | Matches the prompt closely; sports odds are generally offchain and data access adds cost. |
| Away-day travel/sports group treasury | 4 | 3 | 4 | 5 | 3.9 | Natural three-track story, but bookings, outcomes and split payments create too many dependencies. |
| General research agent with source trust memory | 4 | 5 | 2 | 4 | 3.9 | Easy to ship, weaker urgency and distinctive product direction. |
| Household subscription watchdog | 4 | 4 | 2 | 4 | 3.6 | Mature competitors; real cancellation needs merchant/email integrations. |
| Broad autonomous agent wallet marketplace | 5 | 2 | 3 | 3 | 3.3 | Strong chain fit, excessive security and infrastructure scope. |

Runway wins this internal comparison because it makes both sponsors necessary in one short story. If we score its uncertain creativity as 3, it falls to 4.3; reducing integration to 4 lowers it to 4.2. The recommendation is robust to modest uncertainty, but user validation and the initial technical spike must precede commitment.

### What must change to justify a 9/10 assessment

The **4.5/5 candidate-selection score** above and the later **7/10 overall competitiveness assessment** serve different purposes. The former compares proposed concepts against the published rubric; the latter discounts missing user evidence, generic positioning and an unproven learning demo. Neither is a judge score, observed outcome or probability. Do not convert 4.5/5 into an achieved 9/10 rating.

| Current weakness | Revised requirement | Evidence needed |
| --- | --- | --- |
| Pain supported broadly, exact users unvalidated | Five interviews, real dated consequences, redacted histories and prototype volunteers. | Three consequential episodes, two usable histories, two volunteers; distinguish stablecoin/Sui segment coverage. |
| A stored memory could merely decorate the interface | Controlled no-history/Walrus/Postgres comparison with fixed current state; fresh runtime and superseding correction. | Identical current-input hashes, inspectable records, exact Walrus/Postgres engine parity and reproducible decision change. |
| “AI budget with memory” is crowded | First exposed bill/date plus smallest permitted adjustment with an auditable timeline. | Exact hero: delayed invoice exposes Monday rent; 150 USDC purchase reduction preserves the 100 USDC floor; two of three trial users understand and use the action. |

These are implementation and validation commitments, not new research findings. [VALIDATION.md](VALIDATION.md) specifies the gates and unfavorable outcomes that must also be reported. A conditional **9/10 target** is reasonable if they pass alongside reliable sponsor integration and presentation. Merely adding the features does not establish that rating.

The revised direction borrows an outcome-to-next-decision loop from Sui-Index, observable data from Walytics, referenced decisions from Carry and constrained proposals from Praxis/Sup Wallet. Their awards support these patterns as relevant comparables; public evidence does not prove the patterns caused their wins.

The action engine works without a learned forecast, and a no-receipt stress test can identify the same gap. Historical memory adds a client-specific timing estimate and continuity. An equivalent Postgres history should give the same result. We therefore evaluate prediction quality, users' decisions and portability separately, rather than claiming blockchain creates uniquely accurate financial advice.

## How to combine the tracks coherently

The shared mechanism is **commit an expectation → observe an outcome → retain the lesson → change the next action**.

| Track | Application in Runway | Fit |
| --- | --- | --- |
| Consumer Finance | Confirmed funds, dated obligations, invoice timing and a deadline stress test with minimal permitted spending adjustments. | **Primary and strongest.** |
| Smart Agents | Receipt reconciliation, portable timing lessons/corrections, explained action plans and optional bounded parsing purchases. | **Strong secondary capability.** |
| Markets & Sports Prediction | Forecast whether a receivable arrives by a specified date; compare invoice promises with actual settlements. | **Adjacent, not clearly the published sector.** Organizer confirmation is needed to claim track eligibility. |

A personal invoice forecast is not a bookmaker comparison or a public prediction market. We should not imply that using probabilities automatically qualifies the project for the Markets track. If the organizers require a full three-track product, the better fallback is a travel treasury predicting event/travel costs, but that sacrifices our cleaner cash-flow story. For a first-place attempt, focus is the stronger choice.

## Verified stack constraints

| Surface | Evidence | Consequence |
| --- | --- | --- |
| Walrus Memory Mainnet | [Quick start](https://docs.wal.app/walrus-memory/getting-started/quick-start) gives the production relayer and delegate/account setup. | Use the real Memory SDK, not only generic blob uploads. |
| Asynchronous writes | [API reference](https://docs.wal.app/walrus-memory/sdk/api-reference) returns jobs before storage finishes. | Persist job IDs, await completion and retain actual blob IDs before counting memories. |
| Semantic recall | The same API reference documents relevance ordering and bounded recency candidates. | Exact current policy, balances and event ordering need versioned state and complete reconciliation. |
| Ownership | [Multi-tenant cookbook](https://docs.wal.app/walrus-memory/sdk/cookbook-multi-tenant) says an operator account owns memories even with per-user namespaces. | Operator-managed demo must disclose ownership; personal ownership needs a user-owned MemWal account. |
| Privacy | [Relayer overview](https://docs.wal.app/walrus-memory/relayer/overview) says the default relayer sees plaintext while embedding/encrypting. | Encrypting storage does not mean the service or model never sees financial data. |
| Deletion | [Delete guide](https://docs.wal.app/walrus-memory/guides/delete-memories-programmatically) documents owner-authenticated deletion. | Do not repeat old “no delete” claims; validate deployment support and do not promise erasure of downloaded copies. |
| Tatum Sui transport | [Tatum gRPC guide](https://docs.tatum.io/reference/sui-grpc) and [migration guide](https://docs.tatum.io/docs/sui-migration-guide-from-json-rpc-to-grpc) favor gRPC. | Use server-side native gRPC with Tatum key metadata. JSON-RPC is a contingency only after live verification. |
| Tatum Data API coverage | [Sui capability page](https://tatum.io/chain/sui) lists Price API specifically, while its generic FAQ claims broader data/notifications. | Do not assume a REST address-history endpoint; confirm an exact supported method or use bounded gRPC indexing. |
| SDK transport | [Mysten SDK gRPC docs](https://sdk.mystenlabs.com/sui/clients/grpc) distinguish default gRPC-web from native server transport. | A native Tatum endpoint is not automatically compatible with an unconfigured Fetch transport. |
| Sui MPP | [suimpp docs](https://suimpp.dev/docs) and [source repository](https://github.com/mission69b/suimpp) provide client/server implementations. | Early payment spike; persistence and Tatum-auth transport require deliberate integration. |
| Gasless stablecoins | [Sui transfer docs](https://www.docs.sui.io/develop/transaction-payment/gasless-stablecoin-transfers) specify 0.01 minimum and narrow eligible operations. | A 0.01 USDC tool call can qualify; custom receipt Move writes require a separate or normally funded transaction. |

Source snapshots inspected: MemWal commit `691ae38bf2d62229bd605f9d9fb1a098434f4c4f`; suimpp commit `a1a538b0ab7d6aded8d94b167f9d819d67b23cd5`. These are research references, not recommendations to pin every dependency to those commits. Lock compatible published package versions after the live spike.

## The pattern to carry forward

Our inference from this sample is that strong submissions tie a recognizable user problem to a sponsor-specific mechanism, complete the full action/outcome loop, and expose enough evidence that a judge can inspect it. The same product can demonstrate multiple capabilities when they solve the same task. No source proves that breadth alone increases placement, or that multiplying sponsors outweighs a clear working demo.

Runway should therefore make one visibly consequential promise: **“Show the bill a payment delay exposes, and the smallest allowed change that covers it.”** The reconciled learning loop and portable decision evidence support that focused deadline stress test. User validation must establish whether this is a meaningful improvement over the target user's existing workflow.
