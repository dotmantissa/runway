import { chromium } from "@playwright/test";
import { readFile, writeFile, rename } from "node:fs/promises";
const baseURL = process.env.DEMO_BASE_URL || "http://localhost:5174";
const evidence = JSON.parse(await readFile("docs/demo-gate.json", "utf8"));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseURL + "/story");
  const video = page.locator("video");
  await video.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => document.querySelector("video")?.readyState >= 1,
    { timeout: 30000 },
  );
  const box = await video.boundingBox();
  // A real user gesture authorizes the audio context and native media playback.
  await page.mouse.click(box.x + 35, box.y + box.height - 25);
  await video.evaluate(async (element) => {
    element.muted = false;
    element.volume = 1;
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    context.createMediaElementSource(element).connect(analyser);
    analyser.connect(context.destination);
    window.__demoAudio = { context, analyser };
    await context.resume();
    element.currentTime = 5;
    await element.play();
  });
  await page.waitForFunction(
    () => {
      const video = document.querySelector("video"),
        audio = window.__demoAudio;
      const samples = new Float32Array(audio.analyser.fftSize);
      audio.analyser.getFloatTimeDomainData(samples);
      const energy =
        samples.reduce((sum, sample) => sum + sample * sample, 0) /
        samples.length;
      return video.currentTime > 6 && energy > 0.000001;
    },
    { timeout: 30000 },
  );
  const selected = await video.evaluate((element) => ({
    duration: element.duration,
    width: element.videoWidth,
    height: element.videoHeight,
    source: element.currentSrc,
    muted: element.muted,
    volume: element.volume,
    playing: !element.paused,
    currentTime: element.currentTime,
    audioContext: window.__demoAudio.context.state,
  }));
  if (
    Math.abs(selected.duration - evidence.durationSeconds) > 0.2 ||
    selected.width !== 1920 ||
    selected.height !== 1080 ||
    selected.muted
  )
    throw new Error("Unexpected narrated video metadata.");
  for (const seconds of [50, 81, 118, 155]) {
    await video.evaluate((element, time) => {
      element.currentTime = time;
    }, seconds);
    await page.waitForFunction(
      (time) =>
        Math.abs(document.querySelector("video").currentTime - time) < 1 &&
        document.querySelector("video").readyState >= 2,
      seconds,
      { timeout: 30000 },
    );
  }
  await video.evaluate((element) => {
    element.pause();
    element.textTracks[0].mode = "hidden";
  });
  await page.waitForFunction(
    () => document.querySelector("video").textTracks[0].cues?.length > 0,
    { timeout: 30000 },
  );
  const captions = await video.evaluate(
    (element) => element.textTracks[0].cues.length,
  );
  if (errors.length) throw new Error("Browser errors: " + errors.join("; "));
  const result = {
    checkedAt: new Date().toISOString(),
    environment:
      "actual Playwright Chromium selected source with user-gesture playback and Web Audio signal",
    ...selected,
    seekedSeconds: [50, 81, 118, 155],
    captionCues: captions,
    audibleSignalVerified: true,
    pageErrors: errors,
  };
  await page.screenshot({ path: "research/narrated-browser-playback.png" });
  if (!process.env.DEMO_VERIFY_READ_ONLY) {
    evidence.playbackVerified = result;
    await writeFile(
      "docs/demo-gate.json.tmp",
      JSON.stringify(evidence, null, 2) + "\n",
    );
    await rename("docs/demo-gate.json.tmp", "docs/demo-gate.json");
  }
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
