// Unsaved card-editor edits as per-field changes, merged over the newest saved answers. Pure: no React, no storage.
// A "field" is a top-level key of a section's answers: a health condition (answer and note together), a skin row
// (selected, note and other together), massage "areas" or "notes", or one client-details input.

export type SectionDraft<T extends object> = {
  /** Fingerprint of the saved answers these changes were made against. */
  base: string;
  /** Only the fields that were changed, with their unsaved values. */
  fields: Partial<T>;
  /** What those fields were in the saved answers at the time, to spot the same field changed elsewhere. */
  baseFields: Partial<T>;
};

/** JSON with object keys sorted, so equal answers always print the same. */
export function stablePrint(v: unknown): string {
  return JSON.stringify(v, (_k, val: unknown) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : val,
  );
}

const same = (a: unknown, b: unknown) => stablePrint(a) === stablePrint(b);

/**
 * The changes between what is on screen and the section's base (the saved answers the screen was built from), or
 * undefined when there are none. `origin`: the draft the screen was itself built from (a reopened draft, or a
 * re-merge after newer answers arrived). Its fingerprint and the base values of the fields it carried are kept,
 * so a second Back without saving still knows those fields were changed against older answers.
 */
export function makeSectionDraft<T extends object>(
  current: T,
  base: T,
  origin?: SectionDraft<T>,
  tidy?: (v: T) => T,
): SectionDraft<T> | undefined {
  // `tidy`: the base as the server stores it (a just-saved base holds what was sent, which the server may have
  // tidied). Which fields changed is still decided against the base as it is on screen.
  const stored = tidy ? tidy(base) : base;
  const fields: Partial<T> = {};
  const baseFields: Partial<T> = {};
  for (const key of Object.keys(current) as (keyof T)[]) {
    if (same(current[key], base[key])) continue;
    fields[key] = current[key];
    const carried = origin !== undefined && Object.prototype.hasOwnProperty.call(origin.fields, key);
    baseFields[key] = carried ? origin.baseFields[key] : stored[key];
  }
  if (Object.keys(fields).length === 0) return undefined;
  return { base: origin?.base ?? stablePrint(stored), fields, baseFields };
}

/**
 * The newest saved answers with a draft's changed fields on top. Fields the draft didn't change keep the saved
 * value, however new. `serverChanged`: the saved answers changed since the draft was made. `conflicts`: fields
 * changed both in the draft and since in the saved answers (the draft's value is the one shown).
 */
export function applySectionDraft<T extends object>(
  saved: T,
  draft: SectionDraft<T> | undefined,
): { value: T; serverChanged: boolean; conflicts: string[] } {
  if (!draft) return { value: saved, serverChanged: false, conflicts: [] };
  const value = { ...saved };
  const conflicts: string[] = [];
  for (const key of Object.keys(draft.fields) as (keyof T)[]) {
    if (!Object.prototype.hasOwnProperty.call(saved, key)) continue;
    value[key] = draft.fields[key] as T[keyof T];
    if (!same(saved[key], draft.baseFields[key])) conflicts.push(String(key));
  }
  return { value, serverChanged: stablePrint(saved) !== draft.base, conflicts };
}

export type Reconciled<T extends object> =
  | { kind: "same" }
  | { kind: "adopt"; value: T }
  | { kind: "merged"; value: T; origin: SectionDraft<T>; conflicts: string[] };

/**
 * Newer saved answers (`fresh`) arrived while a section is open, for example after another section's save
 * refreshed the page. If they are still the section's base: nothing to do. If the section has no unsaved edits:
 * adopt them. Otherwise the unsaved edits are re-merged over them exactly as a reopened draft is, and `origin`
 * (the edits as a draft against the old base) becomes the section's origin, with `fresh` as its new base.
 * All values must be in their saved form, so the section's own save never looks like a change elsewhere.
 */
export function reconcileSection<T extends object>(current: T, base: T, fresh: T, origin?: SectionDraft<T>): Reconciled<T> {
  if (same(base, fresh)) return { kind: "same" };
  const draft = makeSectionDraft(current, base, origin);
  if (!draft) return { kind: "adopt", value: fresh };
  const merged = applySectionDraft(fresh, draft);
  return { kind: "merged", value: merged.value, origin: draft, conflicts: merged.conflicts };
}
