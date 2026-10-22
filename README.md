# Total Recall: research and build strategy

Prepared 21 October 2026 for the [Tatum × Walrus Total Recall hackathon](https://tatum.io/hackathon/total-recall).

**Recommendation: build Runway, a cash-flow agent for freelancers paid in stablecoins.** Its distinctive feature is a payment-delay stress test: identify the first obligation exposed by a late invoice and the smallest permitted spending adjustment that covers it. Tatum verifies Sui receipts; Walrus Memory carries payment lessons and user corrections between sessions.

The core promise: **“Your client says Friday. Your payment history says Tuesday. Runway remembers the difference.”** Runway is a working name, not a cleared trademark or domain.

The revised plan targets **9/10 competitiveness**, conditional on three pieces of evidence: target users demonstrate a costly timing problem, a controlled comparison shows history changes the right decision, and the stress test produces an exact, understandable action. The earlier 7/10 assessment does not rise merely because features were added. Neither rating is a win probability.

In the hero replay, 800 USDC must cover a 250 USDC flexible purchase, 600 USDC rent and a 100 USDC reserve. An invoice promised Friday is forecast for Tuesday from prior outcomes. Runway identifies Monday's rent exposure and proposes reducing the purchase by **150 USDC**. Expected income stays separate from confirmed funds. A fresh runtime reproduces the recommendation from authorized memories.

| Document | What it contains |
| --- | --- |
| [Research dossier](RESEARCH.md) | Verified winners, pain points, implementation patterns, competitors, candidate comparison, source register |
| [Product and technical plan](BUILD_PLAN.md) | Scope, memory loop, architecture, reconciliation, agent payments, evaluation, demo |
| [Implementation architecture](ARCHITECTURE.md) | Exact modules, domain rules, schemas, API contracts, workflows, sponsor adapters, concurrency and operational gates |
| [Frontend design specification](DESIGN_SPEC.md) | Original visual system, every screen/state, circle motion, copy, logo/icons, accessibility and performance acceptance |
| [Implementation work packages](IMPLEMENTATION.md) | Dependency-ordered build steps, requirement trace, dates, hour budgets, outputs and verification |
| [Validation protocol](VALIDATION.md) | Interview gates, controlled history comparison, exact stress-test cases and evidence needed for the 9/10 target |
| [Delivery plan](DELIVERY.md) | Dated milestones, time and cost estimates, fallback gates, judge evidence, submission checklist |

Prioritize **Consumer Finance first place** and **Best Walrus Memory**. Pursue **Best Use of Agent Payments** after the validated stress-test and memory loop work. Add the AI Builder award only if the project is genuinely built primarily there and remains technically maintainable. One submission can demonstrate finance and agent workflows; qualification for the Markets track is weaker and requires organizer confirmation.

The published event lists three $500 first-place track awards and three $500 special awards, rather than one overall grand prize. Winning all three special awards alongside one first place would total $2,000 if stacking is allowed. This is a conditional prize scenario, not an expected payout or a probability estimate.

This is a completed research and planning package. Interviews, prototype trials and runtime evaluations are future tasks. No application has been implemented, funded, deployed, posted, or submitted. Sponsor integration behavior still needs live verification with the builder's accounts. Capacity is provisionally one experienced full-stack builder with approximately 120 hours available before the deadline; the schedule must be resized if capacity differs.

The project directory is now **`/home/dotmantissa/hackathons/runway`**. The detailed architecture governs implementation choices; the design specification treats [nearhackathon.com](https://nearhackathon.com/) as a craft benchmark and defines an original Runway layout, payment-date orbit, logo and human product copy. It prohibits authored frontend em dashes and emoji. The browser tab and shortcut assets use the same original brand.

Full public-page and source-file snapshots are retained in the locally ignored `research/` directory for recovery. Public-facing documents link to their original sources and distinguish verified facts, project authors' claims, and our recommendations. The local recovery checklist is Git ignored and must never be committed.
