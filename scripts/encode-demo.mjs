// Render the authored Remotion timeline, then publish synchronized audio/video.
import { spawnSync } from "node:child_process";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";
const ffmpeg = process.env.DEMO_FFMPEG || "ffmpeg";
const root = "apps/web/public/demo/";
const evidence = JSON.parse(
  await readFile("video/public/capture-timing.json", "utf8"),
);
await mkdir("video/out", { recursive: true });
function run(executable, args, cwd) {
  const result = spawnSync(executable, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error("Media operation failed: " + executable);
}
if (process.env.DEMO_REUSE_RENDER !== "1") {
  run(
    process.execPath,
    [
      "node_modules/@remotion/cli/remotion-cli.js",
      "render",
      "src/index.ts",
      "RunwayDemo",
      "out/runway-demo.mp4",
      "--codec=h264",
      "--audio-codec=aac",
      "--crf=21",
      "--pixel-format=yuv420p",
      "--concurrency=2",
      "--offthread-video-threads=1",
      "--log=error",
      "--browser-executable=" +
        (process.env.DEMO_BROWSER_EXECUTABLE ||
          chromium
            .executablePath()
            .replace(
              /chromium-(\d+)\/chrome-linux\/chrome$/,
              "chromium_headless_shell-$1/chrome-linux/headless_shell",
            )),
    ],
    "video",
  );
}
run(ffmpeg, [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-i",
  "video/out/runway-demo.mp4",
  "-c:v",
  "copy",
  "-af",
  "pan=mono|c0=0.5*c0+0.5*c1,loudnorm=I=-16:TP=-1.5:LRA=11",
  "-ac",
  "1",
  "-ar",
  "48000",
  "-c:a",
  "aac",
  "-b:a",
  "128k",
  "-movflags",
  "+faststart",
  root + "runway-demo.new.mp4",
]);
run(ffmpeg, [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-i",
  root + "runway-demo.new.mp4",
  "-c:v",
  "libvpx-vp9",
  "-crf",
  "34",
  "-b:v",
  "0",
  "-deadline",
  "realtime",
  "-cpu-used",
  "5",
  "-row-mt",
  "1",
  "-threads",
  "2",
  "-c:a",
  "libopus",
  "-b:a",
  "64k",
  root + "runway-demo.new.webm",
]);
run(ffmpeg, [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-ss",
  "5",
  "-i",
  root + "runway-demo.new.mp4",
  "-frames:v",
  "1",
  "-q:v",
  "3",
  root + "runway-demo-poster.new.jpg",
]);
const stamp = (seconds) =>
  new Date(Math.round(seconds * 1000)).toISOString().slice(11, 23);
const captions = evidence.scenes.flatMap((s) =>
  s.captions.map((c) => ({
    ...c,
    startMs: c.startMs + Math.round(s.speechStart * 1000),
    endMs: c.endMs + Math.round(s.speechStart * 1000),
  })),
);
await writeFile(
  root + "runway-demo.vtt.tmp",
  "WEBVTT\n\n" +
    captions
      .map(
        (c, i) =>
          `${i + 1}\n${stamp(c.startMs / 1000)} --> ${stamp(c.endMs / 1000)}\n${c.text}\n`,
      )
      .join("\n"),
);
for (const [temporary, final] of [
  ["runway-demo.new.mp4", "runway-demo.mp4"],
  ["runway-demo.new.webm", "runway-demo.webm"],
  ["runway-demo-poster.new.jpg", "runway-demo-poster.jpg"],
  ["runway-demo.vtt.tmp", "runway-demo.vtt"],
])
  await rename(root + temporary, root + final);
const digest = (b) => createHash("sha256").update(b).digest("hex");
const mp4 = await readFile(root + "runway-demo.mp4"),
  webm = await readFile(root + "runway-demo.webm");
evidence.state = "encoded";
evidence.renderedAt = new Date().toISOString();
evidence.durationSeconds = Math.round(evidence.durationSeconds * 30) / 30;
evidence.dimensions = { width: 1920, height: 1080 };
evidence.mp4Sha256 = digest(mp4);
evidence.mp4Bytes = mp4.length;
evidence.webmSha256 = digest(webm);
evidence.webmBytes = webm.length;
evidence.encoding =
  "Remotion 4.0.538; actual browser footage at natural speed; H.264/AAC MP4 faststart and VP9/Opus WebM; English male neural speech, normalized to -16 LUFS with -1.5 dBTP target";
evidence.publishedPaths = {
  video: "/demo/runway-demo.mp4",
  fallback: "/demo/runway-demo.webm",
  captions: "/demo/runway-demo.vtt",
  story: "/story",
};
await writeFile(
  "docs/demo-gate.json.tmp",
  JSON.stringify(evidence, null, 2) + "\n",
);
await rename("docs/demo-gate.json.tmp", "docs/demo-gate.json");
console.log(
  JSON.stringify({
    state: evidence.state,
    durationSeconds: evidence.durationSeconds,
    mp4Bytes: mp4.length,
    webmBytes: webm.length,
    voice: evidence.narration.voice,
  }),
);
