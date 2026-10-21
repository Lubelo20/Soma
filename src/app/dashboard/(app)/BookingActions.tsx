import { updateBooking } from "../actions";

export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";

export const statusStyle: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-mint text-brand-dark",
  completed: "bg-slate-100 text-slate-700",
  declined: "bg-red-50 text-red-800",
  cancelled: "bg-red-50 text-red-800",
};

export function StatusPill({ status }: { status: BookingStatus }) {
  return <span className={`pill ${statusStyle[status]}`}>{status}</span>;
}

export const whatsappLink = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `27${digits.slice(1)}` : digits}`;
};

function ActionButton({ id, action, label, tone = "solid" }: { id: string; action: string; label: string; tone?: "solid" | "line" }) {
  return (
    <form action={updateBooking}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <button type="submit" className={`btn ${tone === "solid" ? "btn-solid" : "btn-line"} min-h-10 px-5`}>
        {label}
      </button>
    </form>
  );
}

function ReasonAction({ id, action, label, help }: { id: string; action: string; label: string; help: string }) {
  return (
    <details className="group">
      <summary className="btn min-h-10 cursor-pointer list-none border border-red-700 px-5 text-red-700 hover:bg-red-50">{label}</summary>
      <form action={updateBooking} className="mt-3 flex w-full max-w-md flex-col gap-2">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="action" value={action} />
        <label className="label">
          <span>
            Message to the client <span className="hint">({help})</span>
          </span>
          <textarea name="reason" rows={2} maxLength={1000} className="field resize-y py-2" />
        </label>
        <button type="submit" className="btn min-h-10 self-start border-none bg-red-700 px-5 text-white hover:bg-red-800">
          {label} &amp; email client
        </button>
      </form>
    </details>
  );
}

/** Confirm / decline / cancel / complete buttons for one booking, depending on its status. */
export function BookingActions({ id, status, startsAt }: { id: string; status: BookingStatus; startsAt: Date }) {
  if (status === "pending") {
    return (
      <div className="flex flex-wrap items-start gap-3">
        <ActionButton id={id} action="confirm" label="Confirm & email client" />
        <ReasonAction id={id} action="decline" label="Decline" help="optional, e.g. suggest another time" />
      </div>
    );
  }
  if (status === "confirmed") {
    return (
      <div className="flex flex-wrap items-start gap-3">
        {startsAt <= new Date() && <ActionButton id={id} action="complete" label="Mark completed" tone="line" />}
        <ReasonAction id={id} action="cancel" label="Cancel booking" help="optional" />
      </div>
    );
  }
  return null;
}
