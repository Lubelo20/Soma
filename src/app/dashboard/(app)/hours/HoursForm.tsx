"use client";

import { useActionState } from "react";
import type { DayHours } from "@/lib/slots";
import { saveHours } from "../../actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function HoursForm({ weekly }: { weekly: DayHours[] }) {
  const [state, action, pending] = useActionState(saveHours, {});
  return (
    <form action={action} className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-6">
      {ORDER.map((d) => {
        const h = weekly[d];
        return (
          <div key={d} className="grid grid-cols-[110px_auto] items-center gap-x-4 gap-y-2 sm:grid-cols-[130px_90px_1fr]">
            <span className="font-semibold text-ink-strong">{DAYS[d]}</span>
            <label className="flex items-center gap-2 text-sm text-ink-body">
              <input type="checkbox" name={`open-${d}`} defaultChecked={!!h} className="size-4 accent-brand" />
              Open
            </label>
            <div className="col-span-2 flex items-center gap-2 text-sm sm:col-span-1">
              <input type="time" name={`opens-${d}`} defaultValue={h?.opens ?? "09:00"} step={1800} aria-label={`${DAYS[d]} opens`} className="field min-h-10" />
              <span className="text-ink-subtle">to</span>
              <input type="time" name={`closes-${d}`} defaultValue={h?.closes ?? "17:00"} step={1800} aria-label={`${DAYS[d]} closes`} className="field min-h-10" />
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 border-t border-line-soft pt-4">
        <button type="submit" disabled={pending} className="btn btn-solid min-h-10 border-none px-5">
          {pending ? "Saving…" : "Save opening hours"}
        </button>
        {state.error && <span className="text-sm font-medium text-red-700">{state.error}</span>}
        {state.ok && <span className="text-sm font-medium text-brand">Saved ✓</span>}
      </div>
    </form>
  );
}
