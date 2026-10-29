import { Link } from "react-router-dom";
import demoNarration from "../../../video/narration.json";
export default function Story() {
  return (
    <article className="public-copy build-story">
      <p className="eyebrow">Consumer Finance Apps · Updated 29 October 2026</p>
      <h1>
        My client said Friday.
        <br />
        The history said Tuesday.
      </h1>
      <p className="story-deck">
        Runway turns a late invoice into a dated spending decision, with
        receipts for the calculation and a way to correct what it remembers.
      </p>
      <p>
        A future invoice can look reassuring beside a wallet balance. Rent still
        has a date. Runway keeps those two facts separate: confirmed funds
        describe money received; an invoice remains an expectation.
      </p>
      <p>
        The example below is synthetic. No interviews, observed user trials or
        customer savings are claimed.
      </p>
      <section
        className="story-video"
        aria-label="Runway product demonstration"
      >
        <video
          controls
          playsInline
          preload="metadata"
          poster="/demo/runway-demo-poster.jpg"
          aria-label="Runway demonstration with English male narration and captions"
        >
          <source src="/demo/runway-demo.mp4" type="video/mp4" />
          <source src="/demo/runway-demo.webm" type="video/webm" />
          <track
            kind="captions"
            src="/demo/runway-demo.vtt"
            srcLang="en"
            label="English"
          />
          Your browser cannot play this video. Read the transcript below.
        </video>
        <p className="helper">
          An actual app recording with English male narration and captions:
          signed Sui wallet, live Tatum balance, a labelled synthetic finance
          example, and live Walrus recall. No funds are transferred.
        </p>
        <details>
          <summary>Read the demo transcript</summary>
          <ol className="story-transcript">
            {demoNarration.scenes.map((scene) => (
              <li key={scene.id}>{scene.text}</li>
            ))}
          </ol>
        </details>
      </section>
      <h2>A decision with a deadline</h2>
      <p>
        In the dated example, 800 USDC must cover a 250 USDC Saturday purchase,
        600 USDC Monday rent and a 100 USDC reserve. The client promises 1,200
        USDC on Friday 30 October. Four resolved payments have delays of 3, 4, 4
        and 5 days. Their median moves the estimate to Tuesday 3 November.
      </p>
      <p>
        Before that receipt, Monday would end at minus 50 USDC. Reducing the
        purchase from 250 to 100 USDC preserves the 100 USDC floor. The engine
        minimizes the total permitted reduction across flexible expenses while
        preserving every timeline prefix. Fixed bills remain constraints.
      </p>
      <p>
        The no-receipt scenario also finds that 150 USDC adjustment. History
        supplies a client-specific reason to consider the delay; conservative
        arithmetic does not require memory. Future income never increases the
        amount available now.
      </p>
      <h2>What Tatum verifies</h2>
      <p>
        The server uses authenticated Tatum Sui Mainnet gRPC for native-USDC
        metadata, balances and known-digest transaction verification. The
        receipt adapter checks successful checkpointed settlement, token,
        recipient credit, sender and time. A funded receipt passed those checks.
        Its owner has not yet allocated it to an invoice in a signed workspace.
      </p>
      <p>
        A transaction's presence does not by itself settle an invoice.
        Allocation is explicit, scoped to the signed workspace and bounded by
        the remaining invoice and receipt amounts. Wallet identifiers from the
        builder's receipt evidence stay private.
      </p>
      <h2>What Walrus remembers</h2>
      <p>
        Click Recall from Walrus on the evidence page to retrieve the published
        synthetic history and policy versions now. All twelve useful records
        must match their identifiers, blobs and content hashes before the app
        recomputes the original 150 USDC adjustment and corrected 100 USDC
        result. A remote failure remains visible instead of falling back to
        local history.
      </p>
      <p>
        Ten useful synthetic records capture resolved payments, reserve policy,
        obligations, an invoice expectation, a lesson and a proposal. Each
        record has a logical ID, structured payload, content hash and real
        remember-job/blob evidence. A separate compatibility record is also
        complete. A fresh process retrieved the history and reproduced the
        database-backed 150 USDC plan.
      </p>
      <p>
        Two additional synthetic corrections demonstrate that continuity
        includes changed facts. The reserve correction replaces 100 with 50
        USDC; with the same history, the proposed reduction becomes 100 USDC. A
        client-association correction removes an incorrectly attributed payment
        from Cedar's active history. Three payments remain, so the engine
        refuses a personalized timing estimate.
      </p>
      <p>
        The correction harness retrieves both versions and verifies the
        supersession links. It resolves policy versions for this proof; the
        app's current financial state stays database-backed. Corrections
        preserve old records for inspection. They do not erase the original
        blobs.
      </p>
      <p>
        There are thirteen content-verified synthetic Mainnet records in total:
        ten originals, two corrections and one compatibility record. The managed
        relayer sees published plaintext, and namespaces do not create
        user-owned accounts. Personal publication remains disabled in
        production. Retention metadata and the original provider failures are
        preserved in the repository.
      </p>
      <h2>The evaluation includes the failures</h2>
      <p>
        A frozen engineering fixture covers persistent delay, punctual payments,
        improving timing, alternating timing and sparse history. Rolling
        evaluation only uses payments resolved before each forecast date. It
        produces 16 eligible predictions and 19 insufficient-history cases.
      </p>
      <p>
        History's mean absolute timing error is 2.1875 days, compared with
        1.9375 days for the promised-date baseline. The median model performs
        worse on this mixture. It detects three of five actual fixed-bill
        exposures, misses two, and raises seven false alarms.
      </p>
      <p>
        Applying the proposed actions to actual synthetic receipt dates reduces
        reserve breaches from five to two, but proposes 1,500 USDC of total
        reductions across independent cases, including 1,050 USDC more than the
        hindsight minimum. Those numbers describe simulations, not customer
        savings. The full rows and exclusions are published; no user held-out
        evaluation is complete.
      </p>
      <h2>A bounded invoice assistant</h2>
      <p>
        The optional agent uses rules to extract labeled invoice fields from
        text or selectable PDF content. It is not an unrestricted assistant or
        an LLM. The configured service charges 0.01 native USDC through Sui MPP.
        A separate tool wallet, daily and per-call limits, gas limits and
        explicit purchase approval bound spending.
      </p>
      <p>
        The coordinator persists the signed operation before broadcast.
        Uncertain settlement reconciles the original digest; retry can resend
        the same bytes, rather than signing a replacement. The paid service
        caches output by verified payment. The resulting invoice remains a draft
        until reviewed and confirmed.
      </p>
      <p>
        Protocol, concurrency and recovery tests pass. A real HTTP 402 quote and
        selectable-PDF runtime check pass without funding. No funded agent
        purchase has been demonstrated, and payments remain disabled publicly.
      </p>
      <h2>What comes next</h2>
      <p>
        The next evidence must come from people: redacted payment histories,
        observed decisions and explicit publication consent. We also need a
        separately funded tool wallet and a live approved purchase before
        claiming the payment flow works end to end on Mainnet.
      </p>
      <p>
        Runway was built with coding assistance and a custom application stack.
        We do not claim it was primarily built with Tatum AI Builder or that it
        qualifies for that award. The intended primary submission track is
        Consumer Finance Apps; award eligibility remains subject to the
        organizers.
      </p>
      <div className="actions">
        <Link className="button" to="/demo">
          Try the example
        </Link>
        <Link className="text-link" to="/evidence">
          Inspect the evidence
        </Link>
        <a className="text-link" href="https://github.com/dotmantissa/runway">
          Source and reproducible checks
        </a>
      </div>
    </article>
  );
}
