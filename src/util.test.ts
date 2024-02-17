import { expect, describe, test, beforeEach } from "vitest";
import {
  BitArray,
  clamp,
  complexProduct,
  getFftSize,
  getSubIndexOffset,
} from "./utils.js";

describe("clamp", () => {
  test("lower value is clamped up", () => {
    expect(clamp(0, 1, 2)).equal(1);
  });

  test("higher value is clamped down", () => {
    expect(clamp(3, 1, 2)).equal(2);
  });

  test("value in range is unchanged", () => {
    expect(clamp(1.5, 1, 2)).equal(1.5);
  });
});

describe("complexProduct", () => {
  let output: number[];
  const offset = 0;

  beforeEach(() => {
    output = [0, 0];
  });

  test("two real numbers", () => {
    complexProduct(output, offset, 4, 0, 5, 0);
    expect(output).deep.equal([20, 0]);
  });

  test("two imaginary numbers", () => {
    complexProduct(output, offset, 0, 4, 0, 5);
    expect(output).deep.equal([-20, 0]);
  });

  test("two complex numbers", () => {
    complexProduct(output, offset, 20, 4, -19, 51);
    expect(output).deep.equal([-584, 944]);
  });
});

describe("getFftSize", () => {
  test("FFT size includes padding", () => {
    // 100 ms - 10ms window = 10 windows ~= 2^4 so 2^5 includes padding
    expect(getFftSize(100, 5, 10)).toBe(2 ** 5);
  });

  test("FFT size is always >= 4", () => {
    // 10ms - 10ms window = 1 window == 2^0 so even with default padding of one order of magnitude this would be too small
    expect(getFftSize(10, 10, 10)).toBe(4);
  });
});

describe("getSubIndexOffset", () => {
  test("should give a negative result", () => {
    // bit arrays are pre-padded with n / 4 zeroes each side
    const audio: BitArray = [0, 0, 1, 0, 0, 0, 0, 0];
    const subs: BitArray = [0, 0, 0, 1, 0, 0, 0, 0];

    expect(getSubIndexOffset(audio, subs)).toBe(-1);
  });

  test("should give a positive result", () => {
    const audio: BitArray = [0, 0, 0, 0, 0, 1, 0, 0];
    const subs: BitArray = [0, 0, 1, 0, 0, 0, 0, 0];

    expect(getSubIndexOffset(audio, subs)).toBe(3);
  });

  test("should give a negative result", () => {
    const audio: BitArray = [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const subs: BitArray = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0];

    expect(getSubIndexOffset(audio, subs)).toBe(-4);
  });
});
