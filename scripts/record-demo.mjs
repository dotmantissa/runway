// Actual browser recording; overlays are documentary captions, never app data.
import { chromium } from "@playwright/test";
import { mkdir, writeFile, rename, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const baseURL = process.env.DEMO_BASE_URL || "http://localhost:5174";
await mkdir("research/demo-recording", { recursive: true });
await mkdir("apps/web/public/demo", { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
  recordVideo: {
    dir: "research/demo-recording",
    size: { width: 1440, height: 1000 },
  },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const started = Date.now(),
  scenes = [];
async function caption(title, text) {
  await page.evaluate(
    ({ title, text }) => {
      let el = document.getElementById("recording-caption");
      if (!el) {
        el = document.createElement("aside");
        el.id = "recording-caption";
        document.body.append(el);
      }
      el.setAttribute("aria-label", "Recording caption");
      Object.assign(el.style, {
        position: "fixed",
        left: "24px",
        right: "24px",
        bottom: "18px",
        zIndex: "2147483647",
        padding: "18px 28px",
        borderRadius: "12px",
        background: "#172c23",
        color: "#ffffff",
        boxShadow: "0 4px 26px #0003",
        pointerEvents: "none",
        fontFamily: "Public Sans, Arial, sans-serif",
        lineHeight: "1.5",
      });
      el.replaceChildren();
      const h = document.createElement("strong");
      h.textContent = title;
      h.style.cssText =
        "display:block;font-size:18px;letter-spacing:0.01em;color:#d2e9d4;margin-bottom:4px";
      const p = document.createElement("div");
      p.textContent = text;
      p.style.cssText = "font-size:23px;max-width:1260px";
      el.append(h, p);
    },
    { title, text },
  );
}
async function scene(title, text, seconds, action) {
  const start = (Date.now() - started) / 1000;
  await action();
  await caption(title, text);
  await page.waitForTimeout(
    Math.max(
      1000,
      seconds * 1000 - ((Date.now() - started) / 1000 - start) * 1000,
    ),
  );
  const end = (Date.now() - started) / 1000;
  scenes.push({ start, end, title, text });
  console.log(`Scene complete: ${title} (${end.toFixed(1)}s)`);
}
try {
  await scene(
    "Runway · Synthetic example",
    "A client promises Friday. Payment history suggests Tuesday. Plan around the bill that cannot wait.",
    12,
    async () => {
      await page.goto(baseURL);
      await page
        .getByRole("heading", {
          name: "Your client says Friday. Your history says Tuesday.",
        })
        .waitFor();
    },
  );
  await scene(
    "Confirmed money and expected income stay separate",
    "800 USDC confirmed. A 1,200 USDC invoice is still expected. Rent and the reserve leave zero available now.",
    17,
    async () => {
      await page
        .getByRole("link", { name: "Try the example", exact: true })
        .first()
        .click();
      await page
        .getByRole("heading", { name: "A little room to plan ahead." })
        .waitFor();
    },
  );
  await scene(
    "Compare the client's promised date",
    "If the invoice arrives Friday, Monday rent is covered in that scenario. The receipt remains uncertain.",
    12,
    async () => {
      await page
        .getByRole("link", { name: "Plan", exact: true })
        .first()
        .click();
      await page
        .getByRole("button", { name: "Client's date", exact: true })
        .click();
      await page
        .getByText("No spending change is needed for this scenario.")
        .waitFor();
    },
  );
  await scene(
    "Four past payments change the timing estimate",
    "Delays of 3, 4, 4 and 5 days put the median on Tuesday, after Monday rent. Reducing the purchase by 150 USDC preserves the reserve.",
    19,
    async () => {
      await page
        .getByRole("button", { name: "From past payments", exact: true })
        .click();
      await page.getByText("Reduce by 150 USDC", { exact: true }).waitFor();
    },
  );
  await scene(
    "A separate stress test",
    "No payment in the period also requires a 150 USDC reduction. History gives a client-specific reason to consider that risk.",
    10,
    async () => {
      await page
        .getByRole("button", { name: "No payment in this period", exact: true })
        .click();
      await page.getByText("Reduce by 150 USDC", { exact: true }).waitFor();
    },
  );
  await scene(
    "Review before accepting",
    "Only the flexible purchase changes: 250 to 100 USDC. Fixed bills and the 100 USDC reserve remain constraints.",
    12,
    async () => {
      await page
        .getByRole("button", { name: "Review changes", exact: false })
        .click();
      await page
        .getByRole("heading", { name: "Review these changes" })
        .waitFor();
    },
  );
  await scene(
    "Saved across a reload",
    "The accepted spending plan persists. Saving a plan moves no funds and does not turn an invoice into cash.",
    10,
    async () => {
      await page
        .getByRole("button", { name: "Save these changes", exact: true })
        .click();
      await page
        .getByText("Spending changes saved. No funds moved.", { exact: true })
        .waitFor();
      await page.reload();
      await page
        .getByText("No spending change is needed for this scenario.")
        .waitFor();
    },
  );
  await scene(
    "Invoice assistant · Free synthetic sample",
    "The parser extracts an invoice draft. Review and edit the fields before saving. No payment was made.",
    17,
    async () => {
      await page
        .getByRole("link", { name: "Invoices", exact: true })
        .first()
        .click();
      await page
        .getByRole("button", { name: "Invoice assistant", exact: true })
        .click();
      await page.getByRole("button", { name: "Try a sample invoice" }).click();
      await page.getByRole("button", { name: "Review sample draft" }).click();
      await page
        .getByRole("heading", { name: "Review the extracted invoice" })
        .waitFor();
    },
  );
  await scene(
    "An expectation needs explicit confirmation",
    "This sample is saved only after review. The optional 0.01 USDC paid service requires an isolated wallet and per-purchase approval.",
    10,
    async () => {
      await page.getByLabel("Invoice reference").fill("DEMO-REVIEWED");
      await page
        .getByRole("button", { name: "Save invoice", exact: true })
        .click();
      await page.getByText("DEMO-REVIEWED", { exact: true }).waitFor();
    },
  );
  await scene(
    "Actual sponsor operations, separate from the sample",
    "Authenticated Tatum Mainnet reads and thirteen synthetic Walrus records have evidence. A fresh process reproduces the remote history calculation.",
    13,
    async () => {
      await page.goto(baseURL + "/evidence");
      await page
        .getByText(
          "12 completed and content-matched records in the public manifest.",
        )
        .waitFor();
      await page
        .getByRole("heading", { name: "Walrus Memory · Mainnet" })
        .scrollIntoViewIfNeeded();
    },
  );
  await scene(
    "Corrections supersede old facts",
    "Fresh recall retrieves both versions. A corrected reserve changes the action; a corrected client association prevents a stale timing estimate.",
    12,
    async () => {
      await page
        .getByRole("heading", { name: "Corrections survive a fresh recall" })
        .scrollIntoViewIfNeeded();
    },
  );
  await scene(
    "Evidence includes the limits",
    "The synthetic replay includes missed delays and unnecessary reductions. Real user trials and a funded paid-parser purchase remain unverified.",
    12,
    async () => {
      await page
        .getByRole("heading", { name: "What the synthetic replay found" })
        .scrollIntoViewIfNeeded();
    },
  );
  if (errors.length) throw new Error("Browser errors: " + errors.join("; "));
  const video = page.video();
  await context.close();
  const raw = await video.path();
  const dest = "apps/web/public/demo/runway-demo.webm";
  await rename(raw, dest);
  const stamp = (seconds) => {
    const ms = Math.round(seconds * 1000);
    return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
  };
  await writeFile(
    "apps/web/public/demo/runway-demo.vtt",
    "WEBVTT\n\n" +
      scenes
        .map(
          (s, i) =>
            `${i + 1}\n${stamp(s.start)} --> ${stamp(s.end)}\n${s.title}\n${s.text}\n`,
        )
        .join("\n"),
  );
  const bytes = await readFile(dest);
  const evidence = {
    state: "recorded",
    recordedAt: new Date().toISOString(),
    source: baseURL,
    actualBrowser: true,
    syntheticFinancialData: true,
    mockedApiResponses: false,
    fundedPaymentPerformed: false,
    silentWithVisibleEnglishCaptions: true,
    durationSeconds: scenes.at(-1).end,
    dimensions: { width: 1440, height: 1000 },
    webmSha256: createHash("sha256").update(bytes).digest("hex"),
    webmBytes: bytes.length,
    scenes,
    pageErrors: errors,
  };
  await writeFile(
    "docs/demo-gate.json",
    JSON.stringify(evidence, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      state: evidence.state,
      durationSeconds: evidence.durationSeconds,
      webmBytes: bytes.length,
    }),
  );
} finally {
  await browser.close();
}
