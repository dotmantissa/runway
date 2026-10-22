# Invoice agent and priced parser

Open **Invoices → Invoice assistant**. Every workspace can inspect a synthetic invoice and review/correct its draft before saving. The sample makes no payment. Paid execution is disabled by default and restricted to explicitly allowlisted signed personal workspaces.

The agent has one tool: a builder-operated invoice extraction service priced at **0.01 native USDC on Sui Mainnet**. It uses bounded structured-text rules, not an LLM or unrestricted chat. Supported labels are `Client:` or `Bill to:`, `Invoice:`, `Total: ... USDC`, and `Due date: YYYY-MM-DD`. Missing or conflicting financial fields fail instead of being guessed. PDFs require selectable text, at most 2 MB and 10 pages; scanned/encrypted PDFs, URLs and OCR are unsupported. Manual entry stays available.

## Configuration

Use the existing ignored `.env` locally and encrypted environment variables on the deployment host. Never put a primary user wallet key in the backend. Create a distinct Ed25519 tool wallet, keep its balance small, and use a different service recipient. The tool wallet must stay excluded from personal planner balances.

| Variable                          | Purpose                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `ENABLE_AGENT_PAYMENTS=true`      | Enables the coordinator after the remaining settings are supplied.                                                                           |
| `TOOL_WALLET_KEY`                 | Dedicated Ed25519 Sui private key in Sui's encoded format. Server only.                                                                      |
| `TOOL_ALLOWED_WALLETS`            | Comma-separated full Sui addresses allowed to approve spending. These are signed workspace owners, not tool-wallet keys.                     |
| `TOOL_MAX_GAS_MIST`               | Per-purchase gas limit, default 5,000,000 MIST; hard maximum 10,000,000.                                                                     |
| `TOOL_DAILY_GAS_MIST`             | Shared daily gas allowance, default 20,000,000 MIST; hard maximum 50,000,000.                                                                |
| `PARSER_SERVICE_ENABLED=true`     | Enables the builder-operated HTTP 402 endpoint.                                                                                              |
| `PARSER_RECIPIENT`                | Full Sui address receiving native USDC, distinct from the tool wallet.                                                                       |
| `PARSER_PAYMENT_SECRET`           | Random server-side challenge-authentication secret of at least 32 characters. Keep stable during recovery.                                   |
| `PARSER_SERVICE_URL`              | Exact endpoint, normally `APP_ORIGIN/api/v1/paid/invoice-parse`. Defaults to that value. HTTPS in production; no credentials/query/fragment. |
| `TATUM_API_KEY`, `TATUM_GRPC_URL` | Authenticated Mainnet reads, preparation and broadcast through the existing native gRPC transport.                                           |

The built-in service and coordinator can run on the same deployment. Public guests cannot spend the tool wallet. The service is builder-operated; this is a useful priced-tool exercise, not evidence of third-party adoption. No funded purchase, automatic refund or award qualification is asserted by implementation alone.

After configuration and migration 4, sign in with an allowlisted owner, open the assistant, and approve spending limits. Runway enforces at most 0.05 USDC per call and 0.20 USDC per UTC day, with a shared wallet/day ceiling across workspaces. Lower per-workspace limits apply too. Gas is separate and counted conservatively at the reserved maximum even when actual gas costs less. The gas allowance can become the limiting factor before the USDC allowance is exhausted. These are trusted server policies; the tool wallet's small balance is the financial boundary.

For each invoice, request a quote, inspect the service/recipient, exact price, gas limit and extracted source text, then explicitly approve payment and sharing with that service. No invoice is automatically saved. After settlement/output, select **Review extracted draft**, correct the fields, and save the expectation. Confirmed personal funds are unchanged.

## Protocol and durable execution

The implementation pins `@suimpp/mpp` 0.9.0, compatible `mppx` 0.4.12 and `unpdf` 1.9.1. It uses the [Sui MPP reference client's](https://suimpp.dev/docs) actual credential/proof generation and standard `WWW-Authenticate: Payment`, `Authorization: Payment` and `Payment-Receipt` serialization. The challenge's authenticated `opaque` metadata binds request ID, input hash, Mainnet and issue time. Challenge lifetime is five minutes.

The reference client's execution hook prepares and signs the transaction without broadcasting. Runway stores the bytes, signature, locally computed digest and bound MPP credential before network submission. A persistent wallet row serializes signing/coin selection. Reservations are transactional; an order keeps its original UTC reservation day through reconciliation and retries.

Runway's server verifies the reference Sui proof format through the Sui SDK and independently verifies settlement through Tatum. Invalid proofs are rejected before a chain lookup. Settlement must match exact digest, positive native-USDC amount, recipient, sender and challenge lifetime. This avoids the reference server's internally constructed public gRPC client; no unauthenticated Tatum URL substitution or custom network bridge is used. Protocol interoperability is tested with real reference-client credentials and explicitly injected chain evidence.

`parser_paid_jobs` uniquely binds a digest and request ID to one content hash/challenge. Concurrent duplicates return the existing running/result state. Reusing a credential for different content fails. Paid results survive response loss and process restarts; a service retry reuses the same payment and cached result.

## Recovery and privacy

- **Before signing:** revoked policy, expired approval or failed preparation releases the reservation. No broadcast occurred.
- **Unknown settlement:** retain the signed operation, original digest and full reservation. Subsequent worker runs query that digest. Explicit retry may resubmit the exact persisted bytes; it never signs a replacement transfer.
- **Definitively failed onchain execution:** release the USDC reservation, retain the conservative gas charge and show the failure. A new purchase requires a fresh quote/approval.
- **Payment settled but parsing failed:** retain the digest and spent allowance. **Resume existing job** retries the same paid job. After input expiry, reattach exactly the original invoice; a changed content hash is rejected.
- **Tatum evidence mismatch or changed wallet/service configuration:** retain the existing operation for review. Restore the original configuration and reconcile; do not delete attempts, clear unknown reservations or reset a paid order into an unpaid state.

The original PDF is never stored. Extracted text stays in the scoped order for recovery, is cleared when the result is ready, and becomes unavailable to processing after one hour. Worker activity clears expired text; the scheduled deployment also sweeps on API activity/daily cron. Expiry is an access limit, not a promise that database backups are erased on an exact schedule. The MPP service receives text only after explicit purchase/sharing consent. Raw source text is never written to Walrus. Reviewed expectation/tool-receipt records follow the workspace's separate Memory consent, and record output hash, payment digest and user corrections.

Stopping new spending does not erase history or abandon an already prepared payment. Keep the original delegate/tool wallet configuration available until existing operations are reconciled. Unknown settlement blocks new wallet coin selection to prevent conflicting signatures.

## Verification

```sh
pnpm typecheck
pnpm test
pnpm test:e2e
RUNWAY_TEST_DATABASE_URL=postgresql://user:password@localhost:5432/test_database pnpm smoke:postgres
pnpm build
```

Tests cover real reference proof interoperability, selectable-text PDF extraction, exact units/dates, request/credential reuse, proof theft/grief protection, concurrent budget and paid-job claims, wallet signing serialization, prepared-operation restart, original-day accounting, response loss, post-payment parser failure, policy revocation and reviewed correction persistence. The native PostgreSQL smoke uses disposable schemas and two connections to test shared-wallet budget contention. Browser paid-service responses are explicitly injected, while the sample save/reload uses the real application API. A separate built-server check also passed actual personal-message sign-in, runtime PDF loading and a real HTTP 402 quote exchange with ephemeral unfunded wallets. These checks do not transfer funds or prove live Mainnet settlement.

The canonical proof field order follows the MIT-licensed suimpp protocol implementation. See [third-party notices](THIRD_PARTY_NOTICES.md).
