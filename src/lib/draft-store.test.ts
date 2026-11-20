import { describe, expect, it, vi } from "vitest";
import { createDraftStore } from "./draft-store";

type D = { health?: string; details?: string };
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("createDraftStore", () => {
  it("starts empty", () => {
    const s = createDraftStore<D>();
    expect(s.get(A)).toBeUndefined();
    expect(s.has(A)).toBe(false);
    expect(s.hasAny()).toBe(false);
  });

  it("merges parts per id and keeps ids apart", () => {
    const s = createDraftStore<D>();
    s.update(A, { health: "yes" });
    s.update(A, { details: "Thandi" });
    expect(s.get(A)).toEqual({ health: "yes", details: "Thandi" });
    expect(s.get(B)).toBeUndefined();
    expect(s.has(B)).toBe(false);
  });

  it("removes a part given as undefined, and the whole draft once no part is left", () => {
    const s = createDraftStore<D>();
    s.update(A, { health: "yes", details: "x" });
    s.update(A, { health: undefined });
    expect(s.get(A)).toEqual({ details: "x" });
    s.update(A, { details: undefined });
    expect(s.has(A)).toBe(false);
    expect(s.get(A)).toBeUndefined();
  });

  it("returns a copy, so changing it doesn't change the store", () => {
    const s = createDraftStore<D>();
    s.update(A, { health: "yes" });
    const got = s.get(A)!;
    got.health = "no";
    expect(s.get(A)).toEqual({ health: "yes" });
  });

  it("clears one id or everything", () => {
    const s = createDraftStore<D>();
    s.update(A, { health: "yes" });
    s.update(B, { health: "no" });
    s.clear(A);
    expect(s.has(A)).toBe(false);
    expect(s.has(B)).toBe(true);
    expect(s.firstId()).toBe(B);
    s.clearAll();
    expect(s.hasAny()).toBe(false);
    expect(s.firstId()).toBeUndefined();
  });

  it("ignores ids that aren't uuids", () => {
    const s = createDraftStore<D>();
    s.update("not-an-id", { health: "yes" });
    expect(s.hasAny()).toBe(false);
  });

  it("tells subscribers about every change until they unsubscribe", () => {
    const s = createDraftStore<D>();
    const fn = vi.fn();
    const off = s.subscribe(fn);
    s.update(A, { health: "yes" });
    s.clear(A);
    s.clearAll();
    expect(fn).toHaveBeenCalledTimes(3);
    off();
    s.update(A, { health: "yes" });
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe("hasOtherThan", () => {
  it("tells whether any id other than the given one has a draft", () => {
    const s = createDraftStore<D>();
    expect(s.hasOtherThan(A)).toBe(false);
    s.update(A, { health: "yes" });
    expect(s.hasOtherThan(A)).toBe(false);
    expect(s.hasOtherThan(B)).toBe(true);
    s.update(B, { health: "no" });
    expect(s.hasOtherThan(A)).toBe(true);
  });
});
