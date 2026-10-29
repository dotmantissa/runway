# Runway actual-app demo

An editable Remotion 4.0.538 composition of real browser interactions with synchronized English male neural narration. The 12 scene groups keep footage, audio and phrase captions on the same clock. The capture shows a real signed Sui wallet session and Tatum balance refresh, followed by an isolated synthetic finance example and live recall of twelve published Mainnet records. No API is mocked and no funds are transferred.

Install separately from the application: `cd video && npm ci`. Run `npm run dev` to open Remotion Studio. The browser capture stays ignored; the public demo artifacts and speech clips are committed.

From the repository root, start the app and follow the complete recording/render steps in [the runbook](../docs/RUNBOOK.md#correction-proof-synthetic-evaluation-and-media). `pnpm demo:record` requires generated narration timing and `DEMO_WALLET_KEY` in an ignored mode-600 `.env.submission` (or the process environment). The Wallet Standard bridge holds the key only in Node and signs only this app’s real sign-in challenge; it refuses transaction signatures. `DEMO_PREFLIGHT=1 pnpm demo:record` checks the entire sequence before capture. `pnpm demo:record` `pnpm demo:prepare` trims the recording-only sync slate and authors the scene timeline; `pnpm demo:encode` renders through Remotion and creates the published MP4, WebM, poster, captions and evidence.

The local voice uses Kokoro v1.0 int8, male `am_michael`, US English, normal speed. Model/voice files remain in ignored local research, outside deployment. Phrase-caption timings are estimated within measured speech clips. Actions and speech start times are measured during capture, and a video sync slate establishes the source trim to within one capture frame.

The final 29 October export uses `DEMO_RENDER_ENGINE=ffmpeg` after the shared host exhausted memory during browser rendering. This exports the measured scene timeline with the same speech starts and caption cues at natural speed. The authored Remotion composition remains editable; `docs/demo-gate.json` records the actual export engine and verification.
