# Runway submission package

Updated 29 October 2026. **Draft; not submitted.** Intended primary track: **Consumer Finance Apps**. The primary product and synthetic Walrus evidence are ready to review. The Agent Payments award is conditional on a real approved purchase; no AI Builder award qualification is claimed.

- Live app: https://runway-ten-xi.vercel.app
- Wallet-free example: https://runway-ten-xi.vercel.app/demo
- Published build story and embedded demo: https://runway-ten-xi.vercel.app/story
- Demo video: https://runway-ten-xi.vercel.app/demo/runway-demo.mp4 (2m36s actual app flow with synchronized male English narration and captions)
- Evidence: https://runway-ten-xi.vercel.app/evidence
- Public source: https://github.com/dotmantissa/runway

The official [event page](https://tatum.io/hackathon/total-recall) embeds the [submission form and rules](https://recall-tatum-walrus.vercel.app). Current page/client source was rechecked on 22 October. It still requires Mainnet Memory, ten memories, relevant Tatum reads, a public repository, a working demo, a published build post and a 2–3 minute demo. Deadline: **10 November 2026, 17:00 UTC / 18:00 Lagos**. Recheck the live form when submitting.

## Project description

Runway helps stablecoin-paid freelancers plan around a late invoice. It separates confirmed funds from expected income, compares promised dates with resolved payment history, identifies the first exposed obligation and proposes the smallest reduction the user's flexible-spending rules permit. Fixed bills and the reserve remain constraints. Users review changes before saving; saving moves no funds.

Tatum's authenticated Sui Mainnet gRPC verifies native-USDC metadata, balances and known-digest receipts. Walrus Memory stores structured outcomes, policies, obligations, lessons and decision evidence. Thirteen synthetic Mainnet records are content-verified, including two corrections and a compatibility record. The evidence page now includes a live, read-only Recall from Walrus button: it retrieves all twelve useful records with matching namespaces, blob IDs and hashes and recomputes both the original and corrected decisions. A failed remote request never substitutes local history. Separate fresh-process checks also verify parity and supersession.

The new demo begins with the supplied wallet signing a real Runway login message and refreshing its actual native-USDC balance through Tatum. The finance scenario then uses an isolated, labelled synthetic example. Its four historical delays move a Friday promise to Tuesday and expose Monday rent; reducing a flexible purchase by 150 USDC preserves the reserve. A no-receipt stress test independently finds the same conservative action. The memory benefit demonstrated is continuity and inspectable context, not better predictions than another store holding the same records.

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

## Copy-ready form answers

**Email:** negativemantissa@gmail.com (provided by the builder).

**Discord handle, LinkedIn, referral source and first Web3 project:** require the builder's answers. No personal accounts or history are inferred. Telegram and community/account referral can be omitted if not applicable.

**Tatum ID:** retrieve from Tatum Dashboard → My Account → My Account Info. An API key or Memory account ID is not this identifier.

**SUI address, Account ID (SUI), MEMWAL_AGENT_ID:** securely re-derived from the supplied wallet and existing configured Memory account/delegate on 29 October. They are provided in the chat handoff and ignored local form-identifiers evidence, not duplicated in this public document.

**Project description:**

Runway helps freelancers paid in stablecoins avoid a missed bill when a client pays late. It separates confirmed cash from unpaid invoices, compares promised dates with resolved payment history, identifies the first exposed bill, and proposes the smallest reduction permitted by the user's flexible-spending rules. Fixed bills and the reserve remain constraints, and the user reviews changes before saving.

Tatum performs authenticated Sui Mainnet reads for native-USDC balances and receipt verification. Walrus Memory persists structured payment outcomes, rules, lessons and corrections across sessions. Thirteen synthetic Mainnet records have completed, content-matched evidence. The live recall button retrieves all twelve useful records, verifies their blobs and hashes, and reproduces the spending decision; recalled policy and client corrections prevent stale facts from silently driving another forecast.

The demo shows a real wallet login and Tatum balance refresh, followed by an isolated synthetic scenario: a Friday promise becomes Tuesday from past payments, exposing Monday rent. Reducing a 250 USDC flexible purchase to 100 preserves a 100 USDC reserve. The app saves and reloads the reviewed plan, then reproduces the decision through live Walrus recall. This fits Consumer Finance Apps by turning payment timing into an inspectable budgeting decision. No funds are transferred, and no customer savings or improved forecasting are claimed.

**Short demo video:** https://runway-ten-xi.vercel.app/demo/runway-demo.mp4

**GitHub repo:** https://github.com/dotmantissa/runway

**Additional documentation:** https://runway-ten-xi.vercel.app/story

**Walrus experience:**

Walrus Memory worked well for carrying structured payment outcomes and corrections between sessions. The important integration lesson was to treat job acceptance, completed storage and content-verified recall as separate states. We persist logical IDs, job IDs, blobs and hashes, so interrupted work can resume without publishing duplicates. Live recall now reproduces the original and corrected finance decisions from Mainnet records. Clearer provider-health diagnostics and stronger exact-record retrieval tools would make the integration easier.

**Tatum AI Builder experience:**

I did not use Tatum AI Builder. Runway is a custom TypeScript, React and PostgreSQL application built with coding assistance, integrating Tatum's authenticated Sui Mainnet gRPC directly for balance and receipt verification. I cannot assess AI Builder's prompting, generated apps or dashboard from this build.

**One Walrus Memory friction point:**

A remember job was accepted but later failed at the embedding provider. Counting acceptance as storage would have overstated the integration. We retained the failure and job ID, explicitly reconciled the replacement, and counted the record only after its content was retrieved and matched. Surface downstream embedding health and terminal failure reasons earlier in the developer workflow.

**Social links:** add the URL after the builder publishes the prepared X post. No social post has been sent automatically.
