# Runway

Try the hosted app at **https://runway-ten-xi.vercel.app**.

Runway is an implemented cash-flow planner for freelancers paid in stablecoins. It keeps expected income separate from confirmed funds, models payment-delay scenarios, and proposes the smallest permitted reduction in flexible spending. Fixed bills and the reserve remain constraints.

The responsive app includes an isolated wallet-free example, Sui wallet sign-in, invoices and CSV review, expenses, plan acceptance, receipt reconciliation, corrected payment history, activity, and memory inspection. The invoice assistant adds a free synthetic sample and an optional paid text/PDF extraction flow with Sui MPP, separate tool-wallet limits, durable payment recovery and explicit draft confirmation. Paid execution requires configuration and is disabled by default; no funded parser purchase is claimed. Start with Node 22 and `pnpm install --frozen-lockfile`, then `pnpm dev:all`. Open http://localhost:5174. See the [runbook](docs/RUNBOOK.md) and [invoice agent guide](docs/INVOICE_AGENT.md) for configuration, tests, production execution, and recovery.

Verified locally: exact optimizer/property cases, scoped API and nonce/CSRF/idempotency tests, persistent restart, browser save/reload journey, responsive accessibility at 1440/390/320 pixels, and production build/startup. Tatum authenticated Sui Mainnet metadata, balance and a funded native-USDC receipt passed the real adapter checks. Authenticated invoice allocation remains pending. Walrus Memory recovered during verification: a reconciled compatibility record and ten useful synthetic records were stored and retrieved on Mainnet. A fresh process reproduced the database-backed history result from remote content with matching hashes; historical provider failures remain preserved. Real user trials and a funded agent purchase remain open. An administrative recovery command now verifies existing completed jobs and preserves interrupted submission evidence without resubmitting. The Vercel release passed hosted save/reload, responsive accessibility, wallet-module and authenticated Tatum-job checks; evidence is recorded in `docs/deployment-gate.json`. See [sponsor compatibility](docs/integration-compatibility.md) and the [recovery runbook](docs/RUNBOOK.md#sponsor-gates-and-memory-recovery).

The sections below preserve the original research and strategy. They describe planned acceptance evidence and award goals, not completed user research or sponsor milestones.

## Research and build strategy

Prepared 21 October 2026 for the [Tatum × Walrus Total Recall hackathon](https://tatum.io/hackathon/total-recall).

**Recommendation: build Runway, a cash-flow agent for freelancers paid in stablecoins.** Its distinctive feature is a payment-delay stress test: identify the first obligation exposed by a late invoice and the smallest permitted spending adjustment that covers it. Tatum verifies Sui receipts; Walrus Memory carries payment lessons and user corrections between sessions.

The core promise: **“Your client says Friday. Your payment history says Tuesday. Runway remembers the difference.”** Runway is a working name, not a cleared trademark or domain.

The revised plan targets **9/10 competitiveness**, conditional on three pieces of evidence: target users demonstrate a costly timing problem, a controlled comparison shows history changes the right decision, and the stress test produces an exact, understandable action. The earlier 7/10 assessment does not rise merely because features were added. Neither rating is a win probability.

In the hero replay, 800 USDC must cover a 250 USDC flexible purchase, 600 USDC rent and a 100 USDC reserve. An invoice promised Friday is forecast for Tuesday from prior outcomes. Runway identifies Monday's rent exposure and proposes reducing the purchase by **150 USDC**. Expected income stays separate from confirmed funds. A fresh runtime reproduces the recommendation from authorized memories.

| Document                                          | What it contains                                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [Research dossier](RESEARCH.md)                   | Verified winners, pain points, implementation patterns, competitors, candidate comparison, source register            |
| [Product and technical plan](BUILD_PLAN.md)       | Scope, memory loop, architecture, reconciliation, agent payments, evaluation, demo                                    |
| [Implementation architecture](ARCHITECTURE.md)    | Exact modules, domain rules, schemas, API contracts, workflows, sponsor adapters, concurrency and operational gates   |
| [Frontend design specification](DESIGN_SPEC.md)   | Original visual system, every screen/state, circle motion, copy, logo/icons, accessibility and performance acceptance |
| [Implementation work packages](IMPLEMENTATION.md) | Dependency-ordered build steps, requirement trace, dates, hour budgets, outputs and verification                      |
| [Validation protocol](VALIDATION.md)              | Interview gates, controlled history comparison, exact stress-test cases and evidence needed for the 9/10 target       |
| [Delivery plan](DELIVERY.md)                      | Dated milestones, time and cost estimates, fallback gates, judge evidence, submission checklist                       |

Prioritize **Consumer Finance first place** and **Best Walrus Memory**. Pursue **Best Use of Agent Payments** after the validated stress-test and memory loop work. Add the AI Builder award only if the project is genuinely built primarily there and remains technically maintainable. One submission can demonstrate finance and agent workflows; qualification for the Markets track is weaker and requires organizer confirmation.

The published event lists three $500 first-place track awards and three $500 special awards, rather than one overall grand prize. Winning all three special awards alongside one first place would total $2,000 if stacking is allowed. This is a conditional prize scenario, not an expected payout or a probability estimate.

The research and planning package is complete and the local application is implemented. Interviews, prototype trials, authenticated receipt allocation, a funded agent purchase, submission and presentation artifacts remain future tasks. Completed remote memory and fresh-process parity evidence use labelled synthetic fixtures. No prize or user-validation outcome is claimed. The original 120-hour schedule remains a planning estimate.

The project directory is now **`/home/dotmantissa/hackathons/runway`**. The detailed architecture governs implementation choices; the design specification treats [nearhackathon.com](https://nearhackathon.com/) as a craft benchmark and defines an original Runway layout, payment-date orbit, logo and human product copy. It prohibits authored frontend em dashes and emoji. The browser tab and shortcut assets use the same original brand.

Full public-page and source-file snapshots are retained in the locally ignored `research/` directory for recovery. Public-facing documents link to their original sources and distinguish verified facts, project authors' claims, and our recommendations. The local recovery checklist is Git ignored and must never be committed.
