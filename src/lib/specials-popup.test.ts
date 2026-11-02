import { describe, expect, it } from "vitest";
import { markDismissed, shouldOpenPopup, wasDismissed, wrapIndex } from "./specials-popup";

describe("shouldOpenPopup", () => {
  it("opens on public pages while specials are on", () => {
    expect(shouldOpenPopup("/", 2, false)).toBe(true);
    expect(shouldOpenPopup("/treatments", 1, false)).toBe(true);
  });

  it("never interrupts someone booking", () => {
    expect(shouldOpenPopup("/book", 2, false)).toBe(false);
  });

  it("stays away with no specials or once closed", () => {
    expect(shouldOpenPopup("/", 0, false)).toBe(false);
    expect(shouldOpenPopup("/", 2, true)).toBe(false);
  });
});

describe("remembering it was closed", () => {
  const memory = () => {
    const values = new Map<string, string>();
    return { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => void values.set(k, v) };
  };

  it("remembers a close for the visit", () => {
    const storage = memory();
    expect(wasDismissed(storage)).toBe(false);
    markDismissed(storage);
    expect(wasDismissed(storage)).toBe(true);
  });

  it("still works when browser storage is blocked", () => {
    const throwing = {
      getItem(): string | null {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    expect(wasDismissed(throwing)).toBe(false);
    expect(() => markDismissed(throwing)).not.toThrow();
  });

  it("still works when browser storage is missing", () => {
    expect(wasDismissed(undefined)).toBe(false);
    expect(() => markDismissed(undefined)).not.toThrow();
  });
});

describe("wrapIndex", () => {
  it("wraps past either end", () => {
    expect(wrapIndex(3, 3)).toBe(0);
    expect(wrapIndex(-1, 3)).toBe(2);
    expect(wrapIndex(1, 3)).toBe(1);
  });
});
