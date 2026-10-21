import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { getClosures, getWeeklyHours } from "@/lib/data";
import { formatDate } from "@/lib/slots";
import { addClosure, removeClosure } from "../../actions";
import { HoursForm } from "./HoursForm";

export const metadata: Metadata = { title: "Opening hours" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

export default async function HoursPage() {
  await requireStaff();
  const [weekly, closures] = await Promise.all([getWeeklyHours(), getClosures()]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="m-0 font-serif text-[34px] font-normal">Opening hours</h1>
      <p className="m-0 text-[15px] leading-relaxed text-ink-muted">
        Clients can only book times within these hours. Changing them doesn&rsquo;t affect bookings already made.
      </p>
      <HoursForm weekly={weekly} />

      <h2 className="m-0 mt-4 font-serif text-[26px] font-normal">Closed days</h2>
      <p className="m-0 text-[15px] leading-relaxed text-ink-muted">
        Public holidays, training days or leave. No bookings can be made on these dates. Check the bookings list for anything already booked that day.
      </p>
      <form action={addClosure} className="flex flex-wrap items-end gap-3 rounded-[18px] border border-line bg-white p-6">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-body">
          Date
          <input type="date" name="day" required className="field min-h-10" />
        </label>
        <label className="flex min-w-[200px] flex-1 flex-col gap-1.5 text-[13px] font-semibold text-ink-body">
          <span>
            Note <span className="font-normal text-ink-subtle">(optional)</span>
          </span>
          <input name="note" maxLength={120} placeholder="e.g. Public holiday" className="field min-h-10" />
        </label>
        <button type="submit" className="btn btn-solid min-h-10 border-none px-5">
          Add closed day
        </button>
      </form>
      {closures.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {closures.map((c) => (
            <li key={c.day} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white px-5 py-3">
              <span>
                <strong className="text-ink-strong">{formatDate(c.day)}</strong>
                {c.note && <span className="text-ink-muted"> · {c.note}</span>}
              </span>
              <form action={removeClosure}>
                <input type="hidden" name="day" value={c.day} />
                <button type="submit" className="cursor-pointer text-sm font-semibold text-red-700">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
