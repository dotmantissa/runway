# Running Runway

Requires Node 22 or newer and pnpm 9. Production uses persistent PostgreSQL. The optional Docker stack pins PostgreSQL 17; native PostgreSQL 18.6 has passed concurrency and recovery checks. Development uses persistent PGlite PostgreSQL at `.data` when `DATABASE_URL` is unset. A separate worker requires real PostgreSQL; do not open the same embedded store from two processes.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev:all
```

Open http://localhost:5174. The API listens on port 3001; Vite proxies `/api`. Configure `APP_ORIGIN` to the exact browser origin. The strict frontend port avoids silently changing the origin. Credentials are server-only and must never use a `VITE_` prefix. The example needs no wallet, chain funding, or memory publication.

To use local PostgreSQL, run `docker compose up -d postgres` and configure `DATABASE_URL` from `.env.example`. Run `pnpm db:migrate`. Use `INLINE_WORKER=false` with `pnpm worker:dev` only against PostgreSQL. Keep the default inline worker for the embedded database.

```sh
pnpm typecheck
pnpm test
pnpm copy:check
pnpm test:e2e
pnpm build
```

Browser tests use a running development server. Install Chromium with `pnpm exec playwright install chromium` if needed. No receipt test sends funds; chain behavior in integration tests is explicitly injected test evidence. Use `pnpm smoke:tatum` for authenticated Mainnet reads and optional `SMOKE_SUI_ADDRESS` / `SMOKE_RECEIPT_DIGEST` for an actual known payment.

For a local production-build preview, run `APP_ORIGIN=http://localhost:3001 pnpm start` after building and visit that origin. This development preview is not a production deployment.

## Production

Build `Dockerfile` or run the built Node server. Set `NODE_ENV=production`, `DATABASE_URL`, `APP_ORIGIN=https://your-host`, and provider secrets through the host secret manager. Route HTTPS to port 3001. Fastify serves the Vite assets and SPA routes from `dist/web`; migration sources must remain at `apps/server/src/db/migrations`. Keep `INLINE_WORKER=true` for a single process, or run `pnpm start:worker` with PostgreSQL for a separate worker. The readiness endpoint checks database/migration state and a recent worker heartbeat; liveness does not call paid services.

The server requires outbound native HTTP/2 to Tatum gRPC and HTTPS to MemWal. Vercel runs the API in a Node function as described below; a static-only host cannot run the backend. Back up PostgreSQL using the host's database backup facility before schema changes.

## Sponsor gates and memory recovery

`docs/tatum-gate.json` records successful authenticated metadata/balance reads and a funded native-USDC receipt verified by the actual Mainnet adapter. Full smoke evidence stays in ignored `research/tatum-smoke.json`; the public artifact omits wallet identifiers and financial details. Hosted verification in the receiving wallet’s signed workspace and invoice allocation remain pending. `docs/memory-gate.json` preserves the original embedding failure and the explicitly reconciled v2 compatibility record now stored/retrieved on Mainnet. `docs/memory-manifest.json` contains ten completed useful synthetic records with job/blob IDs and matched content; `docs/comparison.json` records fresh-process remote/database parity. Never count accepted/failed jobs as completed Mainnet records.

```sh
pnpm evidence compare-local
MEMORY_WRITES_ENABLED=true pnpm evidence publish
pnpm evidence compare-walrus
```

The publication command writes ten useful synthetic records to a dedicated builder namespace, with persisted job IDs, content hashes and blob IDs. Enable it only when the relayer is healthy. It stops on the first failure and resumes known jobs. The fresh-process comparison reads current fixture state and a bounded manifest, then retrieves actual outcomes remotely. It fails rather than substitutes local history. These commands have now passed on Mainnet with labelled synthetic fixtures: ten records completed and a fresh process reproduced the same history hash and plan. Retention and availability must still be checked through judging.

If a process loses a submission response, the record stays `submitting`/`needs_review`. Do not clear this state and resubmit. Obtain the existing job ID from the relayer using the original logical record ID as the idempotency key. Known `running` jobs resume polling after lease expiry. Uploaded content becomes `verified` only after matching logical ID, record type, scope, blob ID, schema and payload hash are retrieved. An upstream permanent failed job requires service resolution and an explicitly reconciled replacement, not blind automatic retries.

Administrators with the existing PostgreSQL connection and configured Memory delegate can inspect and recover an application record with:

```sh
pnpm memory:recover --workspace <workspace-id> --record <record-id> --remote-job <existing-job-id>
pnpm memory:recover --workspace <workspace-id> --record <record-id> --remote-job <existing-job-id> --apply
```

The first command only reads local and remote state. Omit `--remote-job` if the record already has its remote job ID. The `--apply` command requires a completed remote job and retrieves its content before changing local state. It checks the entire immutable envelope, rejects another namespace or job, and refuses to race a running worker or changed record. It atomically finalizes the record and publication jobs, preserving their previous errors/results in the activity audit. Repeating a successful recovery leaves one recovery audit event. Neither command calls `remember`, enables writes, changes consent, or replaces a failed job. Already published content can be verified while future publication is disabled.

These commands require `DATABASE_URL` and deliberately do not run migrations. Do not connect them to the active embedded development store. Leave pending jobs and terminal failed jobs intact; rerun inspection after the provider completes an existing job. A `not_found` result or failure to retrieve exact content does not authorize resubmission. The compatibility/evidence scripts use separate file-backed manifests; this recovery command only handles application records in PostgreSQL.

Stopping consent prevents new publication; it does not erase remote history. Current records and outcomes remain local until separately authorized publication. Personal namespaces are operator-managed, not user-owned accounts.

## Scope still requiring evidence

Target-user interviews and observed trials, authenticated receipt allocation, a funded agent purchase, remote correction/retention evidence through judging, video, blog and submission remain unfinished. Ten synthetic Mainnet memories plus a compatibility record and fresh-process Walrus/database parity are now verified. The Vercel production URL is https://runway-ten-xi.vercel.app; see `docs/deployment-gate.json` for hosted checks. The optional invoice agent and priced parser are now implemented at the user's request; their funded Mainnet acceptance remains unperformed. See the [invoice agent guide](INVOICE_AGENT.md) for feature flags, isolated-wallet setup, exact price/limits and recovery. No award eligibility or completed user validation is inferred from local tests.

Existing local records can be explicitly published from their Activity inspector after consent and server writes are enabled. This does not silently backfill old records. Nonlocal jobs keep their existing lifecycle and require reconciliation before retry.

## Vercel

`vercel.json` builds the original Vite frontend and routes `/api/*` to `api/index.js`. The function retains a connection pool between warm requests and uses persistent PostgreSQL for finance state, sessions and durable jobs. Migrations run transactionally under an advisory lock, so simultaneous function startups do not race on schema creation.

Set Node 22, `NODE_ENV=production`, `DATABASE_URL` (a pooled PostgreSQL URL), `APP_ORIGIN` (the exact production HTTPS origin), `INLINE_WORKER=false`, `JOB_MODE=scheduled`, and a generated `CRON_SECRET` of at least 32 characters. Configure sponsor secrets through Vercel encrypted environment variables. The recovered synthetic memory gates are verified. Production keeps `MEMORY_WRITES_ENABLED=false` until publication is intentionally enabled for consenting personal workspaces; no historical backfill is automatic. No secrets belong in `vercel.json` or frontend variables.

Authorized API activity schedules a bounded job drain through Vercel `waitUntil`; job polling resumes known remote jobs. The protected `/api/v1/internal/jobs` route provides a daily recovery sweep, compatible with Vercel Hobby cron limits. Background work has a 60-second drain budget; one in-flight operation can run longer within the 300-second function limit. Bounded remote recall also has a 60-second overall budget. Backlogs continue on subsequent API activity or the daily sweep. This is not a continuously running worker; use the native worker deployment for continuous high-volume processing.

```sh
vercel link --project runway
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```

Verify `/api/v1/health/ready`, SPA deep links, sample save/reload, workspace isolation, and the unauthorized cron response on the actual hosted origin. Production cookies require HTTPS. The migration and sanitized evidence files are explicitly included in the function bundle.

## Native PostgreSQL verification

```sh
RUNWAY_TEST_DATABASE_URL=postgresql://user:password@localhost:5432/test_database pnpm smoke:postgres
```

Use a dedicated test database. The command creates and drops its own disposable schema; it does not import real participants or call paid providers. It verifies concurrent migrations, transaction rollback, concurrent idempotent finance commands, competing job claims and saved-session recovery, and saves sanitized results in `docs/postgres-gate.json`.

The memory smoke command checks an existing job without enabling writes. When no job is known, a new compatibility write requires `MEMORY_WRITES_ENABLED=true`. Unknown submission responses remain `needs_review` through repeated restarts. Existing evidence fields and job IDs are preserved atomically. Do not delete failed evidence to force a replacement.
