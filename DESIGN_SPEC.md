# Runway interface, brand and motion specification

Revision: 21 October 2026. This file is the frontend implementation contract. It specifies intended design and interactions; no Runway screens, logo exports or animation have been built yet. Follow [ARCHITECTURE.md](ARCHITECTURE.md) for data truth and [IMPLEMENTATION.md](IMPLEMENTATION.md) for sequence.

## 1. Quality benchmark and original direction

The benchmark is [nearhackathon.com](https://nearhackathon.com/), inspected in a real browser at 1440×1000 and 390×844 on 21 October. Its strengths are deliberate type scale, disciplined spacing, a responsive interactive letter sphere, consistent borders and a clear motion control. Public source inspection confirmed Canvas 2D, pointer/touch response, visibility/resize handling, font readiness and reduced-motion support. Screenshots are retained locally in ignored research for comparison.

Runway's direction is **an editorial cash-flow instrument**: a clean paper-like canvas, deep ink, a restrained green action color, readable financial rows and an original orbital payment-date illustration. It should feel like a carefully designed financial product with a recognizable voice. The reference is a craft benchmark; its pixel typography, letter sphere, terminal styling, layout, copy and assets do not enter Runway.

Design decisions:

- The marketing page has a spacious asymmetric composition. The app uses compact, well-aligned rows with a few strongly differentiated panels.
- Every surface answers a task: current funds, upcoming bill, expected receipt, reviewable change or supporting evidence. Avoid a uniform grid of interchangeable statistic cards.
- Use real product language and actual functions. Remove abstract claims, fabricated testimonials, invented adoption metrics and unavailable integration logos.
- The landing illustration conveys the difference between a promise and remembered timing. The app's financial timeline remains a separate accessible, data-driven graphic.
- Visible monetary values stay stable during updates. No count-up money, decorative random charts, sparkles, typing illusions or fake progress.
- Ship one complete light theme. A dark theme is optional after quality acceptance and must receive its own contrast/motion checks.

“Does not look AI-generated” is a quality goal evaluated by deliberate composition, specificity and human review. It is not a claim about who wrote the source code.

## 2. Brand and original logo

Working name: **Runway**. Write the name with initial capital in body copy and the wordmark; use lowercase in code/path conventions. No clearance or domain ownership is implied.

Logo concept: **two converging rails and a horizon dot**. The rails represent constraints narrowing toward a future payment date; the dot represents a resolved event. This is an original geometric mark, not an airplane, generic coin or stock wallet symbol.

### Geometry and construction

Master SVG viewBox `0 0 32 32`:

- Left rail: `(7,27)` to `(13,8)`.
- Right rail: `(25,27)` to `(19,8)`.
- Lower crossbar from `(10,21)` to `(22,21)`.
- Upper crossbar from `(12,15)` to `(20,15)`.
- Horizon dot centered `(16,4)`, radius `1.75`.
- Rails/crossbars use `2.25` stroke width with round caps; no outline box inside the mark.
- Normalize intersections so overlaps do not become darker/thicker in raster exports. Inspect optical balance at small sizes and adjust master coordinates only through a versioned brand decision.

Wordmark uses Public Sans Semibold with manually reviewed spacing, then exported as vector outlines for the static logo asset. In the app, accessible brand links combine an SVG mark with live text for crisp rendering. Minimum clear space is the dot-to-rail gap; minimum displayed mark size 20 px. Do not rotate the brand mark as a loading spinner. Use one-color ink/white variants rather than coloring each rail.

Required assets during implementation:

| File | Use and acceptance |
| --- | --- |
| `public/brand/runway-mark.svg` | UI mark using currentColor where appropriate; crisp at 20/24/32/48 px. |
| `public/brand/runway-wordmark.svg` | Header, docs and blog wordmark; correct accessible label. |
| `public/brand/runway-lockup.svg` | Mark plus wordmark with consistent 10 px relative spacing. |
| `public/favicon.svg` | Browser tab using simplified mark in ink; color-scheme-aware background if supported. |
| `public/favicon.ico` | Actual 16/32/48 px raster layers; not an SVG renamed to ICO. |
| `public/apple-touch-icon.png` | 180×180 with mark on ink/white high-contrast square. |
| `public/icon-192.png`, `public/icon-512.png` | App/bookmark/taskbar/manifest icons, with maskable-safe inner region. |
| `public/site.webmanifest` | Name/short name Runway, correct start URL, theme/background and valid icons; no offline claim. |
| `public/brand/runway-social.png` | 1200×630 share image with wordmark and product sentence, no unsupported score/prize claim. |

Brand appears in landing header/footer, app sidebar/mobile header, sign-in, onboarding, loading shell, 404/error screen, evidence export cover, blog header, social preview and browser/app icons. Browser title format is `Overview · Runway`, `Invoices · Runway`, `Plan · Runway`, `Activity · Runway`. Manifest icons support installed shortcuts where the platform permits; an OS taskbar icon is platform-controlled, so verify the browser/shortcut behavior rather than claiming an icon can be forced everywhere. Do not promise PWA offline finances without implementing and validating freshness behavior.

Simplified 16 px favicon omits the upper crossbar if needed; preserve the two rails and dot. Use generous white/ink backing for recognizability at tiny size. Capture browser-tab screenshots after asset wiring. Logos are never fetched from an untrusted external URL.

## 3. Design tokens

Use CSS variables as the single token source. Components may not invent unrelated grays, border radii or shadow stacks. Token names are descriptive, not vendor palette references.

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#F7F8F4` | Page background. |
| `--surface` | `#FFFFFF` | Forms, focused panels and menus. |
| `--surface-subtle` | `#EEF1EA` | Selected navigation, quiet table sections. |
| `--ink` | `#20261F` | Primary text and wordmark. |
| `--ink-secondary` | `#596356` | Descriptions and secondary labels. |
| `--line` | `#D8DED3` | Decorative dividers; not relied on alone to identify interactive controls. |
| `--control-line` | `#7C8777` | Unfilled input/control boundary where required for contrast. |
| `--action` | `#245B43` | Primary controls and selected state. |
| `--action-hover` | `#1B4834` | Primary hover. |
| `--action-ink` | `#FFFFFF` | Text on dark action. |
| `--warning` | `#8F4B12` | Risk text/icon. |
| `--warning-surface` | `#FFF3DF` | Bill exposure surface. |
| `--danger` | `#A3312B` | Form/verification error text. |
| `--danger-surface` | `#FCECE9` | Error region. |
| `--focus` | `#245B43` | Focus outline with offset. |
| `--radius-control` | `8px` | Buttons/inputs. |
| `--radius-panel` | `12px` | Important content surfaces/drawers. |
| `--radius-small` | `4px` | Source labels and compact badges. |

Shadow: one restrained menu/dialog shadow `0 12px 32px rgb(32 38 31 / 10%)`; ordinary financial rows use borders and spacing. No glow, glass blur or floating panels with different shadow depths. Use a two-pixel focus outline offset two pixels; if selected/dark surface obscures it, add a white inner separator.

Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 112 px. Default app section gap 32; compact row gap 12; controls 44 px tall; mobile primary controls 48 px. Card padding 24 desktop/20 mobile, but do not make every section a card.

### Typography

Self-host licensed WOFF2 files and include license attribution. Primary UI/body: **Public Sans**, regular 400, medium 500 and semibold 600. Editorial hero accent: **Source Serif 4**, regular 400; reserve it for one hero line and selected explanatory headings. Evidence IDs only: **IBM Plex Mono**, 400. Limit loaded font files and preload only the primary critical face. A source-license or loading issue falls back to system sans/Georgia/monospace with tested line breaks.

| Role | Desktop | Mobile |
| --- | --- | --- |
| Landing hero | 72/76 px, serif, weight 400, tracking -0.035em. | 42/46 px, tracking -0.025em. |
| Landing supporting sentence | 19/29 px, max 46 characters per line. | 17/26 px. |
| App page title | 30/36 px, semibold. | 26/32 px. |
| Section title | 20/28 px, semibold. | 20/28 px. |
| Principal money | 42/48 px, semibold, tabular numbers. | 36/42 px. |
| Row/form body | 15/22 px. | 16/24 px. |
| Secondary/status | 13/18 px; avoid text smaller than 12. | 13/20 px. |
| Evidence IDs | 12/18 px, mono, wrap/copy affordance. | 12/18 px. |

Money and dates align with tabular figures. Currency unit is smaller but readable; do not imply USDC is a confirmed USD bank balance by using `$` indiscriminately. Show `800 USDC` in the app; input label is `Amount (USDC)`. Negative projected funds show a proper minus sign and explicit shortage text. Decimal precision: six when exact receipt/tool amounts matter, normally up to two for planning values with an exact-value drawer.

## 4. Information architecture and navigation

Public routes: `/`, `/demo`, `/signin`, `/privacy`, `/evidence` for curated synthetic integration proof, and a 404. Authenticated routes: `/app/overview`, `/app/invoices`, `/app/invoices/:id`, `/app/plan`, `/app/activity`, `/app/settings`. Onboarding lives at `/app/setup`. Plan/evidence drawers use URL query state or nested routing so refresh/back returns to the selected entity correctly.

Four primary destinations: **Overview**, **Invoices**, **Plan**, **Activity**. Settings is a bottom utility link. Evidence opens in context from a plan or activity row; it is not a fifth main destination. The explanation assistant is a drawer, not a blank chatbot landing screen.

Desktop shell at ≥1024 px: 216 px left rail, full-height paper background, 24 px wordmark, main content max 1184 px, 40 px side padding, 64 px quiet top bar. Sidebar selected state has an ink icon and tinted row, not a bright left glow. Header shows workspace name, sample/live label and wallet/settings actions. Chain connection status is secondary; it does not dominate the app title.

Tablet 768–1023 px: top brand/navigation row with four text destinations, 24 px content padding. No permanent thin icon-only rail that hides labels. Mobile <768 px: 56 px top bar and 64 px bottom navigation with icon plus text, safe-area padding; main content has 20 px side padding and bottom space above navigation. At 320 px, long hashes wrap in drawers and no essential task requires horizontal page scroll.

Account scope is always visible: `Sample workspace`, `Your workspace`, or `Live settlement exercise`. The sample has a narrow `Example data · 29 Oct 2026` label and a reset control under its menu. Do not use a giant warning banner on every screen; keep provenance persistent and unobtrusive. Live exercise balances stay on their own evidence view.

## 5. Landing page composition and exact copy

Desktop header: wordmark left; `How it works` and `See the example` as anchor links; `Open Runway` primary right. Mobile shows wordmark plus `Try the example`; secondary links move to the footer. Header has a bottom rule and no floating translucent pill.

Hero: left column about 55%, right illustration about 45%, within a 1200 px container. Top spacing 88 px desktop/48 mobile. Small eyebrow `For freelancers paid in stablecoins`. Heading uses controlled line breaks:

> Your client says Friday.
> Your history says Tuesday.

Break each sentence into two shorter lines on the 55% column when necessary; desktop serif hero type scales with `clamp(56px, 5vw, 72px)` rather than forcing a 24-character sentence into a 630 px line. The sentence pair is the copy, not a requirement for exactly two rendered lines. At mobile width use 42/46 px and visually review the word breaks. Do not shrink the heading to fit an arbitrary screenshot composition.

Supporting copy:

> See which bill a late payment puts at risk, and the smallest spending change that covers it.

Primary CTA `Try the example` opens `/demo` immediately. Secondary `Use my own numbers` opens sign-in/setup. Under CTA: `No wallet needed for the example.` No waitlist, vague “Get started” button or sign-in gate before the product can be assessed.

The original orbit appears to the right with two visible labels: `Promised · Fri 30 Oct` and `From past payments · Tue 3 Nov`. Its caption reads `Four past payments. Median delay: four days.` This is the labeled synthetic example, not actual customer performance.

Following sections, in order:

1. **A late payment should not be a surprise twice.** Show the actual sample timeline and `Reduce Saturday's purchase by 150 USDC` action. Caption: `Example data. Rent stays fixed. Your reserve stays at 100 USDC.` Link `Open this plan`.
2. **One invoice. A clearer next step.** Three numbered text rows: `Add the promise`, `Check what arrived`, `Plan around the pattern`. Each has one concrete sentence; no feature-icon tile grid.
3. **See what changed, and why.** A compact real-looking evidence excerpt with sample label. Copy: `Each recommendation points to the payments and rules behind it. Your next session can pick up the same history.` Only mention cross-tool/user-owned portability after that exact capability ships.
4. **Built on receipts, not guesses.** Quiet sponsor names and role descriptions: `Tatum checks Sui balances and receipts.` and `Walrus Memory keeps the outcomes and corrections.` Use approved official wordmarks with licenses only after integration verification. Avoid “powered by blockchain” as consumer headline.
5. **Start with the next bill.** CTA `Try the example`, secondary `Use my own numbers`. Footer: brand, privacy, source/evidence, repository after public URL exists.

If automatic discovery is cut, do not use “We watch every payment” or imply unattended monitoring. If payments are cut, omit parser marketing entirely. Do not display hackathon prize amounts or a 9/10 rating in product marketing.

## 6. Original circle animation: payment-date orbit

Name in code: `PaymentOrbit`. This is an original projected orbital diagram with a central open horizon circle, not a rotating letter globe. It illustrates two expected payment dates and the dated bill between them. It is decorative product storytelling; the accessible financial timeline below carries the actual information.

### Geometry and drawing

Container aspect ratio `1 / 1` desktop, max 480 px, min 320 px on mobile where space allows. Canvas CSS matches container; physical resolution is capped at `min(devicePixelRatio, 2)`. Background is transparent. DOM text/control overlay occupies the same reserved container. No full-screen intro, loading lock or automatic scroll hijack.

Draw three elliptical guide paths with base radii 0.24/0.33/0.42 of the smaller dimension, projected vertically at 0.62, rotated on screen by -18 degrees. Use uniform 1 px muted-ink strokes at 12–22% opacity. The central horizon is a 74 px diameter open ring with the original mark static inside. Add 24 evenly spaced tick marks on the outer guide, with four clearly anchored event dots. Do not render letter particles or the reference's grid/corner brackets.

For an orbit point angle `a`, radius `r`, pitch scale `k=0.62`, and screen rotation `b=-18°`:

```text
u = r * cos(a)
v = k * r * sin(a)
x = cx + u * cos(b) - v * sin(b)
y = cy + u * sin(b) + v * cos(b)
```

A small decorative marker travels one loop every 28 seconds using elapsed time, not frames. A quiet line between Friday's promised point and Tuesday's historical estimate has an amber interruption at Monday's rent point. The static event dots and labels do not move with the decorative marker, so dates remain legible. The ring is a spatial metaphor, not a circular calibrated date chart; the explicit linear timeline carries quantitative ordering.

Depth uses only stroke opacity and marker size within narrow bounds. No blurred glow, stars, random data particles, 3D dependency, noise texture or splash screen. Reserve labels outside the paths using measured DOM boxes. At narrow width, put labels in two stable rows below the illustration rather than colliding text on the ring.

### Interaction and lifecycle

1. Server/static HTML renders the logo, labels, caption and reserved illustration space immediately.
2. After hydration and critical font readiness, initialize Canvas 2D; static SVG fallback remains if unavailable.
3. Pointer movement inside the figure shifts the center at most 6 px desktop and changes screen rotation at most 3 degrees, eased with a time-based damped interpolation. It does not alter financial dates/amounts.
4. Hover highlights only the nearest decorative guide/event, with a subtle opacity change. Essential labels are always present; nothing depends on discovering hover.
5. Touch scroll remains `pan-y`; no preventDefault on touch movement, no mandatory drag. Pointer response is disabled for coarse pointers. Tapping a labeled event button can highlight the corresponding timeline row.
6. `Pause animation`/`Resume animation` is a real 44 px target in DOM. Persist the manual preference locally; reduced motion overrides automatic animation.
7. With `prefers-reduced-motion: reduce`, show static paths/markers from first paint. No route-swoop, orbit or number animation; state transitions occur immediately or with a short opacity change if acceptable.
8. Use `IntersectionObserver` and `visibilitychange` to stop requestAnimationFrame when offscreen/hidden. `ResizeObserver` resets canvas resolution/geometry without duplicate loops. Cleanup observers, pointer listeners and frame IDs on unmount.
9. Render at a maximum 30 fps, using a 33 ms time gate. Target drawing work under 4 ms/frame on the agreed reference laptop and under 8 ms on mobile; record actual device/browser, not an invented universal result.
10. Draw deterministic initial geometry. If repeated frames exceed budget or Save-Data is enabled, fall back to the static visual with all controls/labels usable. An animation failure must not affect the CTA or app data.

Canvas is `aria-hidden`; an adjacent visible caption and labeled event buttons express the meaning. A decorative orbit is not announced as verified payment data. Pause button has a state-aware accessible label. Prefer the SVG fallback for no-JS/reduced-motion. No pointer-follow effects occur on forms, plan review or evidence screens.

### Motion acceptance

Check 1440/1024/768/390/320 px, 1×/2× pixel ratio, mouse/touch, keyboard, manual pause, reduced-motion at load and changed during session, hidden tab, scrolling offscreen, route unmount/remount and Canvas unavailable. Confirm one animation loop, no layout shift, no text collisions and no blocked page scroll. Record a short normal-motion and static/reduced-motion comparison with the reference available side by side for craft review.

## 7. Overview screen

Header: `Your next two weeks`, date range and a small `Edit dates` control constrained to the 14-day policy. The largest value is `Available from confirmed funds`, not a forecasted wallet total. Under it show confirmed total, accepted commitments and reserve as a readable equation/table. If zero, show the commitment shortage explicitly.

Desktop first region is two columns: left 58% current funds ledger; right 42% the single most relevant exposed-bill panel. Below spans the financial timeline and a short list of next obligations. Do not fill the viewport with six equal metric cards.

Hero fixture exact content:

| Label | Text/value |
| --- | --- |
| Confirmed funds | `800 USDC` |
| Planned spending | `850 USDC` |
| Reserve | `100 USDC` |
| Available from confirmed funds | `0 USDC` |
| Commitments and reserve exceed funds | `150 USDC` |
| Bill panel title | `Rent comes before this payment.` |
| Supporting text | `Cedar's past payments suggest Tuesday. Rent is due Monday.` |
| Gap | `50 USDC uncovered · 150 USDC below your reserve` |
| Proposed action | `Reduce Saturday's purchase from 250 to 100 USDC.` |
| Primary action | `Review this change` |
| Evidence action | `Why Tuesday?` |

Client alias Cedar is synthetic; use actual authorized client alias for live data. Sample count text: `Based on 4 past payments. Observed delay: 3 to 5 days.` Do not display a precise percent confidence for this date range.

Below the current ledger, visually separate `Expected, not received` with invoice amount, promised date and estimate. Do not add it into the prominent available figure. The no-receipt stress control reads `What if nothing arrives?`. Never use `Safe to spend` without the modeled-scope caveat; preferred label is the more exact confirmed-funds wording above.

After accepting the fixture change, planned spending becomes `700 USDC`, reserve remains `100 USDC`, shortage becomes `0 USDC`, available remains `0 USDC`. The status is `Plan updated`, with `Saturday's purchase is now 100 USDC.` Show a route/link to audit. Confirmed funds remain 800 until a real or correctly labeled simulated receipt updates them.

## 8. Invoice list, detail and import

Desktop list has purposeful columns: client/reference, amount/remaining, promised date, estimated date with sample label, status and row action. Right-align amounts, left-align dates/text. Default order shows unresolved/overdue before paid; sorting is explicit and stable. Status is text plus small shape/icon; not color alone. Row click opens detail, while buttons have their own focus/labels.

Mobile uses stacked semantic rows preserving the same information: alias/reference top, amount right, promised/estimated dates next, status/action last. It is a designed list, not a desktop table squeezed into unreadable columns. Pagination/cursor loading does not reset the user's filters.

Detail heading is the invoice reference plus client alias. Top summary distinguishes `Expected`, `Received` and `Remaining`; a full paid badge requires verified allocations or labeled user-confirmed offchain evidence. Sections: timeline of expectations/receipts, payment timing history and relevant memory records. Main actions: `Add receipt`, `Edit invoice`, `Confirm an offchain payment`. Changing client or date after resolution uses the correction flow with a reason.

Add/edit form fields: client, reference, amount (USDC), due date, invoice timezone, optional monitored sender. Each has a persistent label. Default timezone shown as `Dates use Africa/Lagos` or selected zone. Amount uses decimal keyboard; the fractional limit is described only on invalid input. Fixed save button reads `Save invoice`; loading `Saving invoice`; success `Invoice saved`. A cancelled wallet or network request keeps the form draft.

Receipt flow:

1. Enter digest, optional invoice association. Button `Check receipt`.
2. Local job progress `Checking the receipt through Tatum` with actual status, not fabricated percent.
3. Valid result displays exact amount, recipient, source/time and matching candidates. Button `Use this receipt` when user choice is required.
4. Ambiguous: `This receipt could match more than one invoice. Choose where it belongs.`
5. Wrong token/recipient: explain which check failed without claiming the client is fraudulent.
6. Partial: `Received 400 USDC. 800 USDC remains.`
7. Verified full: `Payment confirmed`; memory can separately say `Memory update pending`.

CSV import has a separate preview drawer: row count, required columns, timezone, accepted/rejected rows with exact reasons. `Import 6 invoices` reflects actual valid selections. No data is saved on file selection; confirming is a batch command. An invalid file keeps the upload control and field-level errors. Paid historical rows clearly display `User-confirmed history`; they do not acquire chain verification from being imported.

Optional paid parser exposes price before approval and leaves manual entry equally available. Primary text `Parse invoice for 0.01 USDC`; explain the builder-operated service in the live exercise. Payment success does not auto-save an unreviewed extracted invoice.

## 9. Plan screen and review

Header: `Plan around the next payment`. Context row selects the tracked invoice, horizon and scenario. Scenario tabs use human labels: `Client's date`, `From past payments`, `Latest observed delay`, `No payment in this period`. In a no-history state, the history tabs are disabled with a clear reason, not an empty graph.

Desktop order:

1. Current confirmed-funds summary, always unchanged when only history/scenario changes.
2. Accessible financial timeline with four labels and explicit reserve line.
3. Exposure statement: bill/date, uncovered amount, reserve gap.
4. Proposed spending changes as before/after rows with rationale and permitted cap.
5. `Review changes` primary, `See the evidence` secondary.
6. Small uncertainty note and no-receipt comparison link.

The financial chart is custom SVG plus an equivalent semantic event table. X-axis is real local dates; Y-axis is projected USDC with reserve line and zero line distinguished. Confirmed opening state is solid ink, uncertain receipt segment is dashed; risk uses warning color plus label. Do not imply a confidence band from four observations. Selecting an event highlights its row and opens details. Keyboard buttons can select each event; a text table can be used without the chart. On mobile, default to a vertical dated ledger with amounts/after-balances; the chart is collapsible.

Review drawer is 440 px on desktop/full-screen on mobile. It names each change and current original version. Fixture text:

> Reduce Saturday's purchase by 150 USDC.
>
> New purchase amount: 100 USDC.
>
> Rent remains 600 USDC. Your reserve remains 100 USDC.
>
> This covers the listed expenses through 4 November without this invoice arriving.

CTA `Save these changes`; secondary `Keep my current plan`. Final helper `This updates your plan. It does not move funds.` Saving cannot occur from pressing Enter accidentally while reviewing another field. Focus starts on drawer heading, then explicit actions; confirmation is a finance edit, not a wallet transfer.

If infeasible: `There is no permitted change that covers this gap.` Explain remaining gap and which fixed/capped rules constrain it. Offer `Edit my spending rules` and `Keep this scenario`; never a disabled unexplained button or instruction to delay rent. If already funded/no adjustment: `No spending change is needed for this scenario.` Show the remaining no-receipt dependency, not a green guarantee.

If state changes during review: retain before/after context, disable acceptance and say `Your numbers changed. Review the updated plan.` Action `Recalculate`. Show an updated plan only after server validation; never silently accept a new amount.

The comparison proof lives under `See the evidence`: same current inputs for `Without history`, `Walrus history`, `Same history from database`. These are evaluation labels, not default consumer jargon. Explain `The same history gives the same calculation. Walrus lets this session retrieve the recorded outcomes.` A no-receipt baseline can recommend the same 150 reduction; the proof must acknowledge that memory adds client-specific timing rather than monopolizing conservative arithmetic.

## 10. Activity, memory and explanation

Activity is a chronological text ledger grouped by date: invoice saved, receipt verified, policy corrected, plan accepted, memory write completed/failed. Actor/source/time is shown on expansion. Filters `All`, `Payments`, `Plan changes`, `Memory`. Load more preserves place. Do not print raw terminal log JSON into the main activity feed.

Memory evidence drawer has a clear order: `Why this record matters`, human summary, type/source, historical event date, actual write time, publication/recall status, supporting receipt link, logical ID and real blob ID with copy control. Long IDs wrap, remain selectable, and use monospaced font. Old records read `Superseded` and link to the active correction; they are not hidden in a way that conceals provenance.

Status copy:

| State | Human label |
| --- | --- |
| Local outbox queued | `Waiting to save to memory` |
| Remote accepted/running | `Saving to Walrus Memory` |
| Uploaded, not fully indexed | `Uploaded. Checking retrieval.` |
| Done plus matching recall | `Stored and retrieved on Mainnet` |
| Job failed | `Memory could not be saved` |
| Unknown submission | `Checking whether the memory was saved` |
| Missing required record | `History is incomplete` |

No successful checkmark/badge before actual verification. One real completed mainnet count is shown in the evidence view, with its verification time. Regular users do not need to see the hackathon's ten-write requirement.

Explanation drawer title `Why this plan?`. Three suggested questions, a short grounded answer, supporting record links and no decorative AI avatar. Optional free text has a visible label `Ask about this plan`. A response references the selected immutable plan; if state changed, show `This explanation describes an earlier plan.` Model failure has a useful structured template; no generic “Something went wrong” dead end.

## 11. Settings, onboarding and error pages

Settings sections: account/timezone, included funds, reserve/horizon rules, memory consent/ownership, optional tool budget, session/logout. Display operator-managed ownership honestly. Memory text: `Runway's hosted memory account stores these records. The memory service may process their contents.` Link precise privacy details. Do not claim end-to-end secrecy or user-owned memory in this mode.

Onboarding is three short screens: `Set your reserve`, `Add the next bill`, `Add a payment you expect`. Included account confirmation appears alongside the reserve step. Completion summary shows what is modeled and links missing data. Back preserves drafts. Skip invoice yields a usable no-receipt planner, not forced dummy content.

Sign-in text: `Use your own numbers`, `Connect a Sui wallet to keep your workspace private. You can still try the example without one.` If broader Web2 sign-in is desired later, it needs a separate supported identity flow; do not show a nonfunctional email button.

404: `This page is not here.` CTA `Back to Runway`. App route failure: `We could not load this view.` CTA `Try again`, secondary `Open overview`; retain the shell and a user-safe request ID in optional details. No emoji or mascot used as a substitute for useful recovery.

## 12. Global interaction-state contract

| State | Required behavior |
| --- | --- |
| Initial loading | Layout-matching skeleton for actual content, static logo, no fake values/counts; reduced-motion skeleton is static. |
| Background refresh | Preserve last values with actual timestamp; subtle `Updating` label. Avoid full-page skeleton flicker. |
| Empty invoices | `No invoices yet. Add a payment you expect to see its timing here.` Action `Add invoice`. |
| Empty bills | `Add the next bill to see what your funds need to cover.` Action `Add expense`. |
| No history | Show sample count/insufficient-history text and usable client-date/no-receipt scenarios. |
| Stale RPC | `Your balance was last checked at 14:32. Refresh it before saving this plan.` Values labeled stale; acceptance blocked. |
| API offline | Preserve current form draft and read-only known data; no fabricated successful save. |
| Saving | Disable just the affected command, retain context; repeat click cannot duplicate effect. |
| Validation error | Inline specific message tied to field, focus first invalid field; existing inputs preserved. |
| Conflict | Explain which numbers changed and provide recalculation; never silently retry a financial edit with altered values. |
| Successful command | Specific toast/status plus updated entity; no full-screen confetti. |
| Long job | Actual phase/job status and a “You can leave this view” note when recovery is durable. |
| Session expired | Save non-sensitive form draft in memory, prompt sign-in, clear private query cache; no raw finances persisted into shared local storage. |
| Wallet dismissed | `Sign-in was cancelled.` Offer retry and sample; form/navigation remains usable. |

Toast durations: success about four seconds, errors stay until dismissed or the user acts; important financial state also remains in the page, never only in a transient toast. Only use a progress percentage if it reflects a measured bounded operation. Native browser back and refresh work on all selected entities.

## 13. Copy rules and registry

All product strings live in `src/content/` with typed keys and contextual notes. Shared language must be edited once. Source data such as a client-entered invoice title is distinct from authored interface copy and must not be silently rewritten.

Tone: concise, specific, composed and respectful. Name the money/date/action, explain the consequence, stop. Use contractions where they sound natural. Avoid hype words such as “revolutionary,” “seamless,” “unlock,” “supercharge,” “AI-powered” and “state-of-the-art.” Avoid canned contrast patterns, repetitive headings and embellished copy. Do not claim “human-written” authorship as a product fact; require a human read-through and edit for natural language.

No em dash in any authored frontend string. Hyphens occur only where grammar needs them, such as `user-confirmed`; they are not used as decorative punctuation or substitutes for periods. Use `to` for prose ranges and locale date formatting where appropriate. No emoji, Unicode pictogram substitute or sparkle ornament in authored strings. Lucide provides icons in components. A verification script scans authored copy/assets metadata for prohibited punctuation/emoji, while allowing data and functional IDs through a separate boundary. Human review still checks grammar and tone.

Approved short strings:

| Context | Copy |
| --- | --- |
| Primary sample CTA | `Try the example` |
| Personal CTA | `Use my own numbers` |
| Current money | `Available from confirmed funds` |
| Expected money | `Expected, not received` |
| History confidence | `Based on 4 past payments.` |
| Exposure | `Rent comes before this payment.` |
| Adjustment | `Reduce Saturday's purchase from 250 to 100 USDC.` |
| Confirm edit | `Save these changes` |
| Transfer boundary | `This updates your plan. It does not move funds.` |
| Sparse history | `There is not enough payment history for a timing estimate yet.` |
| No permitted action | `There is no permitted change that covers this gap.` |
| Correction | `This rule replaces the earlier version.` |
| Stale plan | `Your numbers changed. Review the updated plan.` |
| Verified receipt | `Payment confirmed through Tatum` |
| Memory complete | `Stored and retrieved on Mainnet` |
| Operator memory | `Stored in Runway's hosted memory account` |
| Sample provenance | `Example data · 29 Oct 2026` |

Amount/date/client interpolation comes from validated DTOs. Plurals use count-aware formatting. Never say an invoice “paid rent” when its receipt arrived afterward, and never replace `user-confirmed` with `verified` for a manual record.

## 14. Icons and accessibility

Lucide React only, typically 18 px with 1.75 stroke, 20 px in mobile nav. Suggested mapping: `LayoutDashboard` Overview, `FileText` Invoices, `CalendarDays` Plan, `List` Activity, `Settings2` Settings, `ArrowRight` CTA, `ArrowUpRight` external source, `Check` verified state, `Clock3` pending, `CircleAlert` gap/error, `Pause`/`Play` motion and `Copy` IDs. Use text labels alongside important icons. No emoji icons or generic sparkles for the assistant.

Target WCAG 2.2 AA. Normal text contrast ≥4.5:1; large text and non-text controls/focus ≥3:1 where applicable. Decorative dividers may be lighter because they carry no essential state. Risk and status always have text/shape cues. Check tokens against actual surfaces, not only white. Every field has a label, error association and correct input mode. Dialogs trap focus, close on Escape where safe, return focus to trigger and preserve unsaved edits with a specific confirmation if needed.

Use landmarks, a skip link, semantic heading hierarchy, aria-live polite command/job status, keyboard-operable charts/event buttons and the equivalent timeline table. Target touch size 44×44 minimum. At 200% zoom layouts reflow. At 320 px no page-level horizontal scroll, cropped CTA or inaccessible action column. Respect reduced motion and do not animate data values. Modal destructive actions need clear language; financial plan acceptance needs exact values, not a vague `Confirm`.

## 15. Frontend implementation constraints

Route components compose feature-specific hooks/DTOs. Keep server state in Query; local state owns selected scenario, form draft, open drawer and motion preference. URL encodes selected invoice/plan where useful. Clear private state when scope changes. Stable query keys include workspace ID, view parameters and entity/version.

Component inventory: `Brand`, `AppShell`, `PageHeading`, `ScopeLabel`, `MoneyValue`, `FundsLedger`, `ExposurePanel`, `ScenarioTabs`, `CashflowTimeline`, `TimelineTable`, `AdjustmentRows`, `PlanReviewDialog`, `InvoiceList`, `InvoiceForm`, `ReceiptCheckDialog`, `ImportPreview`, `ActivityLedger`, `MemoryEvidenceDrawer`, `PlanExplanationDrawer`, `FreshnessLabel`, `AsyncState`, `ToastRegion`, `PaymentOrbit` and base field/button/dialog primitives. No universal dashboard-card component that erases hierarchy.

Use CSS Modules or scoped feature CSS alongside shared token/reset files. Utility CSS is allowed if it does not introduce arbitrary values or prebuilt aesthetics. Primitive dialogs are restyled to match Runway. Avoid a heavy chart library for a fourteen-day SVG and a WebGL stack for an ellipse animation.

Loading/error/empty stories are built before final polish. A screenshot of only the happy desktop state is insufficient. Fixtures render deterministically with injected date/seed and motion disabled for visual comparisons. Persist sample changes in its isolated server workspace; refresh must not secretly reset a saved plan. Reset requires an explicit sample control.

## 16. Craft and performance acceptance

Build these review surfaces before merging visual features: landing desktop/mobile, overview with risk, plan review, invoice form/error, no-history view, memory evidence, stale RPC, wallet cancellation and tiny viewport. Compare them against this spec and the reference screenshots for typographic discipline, spacing, purposeful hierarchy and animation care. Do not claim parity from a Lighthouse score alone.

Performance targets for the actual deployed build: mobile Lighthouse performance ≥90 on the landing under recorded conditions, accessibility checks without serious/critical violations, LCP ≤2.5 s, CLS ≤0.1, and measured interaction latency consistent with INP ≤200 ms where sufficient observation exists. Lab runs are not field INP evidence. The app must feel responsive even when an RPC job is pending; data loading is visibly separate from button interaction.

Target initial landing JS ≤180 KB gzip, app initial JS ≤300 KB gzip before lazy wallet/evidence/parser; adjust only with measured justification. Orbit module target ≤15 KB gzip and no external rendering engine. Fonts/images have declared dimensions and caching; use SVG for the logo. Performance budgets are acceptance targets, not existing measurements.

Human review questions: Is the next useful action obvious within five seconds? Can a person distinguish funds from expected income? Do the dates and amount columns align? Does the page feel composed without relying on decoration? Does any line sound generic or misleading? Is every motion purposeful and controllable? Can the full critical path be completed on a phone and keyboard? Record issues and fixes in the implementation checklist.

Final acceptance includes actual browser favicon/logo exports, responsive screenshots, copy lint plus human review, keyboard/focus walkthrough, normal/reduced-motion recordings, controlled hero arithmetic and at least two successful uncoached trial users under [VALIDATION.md](VALIDATION.md). Design quality is a release requirement, not a final optional coat of paint.
