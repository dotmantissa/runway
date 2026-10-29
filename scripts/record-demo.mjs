// Real browser flow, with a Node-confined wallet and measured speech/action clocks.
import { chromium } from "@playwright/test";
import { mkdir, writeFile, rename, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { installDemoWallet } from "./lib/demo-wallet.mjs";
const baseURL = process.env.DEMO_BASE_URL || "http://localhost:5174";
const preflight = process.env.DEMO_PREFLIGHT === "1";
await mkdir("research/demo-recording", { recursive: true });
const narration = JSON.parse(
  await readFile("video/public/narration-timing.json", "utf8"),
);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1600, height: 820 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
  ...(!preflight
    ? {
        recordVideo: {
          dir: "research/demo-recording",
          size: { width: 1600, height: 820 },
        },
      }
    : {}),
});
const wallet = await installDemoWallet(context, baseURL);
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
page.setDefaultTimeout(25000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const scenes = [];
let started, walletBalance, liveRecall;
const clock = () => (Date.now() - started) / 1000;
async function click(locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error("No clickable element");
  // Native pointer input also handles the wallet component's nested shadow slot.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 8,
  });
  await page.waitForTimeout(120);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
async function scene(action) {
  const spoken = narration.scenes[scenes.length];
  const start = clock(),
    speechStart = start + 0.25;
  await action();
  const actionEnd = clock();
  await page.screenshot({ path: `research/demo-recording/${spoken.id}.png` });
  if (!preflight)
    await page.waitForTimeout(
      Math.max(
        0,
        (speechStart + spoken.audioDurationSeconds + 0.6 - clock()) * 1000,
      ),
    );
  scenes.push({ ...spoken, start, speechStart, actionEnd, end: clock() });
  console.log(`Scene complete: ${spoken.title} (${clock().toFixed(1)}s)`);
}
try {
  await page.goto(baseURL);
  await page
    .getByRole("heading", {
      name: "Your client says Friday. Your history says Tuesday.",
    })
    .waitFor();
  if (!preflight) {
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
  }
  started = Date.now();
  await scene(async () => {
    await page
      .getByRole("heading", {
        name: "Your client says Friday. Your history says Tuesday.",
      })
      .waitFor();
  });
  await scene(async () => {
    await page.goto(baseURL + "/signin");
    await click(
      page.getByRole("button", { name: "Connect Wallet", exact: true }),
    );
    await click(
      page.getByRole("button", { name: "Runway Demo Wallet", exact: false }),
    );
    await click(
      page.getByRole("button", {
        name: "Sign in with this wallet",
        exact: false,
      }),
    );
    await page
      .getByRole("heading", { name: "Start with the next bill.", exact: true })
      .waitFor();
  });
  await scene(async () => {
    await click(page.getByRole("link", { name: "Set my rules", exact: true }));
    await click(page.getByRole("button", { name: "Refresh", exact: true }));
    await page
      .getByText("Balance refresh: done", { exact: false })
      .waitFor({ timeout: 45000 });
    const bootstrap = await (
      await context.request.get(baseURL + "/api/v1/bootstrap")
    ).json();
    if (
      bootstrap.workspace.address !== wallet.address ||
      bootstrap.state.accounts[0].source !== "tatum_verified"
    )
      throw new Error("Signed wallet balance was not verified by Tatum");
    walletBalance = bootstrap.state.accounts[0];
  });
  await scene(async () => {
    await page.goto(baseURL + "/demo");
    await page
      .getByRole("heading", { name: "A little room to plan ahead." })
      .waitFor();
  });
  await scene(async () => {
    await click(page.getByRole("link", { name: "Plan", exact: true }).first());
    await click(
      page.getByRole("button", { name: "Client's date", exact: true }),
    );
    await page
      .getByText("No spending change is needed for this scenario.")
      .waitFor();
  });
  await scene(async () => {
    await click(
      page.getByRole("button", { name: "From past payments", exact: true }),
    );
    await page.getByText("Reduce by 150 USDC", { exact: true }).waitFor();
  });
  await scene(async () => {
    await click(
      page.getByRole("button", { name: "See the evidence", exact: false }),
    );
    await page
      .getByRole("heading", {
        name: "The evidence behind this plan",
        exact: true,
      })
      .waitFor();
  });
  await scene(async () => {
    await click(
      page.getByRole("button", { name: "Close drawer", exact: true }),
    );
    await click(
      page.getByRole("button", {
        name: "No payment in this period",
        exact: true,
      }),
    );
    await click(
      page.getByRole("button", { name: "Review changes", exact: false }),
    );
    await page.getByRole("heading", { name: "Review these changes" }).waitFor();
  });
  await scene(async () => {
    await click(
      page.getByRole("button", { name: "Save these changes", exact: true }),
    );
    await page
      .getByText("Spending changes saved. No funds moved.", { exact: true })
      .waitFor();
    await page.reload();
    await page
      .getByText("No spending change is needed for this scenario.")
      .waitFor();
  });
  await scene(async () => {
    await page.goto(baseURL + "/evidence");
    await page
      .getByRole("heading", { name: "Recall the published example" })
      .waitFor();
    const response = page.waitForResponse(
      (r) => r.url().endsWith("/api/v1/evidence/recall") && r.status() === 200,
      { timeout: 65000 },
    );
    await click(
      page.getByRole("button", { name: "Recall from Walrus", exact: true }),
    );
    liveRecall = await (await response).json();
    await page
      .getByText("Recalled now: 12 matching records", { exact: true })
      .waitFor();
    if (
      liveRecall.source !== "walrus" ||
      liveRecall.original.totalReductionAtomic !== "150000000" ||
      liveRecall.corrected.totalReductionAtomic !== "100000000"
    )
      throw new Error("Live recall did not reproduce both decisions");
    await page
      .getByRole("heading", { name: "Recall the published example" })
      .scrollIntoViewIfNeeded();
  });
  await scene(async () => {
    await page
      .getByText("Recalled now: 12 matching records", { exact: true })
      .scrollIntoViewIfNeeded();
    await page
      .getByText("Corrected reserve: 50 USDC", { exact: true })
      .waitFor();
  });
  await scene(async () => {
    await page
      .getByRole("heading", {
        name: "What the synthetic replay found",
        exact: true,
      })
      .scrollIntoViewIfNeeded();
  });
  if (errors.length) throw new Error("Browser errors: " + errors.join("; "));
  if (wallet.signatureCount() !== 1)
    throw new Error("Expected exactly one real wallet sign-in signature");
  const evidence = {
    state: preflight ? "preflight_verified" : "recorded",
    recordedAt: new Date().toISOString(),
    source: baseURL,
    actualBrowser: true,
    syntheticFinancialData: true,
    mockedApiResponses: false,
    fundedPaymentPerformed: false,
    silentWithVisibleEnglishCaptions: false,
    track: "Consumer Finance Apps",
    wallet: {
      address: wallet.address,
      actualSignatures: wallet.signatureCount(),
      balance: walletBalance,
      secretLocation: "Node process only; never exposed to the page",
    },
    liveRecall: {
      verifiedAt: liveRecall.verifiedAt,
      source: liveRecall.source,
      recordsRetrieved: liveRecall.recordsRetrieved,
      historyHash: liveRecall.historyHash,
      originalReductionAtomic: liveRecall.original.totalReductionAtomic,
      correctedReductionAtomic: liveRecall.corrected.totalReductionAtomic,
    },
    narration: { ...narration, scenes: undefined },
    durationSeconds: scenes.at(-1).end,
    captureDimensions: { width: 1600, height: 820 },
    scenes,
    pageErrors: errors,
  };
  if (preflight) {
    await writeFile(
      "research/demo-preflight.json",
      JSON.stringify(evidence, null, 2) + "\n",
    );
  } else {
    const video = page.video();
    await context.close();
    const dest = "video/public/browser-capture.webm";
    await rename(await video.path(), dest);
    const bytes = await readFile(dest);
    evidence.browserCaptureSha256 = createHash("sha256")
      .update(bytes)
      .digest("hex");
    evidence.browserCaptureBytes = bytes.length;
    await writeFile(
      "video/public/capture-timing.json.tmp",
      JSON.stringify(evidence, null, 2) + "\n",
    );
    await rename(
      "video/public/capture-timing.json.tmp",
      "video/public/capture-timing.json",
    );
  }
  console.log(
    JSON.stringify({
      state: evidence.state,
      durationSeconds: evidence.durationSeconds,
      scenes: scenes.length,
      walletSigned: true,
      liveRecall: evidence.liveRecall,
    }),
  );
} catch (error) {
  await page
    .screenshot({ path: "research/demo-recording/failure.png" })
    .catch(() => {});
  throw error;
} finally {
  await browser.close();
}
