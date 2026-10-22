# User study kit

This kit is ready to use. **No recruitment messages have been sent, and no participant sessions have occurred.** Follow the [validation protocol](../VALIDATION.md). Target five interviews and three observed prototype trials; these are small allocation gates, not adoption statistics.

## Recruitment draft

> I'm testing a prototype that helps freelancers plan around late invoices. Could we spend 20–30 minutes looking at one real late-payment episode and, separately, try a spending decision in the prototype? You can redact clients, wallet addresses and amounts. There is no purchase or financial transaction. You can decline recording, quoting or any publication. I am especially interested in people paid in stablecoins; using Sui is not required.

The builder chooses recipients and sends this invitation. Do not imply participation is already arranged.

## Consent before recording anything

Explain the purpose, timing and ability to stop. Ask separately about private notes, redacted local replay, recording, anonymous aggregates and public quotes. Default all publication scopes to no until explicitly agreed. Do not publish raw financial histories or wallet identifiers. Private participation is not authorization to send content to Walrus or a managed relayer; describe plaintext processing and the correction/retention limits before any separate storage consent.

## Interview script

1. Ask for the most recent concrete invoice that arrived later than expected. Record promised and actual dates and how the participant established them.
2. Ask which dated bill or spending decision overlapped that delay and what actually happened.
3. Ask which tools and information the participant used before deciding what to spend.
4. Ask what could have been reduced and which obligations could not move. Avoid supplying the desired answer.
5. Ask whether a redacted history and a later prototype session are possible; obtain each consent separately.

Record whether the participant actually uses stablecoins and Sui. General freelancer pain does not establish Sui demand.

## Observed trial script

Open the wallet-free example or a consented local replay. Let the participant navigate without coaching.

- Identify the exposed obligation and its date.
- Explain confirmed funds versus expected income.
- Choose a permitted adjustment, or explain why no proposal fits their actual constraints.
- Explain why changing historical evidence or a rule changes the recommendation.

Record time, errors, coaching, interpretation of the reserve and expected income, action feasibility, accepted/rejected proposal and the reason. Do not count a coached answer as an uncoached success. Capture any material product issue, fix it and retest it with permission. Do not convert the simulated 150-USDC reduction into real customer savings.

## Private evidence template

Create a private file under ignored `research/` using participant aliases. Do not put identifying contact details in a public pull request.

| Alias         | Stablecoin/Sui usage | Dated delay episode | Dated consequence | Existing workaround | Permitted adjustment | Available resolved invoices | Consent scopes | Trial scheduled |
| ------------- | -------------------- | ------------------- | ----------------- | ------------------- | -------------------- | --------------------------- | -------------- | --------------- |
| Not recruited | Unknown              | Not observed        | Not observed      | Unknown             | Unknown              | 0                           | None           | No              |

| Alias         | Task 1  | Task 2  | Task 3  | Task 4  | Coaching       | Time         | Material issue | Retest  |
| ------------- | ------- | ------- | ------- | ------- | -------------- | ------------ | -------------- | ------- |
| Not recruited | Not run | Not run | Not run | Not run | Not applicable | Not measured | Unknown        | Not run |

## User-history evaluation intake

Aim for at least eight resolved invoices per client. Four describe history; they do not supply a four-history/held-out prediction. Preserve promised/paid/event/recorded dates, source confidence, corrections and forecast cutoffs. Split by time before looking at outcomes, exclude any unresolved-at-cutoff record and retain failures. Report every included/excluded invoice and all actual counts. Synthetic engineering results are already published in `evaluation.json`; do not relabel those as real participant data.
