# Runway actual-app demo

An editable Remotion 4.0.538 composition of real browser interactions with synchronized English male neural narration. The 12 scene groups keep footage, audio and phrase captions on the same clock. Financial examples are synthetic; the capture never mocks an API or approves a purchase.

Install separately from the application: `cd video && npm ci`. Run `npm run dev` to open Remotion Studio. The browser capture stays ignored; the public demo artifacts and speech clips are committed.

From the repository root, start the app and follow the complete recording/render steps in [the runbook](../docs/RUNBOOK.md#correction-proof-synthetic-evaluation-and-media). `pnpm demo:record` requires generated narration timing; `pnpm demo:prepare` trims the recording-only sync slate and authors the scene timeline; `pnpm demo:encode` renders through Remotion and creates the published MP4, WebM, poster, captions and evidence.

The local voice uses Kokoro v1.0 int8, male `am_michael`, US English, normal speed. Model/voice files remain in ignored local research, outside deployment. Phrase-caption timings are estimated within measured speech clips. Actions and speech start times are measured during capture, and a video sync slate establishes the source trim to within one capture frame.
