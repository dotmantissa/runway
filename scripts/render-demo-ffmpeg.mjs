// Export the same measured, editable timeline without a browser renderer.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const fps = 30;
const stamp = (seconds) => {
  const ticks = Math.max(0, Math.round(seconds * 100));
  return `${Math.floor(ticks / 360000)}:${String(Math.floor(ticks / 6000) % 60).padStart(2, "0")}:${String(Math.floor(ticks / 100) % 60).padStart(2, "0")}.${String(ticks % 100).padStart(2, "0")}`;
};
const escape = (text) =>
  text
    .replaceAll("\\", "\\\\")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}")
    .replaceAll("\n", "\\N");
function pcm(bytes) {
  let format, data;
  for (let i = 12; i + 8 <= bytes.length; ) {
    const type = bytes.toString("ascii", i, i + 4),
      size = bytes.readUInt32LE(i + 4);
    if (type === "fmt ") format = bytes.subarray(i + 8, i + 8 + size);
    if (type === "data") data = bytes.subarray(i + 8, i + 8 + size);
    i += 8 + size + (size % 2);
  }
  if (
    !format ||
    !data ||
    format.readUInt16LE(0) !== 1 ||
    format.readUInt16LE(2) !== 1 ||
    format.readUInt16LE(14) !== 16
  )
    throw new Error("Speech must be mono PCM16 WAV");
  return { samples: data, sampleRate: format.readUInt32LE(4) };
}
export async function renderFfmpegTimeline(evidence, ffmpeg) {
  const directory = "research/ffmpeg-timeline";
  await mkdir(directory, { recursive: true });
  const run = (args) => {
    const result = spawnSync(
      ffmpeg,
      ["-hide_banner", "-loglevel", "error", "-y", "-threads", "1", ...args],
      { stdio: "inherit" },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error("FFmpeg timeline export failed");
  };
  const totalFrames = Math.round(evidence.durationSeconds * fps),
    duration = totalFrames / fps;
  const sampleRate = 24000,
    audio = Buffer.alloc(Math.round(duration * sampleRate) * 4);
  const clips = [];
  for (const scene of evidence.scenes) {
    const frames = Math.round(scene.end * fps) - Math.round(scene.start * fps);
    const seconds = frames / fps;
    const label = ["scene-02", "scene-03"].includes(scene.id)
      ? "Live wallet / Sui Mainnet"
      : ["scene-10", "scene-11"].includes(scene.id)
        ? "Live Mainnet recall / Synthetic records"
        : "Consumer Finance / Synthetic example";
    const ass =
      `[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 0\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Caption,DejaVu Sans,32,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,70,70,26,1\nStyle: Header,DejaVu Sans,18,&H00C8D8C3,&H00C8D8C3,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,56,56,11,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: 0,0:00:00.00,${stamp(seconds)},Header,,0,0,0,,${escape("Runway / " + scene.title + " / " + label)}\n` +
      scene.captions
        .map(
          (cue) =>
            `Dialogue: 0,${stamp(scene.speechStart - scene.start + cue.startMs / 1000)},${stamp(scene.speechStart - scene.start + cue.endMs / 1000)},Caption,,0,0,0,,${escape(cue.text)}\n`,
        )
        .join("");
    const subtitle = `${directory}/${scene.id}.ass`,
      output = `${directory}/${scene.id}.mp4`;
    await writeFile(subtitle, ass);
    run([
      "-ss",
      String(scene.sourceStart),
      "-i",
      "video/public/browser-capture-trimmed.webm",
      "-an",
      "-vf",
      `scale=1808:928:flags=lanczos,pad=1920:1080:56:40:color=0x172c23,setsar=1,fps=30,subtitles=${subtitle}:fontsdir=/usr/share/fonts/truetype/dejavu`,
      "-frames:v",
      String(frames),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "21",
      "-pix_fmt",
      "yuv420p",
      "-threads",
      "1",
      "-filter_threads",
      "1",
      output,
    ]);
    clips.push(output);
    const speech = pcm(await readFile("video/public/" + scene.audio));
    if (speech.sampleRate !== sampleRate)
      throw new Error("Unexpected speech sample rate");
    const offset = Math.round(scene.speechStart * sampleRate);
    for (let i = 0; i < speech.samples.length / 2; i++) {
      const at = (offset + i) * 4;
      if (at + 4 > audio.length)
        throw new Error("Speech exceeds the final timeline");
      const value = speech.samples.readInt16LE(i * 2);
      audio.writeInt16LE(value, at);
      audio.writeInt16LE(value, at + 2);
    }
    console.log(`Exported ${scene.id}: ${frames} frames at natural speed`);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(audio.length + 36, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(audio.length, 40);
  const audioFile = directory + "/narration.wav";
  await writeFile(audioFile, Buffer.concat([header, audio]));
  const concat = directory + "/scenes.txt";
  await writeFile(
    concat,
    "ffconcat version 1.0\n" +
      clips.map((file) => `file '${resolve(file)}'\n`).join(""),
  );
  run([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concat,
    "-i",
    audioFile,
    "-map",
    "0:v",
    "-map",
    "1:a",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-t",
    String(duration),
    "-movflags",
    "+faststart",
    "video/out/runway-demo.mp4",
  ]);
  return "FFmpeg export of the measured Remotion scene timeline";
}
