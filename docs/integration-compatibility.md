# Sponsor compatibility, 22 October 2026

Node 22.23.4, Sui 2.37.0, native grpc-js 1.14.6, protobuf transport 2.11.1, MemWal 0.1.9, dApp Kit core 1.6.39 and React 2.1.41 are pinned in the lockfile.

Tatum authenticated native gRPC metadata and total native-USDC balance reads succeeded on Mainnet. The gRPC hostname is `sui-mainnet-grpc.gateway.tatum.io`, which differs from the JSON-RPC hostname. See `tatum-gate.json`. The real adapter verified a funded native Circle USDC receipt on 22 October 2026, including successful status, checkpoint, matching digest and positive recipient credit. Public evidence omits wallet identifiers and financial details; full evidence remains in ignored local research. Hosted verification in the recipient’s signed workspace and invoice allocation remain pending. Automatic discovery remains disabled.

MemWal health and signed listing initially succeeded using the configured delegate and the user-supplied account. A synthetic remember request was accepted, then failed in the relayer embedding service with HTTP 401, User not found. See `memory-gate.json` for the accepted job ID. No completed write or content-matching recall has been demonstrated. Dependent Mainnet acceptance gates remain open. Local work may continue, with explicit local provenance.

Credentials belong only in the ignored local `.env` or the deployment secret manager. Retry scripts with `pnpm smoke:tatum` and `pnpm smoke:memory`. Never label a queued or failed record as stored on Mainnet.

An earlier 22 October recovery check confirmed the existing job remains terminal failed while signed listing succeeded and public health reported degraded writes. A later read-only check reported healthy unsigned writes but rejected signed listing with 401; follow-up version preflights returned 502 and timed out. The current authentication cause remains unconfirmed, and the later health response does not prove embedding recovery. The compatibility script now preserves prior evidence and refuses duplicate submission after lost responses. Service health alone does not establish embedding availability.

Native PostgreSQL 18.6 passed isolated concurrent startup, transaction rollback, finance idempotency, worker leasing and session restart checks; see `postgres-gate.json`. Vercel Node-function routing and scheduled background processing are implemented; hosted verification is recorded separately from local checks.
