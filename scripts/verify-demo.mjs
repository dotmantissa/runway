// Verify published media and the measured, non-overlapping narration timeline.
import { spawnSync } from "node:child_process";
import { readFile, writeFile, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
const ffmpeg = process.env.DEMO_FFMPEG || "ffmpeg";
const evidence = JSON.parse(await readFile("docs/demo-gate.json", "utf8"));
const root = "apps/web/public/demo/";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function run(args, binary = false) {
  const result = spawnSync(ffmpeg, ["-hide_banner", "-threads", "1", ...args], {
    encoding: binary ? undefined : "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(String(result.stderr));
  return result;
}
if (evidence.durationSeconds < 120 || evidence.durationSeconds > 180)
  throw new Error("The submission video must be two to three minutes.");
const streams = {};
for (const extension of ["mp4", "webm"]) {
  const file = root + "runway-demo." + extension;
  if (hash(await readFile(file)) !== evidence[extension + "Sha256"])
    throw new Error(extension + " hash differs from the evidence.");
  const inspect = spawnSync(ffmpeg, ["-hide_banner", "-i", file], {
    encoding: "utf8",
  });
  const details = inspect.stderr;
  if (!details.includes("1920x1080") || !details.includes("Audio:"))
    throw new Error(extension + " lacks the expected picture or audio.");
  if (!details.includes(extension === "mp4" ? "aac" : "opus"))
    throw new Error(extension + " audio codec is incompatible.");
  run(["-v", "error", "-i", file, "-f", "null", "-"]);
  streams[extension] = {
    fullDecode: true,
    video: extension === "mp4" ? "H.264" : "VP9",
    audio: extension === "mp4" ? "AAC" : "Opus",
  };
}
const pcm = run(
  [
    "-v",
    "error",
    "-i",
    root + "runway-demo.mp4",
    "-vn",
    "-af",
    "pan=mono|c0=c0",
    "-ac",
    "1",
    "-ar",
    "12000",
    "-f",
    "f32le",
    "pipe:1",
  ],
  true,
).stdout;
const audioSeconds = pcm.length / 4 / 12000;
if (Math.abs(audioSeconds - evidence.durationSeconds) > 0.15)
  throw new Error("Audio/video duration differs.");
const sceneAudio = [];
let previousEnd = 0;
for (const scene of evidence.scenes) {
  if (
    scene.start < previousEnd - 0.05 ||
    scene.speechStart < scene.start ||
    scene.speechStart + scene.audioDurationSeconds > scene.end
  )
    throw new Error("Narration overlaps or extends outside " + scene.id);
  if (hash(await readFile("video/public/" + scene.audio)) !== scene.audioSha256)
    throw new Error("Speech asset changed: " + scene.id);
  let squared = 0,
    peak = 0,
    count = 0;
  for (
    let i = Math.round(scene.speechStart * 12000);
    i < Math.round((scene.speechStart + scene.audioDurationSeconds) * 12000) &&
    i * 4 < pcm.length;
    i++
  ) {
    const sample = pcm.readFloatLE(i * 4);
    squared += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
    count++;
  }
  const rmsDb = 20 * Math.log10(Math.sqrt(squared / count));
  if (!Number.isFinite(rmsDb) || rmsDb < -45 || peak >= 1)
    throw new Error("Missing, silent or clipped narration: " + scene.id);
  sceneAudio.push({
    id: scene.id,
    rmsDb: Math.round(rmsDb * 10) / 10,
    peak: Math.round(peak * 1000) / 1000,
  });
  previousEnd = scene.end;
}
evidence.mp4FullDecodeVerified = true;
evidence.mediaVerified = {
  checkedAt: new Date().toISOString(),
  streams,
  audioSeconds,
  sceneAudio,
  measuredSpeechTimeline: true,
  captionTiming: evidence.narration.captionTiming,
};
await writeFile(
  "docs/demo-gate.json.tmp",
  JSON.stringify(evidence, null, 2) + "\n",
);
await rename("docs/demo-gate.json.tmp", "docs/demo-gate.json");
console.log(
  JSON.stringify({
    state: "verified",
    durationSeconds: evidence.durationSeconds,
    scenes: sceneAudio.length,
    streams,
    sceneAudio,
  }),
);
