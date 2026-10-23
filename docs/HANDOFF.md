# Remaining actions requiring the builder

The implementation, synthetic Mainnet correction proof, engineering replay, build story and narrated actual-app demo are complete. No funded agent purchase, personal-record publication, user study or final submission has been performed.

## 1. Fund and approve the isolated invoice tool wallet

A dedicated unfunded wallet and challenge secret are already prepared in ignored mode600 `.env.agent`; do not generate another key or paste this file into chat. The public funding address and proposed owner/recipient are in ignored `research/tool-wallet-public.json`.

Confirm that the proposed owner/recipient is your intended Sui wallet. Back up the dedicated tool key through your usual secure process. Fund only that tool wallet with native Sui Mainnet USDC and SUI for gas; each parser call costs 0.01 USDC plus gas. It stays outside planner balances. No funding transfer has been submitted by the agent.

After funding/confirmation, the deployment can be configured from these secure files. In your allowlisted signed workspace, approve spending limits, request a quote and explicitly approve one purchase. Review the resulting draft before saving. [INVOICE_AGENT.md](INVOICE_AGENT.md) describes exact limits and same-operation recovery. An agent must not approve the purchase as though it were you.

## 2. Sign in and verify your receiving-wallet allocation

The existing receipt passed the real Tatum adapter. Its digest/recipient remain in ignored `research/tatum-smoke.json`. Sign into the receiving wallet's Runway workspace, open the intended invoice, verify the known digest and allocate the appropriate amount. This requires the owner signature and invoice choice; the backend does not need your primary private key.

## 3. Choose whether to publish personal memory

Production personal publication remains disabled. If you want to exercise it, choose an appropriate non-sensitive record, review the privacy notice and explicitly consent in your signed workspace. The service processes plaintext; the account is operator-managed. Server activation can then be handled without asking you to configure host variables manually. No personal record should be published merely to satisfy a synthetic evidence count, which already exceeds ten.

## 4. Supply real participants or consented histories

No outreach or user sessions have occurred. Use [USER_STUDY_KIT.md](USER_STUDY_KIT.md) for recruitment, consent, interviews and observed trials. The target is five interviews and three small trials, with actual stablecoin/Sui use recorded. Share only appropriately redacted, consented histories. At least four prior resolved invoices are needed for a timing estimate; more invoices are needed for held-out replay. The implementation's synthetic results do not substitute for these users.

## 5. Review identity, eligibility and submit

[SUBMISSION.md](SUBMISSION.md) contains ready project/build-experience answers and public app, blog, source and video links. Existing public Memory account/delegate IDs and the proposed Sui address are prepared in ignored mode600 `research/submission-fields.private.json`. Supply or confirm contact/referral details, first-Web3 status, Tatum dashboard ID and intended wallet/account identity. Review eligibility and the terms yourself before final submission. No terms have been accepted or form sent on your behalf.

Current deadline is 10 November 2026, 17:00 UTC / 18:00 Lagos. The rules' mission contradiction and special-award interpretation remain organizer questions; the application does not claim AI Builder qualification. The demo video has English male neural narration synchronized to the actual app flow, optional English captions and a written transcript; no recording is needed from you to use this package.

## Separate technical blocker: Codex Memory plugin

The app's Walrus SDK integration works. The AI-client plugin is still uninstalled because the official marketplace clone failed twice: HTTP/2 CANCEL first, then Git exit128 / `curl 56 GnuTLS recv error (-9): Error decoding the received TLS packet`, unexpected disconnect, early EOF and invalid index-pack on an HTTP/1.1 retry.

The [requested setup instructions](https://memory.walrus.xyz/skills/setup), rules8/10, say to stop at the first blocker and report installation errors instead of substituting plain MCP configuration. The installer was stopped; existing Codex configuration is preserved, no duplicate MCP entry exists, no hooks were trusted and `~/.memwal/credentials.json` was never read. This is a reported technical blocker, not a claim that you must repair application code.

After successful plugin installation, the remaining client actions are your browser login/authorization, one-time hook review in `/hooks` and a complete client restart. Those must happen before a neutral setup fact can be saved/recalled and automatic client memory can be claimed.
