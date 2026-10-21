import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/slots";
import { updateBooking } from "../actions";

export const metadata: Metadata = { title: "Bookings" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

type Booking = {
  id: string;
  ref: string;
  treatmentName: string;
  startsAt: Date;
  endsAt: Date;
  status: "pending" | "confirmed" | "declined" | "cancelled" | "completed";
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

const statusStyle: Record<Booking["status"], string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-mint text-brand-dark",
  completed: "bg-slate-100 text-slate-700",
  declined: "bg-red-50 text-red-800",
  cancelled: "bg-red-50 text-red-800",
};

const whatsappLink = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `27${digits.slice(1)}` : digits}`;
};

function ActionButton({ id, action, label, tone = "solid" }: { id: string; action: string; label: string; tone?: "solid" | "line" }) {
  return (
    <form action={updateBooking}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <button type="submit" className={`btn ${tone === "solid" ? "btn-solid" : "btn-line"} min-h-10 border-none px-5`}>
        {label}
      </button>
    </form>
  );
}

function ReasonAction({ id, action, label, help }: { id: string; action: string; label: string; help: string }) {
  return (
    <details className="group">
      <summary className="btn min-h-10 cursor-pointer list-none border-[1.5px] border-red-700 px-5 text-red-700 hover:bg-red-50">{label}</summary>
      <form action={updateBooking} className="mt-3 flex w-full max-w-md flex-col gap-2">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="action" value={action} />
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-body">
          Message to the client <span className="font-normal text-ink-subtle">({help})</span>
          <textarea name="reason" rows={2} maxLength={1000} className="field resize-y py-2" />
        </label>
        <button type="submit" className="btn min-h-10 self-start border-none bg-red-700 px-5 text-white hover:bg-red-800">
          {label} &amp; email client
        </button>
      </form>
    </details>
  );
}

export default async function BookingsPage(props: PageProps<"/dashboard">) {
  await requireStaff();
  const requested = (await props.searchParams).view;
  const view: View = typeof requested === "string" && requested in views ? (requested as View) : "pending";
  const bookings = await loadBookings(view);
  const now = new Date();

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="m-0 font-serif text-[34px] font-normal">Bookings</h1>
        <Link href="/book" target="_blank" className="text-sm font-semibold">
          + Add a booking (opens booking page)
        </Link>
      </div>

      <nav aria-label="Booking filters" className="flex flex-wrap gap-2">
        {(Object.keys(views) as View[]).map((v) => (
          <Link
            key={v}
            href={`/dashboard?view=${v}`}
            aria-current={v === view ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-semibold no-underline ${
              v === view ? "border-brand bg-brand text-white hover:text-white" : "border-line bg-white text-ink hover:border-brand"
            }`}
          >
            {views[v].label}
          </Link>
        ))}
      </nav>

      {bookings.length === 0 ? (
        <p className="rounded-[18px] border border-line bg-white p-8 text-ink-muted">
          {view === "pending" ? "No bookings waiting for confirmation. 🎉" : "No bookings here yet."}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {bookings.map((b) => (
            <li key={b.id} className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-bold text-ink-strong">{formatDateTime(b.startsAt)}</span>
                  <span className="text-[15px] text-ink-body">
                    {b.treatmentName} · {Math.round((b.endsAt.getTime() - b.startsAt.getTime()) / 60000)} min
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-subtle">{b.ref}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${statusStyle[b.status]}`}>{b.status}</span>
                </div>
              </div>

              <div className="grid gap-x-8 gap-y-2 text-[15px] sm:grid-cols-[auto_1fr]">
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

              {b.status === "pending" && (
                <div className="flex flex-wrap items-start gap-3 border-t border-line-soft pt-4">
                  <ActionButton id={b.id} action="confirm" label="Confirm & email client" />
                  <ReasonAction id={b.id} action="decline" label="Decline" help="optional, e.g. suggest another time" />
                </div>
              )}
              {b.status === "confirmed" && (
                <div className="flex flex-wrap items-start gap-3 border-t border-line-soft pt-4">
                  {b.startsAt <= now && <ActionButton id={b.id} action="complete" label="Mark completed" tone="line" />}
                  <ReasonAction id={b.id} action="cancel" label="Cancel booking" help="optional" />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
