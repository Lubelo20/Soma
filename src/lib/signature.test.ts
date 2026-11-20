import { describe, expect, it } from "vitest";
import { MIN_SIGNATURE_EXTENT, MIN_SIGNATURE_POINTS, isValidSignaturePath, strokesToPath, type Point } from "./signature";

const line = (n: number): Point[] => Array.from({ length: n }, (_, i) => [i * 10, 50] as Point);

describe("strokesToPath", () => {
  it("turns strokes into a path", () => {
    expect(strokesToPath([[[1, 2], [3.04, 4.06]], [[700, -5]]])).toBe("M1 2 L3 4.1 M600 0");
  });
  it("ignores empty strokes and handles an empty list", () => {
    expect(strokesToPath([])).toBe("");
    expect(strokesToPath([[], [[5, 6]], []])).toBe("M5 6");
  });
  it("clamps y to the viewbox height", () => {
    expect(strokesToPath([[[1, 999]]])).toBe("M1 200");
  });
});

describe("isValidSignaturePath", () => {
  it("accepts a real signature and rejects junk", () => {
    const path = strokesToPath([line(12)]);
    expect(isValidSignaturePath(path)).toBe(true);
    expect(isValidSignaturePath("M1 2 L3 4")).toBe(false); // a dot, not a signature
    expect(isValidSignaturePath(path + " Z")).toBe(false);
    expect(isValidSignaturePath('M1 2"/><script>')).toBe(false);
    expect(isValidSignaturePath("M1 2 L" + "9 9 L".repeat(20000) + "9 9")).toBe(false);
  });
  it("accepts multiple strokes totalling 10 points", () => {
    expect(isValidSignaturePath(strokesToPath([line(5), line(5)]))).toBe(true);
  });
  it("rejects an empty string and a path not starting with M", () => {
    expect(isValidSignaturePath("")).toBe(false);
    const path = strokesToPath([line(12)]);
    expect(isValidSignaturePath("L" + path.slice(1))).toBe(false);
  });
  it("rejects exponent, negative, and out-of-range numbers", () => {
    const base = strokesToPath([line(12)]);
    expect(isValidSignaturePath(base + " L1e2 5")).toBe(false);
    expect(isValidSignaturePath(base + " L-1 5")).toBe(false);
    expect(isValidSignaturePath(base + " L601 5")).toBe(false);
    expect(isValidSignaturePath(base + " L5 201")).toBe(false);
    expect(isValidSignaturePath(base + " L1.25 5")).toBe(false);
    expect(isValidSignaturePath(base + " L600 200")).toBe(true);
  });
});

describe("isValidSignaturePath: taps and tiny scribbles", () => {
  it("exports the rule's numbers", () => {
    expect(MIN_SIGNATURE_POINTS).toBe(10);
    expect(MIN_SIGNATURE_EXTENT).toBe(30);
  });
  it("rejects ten single taps spread across the box", () => {
    const taps = Array.from({ length: 10 }, (_, i): Point[] => [[20 + i * 55, 30 + (i % 3) * 60]]);
    expect(isValidSignaturePath(strokesToPath(taps))).toBe(false);
  });
  it("rejects a 12-point scribble confined to a 5x5 area", () => {
    const scribble = Array.from({ length: 12 }, (_, i): Point => [100 + (i % 2) * 5, 100 + Math.floor(i / 2)]);
    expect(isValidSignaturePath(strokesToPath([scribble]))).toBe(false);
  });
  it("accepts a normal 12-point stroke 110 units wide", () => {
    expect(isValidSignaturePath(strokesToPath([line(12)]))).toBe(true);
  });
  it("rejects nine drawn points plus five taps", () => {
    const taps = Array.from({ length: 5 }, (_, i): Point[] => [[300 + i * 40, 150]]);
    expect(isValidSignaturePath(strokesToPath([line(9), ...taps]))).toBe(false);
  });
  it("accepts a tall narrow stroke (40 high, 2 wide)", () => {
    const tall = Array.from({ length: 12 }, (_, i): Point => [200 + (i % 2) * 2, 50 + (i * 40) / 11]);
    expect(isValidSignaturePath(strokesToPath([tall]))).toBe(true);
  });
});
