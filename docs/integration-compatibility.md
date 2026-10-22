# Sponsor compatibility, 22 October 2026

Node 22.23.4, Sui 2.37.0, native grpc-js 1.14.6, protobuf transport 2.11.1, MemWal 0.1.9, dApp Kit core 1.6.39 and React 2.1.41 are pinned in the lockfile.

Tatum authenticated native gRPC metadata and total native-USDC balance reads succeeded on Mainnet. The gRPC hostname is `sui-mainnet-grpc.gateway.tatum.io`, which differs from the JSON-RPC hostname. See `tatum-gate.json`. Known-digest verification is implemented; no funded receipt or automatic discovery has been verified yet.

MemWal health and signed listing succeeded using the configured delegate and the user-supplied account. A synthetic remember request was accepted, then failed in the relayer embedding service with HTTP 401, User not found. See `memory-gate.json` for the accepted job ID. No completed write or content-matching recall has been demonstrated. Dependent Mainnet acceptance gates remain open. Local work may continue, with explicit local provenance.

Credentials belong only in the ignored local `.env` or the deployment secret manager. Retry scripts with `pnpm smoke:tatum` and `pnpm smoke:memory`. Never label a queued or failed record as stored on Mainnet.
