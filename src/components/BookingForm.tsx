"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { createBooking, getSlots, type BookingState } from "@/app/actions";
import { business } from "@/lib/site";
import { formatDate } from "@/lib/slots";

export type BookableTreatment = { id: number; name: string; category: "wellness" | "skincare"; durationMin: number; price: string };

const initial: BookingState = { status: "idle" };
const labelClass = "flex flex-col gap-1.5 text-[13px] font-semibold text-ink-body";
const DATES_PER_PAGE = 14;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
      <legend className="mb-4 flex items-center gap-3 p-0 font-serif text-[22px] text-ink-strong">
        <span className="flex size-8 items-center justify-center rounded-full bg-brand font-sans text-sm font-bold text-white">{n}</span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function BookingForm({
  treatments,
  dates,
  initialTreatmentId,
}: {
  treatments: BookableTreatment[];
  dates: string[];
  initialTreatmentId?: number;
}) {
  const [treatmentId, setTreatmentId] = useState<number | null>(initialTreatmentId ?? null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [datePage, setDatePage] = useState(0);
  // Controlled so the details survive React's form reset after a rejected submit.
  const [details, setDetails] = useState({ name: "", phone: "", email: "", notes: "" });
  const bind = (key: keyof typeof details) => ({
    name: key,
    value: details[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDetails((d) => ({ ...d, [key]: e.target.value })),
  });
  const [loadingSlots, startLoading] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  const treatment = treatments.find((t) => t.id === treatmentId);

  function loadSlots(tId: number, d: string) {
    startLoading(async () => setSlots(await getSlots(tId, d)));
  }

  const [state, action, pending] = useActionState(async (prev: BookingState, fd: FormData) => {
    const result = await createBooking(prev, fd);
    // The chosen time was taken by someone else: refresh the list so they can pick again.
    if (result.errors?.slot && treatmentId && date) {
      setTime(null);
      setSlots(await getSlots(treatmentId, date));
    }
    if (result.status === "success") topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    return result;
  }, initial);

  if (state.status === "success" && state.booking) {
    const b = state.booking;
    return (
      <div ref={topRef} className="flex scroll-mt-28 flex-col items-start gap-4 rounded-[18px] border border-line bg-white p-8">
        <span className="eyebrow">REQUEST RECEIVED · {b.ref}</span>
        <h2 className="m-0 font-serif text-[32px] font-normal">Thank you! We&rsquo;ll confirm shortly</h2>
        <p className="m-0 text-base leading-relaxed text-ink-muted">
          You&rsquo;ve requested <strong className="text-ink-strong">{b.treatmentName}</strong> on{" "}
          <strong className="text-ink-strong">{b.when}</strong>. This time is held for you, but your booking is{" "}
          <strong className="text-ink-strong">not confirmed yet</strong>. We&rsquo;ll email {b.email} as soon as it is.
        </p>
        <a className="btn btn-line" href={business.whatsapp}>
          Questions? WhatsApp us
        </a>
      </div>
    );
  }

  const groups = [
    { label: "Wellness & massage", items: treatments.filter((t) => t.category === "wellness") },
    { label: "Skincare & aesthetics", items: treatments.filter((t) => t.category === "skincare") },
  ];
  const visibleDates = dates.slice(datePage * DATES_PER_PAGE, (datePage + 1) * DATES_PER_PAGE);
  const err = state.errors ?? {};

  return (
    <div ref={topRef} className="scroll-mt-28">
      <form action={action} noValidate className="flex scroll-mt-28 flex-col gap-10 rounded-[18px] border border-line bg-white p-6 sm:p-8">
        <input type="hidden" name="treatmentId" value={treatmentId ?? ""} />
        <input type="hidden" name="date" value={date ?? ""} />
        <input type="hidden" name="time" value={time ?? ""} />
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        <Step n={1} title="Choose a treatment">
          <label className={labelClass}>
            Treatment
            <select
              className="field"
              value={treatmentId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value) || null;
                setTreatmentId(id);
                setTime(null);
                if (id && date) loadSlots(id, date);
              }}
            >
              <option value="" disabled>
                Select a treatment…
              </option>
              {groups.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.durationMin} min · {t.price}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </Step>

        <Step n={2} title="Pick a date">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
            {visibleDates.map((d) => {
              const selected = d === date;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!treatmentId}
                  aria-pressed={selected}
                  onClick={() => {
                    setDate(d);
                    setTime(null);
                    if (treatmentId) loadSlots(treatmentId, d);
                  }}
                  className={`flex cursor-pointer flex-col items-center rounded-xl border px-2 py-2.5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"
                  }`}
                >
                  <span className="text-[11px] font-semibold tracking-wider uppercase">{formatDate(d, { weekday: "short" })}</span>
                  <span className="text-xl font-semibold">{formatDate(d, { day: "numeric" })}</span>
                  <span className="text-[11px]">{formatDate(d, { month: "short" })}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <button
              type="button"
              className="cursor-pointer text-brand disabled:invisible"
              disabled={datePage === 0}
              onClick={() => setDatePage((p) => p - 1)}
            >
              ← Earlier dates
            </button>
            <button
              type="button"
              className="cursor-pointer text-brand disabled:invisible"
              disabled={(datePage + 1) * DATES_PER_PAGE >= dates.length}
              onClick={() => setDatePage((p) => p + 1)}
            >
              Later dates →
            </button>
          </div>
          {!treatmentId && <p className="m-0 text-sm text-ink-subtle">Choose a treatment first.</p>}
        </Step>

        <Step n={3} title="Pick a time">
          {!date || !treatment ? (
            <p className="m-0 text-sm text-ink-subtle">Choose a treatment and date to see available times.</p>
          ) : loadingSlots ? (
            <p className="m-0 text-sm text-ink-subtle">Checking availability…</p>
          ) : slots && slots.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={s === time}
                  onClick={() => setTime(s)}
                  className={`cursor-pointer rounded-xl border py-2.5 text-[15px] font-semibold transition-colors ${
                    s === time ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm text-ink-subtle">No times left on {formatDate(date)}. Please try another date.</p>
          )}
          {err.slot && <p className="m-0 text-sm font-medium text-red-700">{err.slot}</p>}
        </Step>

        <Step n={4} title="Your details">
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
            <label className={labelClass}>
              Full name
              <input type="text" {...bind("name")} autoComplete="name" className="field" aria-invalid={!!err.name} />
              {err.name && <span className="text-xs font-medium text-red-700">{err.name}</span>}
            </label>
            <label className={labelClass}>
              Phone / WhatsApp
              <input type="tel" {...bind("phone")} autoComplete="tel" className="field" aria-invalid={!!err.phone} />
              {err.phone && <span className="text-xs font-medium text-red-700">{err.phone}</span>}
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              <span>
                Email <span className="font-normal text-ink-subtle">(we&rsquo;ll send your confirmation here)</span>
              </span>
              <input type="email" {...bind("email")} autoComplete="email" className="field" aria-invalid={!!err.email} />
              {err.email && <span className="text-xs font-medium text-red-700">{err.email}</span>}
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              <span>
                Anything we should know?{" "}
                <span className="font-normal text-ink-subtle">(optional: pregnancy, injuries, allergies, skin concerns)</span>
              </span>
              <textarea {...bind("notes")} rows={3} maxLength={1000} className="field resize-y py-3" />
            </label>
          </div>
        </Step>

        {treatment && date && time && (
          <div className="rounded-[14px] bg-mint-soft px-5 py-4 text-[15px] text-ink-body">
            <strong className="text-ink-strong">{treatment.name}</strong> ({treatment.durationMin} min) on{" "}
            <strong className="text-ink-strong">
              {formatDate(date)} at {time}
            </strong>
          </div>
        )}
        {state.message && <p className="m-0 text-sm font-medium text-red-700">{state.message}</p>}
        <div className="flex flex-col gap-3">
          <button type="submit" disabled={pending || !time} className="btn btn-solid border-none">
            {pending ? "Sending request…" : "Request booking"}
          </button>
          <p className="m-0 text-center text-[13px] text-ink-subtle">Your booking is confirmed once the clinic replies by email.</p>
        </div>
      </form>
    </div>
  );
}
