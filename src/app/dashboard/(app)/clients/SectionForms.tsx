"use client";

import {
  BODY_AREAS,
  HEALTH_CONDITIONS,
  SKIN_ROWS,
  type HealthAnswers,
  type MassageAnswers,
  type SkinAnswers,
} from "@/lib/record-card";
import { BodyMap } from "./BodyMap";

// Controlled forms for the health, massage and skin sections. Their state lives in CardWizard, so moving
// between steps never loses what was typed. Field names match the parsers in src/lib/record-card.ts.

/** Form fields for one section, as the server action expects them. Ticked options keep their defined order. */
export function sectionFormData(
  section: "health" | "massage" | "skin",
  answers: HealthAnswers | MassageAnswers | SkinAnswers,
): FormData {
  const fd = new FormData();
  if (section === "health") {
    const h = answers as HealthAnswers;
    for (const { key } of HEALTH_CONDITIONS) {
      if (h[key].answer) fd.set(`health.${key}`, h[key].answer);
      fd.set(`health.${key}.note`, h[key].note);
    }
  } else if (section === "skin") {
    const sk = answers as SkinAnswers;
    for (const row of SKIN_ROWS) {
      const { selected, note, other } = sk[row.key];
      for (const o of row.options) if (selected.includes(o.value)) fd.append(`skin.${row.key}`, o.value);
      fd.set(`skin.${row.key}.note`, note);
      // The "Other" text only counts while "Other" is ticked.
      fd.set(`skin.${row.key}.other`, selected.includes("other") ? other : "");
    }
  } else {
    const m = answers as MassageAnswers;
    for (const a of BODY_AREAS) if (m.areas.includes(a.id)) fd.append("massage.areas", a.id);
    fd.set("massage.notes", m.notes);
  }
  return fd;
}

// ---------- Health ----------

export function HealthForm({ value, onChange }: { value: HealthAnswers; onChange: (v: HealthAnswers) => void }) {
  const set = (key: keyof HealthAnswers, patch: Partial<HealthAnswers[keyof HealthAnswers]>) =>
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  const unanswered = HEALTH_CONDITIONS.filter(({ key }) => value[key].answer === null).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-ink-muted">Does the client have, or have they had, any of the following?</p>
      <ul className="m-0 flex list-none flex-col p-0">
        {HEALTH_CONDITIONS.map(({ key, label, noteLabel }) => {
          const entry = value[key];
          const labelId = `health-${key}-label`;
          return (
            <li
              key={key}
              className="grid gap-3 border-t border-line-soft py-4 first:border-t-0 first:pt-0 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-4"
            >
              {entry.answer && <input type="hidden" name={`health.${key}`} value={entry.answer} />}
              <span id={labelId} className="font-medium text-ink-strong">
                {label}
              </span>
              <div role="group" aria-labelledby={labelId} className="grid grid-cols-2 gap-2 lg:w-44">
                {(["yes", "no"] as const).map((answer) => {
                  const on = entry.answer === answer;
                  return (
                    <button
                      key={answer}
                      type="button"
                      aria-pressed={on}
                      // Tapping the chosen answer again clears it.
                      onClick={() => set(key, { answer: on ? null : answer })}
                      className={`min-h-12 cursor-pointer rounded-[2px] border text-sm font-semibold tracking-[.12em] uppercase transition-colors ${
                        on
                          ? answer === "yes"
                            ? "border-gold-deep bg-gold-deep text-white"
                            : "border-brand bg-brand text-cream"
                          : "border-line bg-white text-ink hover:border-brand"
                      }`}
                    >
                      {answer === "yes" ? "Yes" : "No"}
                    </button>
                  );
                })}
              </div>
              <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
                {noteLabel ?? "Notes"}
                <input
                  name={`health.${key}.note`}
                  value={entry.note}
                  onChange={(e) => set(key, { note: e.target.value })}
                  maxLength={500}
                  autoComplete="off"
                  aria-label={`${label}: ${noteLabel ?? "Notes"}`}
                  className="field"
                />
              </label>
            </li>
          );
        })}
      </ul>
      {unanswered > 0 && (
        <p className="m-0 text-sm text-ink-muted">
          {unanswered} not answered yet
        </p>
      )}
    </div>
  );
}

// ---------- Massage ----------

export function MassageForm({ value, onChange }: { value: MassageAnswers; onChange: (v: MassageAnswers) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="m-0 text-sm text-ink-muted">Tap the areas of tension or discomfort.</p>
      <BodyMap value={value.areas} onChange={(areas) => onChange({ ...value, areas })} />
      <label className="label">
        Additional notes
        <textarea
          name="massage.notes"
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          maxLength={2000}
          rows={4}
          autoComplete="off"
          className="field py-3"
        />
      </label>
    </div>
  );
}

// ---------- Skin ----------

type SkinRow = (typeof SKIN_ROWS)[number];

function nextSelection(row: SkinRow, selected: string[], option: string, checked: boolean): string[] {
  if (row.pick !== "many") return checked ? [option] : [];
  if (!checked) return selected.filter((v) => v !== option);
  // "None" stands alone: ticking it clears the rest, ticking anything else clears it.
  if (option === "none") return ["none"];
  return [...selected.filter((v) => v !== "none"), option];
}

export function SkinForm({ value, onChange }: { value: SkinAnswers; onChange: (v: SkinAnswers) => void }) {
  const set = (key: SkinRow["key"], patch: Partial<SkinAnswers[SkinRow["key"]]>) =>
    onChange({ ...value, [key]: { ...value[key], ...patch } });

  return (
    <div className="flex flex-col">
      {SKIN_ROWS.map((row) => {
        const entry = value[row.key];
        const multi = row.pick === "many";
        return (
          <fieldset key={row.key} className="m-0 flex min-w-0 flex-col gap-3 border-0 border-t border-line-soft p-0 py-5 first:border-t-0 first:pt-0">
            <legend className="float-left mb-3 w-full p-0 font-medium text-ink-strong">
              {row.label}
              {multi && <span className="ml-2 text-xs font-normal text-ink-subtle">(tick all that apply)</span>}
            </legend>
            <div className="clear-both flex flex-wrap gap-2">
              {row.options.map((o) => {
                const on = entry.selected.includes(o.value);
                return (
                  <label key={o.value} className="cursor-pointer">
                    <input
                      type={multi ? "checkbox" : "radio"}
                      name={`skin.${row.key}`}
                      value={o.value}
                      checked={on}
                      onChange={(e) => set(row.key, { selected: nextSelection(row, entry.selected, o.value, e.target.checked) })}
                      // A radio can't be unticked by tapping it again, so do that here.
                      onClick={() => {
                        if (!multi && on) set(row.key, { selected: [] });
                      }}
                      className="peer sr-only"
                    />
                    <span className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-sm text-ink transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-cream peer-focus-visible:ring-2 peer-focus-visible:ring-gold-deep peer-focus-visible:ring-offset-2 hover:border-brand">
                      {o.label}
                    </span>
                  </label>
                );
              })}
            </div>
            {row.hasOther && entry.selected.includes("other") && (
              <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
                Other (specify)
                <input
                  name={`skin.${row.key}.other`}
                  value={entry.other}
                  onChange={(e) => set(row.key, { other: e.target.value })}
                  maxLength={200}
                  autoComplete="off"
                  aria-label={`${row.label}: other`}
                  className="field"
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
              {row.noteLabel ?? "Notes"}
              <input
                name={`skin.${row.key}.note`}
                value={entry.note}
                onChange={(e) => set(row.key, { note: e.target.value })}
                maxLength={500}
                autoComplete="off"
                aria-label={`${row.label}: ${row.noteLabel ?? "Notes"}`}
                className="field"
              />
            </label>
          </fieldset>
        );
      })}
    </div>
  );
}
