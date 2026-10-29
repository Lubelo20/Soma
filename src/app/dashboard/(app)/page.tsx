import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/slots";
import { BookingActions, StatusPill, whatsappLink, type BookingStatus } from "./BookingActions";

export const metadata: Metadata = { title: "Bookings" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

type Booking = {
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
  staffNote: string;
  createdAt: Date;
};

const views = {
  pending: { label: "Needs confirming" },
  upcoming: { label: "Upcoming" },
  past: { label: "Past" },
  all: { label: "All" },
} as const;
type View = keyof typeof views;

async function loadBookings(view: View) {
  switch (view) {
    case "pending":
      return sql<Booking[]>`select * from bookings where status = 'pending' order by starts_at`;
    case "upcoming":
      return sql<Booking[]>`select * from bookings where status in ('pending', 'confirmed') and ends_at >= now() order by starts_at`;
    case "past":
      return sql<Booking[]>`select * from bookings where starts_at < now() order by starts_at desc limit 200`;
    case "all":
      return sql<Booking[]>`select * from bookings order by starts_at desc limit 500`;
  }
}

export default async function BookingsPage(props: PageProps<"/dashboard">) {
  await requireStaff();
  const requested = (await props.searchParams).view;
  const view: View = typeof requested === "string" && requested in views ? (requested as View) : "pending";
  const bookings = await loadBookings(view);

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="page-title">Bookings</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/dashboard/calendar" className="text-link">
            Calendar view
          </Link>
          <Link href="/book" target="_blank" className="text-link">
            Add a booking ↗
          </Link>
        </div>
      </div>

      <nav aria-label="Booking filters" className="flex flex-wrap gap-1 border-b border-line">
        {(Object.keys(views) as View[]).map((v) => (
          <Link key={v} href={`/dashboard?view=${v}`} aria-current={v === view ? "page" : undefined} className="tab-underline">
            {views[v].label}
          </Link>
        ))}
      </nav>

      {bookings.length === 0 ? (
        <p className="card m-0 text-ink-muted">{view === "pending" ? "No bookings waiting for confirmation." : "No bookings here yet."}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {bookings.map((b) => (
            <li key={b.id} className="card flex flex-col gap-4 max-sm:p-4 sm:gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-[21px] leading-tight text-ink-strong sm:text-[24px]">{formatDateTime(b.startsAt)}</span>
                  <span className="text-[15px] text-ink-body">
                    {b.treatmentName} · {Math.round((b.endsAt.getTime() - b.startsAt.getTime()) / 60000)} min
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs tracking-[.08em] text-ink-subtle">{b.ref}</span>
                  <StatusPill status={b.status} />
                </div>
              </div>

              {/* Labels sit beside their values even on phones, which keeps each card short. */}
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-line-soft pt-4 text-[15px] sm:gap-x-8">
                <span className="text-ink-subtle">Client</span>
                <span className="font-semibold text-ink-strong">{b.clientName}</span>
                <span className="text-ink-subtle">Phone</span>
                <span>
                  <a href={`tel:${b.clientPhone}`}>{b.clientPhone}</a> ·{" "}
                  <a href={whatsappLink(b.clientPhone)} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </span>
                <span className="text-ink-subtle">Email</span>
                <a href={`mailto:${b.clientEmail}`} className="break-all">
                  {b.clientEmail}
                </a>
                {b.notes && (
                  <>
                    <span className="text-ink-subtle">Client notes</span>
                    <span className="whitespace-pre-line">{b.notes}</span>
                  </>
                )}
                {b.staffNote && (
                  <>
                    <span className="text-ink-subtle">Message sent</span>
                    <span className="whitespace-pre-line">{b.staffNote}</span>
                  </>
                )}
                <span className="text-ink-subtle">Requested</span>
                <span className="text-ink-muted">{formatDateTime(b.createdAt)}</span>
              </div>

              {(b.status === "pending" || b.status === "confirmed") && (
                <div className="border-t border-line-soft pt-4">
                  <BookingActions id={b.id} status={b.status} startsAt={b.startsAt} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
