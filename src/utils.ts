import FFT from "fft.js";
import type Subtune from "./index.js";

export type BitArray = Array<0 | 1>;

export function clamp(v: number, min: number, max: number): number {
  return Math.max(Math.min(v, max), min);
}

// given an audio length, length of subtitle track and a window size compute the size of our bit arrays
// to the nearest power of 2 (for fft compatability) and include padding to prevent wrapping
export function getFftSize(
  audioLength: number,
  maxSub: number,
  windowSize: number
): number {
  const lengthMs = Math.max(audioLength, maxSub);
  const exponent = Math.ceil(Math.log2(Math.ceil(lengthMs / windowSize))) + 1;
  return 2 ** Math.max(exponent, 2);
}

export function fillBitArrayWithDuration(
  arr: BitArray,
  sample: Subtune.Subtitle,
  windowSize: number,
  offset: number = 0
): void {
  const { start, end } = sample;
  const startIndex = Math.floor(start / windowSize);
  const endIndex = Math.floor(end / windowSize);
  for (let i = startIndex; i < endIndex; i++) {
    arr[i + offset] = 1;
  }
}

export function complexProduct(
  output: number[],
  offset: number,
  a: number,
  b: number,
  c: number,
  d: number
): void {
  output[offset] = a * c - b * d;
  output[offset + 1] = a * d + b * c;
}

export function getSubIndexOffset(
  audioBits: BitArray,
  subBits: BitArray
): number {
  const N = audioBits.length;
  const fft = new FFT(N);
  const subFft = fft.createComplexArray();
  const audioFft = fft.createComplexArray();
  const audioSubStarProd = fft.createComplexArray();
  const subAudioStarProd = fft.createComplexArray();

  fft.transform(subFft, fft.toComplexArray(subBits, undefined));
  fft.transform(audioFft, fft.toComplexArray(audioBits, undefined));

  for (let i = 0; i < N * 2; i += 2) {
    // take conjugates of both FFTs since we need to test offseting in both directions
    const subStarA = subFft[i];
    const subStarB = -subFft[i + 1];

    const audioStarA = audioFft[i];
    const audioStarB = -audioFft[i + 1];

    complexProduct(
      audioSubStarProd,
      i,
      audioFft[i],
      audioFft[i + 1],
      subStarA,
      subStarB
    );
    complexProduct(
      subAudioStarProd,
      i,
      subFft[i],
      subFft[i + 1],
      audioStarA,
      audioStarB
    );
  }

  fft.inverseTransform(audioFft, subAudioStarProd);
  fft.inverseTransform(subFft, audioSubStarProd);

  let maxIndex = 0;
  let sign = 0;
  let maxValue = -Infinity;
  const crossCorrelations = [audioFft, subFft];
  for (let i = 0; i < N * 2; i += 2) {
    for (const crossCorrelation of crossCorrelations) {
      if (crossCorrelation[i] > maxValue) {
        maxValue = crossCorrelation[i];
        maxIndex = i / 2;
        sign = crossCorrelation === audioFft ? -1 : 1;
      }
    }
  }

  return sign * maxIndex;
}
