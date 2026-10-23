"""Generate local English male speech for the actual-browser Remotion demo.

Requires kokoro-onnx==0.4.9, soundfile and espeakng-loader in an isolated venv.
Model/voice paths are explicit; no hosted API, credentials or financial data.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path

import espeakng_loader
import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro
from phonemizer.backend.espeak.wrapper import EspeakWrapper


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--voices", required=True)
    parser.add_argument("--script", default="video/narration.json")
    args = parser.parse_args()
    EspeakWrapper.set_library(espeakng_loader.get_library_path())
    os.environ["ESPEAK_DATA_PATH"] = espeakng_loader.get_data_path()
    options = ort.SessionOptions()
    options.intra_op_num_threads = 2
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(args.model, sess_options=options, providers=["CPUExecutionProvider"])
    engine = Kokoro.from_session(session, args.voices)
    config = json.loads(Path(args.script).read_text())
    output = Path("video/public/voiceover")
    output.mkdir(parents=True, exist_ok=True)
    scenes = []
    for scene in config["scenes"]:
        speech = scene["text"].replace("USDC", "U S D C").replace("Sui", "Soo-ee")
        samples, sample_rate = engine.create(speech, voice=config["voice"], speed=config["speed"], lang=config["language"])
        # Gentle edge fades suppress clicks without changing speech speed/pitch.
        fade = min(240, len(samples) // 2)
        samples[:fade] *= np.linspace(0, 1, fade)
        samples[-fade:] *= np.linspace(1, 0, fade)
        path = output / (scene["id"] + ".wav")
        sf.write(path, samples, sample_rate, subtype="PCM_16")
        duration = len(samples) / sample_rate
        words = scene["text"].split()
        captions = []
        # Readable phrase cues estimated within measured speech, not forced alignment.
        for i in range(0, len(words), 8):
            end = min(i + 8, len(words))
            captions.append({"text": " ".join(words[i:end]), "startMs": round(i / len(words) * duration * 1000), "endMs": round(end / len(words) * duration * 1000), "timestampMs": None, "confidence": None, "pageBreakAfter": True})
        scenes.append({**scene, "audio": "voiceover/" + path.name, "audioDurationSeconds": duration, "audioSha256": hashlib.sha256(path.read_bytes()).hexdigest(), "captions": captions})
        print(f"{scene['id']}: {duration:.2f}s", flush=True)
    result = {"provider": "local Kokoro ONNX", "model": "Kokoro v1.0 int8 / 82M", "modelSha256": hashlib.sha256(Path(args.model).read_bytes()).hexdigest(), "voicesSha256": hashlib.sha256(Path(args.voices).read_bytes()).hexdigest(), "voice": config["voice"], "gender": "male", "language": "English (US)", "speed": config["speed"], "captionTiming": "phrase cues estimated within each measured speech clip", "scenes": scenes}
    Path("video/public/narration-timing.json").write_text(json.dumps(result, indent=2) + "\n")
    print(f"Total speech: {sum(s['audioDurationSeconds'] for s in scenes):.2f}s", flush=True)


if __name__ == "__main__":
    main()
