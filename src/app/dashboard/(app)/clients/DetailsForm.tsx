"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useImperativeHandle, useRef, useState, useTransition, type Ref } from "react";
import { Icon } from "@/components/Icon";
import type { ClientDetails } from "@/lib/clients";
import { isUnder18 } from "@/lib/record-card";
import { clinicDate } from "@/lib/slots";
import { saveDetails, type ClientResult } from "../../clients-actions";

type Values = {
  fullName: string;
  phone: string;
  email: string;
  idNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  occupation: string;
  initialAppointment: string;
  clientType: "first" | "returning";
};

const CONNECTION_ERROR = "Couldn't save. Check your connection and try again.";
const DUPLICATE_ERROR = "A card with this phone or ID number already exists. See the client details above.";

/** Lets CardWizard save unsaved details before leaving the page. Resolves to an error message, or null when saved. */
export type DetailsHandle = { saveIfChanged: () => Promise<string | null> };

/**
 * The client details section of a record card. Every value lives in React state, so a failed save
 * (signed out, offline, validation) never clears what was typed. Nothing is kept in browser storage.
 * After saving: "card" opens the card, "next" moves on to the health section, "stay" shows a Saved tick.
 * `handle` (optional) exposes saveIfChanged, which saves only when something was edited since the last save.
 */
export function DetailsForm({
  initial,
  onSaved = "next",
  handle,
}: {
  initial: Partial<ClientDetails>;
  onSaved?: "card" | "next" | "stay";
  handle?: Ref<DetailsHandle>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [v, setV] = useState<Values>({
    fullName: initial.fullName ?? "",
    phone: initial.phone ?? "",
    email: initial.email ?? "",
    idNumber: initial.idNumber ?? "",
    dateOfBirth: initial.dateOfBirth ?? "",
    gender: initial.gender ?? "",
    address: initial.address ?? "",
    emergencyContact: initial.emergencyContact ?? "",
    occupation: initial.occupation ?? "",
    initialAppointment: initial.initialAppointment ?? clinicDate(new Date()),
    clientType: initial.clientType ?? "first",
  });
  // The values as last saved (or as loaded), to tell whether anything is unsaved.
  const [savedValues, setSavedValues] = useState<Values>(v);
  const [result, setResult] = useState<ClientResult | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tick, setTick] = useState(false);
  const edits = useRef(0); // counts edits, so a save that finishes after more typing doesn't claim "Saved"

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    edits.current += 1;
    setTick(false);
    setV((prev) => ({ ...prev, [key]: value }));
  };
  const under18 = isUnder18(v.dateOfBirth, clinicDate(new Date()));
  const duplicates = result?.error === "duplicate" ? (result.duplicates ?? []) : [];
  const message = failed ?? (result?.error && result.error !== "duplicate" ? result.error : null);

  const dirty = JSON.stringify(v) !== JSON.stringify(savedValues);

  /** Sends the details; the result, or null when the request itself failed (offline). Never clears the form. */
  async function save(differentPerson: boolean): Promise<ClientResult | null> {
    const sent = v;
    const fd = new FormData();
    if (initial.id) fd.set("id", initial.id);
    for (const [k, val] of Object.entries(sent)) fd.set(k, val);
    if (differentPerson) fd.set("differentPerson", "on");
    setFailed(null);
    try {
      const res = await saveDetails({}, fd);
      setResult(res);
      if (res.ok) setSavedValues(sent);
      return res;
    } catch {
      setFailed(CONNECTION_ERROR);
      return null;
    }
  }

  useImperativeHandle(handle, () => ({
    async saveIfChanged() {
      if (!dirty) return null;
      const res = await save(false);
      if (res?.ok) return null;
      if (res?.error === "duplicate") return DUPLICATE_ERROR;
      return res?.error ?? CONNECTION_ERROR;
    },
  }));

  function submit(differentPerson: boolean) {
    const editsAtSubmit = edits.current;
    startTransition(async () => {
      const res = await save(differentPerson);
      if (res?.ok && res.id) {
        if (onSaved === "stay") {
          setTick(edits.current === editsAtSubmit);
        } else if (onSaved === "next" && pathname === `/dashboard/clients/${res.id}/edit`) {
          // Already inside the card's step-by-step editor: change step in place so unsaved answers in the
          // other sections are kept.
          window.history.pushState(null, "", "?step=health");
          window.scrollTo(0, 0);
        } else {
          setSaved(true);
          router.push(onSaved === "card" ? `/dashboard/clients/${res.id}` : `/dashboard/clients/${res.id}/edit?step=health`);
        }
      }
    });
  }

  const busy = pending || saved;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) submit(false);
      }}
      autoComplete="off"
      className="flex flex-col gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="label sm:col-span-2">
          Full name
          <input
            name="fullName"
            value={v.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            required
            minLength={2}
            maxLength={120}
            autoComplete="off"
            className="field"
          />
        </label>
        <label className="label">
          Phone
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            value={v.phone}
            onChange={(e) => set("phone", e.target.value)}
            required
            maxLength={30}
            autoComplete="off"
            className="field"
          />
        </label>
        <label className="label">
          Email <span className="hint">(optional)</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            value={v.email}
            onChange={(e) => set("email", e.target.value)}
            maxLength={200}
            autoComplete="off"
            autoCapitalize="none"
            className="field"
          />
        </label>
        <label className="label">
          ID number <span className="hint">(optional)</span>
          <input
            name="idNumber"
            inputMode="numeric"
            value={v.idNumber}
            onChange={(e) => set("idNumber", e.target.value)}
            maxLength={30}
            autoComplete="off"
            className="field"
          />
        </label>
        <label className="label">
          Date of birth <span className="hint">(optional)</span>
          <input
            name="dateOfBirth"
            type="date"
            value={v.dateOfBirth}
            onChange={(e) => set("dateOfBirth", e.target.value)}
            max={clinicDate(new Date())}
            autoComplete="off"
            className="field"
          />
        </label>
        {under18 && (
          <p role="status" className="note sm:col-span-2">
            The clinic doesn&apos;t treat clients under 18.
          </p>
        )}
        <label className="label">
          Gender <span className="hint">(optional)</span>
          <input
            name="gender"
            list="gender-options"
            value={v.gender}
            onChange={(e) => set("gender", e.target.value)}
            maxLength={30}
            autoComplete="off"
            className="field"
          />
          <datalist id="gender-options">
            <option value="Female" />
            <option value="Male" />
            <option value="Other" />
          </datalist>
        </label>
        <label className="label">
          Occupation <span className="hint">(optional)</span>
          <input
            name="occupation"
            value={v.occupation}
            onChange={(e) => set("occupation", e.target.value)}
            maxLength={100}
            autoComplete="off"
            className="field"
          />
        </label>
        <label className="label sm:col-span-2">
          Address <span className="hint">(optional)</span>
          <input
            name="address"
            value={v.address}
            onChange={(e) => set("address", e.target.value)}
            maxLength={300}
            autoComplete="off"
            className="field"
          />
        </label>
        <label className="label sm:col-span-2">
          Emergency contact <span className="hint">(name and phone, optional)</span>
          <input
            name="emergencyContact"
            value={v.emergencyContact}
            onChange={(e) => set("emergencyContact", e.target.value)}
            maxLength={200}
            autoComplete="off"
            className="field"
          />
        </label>
        <label className="label">
          Initial appointment
          <input
            name="initialAppointment"
            type="date"
            value={v.initialAppointment}
            onChange={(e) => set("initialAppointment", e.target.value)}
            required
            autoComplete="off"
            className="field"
          />
        </label>
        <label className="label">
          Client
          <select
            name="clientType"
            value={v.clientType}
            onChange={(e) => set("clientType", e.target.value === "returning" ? "returning" : "first")}
            className="field"
          >
            <option value="first">First-time client</option>
            <option value="returning">Returning client</option>
          </select>
        </label>
      </div>

      {duplicates.length > 0 && (
        <div role="alert" className="note flex flex-col gap-3">
          <p className="m-0 font-medium">A card with this phone or ID number already exists.</p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {duplicates.map((d) => (
              <li key={d.id}>
                {d.fullName}{" "}
                <Link href={`/dashboard/clients/${d.id}`} className="font-medium underline">
                  Open this card
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" disabled={busy} onClick={() => submit(true)} className="btn btn-line min-h-11 px-5 sm:self-start">
            This is a different person
          </button>
        </div>
      )}

      {message && (
        <p role="alert" className="m-0 text-sm font-medium text-red-700">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className="btn btn-solid min-h-12 px-6 max-sm:w-full">
          {busy ? "Saving…" : onSaved === "next" ? "Save and continue" : "Save"}
        </button>
        {tick && !busy && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <Icon name="check" size={16} strokeWidth={2} />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
