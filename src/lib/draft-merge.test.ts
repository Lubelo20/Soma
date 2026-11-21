import { describe, expect, it } from "vitest";
import { applySectionDraft, makeSectionDraft, reconcileSection, stablePrint } from "./draft-merge";
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

// ---------- Fourth round: the draft keeps its own base; other-device changes stay flagged ----------

describe("reconcileSection (saved answers arrive while the editor is open)", () => {
  const S0 = parseHealth(fd([]));
  const S1 = parseHealth(fd([["health.pregnancy", "yes"], ["health.pregnancy.note", "2nd"]]));
  const allergy = { answer: "yes" as const, note: "Latex" };

  it("does nothing when the saved answers are still the section's base", () => {
    expect(reconcileSection({ ...S0, skinAllergies: allergy }, S0, S0)).toEqual({ kind: "same" });
  });

  it("adopts the newer saved answers when the section has no unsaved edits", () => {
    expect(reconcileSection(S0, S0, S1)).toEqual({ kind: "adopt", value: S1 });
  });

  it("re-merges unsaved edits over the newer answers and names fields changed in both places", () => {
    const r = reconcileSection({ ...S0, pregnancy: { answer: "no" as const, note: "" }, skinAllergies: allergy }, S0, S1);
    if (r.kind !== "merged") throw new Error(r.kind);
    expect(r.value.pregnancy).toEqual({ answer: "no", note: "" }); // the user's unsaved intent is shown
    expect(r.value.skinAllergies).toEqual(allergy);
    expect(r.conflicts).toEqual(["pregnancy"]);
    expect(r.origin.base).toBe(stablePrint(S0));
  });

  it("M1: another device's pregnancy survives a save of a different section and a Back", () => {
    // Device 1 opened Health as S0 and changed the allergy only; device 2 then saved Pregnancy Yes (S1), which
    // reaches device 1 when it saves Massage.
    const r = reconcileSection({ ...S0, skinAllergies: allergy }, S0, S1);
    if (r.kind !== "merged") throw new Error(r.kind);
    expect(r.conflicts).toEqual([]);
    // Back: the draft is made against the section's base (now S1) and keeps the original base.
    const d = makeSectionDraft(r.value, S1, r.origin)!;
    expect(Object.keys(d.fields)).toEqual(["skinAllergies"]);
    expect(d.base).toBe(stablePrint(S0));
    expect(d.baseFields).toEqual({ skinAllergies: S0.skinAllergies });
    // Reopen: Pregnancy Yes is kept and the section is reported as updated elsewhere.
    const open = applySectionDraft(S1, d);
    expect(open.value.pregnancy).toEqual({ answer: "yes", note: "2nd" });
    expect(open.value.skinAllergies).toEqual(allergy);
    expect(open.serverChanged).toBe(true);
    expect(open.conflicts).toEqual([]);
  });
});

describe("makeSectionDraft with the draft it was opened from (M2)", () => {
  const S0 = parseHealth(fd([]));
  const S1 = parseHealth(fd([["health.pregnancy", "yes"]]));
  const D = makeSectionDraft({ ...S0, pregnancy: { answer: "no" as const, note: "" } }, S0)!;

  it("keeps the original base and base values across a second Back without saving", () => {
    const open = applySectionDraft(S1, D);
    expect(open.conflicts).toEqual(["pregnancy"]);
    const again = makeSectionDraft(open.value, S1, D)!;
    expect(again.base).toBe(D.base);
    expect(again.baseFields).toEqual(D.baseFields);
    const reopen = applySectionDraft(S1, again);
    expect(reopen.serverChanged).toBe(true);
    expect(reopen.conflicts).toEqual(["pregnancy"]);
  });

  it("keeps the marker on a carried field the user edited again, and none on a newly edited field", () => {
    const open = applySectionDraft(S1, D);
    const edited = { ...open.value, pregnancy: { answer: "no" as const, note: "checked again" }, heart: { answer: "no" as const, note: "" } };
    const again = makeSectionDraft(edited, S1, D)!;
    const reopen = applySectionDraft(S1, again);
    expect(reopen.conflicts).toEqual(["pregnancy"]);
    expect(reopen.value.heart).toEqual({ answer: "no", note: "" });
  });

  it("after this device saves the section, the base is what was saved: no stale conflict afterwards", () => {
    const savedNow = { ...S1, pregnancy: { answer: "no" as const, note: "" } };
    expect(reconcileSection(savedNow, savedNow, savedNow)).toEqual({ kind: "same" });
    const later = makeSectionDraft({ ...savedNow, heart: { answer: "yes" as const, note: "" } }, savedNow)!;
    const reopen = applySectionDraft(savedNow, later);
    expect(reopen.serverChanged).toBe(false);
    expect(reopen.conflicts).toEqual([]);
  });
});
