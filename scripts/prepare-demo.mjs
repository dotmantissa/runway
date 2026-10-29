// Remove the capture-only sync slate and author editable Remotion scene groups.
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const ffmpeg = process.env.DEMO_FFMPEG || "ffmpeg";
const root = "video/public/";
const evidence = JSON.parse(
  await readFile(root + "capture-timing.json", "utf8"),
);
// Preparation is repeatable: recover the original source clock after a prior run.
if (evidence.captureDurationSeconds) {
  evidence.durationSeconds = evidence.captureDurationSeconds;
  evidence.scenes = evidence.scenes.map((scene) => ({
    ...scene,
    start: scene.captureStart,
    speechStart: scene.captureSpeechStart,
    end: scene.captureEnd,
  }));
}
const raw = root + "browser-capture.webm";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
if (hash(await readFile(raw)) !== evidence.browserCaptureSha256)
  throw new Error("Capture changed since recording.");
function run(args, binary = false) {
  const result = spawnSync(ffmpeg, ["-hide_banner", "-y", ...args], {
    encoding: binary ? undefined : "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(String(result.stderr));
  return result;
}
const scan = run(
  [
    "-i",
    raw,
    "-vf",
    "crop=2:2:0:0",
    "-pix_fmt",
    "rgb24",
    "-f",
    "rawvideo",
    "pipe:1",
  ],
  true,
);
const fps = Number(String(scan.stderr).match(/(\d+(?:\.\d+)?) fps/)?.[1]);
if (!fps) throw new Error("Capture frame rate unavailable.");
let lastSlate = -1;
for (let offset = 0; offset < scan.stdout.length; offset += 12) {
  const [r, g, b] = scan.stdout.subarray(offset, offset + 3);
  if (r < 35 && g > 220 && b < 35) lastSlate = offset / 12;
}
if (lastSlate < 0 || lastSlate / fps > 30)
  throw new Error(
    "Capture synchronization slate missing or outside the intro.",
  );
evidence.captureTrimSeconds = (lastSlate + 1) / fps;
evidence.synchronizationToleranceSeconds = 1 / fps + 1 / 30;
run([
  "-loglevel",
  "error",
  "-ss",
  String(evidence.captureTrimSeconds),
  "-i",
  raw,
  "-t",
  String(evidence.durationSeconds),
  "-c:v",
  "libvpx-vp9",
  "-crf",
  "28",
  "-b:v",
  "0",
  "-deadline",
  "realtime",
  "-cpu-used",
  "5",
  "-threads",
  "2",
  "-pix_fmt",
  "yuv420p",
  "-an",
  root + "browser-capture-trimmed.webm",
]);
evidence.preparedCaptureSha256 = hash(
  await readFile(root + "browser-capture-trimmed.webm"),
);
// Tighten only dead pauses; actual clicks, scrolling and app responses stay at 1x.
// Keep source and edited clocks separately so speech and captions follow each shot.
evidence.captureDurationSeconds = evidence.durationSeconds;
let cursor = 0;
evidence.scenes = evidence.scenes.map((scene, index) => {
  const sourceStart =
    index === 0 ? Math.max(scene.start, scene.speechStart - 0.15) : scene.start;
  const sourceEnd = Math.min(
    scene.end,
    Math.max(
      scene.actionEnd || 0,
      scene.speechStart + scene.audioDurationSeconds,
    ) + 0.08,
  );
  const updated = {
    ...scene,
    captureStart: scene.start,
    captureSpeechStart: scene.speechStart,
    captureEnd: scene.end,
    sourceStart,
    sourceEnd,
    start: cursor,
    speechStart: cursor + scene.speechStart - sourceStart,
    end: cursor + sourceEnd - sourceStart,
  };
  cursor = updated.end;
  return updated;
});
evidence.durationSeconds = cursor;
evidence.editing =
  "Natural-speed actual app interactions; initial loading and brief silent holds after speech trimmed.";
if (cursor < 120 || cursor > 180)
  throw new Error(
    "Prepared demo is outside the 2–3 minute submission limit: " + cursor,
  );
// Each group owns its footage, spoken clip, chapter and inline editable captions.
const indexLabel = (id) =>
  ["scene-02", "scene-03"].includes(id)
    ? "Live wallet / Sui Mainnet"
    : ["scene-10", "scene-11"].includes(id)
      ? "Live Mainnet recall / Synthetic records"
      : "Consumer Finance / Synthetic example";
const nodes = evidence.scenes.map((scene) => {
  const captions = scene.captions.map((cue) => ({
    ...cue,
    startMs: cue.startMs + Math.round(scene.captureSpeechStart * 1000),
    endMs: cue.endMs + Math.round(scene.captureSpeechStart * 1000),
  }));
  return `      <Sequence name=${JSON.stringify(scene.title)} from={Math.round(${scene.start} * fps)} trimBefore={Math.round(${scene.sourceStart} * fps)} durationInFrames={Math.round(${scene.end} * fps) - Math.round(${scene.start} * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile(${JSON.stringify(scene.audio)})} from={Math.round(${scene.captureSpeechStart} * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / ${scene.title} / ${indexLabel(scene.id)}</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={${JSON.stringify(captions, null, 2)}} />
        </div>
      </Sequence>`;
});
await writeFile(
  "video/src/Composition.tsx",
  `import {AbsoluteFill, Sequence, staticFile, useVideoConfig} from "remotion";
import {Audio, Video} from "@remotion/media";
import {BasicCaptions} from "./basic-captions";
export const RunwayDemo = () => {
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{backgroundColor:"#172c23"}}>
${nodes.join("\n")}
  </AbsoluteFill>;
};\n`,
);
await writeFile(
  "video/src/Root.tsx",
  `import {Composition} from "remotion";
import {RunwayDemo} from "./Composition";
export const RemotionRoot = () => <Composition id="RunwayDemo" component={RunwayDemo} width={1920} height={1080} fps={30} durationInFrames={${Math.round(evidence.durationSeconds * 30)}} defaultProps={{}} />;\n`,
);
await writeFile(
  root + "capture-timing.json",
  JSON.stringify(evidence, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    state: "prepared",
    captureTrimSeconds: evidence.captureTrimSeconds,
    durationSeconds: evidence.durationSeconds,
    scenes: evidence.scenes.length,
  }),
);
