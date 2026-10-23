// Actual browser capture, paced by measured English male narration for Remotion.
import { chromium } from "@playwright/test";
import { mkdir, writeFile, rename, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const baseURL = process.env.DEMO_BASE_URL || "http://localhost:5174";
await mkdir("research/demo-recording", { recursive: true });
await mkdir("apps/web/public/demo", { recursive: true });
const narration = JSON.parse(
  await readFile("video/public/narration-timing.json", "utf8"),
);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1600, height: 820 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
  recordVideo: {
    dir: "research/demo-recording",
    size: { width: 1600, height: 820 },
  },
});
await context.addInitScript(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const cursor = document.createElement("div");
    cursor.style.cssText =
      "position:fixed;width:18px;height:18px;border:2px solid #277448;border-radius:50%;background:#c8e3d6aa;pointer-events:none;z-index:2147483646;display:none";
    document.body.append(cursor);
    document.addEventListener("pointermove", (event) => {
      cursor.style.display = "block";
      cursor.style.left = `${event.clientX - 9}px`;
      cursor.style.top = `${event.clientY - 9}px`;
    });
  });
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let started;
const scenes = [];
async function scene(_title, _text, _seconds, action) {
  const spoken = narration.scenes[scenes.length];
  if (!spoken) throw new Error("Missing narration for scene.");
  const start = (Date.now() - started) / 1000;
  await action();
  const speechStart = (Date.now() - started) / 1000 + 0.2;
  await page.waitForTimeout(spoken.audioDurationSeconds * 1000 + 800);
  const end = (Date.now() - started) / 1000;
  scenes.push({
    ...spoken,
    start,
    speechStart,
    end,
    title: spoken.title,
    text: spoken.text,
  });
  console.log(`Scene complete: ${spoken.title} (${end.toFixed(1)}s)`);
}
try {
  await page.goto(baseURL);
  await page
    .getByRole("heading", {
      name: "Your client says Friday. Your history says Tuesday.",
    })
    .waitFor();
  await page.evaluate(() => {
    const slate = document.createElement("div");
    slate.id = "recording-sync-slate";
    slate.style.cssText =
      "position:fixed;inset:0;background:#00ff00;z-index:2147483647";
    document.body.append(slate);
  });
  await page.waitForTimeout(700);
  await page.evaluate(() =>
    document.getElementById("recording-sync-slate").remove(),
  );
  started = Date.now();
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
  const dest = "video/public/browser-capture.webm";
  await rename(raw, dest);
  const bytes = await readFile(dest);
  const evidence = {
    state: "recorded",
    recordedAt: new Date().toISOString(),
    source: baseURL,
    actualBrowser: true,
    syntheticFinancialData: true,
    mockedApiResponses: false,
    fundedPaymentPerformed: false,
    silentWithVisibleEnglishCaptions: false,
    narration: { ...narration, scenes: undefined },
    durationSeconds: scenes.at(-1).end,
    captureDimensions: { width: 1600, height: 820 },
    browserCaptureSha256: createHash("sha256").update(bytes).digest("hex"),
    browserCaptureBytes: bytes.length,
    scenes,
    pageErrors: errors,
  };
  await writeFile(
    "video/public/capture-timing.json.tmp",
    JSON.stringify(evidence, null, 2) + "\n",
  );
  await rename(
    "video/public/capture-timing.json.tmp",
    "video/public/capture-timing.json",
  );
  console.log(
    JSON.stringify({
      state: evidence.state,
      durationSeconds: evidence.durationSeconds,
      browserCaptureBytes: bytes.length,
    }),
  );
} finally {
  await browser.close();
}
