import { spawnSync } from "node:child_process";
import { readFile, writeFile, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
const executable = process.env.DEMO_FFMPEG || "ffmpeg";
const root = "apps/web/public/demo/";
const input = root + "runway-demo.webm";
function run(args) {
  const result = spawnSync(
    executable,
    ["-hide_banner", "-loglevel", "error", "-y", ...args],
    { encoding: "utf8" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(result.stderr || "Media encoding failed.");
}
const evidence = JSON.parse(await readFile("docs/demo-gate.json", "utf8"));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
if (digest(await readFile(input)) !== evidence.webmSha256)
  throw new Error("Recording changed; verify the source before encoding.");
run([
  "-i",
  input,
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "23",
  "-pix_fmt",
  "yuv420p",
  "-threads",
  "2",
  "-movflags",
  "+faststart",
  "-an",
  root + "runway-demo.mp4",
]);
run([
  "-ss",
  "5",
  "-i",
  input,
  "-frames:v",
  "1",
  "-q:v",
  "3",
  root + "runway-demo-poster.jpg",
]);
const bytes = await readFile(root + "runway-demo.mp4");
evidence.state = "encoded";
evidence.mp4Sha256 = digest(bytes);
evidence.mp4Bytes = bytes.length;
evidence.encoding =
  "H.264/yuv420p, CRF23, MP4 faststart; silent captioned actual browser recording";
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
    mp4Bytes: bytes.length,
    mp4Sha256: evidence.mp4Sha256,
  }),
);
