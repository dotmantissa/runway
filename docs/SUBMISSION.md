# Runway submission package

Prepared 22 October 2026. **Draft; not submitted.** Intended primary track: **Consumer Finance Apps**. The primary product and synthetic Walrus evidence are ready to review. The Agent Payments award is conditional on a real approved purchase; no AI Builder award qualification is claimed.

- Live app: https://runway-ten-xi.vercel.app
- Wallet-free example: https://runway-ten-xi.vercel.app/demo
- Published build story and embedded demo: https://runway-ten-xi.vercel.app/story
- Demo video: https://runway-ten-xi.vercel.app/demo/runway-demo.mp4
- Evidence: https://runway-ten-xi.vercel.app/evidence
- Public source: https://github.com/dotmantissa/runway

The official [event page](https://tatum.io/hackathon/total-recall) embeds the [submission form and rules](https://recall-tatum-walrus.vercel.app). Current page/client source was rechecked on 22 October. It still requires Mainnet Memory, ten memories, relevant Tatum reads, a public repository, a working demo, a published build post and a 2–3 minute demo. Deadline: **10 November 2026, 17:00 UTC / 18:00 Lagos**. Recheck the live form when submitting.

## Project description

Runway helps stablecoin-paid freelancers plan around a late invoice. It separates confirmed funds from expected income, compares promised dates with resolved payment history, identifies the first exposed obligation and proposes the smallest reduction the user's flexible-spending rules permit. Fixed bills and the reserve remain constraints. Users review changes before saving; saving moves no funds.

Tatum's authenticated Sui Mainnet gRPC verifies native-USDC metadata, balances and known-digest receipts. Walrus Memory stores structured outcomes, policies, obligations, lessons and decision evidence. Thirteen synthetic Mainnet records are content-verified, including two corrections and a compatibility record. A fresh process retrieves history and reproduces the database-backed calculation; a second fresh process verifies supersession rather than reusing stale facts.

The public example is synthetic. Its four historical delays move a Friday promise to Tuesday and expose Monday rent; reducing a flexible purchase by 150 USDC preserves the reserve. A no-receipt stress test independently finds the same conservative action. The memory benefit demonstrated is continuity and inspectable context, not better predictions than another store holding the same records.

The optional invoice assistant extracts labeled text or selectable PDFs into a reviewable draft. Its disabled-by-default paid path uses Sui MPP at 0.01 native USDC, a separate tool wallet, explicit approval and durable same-digest recovery. No funded parser purchase is claimed.

A reproducible synthetic temporal evaluation reports all 16 eligible forecasts and 19 sparse-history cases, including adverse results: history mean error 2.1875 days versus promised-date 1.9375, with two versus five observed reserve breaches after proposed actions. Zero real user interviews or trials are claimed.

## Walrus build experience

The integration made acceptance, storage and retrieval separate states. An initially accepted compatibility job failed at the embedding provider; its ID and failure remain in the evidence history. After the provider recovered, we checked that failed job and the empty namespace, explicitly reconciled a versioned replacement, and verified its actual content before counting it. Useful fixture records persist logical IDs, accepted jobs, blobs and content hashes, so restarts resume known jobs rather than blindly submitting again.

Fresh-process recall established exact parity with the same database history. Two later synthetic corrections show a changed reserve policy and a mistaken client association. Both old and new records are retrieved; the active interpretation changes while the original stays inspectable. Hosted namespaces remain operator-managed, the relayer processes plaintext, and personal publication is disabled pending explicit consent. This is integration experience with synthetic fixtures, not longitudinal customer learning.

## Tatum AI Builder experience

Runway uses a custom TypeScript, React and PostgreSQL application built with coding assistance. Authenticated Tatum Sui gRPC is integrated directly. We do not claim that the application was primarily built with Tatum AI Builder. The dedicated AI Builder award should not be selected without qualifying provenance.

## Walrus friction and reproducibility

Observed issues included an embedding-provider authorization failure, an embedding timeout and a relayer compatibility-preflight timeout. The evidence retains the original failure and uses bounded read retries; it does not erase history or count queued jobs as stored memories. Codex client plugin installation separately failed during GitHub cloning, including a TLS receive error on the HTTP/1.1 retry. This client setup failure does not describe the working application SDK path.

Reproduce from the root:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm copy:check
pnpm evaluate
pnpm evidence compare-local
pnpm evidence compare-walrus
pnpm evidence:corrections verify
pnpm build
```

Remote reads need the existing private Memory account/delegate configuration. Publication commands require explicit synthetic-write authorization and persisted manifests. Ordinary setup and the example do not require sponsor credentials.

## Fields requiring the builder

The live form includes contact/identity, referral, first-Web3-project, Tatum account, Sui/Memory identity and terms fields. Public Memory account/delegate IDs and the proposed Sui address have already been prepared in the ignored mode600 `research/submission-fields.private.json`, using the existing configured account. No private keys are included. Review those values in the local file, not by pasting secrets into chat.

Still supply or confirm: intended email, Discord, LinkedIn, optional Telegram, referral details, first-Web3 answer, Tatum dashboard account ID, ownership/intended use of the proposed Sui address, eligibility and acceptance of the event terms. The current form has an additional-docs field for the build story. No form has been sent and no terms accepted on the builder's behalf.

## Eligibility questions that remain unresolved

The current rules' introduction still describes a feedback/form platform, while detailed tracks describe memory applications. Prize stacking and whether the implemented MPP flow meets the special award's interpretation also remain organizer decisions. Questions are ready in [the delivery plan](../DELIVERY.md#organizer-questions-to-resolve). No organizer message has been sent. Do not select AI Builder qualification from coding-assistant usage alone.

No user evidence or funded agent acceptance should be added to this draft until it actually occurs. Update the video/write-up if such evidence is later completed. Keep the demo, credentials and storage available through judging, 11–16 November, and the 17 November announcement.
