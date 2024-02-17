import vad from "@ricky0123/vad-node";
import {
  BitArray,
  clamp,
  fillBitArrayWithDuration,
  getFftSize,
  getSubIndexOffset,
} from "./utils.js";

export namespace Subtune {
  export interface Options extends Partial<vad.NonRealTimeVADOptions> {
    /**
     * Width of window to use when matching subs in milliseconds.
     * Larger values will produce a result faster but it will be less accurate.
     * @default 10
     * */
    windowSize?: number;
  }

  export interface Subtitle {
    /** A start time in milliseconds for the subtitle. */
    start: number;
    /** An end time in milliseconds for the subtitle. */
    end: number;
  }

  export async function run(
    subs: Subtitle[],
    samples: Float32Array,
    sampleRate: number,
    opts?: Options
  ): Promise<number> {
    const windowSize = clamp(opts?.windowSize ?? 10, 1, 10);
    const maxSub = Math.max(...subs.map((a) => a.end));
    const audioLength = (samples.length / sampleRate) * 1000;

    const N = getFftSize(audioLength, maxSub, windowSize);
    const padding = N / 4;

    const subBits: BitArray = new Array(N).fill(0);
    const audioBits: BitArray = new Array(N).fill(0);

    // fill in the audio bits with VAD result
    const audioVad = await vad.NonRealTimeVAD.new(opts);
    for await (const sample of audioVad.run(samples, sampleRate)) {
      fillBitArrayWithDuration(audioBits, sample, windowSize, padding);
    }

    // fill in sub bits directly
    for (const sub of subs) {
      fillBitArrayWithDuration(subBits, sub, windowSize);
    }

    return (getSubIndexOffset(audioBits, subBits) - padding) * windowSize;
  }
}

export default Subtune;
