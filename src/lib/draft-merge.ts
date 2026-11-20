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

/** The changes between what is on screen and the saved answers, or undefined when there are none. */
export function makeSectionDraft<T extends object>(current: T, saved: T): SectionDraft<T> | undefined {
  const fields: Partial<T> = {};
  const baseFields: Partial<T> = {};
  for (const key of Object.keys(current) as (keyof T)[]) {
    if (same(current[key], saved[key])) continue;
    fields[key] = current[key];
    baseFields[key] = saved[key];
  }
  if (Object.keys(fields).length === 0) return undefined;
  return { base: stablePrint(saved), fields, baseFields };
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
