import { expect, test } from "vitest";
import Subtune from "./index.js";
import { parse } from "@plussub/srt-vtt-parser";
import fs from "fs";
import path from "path";
import { WaveFile } from "wavefile";

const __dirname = import.meta.dirname!;

export function loadSample(
  name: string,
  offsetMs: number = 0,
  dir: string = "../samples"
): {
  audio: Float32Array;
  subs: Subtune.Subtitle[];
} {
  // expects webvtt subs and mono 44.8kHz wave file audio
  const subsText = fs
    .readFileSync(path.join(__dirname, dir, `${name}.vtt`))
    .toString("utf-8");
  const audioBuf = fs.readFileSync(path.join(__dirname, dir, `${name}.wav`));

  const subs: Subtune.Subtitle[] = parse(subsText + "\n").entries.map((a) => ({
    start: a.from + offsetMs,
    end: a.to + offsetMs,
  }));

  const wav = new WaveFile(audioBuf);
  const audio = wav.getSamples(false, Float32Array) as any;

  return { subs, audio };
}

test("returns small value for correctly-aligned subtitles", async () => {
  const { audio, subs } = loadSample("ElephantsDream");
  const result = await Subtune.run(subs, audio, 44800);
  expect(result).approximately(0, 300);
});

test("returns large value for badly-aligned subtitles", async () => {
  const offset = 20000;
  const { audio, subs } = loadSample("ElephantsDream", offset);
  const result = await Subtune.run(subs, audio, 44800);
  expect(result).approximately(-offset, 5000);
});

test("returns positive value for delayed aligned subtitles", async () => {
  const offset = -5000;
  const { audio, subs } = loadSample("ElephantsDream", offset);
  const result = await Subtune.run(subs, audio, 44800);
  expect(result).approximately(-offset, 3000);
});

test("returns more accurate offset when tweaking speech thresholds", async () => {
  const offset = -5000;
  const { audio, subs } = loadSample("ElephantsDream", offset);
  const result = await Subtune.run(subs, audio, 44800, {
    positiveSpeechThreshold: 0.7,
    negativeSpeechThreshold: 0.55,
  });
  expect(result).approximately(-offset, 600);
});
