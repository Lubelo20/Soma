"use client";

import { useActionState } from "react";
import { saveTreatment } from "../../actions";

export type EditableTreatment = {
  id?: number;
  name: string;
  category: "wellness" | "skincare";
  description: string;
  durationMin: number;
  priceCents: number | null;
  active: boolean;
};

const labelClass = "flex flex-col gap-1.5 text-[13px] font-semibold text-ink-body";

export function TreatmentEditor({ treatment, isNew = false }: { treatment: EditableTreatment; isNew?: boolean }) {
  const [state, action, pending] = useActionState(saveTreatment, {});
  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_1fr_1fr]">
      {treatment.id && <input type="hidden" name="id" value={treatment.id} />}
      <label className={labelClass}>
        Name
        <input name="name" defaultValue={treatment.name} required className="field" />
      </label>
      <label className={labelClass}>
        Category
        <select name="category" defaultValue={treatment.category} className="field">
          <option value="wellness">Wellness</option>
          <option value="skincare">Skincare</option>
        </select>
      </label>
      <label className={labelClass}>
        Minutes
        <input name="durationMin" type="number" min={10} max={480} step={5} defaultValue={treatment.durationMin} required className="field" />
      </label>
      <label className={labelClass}>
        Price (R)
        <input
          name="price"
          inputMode="decimal"
          placeholder="On request"
          defaultValue={treatment.priceCents == null ? "" : String(treatment.priceCents / 100)}
          className="field"
        />
      </label>
      <label className={`${labelClass} sm:col-span-4`}>
        Description
        <textarea name="description" rows={2} maxLength={600} defaultValue={treatment.description} className="field resize-y py-2" />
      </label>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-4">
        <label className="flex items-center gap-2 text-sm text-ink-body">
          <input type="checkbox" name="active" defaultChecked={treatment.active} className="size-4 accent-brand" />
          Show on website &amp; allow bookings
        </label>
        <button type="submit" disabled={pending} className="btn btn-solid min-h-10 border-none px-5">
          {pending ? "Saving…" : isNew ? "Add treatment" : "Save"}
        </button>
        {state.error && <span className="text-sm font-medium text-red-700">{state.error}</span>}
        {state.ok && <span className="text-sm font-medium text-brand">Saved ✓</span>}
      </div>
    </form>
  );
}
