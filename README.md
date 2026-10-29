# Runway

**Your client says Friday. Your payment history says Tuesday. Rent is due Monday.**

Runway helps freelancers paid in stablecoins make a spending decision before a late invoice becomes a missed bill. Built for the **Consumer Finance Apps** track of the [Tatum × Walrus Total Recall hackathon](https://tatum.io/hackathon/total-recall).

- [Live app](https://runway-ten-xi.vercel.app)
- [Try the wallet-free example](https://runway-ten-xi.vercel.app/demo)
- [Watch the narrated demo and read the build story](https://runway-ten-xi.vercel.app/story)
- [Inspect the evidence and trigger live Walrus recall](https://runway-ten-xi.vercel.app/evidence)
- [Submission answers](docs/SUBMISSION.md)

## The decision

A dated synthetic example starts with **800 USDC confirmed**, a **1,200 USDC unpaid invoice**, a **250 USDC Saturday purchase**, **600 USDC Monday rent**, and a **100 USDC reserve**.

The promised Friday payment makes the projection look comfortable. Four past payments arrived 3, 4, 4 and 5 days late, moving the estimate to Tuesday. Runway identifies Monday rent as exposed and proposes the smallest permitted adjustment: **reduce the flexible purchase by 150 USDC**, leaving it at 100. The user reviews and saves the plan; fixed bills and the reserve remain constraints. Saving moves no funds. Expected income never increases funds available now.

The no-payment stress test independently finds the same conservative adjustment. History supplies an inspectable reason to consider that delay, rather than a guarantee of when the client will pay.

## What makes the memory useful

**Tatum** performs authenticated Sui Mainnet gRPC reads for native-USDC metadata, balances and known-digest receipt verification. Wallet sign-in uses a real Sui personal-message signature. Receipt allocation is explicit and limited to the signed workspace; merely finding a transaction does not settle an invoice.

**Walrus Memory** persists structured outcomes, policy, obligations, expectations, lessons and decision evidence. Thirteen synthetic Mainnet records have completed, content-matched evidence: ten useful originals, two corrections and one compatibility record.

On the evidence page, **Recall from Walrus** makes a live request for all twelve useful records, verifies namespace, logical IDs, blobs and content hashes, and recalculates the decision. The original history reproduces the 150 USDC adjustment. A recalled reserve correction from 100 to 50 USDC changes it to 100 USDC. Separately, correcting a client's payment association leaves only three active payments, so the engine refuses to reuse the stale four-payment estimate. Remote failure is shown as a failure; local history is never substituted for this recall.

Current financial state remains in PostgreSQL. Memory continuity and correction handling are demonstrated; better forecasting than another store holding identical records is not claimed. The relayer processes plaintext and hosted namespaces are operator-managed. Personal publication requires consent and is disabled on the public deployment.

## Run locally

Requires **Node 22** and **pnpm 9**.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev:all
```

Open http://localhost:5174. The example needs no wallet, funding or sponsor keys. Personal Tatum reads and live published-memory recall require the server-only credentials documented in [.env.example](.env.example). Development uses persistent PGlite; production uses PostgreSQL. Alternate API ports are documented in the [runbook](docs/RUNBOOK.md).

```sh
pnpm typecheck
pnpm test
pnpm copy:check
pnpm test:e2e
pnpm build
```

The browser suite expects a running app. The [runbook](docs/RUNBOOK.md) covers deployment, remote recall, recovery, synthetic evaluation and reproducible demo recording.

## Scope and evidence

The responsive app includes invoices and CSV review, flexible and fixed expenses, scenario comparison, review/save/reload, receipt reconciliation, history corrections, activity and record inspection. An optional invoice assistant extracts selectable text/PDF into a draft that must be reviewed before saving. Its 0.01 native-USDC MPP service is disabled publicly; a funded parser purchase remains unverified. See the [invoice agent guide](docs/INVOICE_AGENT.md).

The [frozen synthetic evaluation](docs/evaluation.json) publishes all 16 eligible forecasts and 19 sparse-history opportunities, including adverse results: timing mean error was 2.1875 days with history versus 1.9375 for promised dates, while simulated reserve breaches fell from five to two with some unnecessary reductions. No customer savings, interviews or real-user trials are claimed. Run `pnpm evaluate` to reproduce it.

See [architecture](ARCHITECTURE.md), [sponsor compatibility](docs/integration-compatibility.md), [evaluation methodology](docs/EVALUATION.md) and [handoff](docs/HANDOFF.md) for implementation details and remaining acceptance work. The original [research](RESEARCH.md), [build plan](BUILD_PLAN.md), [design specification](DESIGN_SPEC.md), [implementation packages](IMPLEMENTATION.md) and [validation protocol](VALIDATION.md) remain available as planning history.
