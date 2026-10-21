import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { getWeeklyHours } from "@/lib/data";
import { sql } from "@/lib/db";
import { TIME_ZONE, clinicDate, clinicTime, formatDate, weekday } from "@/lib/slots";
import { BookingActions, StatusPill, statusStyle, whatsappLink, type BookingStatus } from "../BookingActions";

export const metadata: Metadata = { title: "Calendar" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

type Row = {
  id: string;
  ref: string;
  treatmentName: string;
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
};

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const clock = new Intl.DateTimeFormat("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIME_ZONE });

function shiftMonth(ym: string, by: number) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + by, 1)).toISOString().slice(0, 7);
}

function monthLabel(ym: string) {
  return new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));
}

export default async function CalendarPage(props: PageProps<"/dashboard/calendar">) {
  await requireStaff();
  const params = await props.searchParams;
  const today = clinicDate(new Date());
  const ym = typeof params.month === "string" && MONTH.test(params.month) ? params.month : today.slice(0, 7);

  const [y, m] = ym.split("-").map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dates = Array.from({ length: count }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`);
  const requestedDay = typeof params.day === "string" && DAY.test(params.day) && params.day.startsWith(ym) ? params.day : null;
  const selected = requestedDay ?? (today.startsWith(ym) ? today : null);

  const [weekly, bookings, closures] = await Promise.all([
    getWeeklyHours(),
    sql<Row[]>`
      select id, ref, treatment_name, starts_at, ends_at, status, client_name, client_phone, client_email, notes
      from bookings
      where starts_at >= ${clinicTime(dates[0], "00:00")} and starts_at < ${clinicTime(`${shiftMonth(ym, 1)}-01`, "00:00")}
        and status in ('pending', 'confirmed', 'completed')
      order by starts_at`,
    sql<{ day: string; note: string }[]>`
      select to_char(day, 'YYYY-MM-DD') as day, note from closures where day between ${dates[0]}::date and ${dates[count - 1]}::date`,
  ]);

  const byDay = new Map<string, Row[]>();
  for (const b of bookings) {
    const d = clinicDate(b.startsAt);
    byDay.set(d, [...(byDay.get(d) ?? []), b]);
  }
  const closure = new Map(closures.map((c) => [c.day, c.note]));
  const isClosed = (d: string) => closure.has(d) || !weekly[weekday(d)];

  // Monday-first grid, padded to whole weeks.
  const lead = (weekday(dates[0]) + 6) % 7;
  const cells: (string | null)[] = [...Array<null>(lead).fill(null), ...dates];
  while (cells.length % 7) cells.push(null);

  const dayBookings = selected ? (byDay.get(selected) ?? []) : [];
  const pendingThisMonth = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Calendar</h1>
          <p className="m-0 text-sm text-ink-muted">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"} in {monthLabel(ym)}
            {pendingThisMonth > 0 && (
              <>
                {" "}
                · <span className="text-amber-800">{pendingThisMonth} waiting for confirmation</span>
              </>
            )}
          </p>
        </div>
        <nav aria-label="Month" className="flex items-center gap-1">
          <Link href={`/dashboard/calendar?month=${shiftMonth(ym, -1)}`} aria-label="Previous month" className="tab">
            ←
          </Link>
          <span className="min-w-[160px] text-center font-serif text-[22px] text-ink-strong">{monthLabel(ym)}</span>
          <Link href={`/dashboard/calendar?month=${shiftMonth(ym, 1)}`} aria-label="Next month" className="tab">
            →
          </Link>
          <Link href="/dashboard/calendar" className="tab ml-2">
            Today
          </Link>
        </nav>
      </div>

      <div className="grid items-start gap-8 xl:grid-cols-[1fr_360px]">
        <div className="card p-0">
          <div className="grid grid-cols-7 border-b border-line">
            {DOW.map((d) => (
              <span key={d} className="px-2 py-3 text-center text-[10.5px] font-medium tracking-[.22em] text-ink-subtle uppercase">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              if (!d) return <span key={`blank-${i}`} className="min-h-20 border-r border-b border-line-soft bg-cream/60 last:border-r-0 md:min-h-28" />;
              const items = byDay.get(d) ?? [];
              const closed = isClosed(d);
              const isToday = d === today;
              const isSelected = d === selected;
              return (
                <Link
                  key={d}
                  href={`/dashboard/calendar?month=${ym}&day=${d}`}
                  aria-current={isSelected ? "date" : undefined}
                  className={`flex min-h-20 flex-col gap-1 border-r border-b border-line-soft p-1.5 no-underline transition-colors md:min-h-28 md:p-2 ${
                    isSelected ? "bg-mint" : closed ? "bg-cream/80 hover:bg-mint-soft" : "bg-white hover:bg-mint-soft"
                  } ${(i + 1) % 7 === 0 ? "border-r-0" : ""}`}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span
                      className={`flex size-7 items-center justify-center rounded-full text-[13px] ${
                        isToday ? "bg-brand font-semibold text-white" : closed ? "text-ink-subtle" : "text-ink-strong"
                      }`}
                    >
                      {Number(d.slice(-2))}
                    </span>
                    {closed && <span className="hidden text-[9.5px] tracking-[.16em] text-ink-subtle uppercase md:inline">Closed</span>}
                    {items.length > 0 && (
                      <span className="rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white md:hidden">{items.length}</span>
                    )}
                  </span>
                  <span className="hidden flex-col gap-1 md:flex">
                    {items.slice(0, 3).map((b) => (
                      <span key={b.id} className={`truncate px-1.5 py-0.5 text-[11px] leading-snug ${statusStyle[b.status]}`}>
                        <span className="font-semibold">{clock.format(b.startsAt)}</span> {b.clientName.split(" ")[0]}
                      </span>
                    ))}
                    {items.length > 3 && <span className="px-1.5 text-[11px] text-ink-subtle">+{items.length - 3} more</span>}
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-[11px] tracking-[.08em] text-ink-subtle">
            <span className="flex items-center gap-2">
              <span className="size-3 bg-amber-100" /> Needs confirming
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 bg-mint" /> Confirmed
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 bg-slate-100" /> Completed
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 border border-line bg-cream" /> Closed
            </span>
          </div>
        </div>

        <aside className="card flex flex-col gap-5">
          {selected ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="eyebrow">{selected === today ? "Today" : "Selected day"}</span>
                <h2 className="m-0 font-serif text-[26px] leading-tight font-light text-ink-strong">{formatDate(selected)}</h2>
                {closure.has(selected) ? (
                  <span className="text-sm text-ink-muted">Closed{closure.get(selected) ? ` · ${closure.get(selected)}` : ""}</span>
                ) : !weekly[weekday(selected)] ? (
                  <span className="text-sm text-ink-muted">Closed on this day of the week</span>
                ) : (
                  <span className="text-sm text-ink-muted">
                    Open {weekly[weekday(selected)]!.opens}–{weekly[weekday(selected)]!.closes}
                  </span>
                )}
              </div>
              {dayBookings.length === 0 ? (
                <p className="m-0 text-sm text-ink-muted">No bookings on this day.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
                  {dayBookings.map((b) => (
                    <li key={b.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-serif text-[22px] leading-tight text-ink-strong">
                            {clock.format(b.startsAt)}–{clock.format(b.endsAt)}
                          </span>
                          <span className="text-sm text-ink-body">{b.treatmentName}</span>
                        </div>
                        <StatusPill status={b.status} />
                      </div>
                      <div className="flex flex-col gap-0.5 text-sm">
                        <span className="font-semibold text-ink-strong">{b.clientName}</span>
                        <span>
                          <a href={`tel:${b.clientPhone}`}>{b.clientPhone}</a> ·{" "}
                          <a href={whatsappLink(b.clientPhone)} target="_blank" rel="noopener noreferrer">
                            WhatsApp
                          </a>
                        </span>
                        <a href={`mailto:${b.clientEmail}`} className="break-all text-ink-muted">
                          {b.clientEmail}
                        </a>
                        {b.notes && <span className="pt-1 whitespace-pre-line text-ink-muted">{b.notes}</span>}
                        <span className="pt-1 text-xs text-ink-subtle">{b.ref}</span>
                      </div>
                      <BookingActions id={b.id} status={b.status} startsAt={b.startsAt} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="m-0 text-sm text-ink-muted">Choose a day to see its bookings.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
