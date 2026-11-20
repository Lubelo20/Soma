import { describe, expect, it } from "vitest";
import { isValidSignaturePath, strokesToPath, type Point } from "./signature";

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
