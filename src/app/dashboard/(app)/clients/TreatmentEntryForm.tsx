"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { MatchedBooking, TreatmentEntry } from "@/lib/clients";
import { clinicDate, formatDate } from "@/lib/slots";
import { saveEntry } from "../../clients-actions";

const CONNECTION_ERROR = "Couldn't save. Check your connection and try again.";

type Therapist = { id: number; name: string };

/**
 * Adds a treatment log entry, or edits one when `entry` is given. Values live in React state, so a failed
 * save (signed out, offline, validation) never clears what was typed. A new entry clears after it saves.
 */
export function TreatmentEntryForm({
  clientId,
  therapists,
  bookings,
  entry,
  today,
}: {
  clientId: string;
  therapists: Therapist[];
  bookings: MatchedBooking[];
  entry?: TreatmentEntry;
  today: string;
}) {
  const blank = { day: today, kind: "" as "" | "skin" | "massage", products: "", notes: "", therapistId: "", bookingId: "" };
  const [v, setV] = useState({
    day: entry?.day ?? blank.day,
    kind: (entry?.kind ?? blank.kind) as "" | "skin" | "massage",
    products: entry?.products ?? "",
    notes: entry?.notes ?? "",
    therapistId: entry?.therapistId ? String(entry.therapistId) : "",
    bookingId: entry?.bookingId ?? "",
  });
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => {
    setSaved(false);
    setV((prev) => ({ ...prev, [key]: value }));
  };

  // A therapist who has since been removed stays selectable on the entry they were saved against.
  const options =
    entry?.therapistId && !therapists.some((t) => t.id === entry.therapistId)
      ? [...therapists, { id: entry.therapistId, name: entry.therapistName ?? "Removed therapist" }]
      : therapists;
  // The linked booking may no longer match (phone changed); keep it visible rather than silently dropping it.
  const showMissingBooking = entry?.bookingId && !bookings.some((b) => b.id === entry.bookingId);

  function submit() {
    const sent = v;
    const fd = new FormData();
    fd.set("clientId", clientId);
    if (entry) fd.set("id", String(entry.id));
    for (const [k, val] of Object.entries(sent)) fd.set(k, val);
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await saveEntry({}, fd);
        if (res.ok) {
          setSaved(true);
          if (!entry) setV({ ...blank });
        } else {
          setMessage(res.error ?? CONNECTION_ERROR);
        }
      } catch {
        setMessage(CONNECTION_ERROR);
      }
    });
  }

  const id = (name: string) => `entry-${entry?.id ?? "new"}-${name}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!pending) submit();
      }}
      autoComplete="off"
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label" htmlFor={id("day")}>
          Date
          <input
            id={id("day")}
            type="date"
            value={v.day}
            max={today}
            min="2000-01-01"
            onChange={(e) => set("day", e.target.value)}
            required
            className="field"
          />
        </label>
        <label className="label" htmlFor={id("kind")}>
          Treatment type
          <select id={id("kind")} value={v.kind} onChange={(e) => set("kind", e.target.value === "skin" ? "skin" : e.target.value === "massage" ? "massage" : "")} required className="field">
            <option value="">Choose…</option>
            <option value="skin">Skin</option>
            <option value="massage">Massage</option>
          </select>
        </label>
      </div>
      <label className="label" htmlFor={id("products")}>
        Products/tools used
        <textarea id={id("products")} value={v.products} onChange={(e) => set("products", e.target.value)} rows={2} maxLength={1000} className="field resize-y py-2" />
      </label>
      <label className="label" htmlFor={id("notes")}>
        Notes &amp; skin response
        <textarea id={id("notes")} value={v.notes} onChange={(e) => set("notes", e.target.value)} rows={3} maxLength={2000} className="field resize-y py-2" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label" htmlFor={id("therapist")}>
          Therapist
          <select id={id("therapist")} value={v.therapistId} onChange={(e) => set("therapistId", e.target.value)} className="field">
            <option value="">Not set</option>
            {options.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {therapists.length === 0 && (
            <span className="hint">
              <Link href="/dashboard/clients/therapists" className="underline">
                Add therapist names first
              </Link>
            </span>
          )}
        </label>
        <label className="label" htmlFor={id("booking")}>
          Linked booking (optional)
          <select id={id("booking")} value={v.bookingId} onChange={(e) => set("bookingId", e.target.value)} className="field">
            <option value="">None</option>
            {showMissingBooking && <option value={entry.bookingId ?? ""}>Currently linked booking</option>}
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {formatDate(clinicDate(b.startsAt), { day: "numeric", month: "short", year: "numeric" })} · {b.treatmentName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message && (
        <p role="alert" className="m-0 text-sm font-medium text-red-700">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-solid min-h-12 px-6 max-sm:w-full">
          {pending ? "Saving…" : entry ? "Save changes" : "Add entry"}
        </button>
        {saved && !pending && (
          <span role="status" className="text-sm font-medium text-brand">
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
