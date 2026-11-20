import { describe, expect, it } from "vitest";
import { applySectionDraft, makeSectionDraft, stablePrint } from "./draft-merge";
import { parseHealth } from "./record-card";

const fd = (pairs: [string, string][]) => {
  const f = new FormData();
  pairs.forEach(([k, v]) => f.append(k, v));
  return f;
};

describe("stablePrint", () => {
  it("ignores key order", () => {
    expect(stablePrint({ a: 1, b: { c: 2, d: 3 } })).toBe(stablePrint({ b: { d: 3, c: 2 }, a: 1 }));
  });
});

describe("makeSectionDraft", () => {
  it("keeps only the changed fields, with the server values they replaced and the server's fingerprint", () => {
    const server = parseHealth(fd([]));
    const current = { ...server, skinAllergies: { answer: "yes" as const, note: "Latex" } };
    const d = makeSectionDraft(current, server)!;
    expect(d.fields).toEqual({ skinAllergies: { answer: "yes", note: "Latex" } });
    expect(d.baseFields).toEqual({ skinAllergies: { answer: null, note: "" } });
    expect(d.base).toBe(stablePrint(server));
  });

  it("drops a field changed and then put back by hand", () => {
    const server = { notes: "a", areas: ["neck"] };
    expect(makeSectionDraft({ notes: "a", areas: ["neck", "head"] }, server)?.fields).toEqual({ areas: ["neck", "head"] });
    expect(makeSectionDraft({ notes: "a", areas: ["neck"] }, server)).toBeUndefined();
  });

  it("is no draft at all when nothing differs", () => {
    expect(makeSectionDraft({ fullName: "A", phone: "1" }, { phone: "1", fullName: "A" })).toBeUndefined();
  });
});

describe("applySectionDraft", () => {
  it("without a draft, is the server's answers unchanged", () => {
    const server = { a: "1" };
    expect(applySectionDraft(server, undefined)).toEqual({ value: server, serverChanged: false, conflicts: [] });
  });

  it("keeps a newer server answer the draft didn't touch (draft: allergy; other device: pregnancy yes)", () => {
    const base = parseHealth(fd([]));
    const draft = makeSectionDraft({ ...base, skinAllergies: { answer: "yes" as const, note: "Latex" } }, base);
    const fresh = parseHealth(fd([["health.pregnancy", "yes"], ["health.pregnancy.note", "2nd"]]));
    const merged = applySectionDraft(fresh, draft);
    expect(merged.value.pregnancy).toEqual({ answer: "yes", note: "2nd" });
    expect(merged.value.skinAllergies).toEqual({ answer: "yes", note: "Latex" });
    expect(merged.serverChanged).toBe(true);
    expect(merged.conflicts).toEqual([]);
  });

  it("shows the draft's value where both changed the same field, and names that field", () => {
    const base = { notes: "", areas: [] as string[] };
    const draft = makeSectionDraft({ notes: "mine", areas: [] }, base);
    const merged = applySectionDraft({ notes: "theirs", areas: ["neck"] }, draft);
    expect(merged.value).toEqual({ notes: "mine", areas: ["neck"] });
    expect(merged.conflicts).toEqual(["notes"]);
    expect(merged.serverChanged).toBe(true);
  });

  it("reports no server change when the server is still what the draft was based on", () => {
    const base = { a: "1", b: "2" };
    const merged = applySectionDraft(base, makeSectionDraft({ a: "9", b: "2" }, base));
    expect(merged).toEqual({ value: { a: "9", b: "2" }, serverChanged: false, conflicts: [] });
  });

  it("ignores draft fields the section no longer has", () => {
    const merged = applySectionDraft({ a: "1" }, { base: "x", fields: { gone: "?" } as never, baseFields: {} });
    expect(merged.value).toEqual({ a: "1" });
  });
});
