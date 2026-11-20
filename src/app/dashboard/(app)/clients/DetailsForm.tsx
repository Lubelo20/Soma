"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, useTransition, type Ref } from "react";
import { Icon } from "@/components/Icon";
import type { ClientDetails } from "@/lib/clients";
import { CONNECTION_ERROR } from "@/lib/form-messages";
import { isUnder18 } from "@/lib/record-card";
import { clinicDate } from "@/lib/slots";
import { saveDetails, type ClientResult } from "../../clients-actions";
import { useHydrated } from "../../useHydrated";
import { makeSectionDraft } from "@/lib/draft-merge";
import { cardDrafts } from "./card-drafts";
import { ChangedElsewhere } from "./SectionForms";
import { LeavePrompt, useLeaveGuard } from "./LeaveGuard";

export type Values = {
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

const DUPLICATE_ERROR = "A card with this phone or ID / passport number already exists. See the client details above.";

/**
 * Lets CardWizard save unsaved details before leaving the page. saveIfChanged resolves to an error message, or null
 * when saved; isDirty tells whether anything is unsaved; discard puts the saved values back once the page is left.
 */
export type DetailsHandle = {
  saveIfChanged: () => Promise<string | null>;
  isDirty: () => boolean;
  /** Puts the saved values back once the page is left (after "Discard changes" in the leave prompt). */
  discard: () => void;
  /** Undoes `discard` when the navigation it was chosen for didn't happen. */
  cancelDiscard: () => void;
  /** Puts the saved values back now (the "changes from earlier" note's Discard). */
  resetNow: () => void;
};

export const valuesFrom = (initial: Partial<ClientDetails>): Values => ({
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

/**
 * The client details section of a record card. Every value lives in React state, so a failed save
 * (signed out, offline, validation) never clears what was typed. Nothing is kept in browser storage.
 * After saving: "card" opens the card, "next" moves on to the health section, "stay" shows a Saved tick.
 * `handle` (optional) is for CardWizard, which then also guards leaving the page; without it (the new-card page)
 * this form guards leaving with unsaved edits itself.
 * Next keeps a left page mounted but hidden: once a save has moved on to another page, the form empties itself
 * when hidden, so Back never shows one client's details in a blank new card.
 * In CardWizard (`draftId` = the card's id), unsaved values are kept in the in-memory card draft when the form is
 * hidden (only the changed inputs), and `draft` (those earlier changes merged over the newest saved details) is
 * where it starts; `flagged` inputs were changed on another device too. The new-card page has no drafts.
 */
export function DetailsForm({
  initial,
  onSaved = "next",
  handle,
  draftId,
  draft,
  flagged: flaggedFromDraft = [],
}: {
  initial: Partial<ClientDetails>;
  onSaved?: "card" | "next" | "stay";
  handle?: Ref<DetailsHandle>;
  draftId?: string;
  draft?: Values;
  flagged?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();
  const [v, setV] = useState<Values>(() => draft ?? valuesFrom(initial));
  // The values as last saved (or as loaded), to tell whether anything is unsaved.
  const [savedValues, setSavedValues] = useState<Values>(() => valuesFrom(initial));
  const [result, setResult] = useState<ClientResult | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [tick, setTick] = useState(false);
  const [flagged, setFlagged] = useState<string[]>(flaggedFromDraft);
  const flag = (key: keyof Values) => <ChangedElsewhere show={flagged.includes(key)} />;
  const edits = useRef(0); // counts edits, so a save that finishes after more typing doesn't claim "Saved"
  // Set once a save has sent us to another page, or edits were discarded: the form resets when it is hidden.
  const resetOnHide = useRef(false);
  const latestInitial = useRef(initial);
  const latest = useRef({ v, savedValues });
  useEffect(() => {
    latestInitial.current = initial;
    latest.current = { v, savedValues };
  }, [initial, v, savedValues]);

  function resetToSaved() {
    const fresh = valuesFrom(latestInitial.current);
    setV(fresh);
    setSavedValues(fresh);
    setResult(null);
    setFailed(null);
    setTick(false);
    setFlagged([]);
  }

  useLayoutEffect(
    () => () => {
      if (resetOnHide.current) {
        resetOnHide.current = false;
        resetToSaved();
        if (draftId) cardDrafts.update(draftId, { details: undefined });
        return;
      }
      // Left with unsaved details (Back, a swipe): keep them for the next time this card's editor opens.
      if (draftId) {
        const { v: now, savedValues: was } = latest.current;
        const dirtyNow = JSON.stringify(now) !== JSON.stringify(was);
        // Only the inputs that differ from the newest saved details, with what those were.
        cardDrafts.update(draftId, { details: dirtyNow ? makeSectionDraft(now, valuesFrom(latestInitial.current)) : undefined });
      }
    },
    // Runs only when hidden or unmounted; the draft id is fixed for the form's life (FreshOnOpen keys the editor).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
      if (res.ok) {
        setSavedValues(sent);
        setFlagged([]);
        if (draftId) cardDrafts.update(draftId, { details: undefined });
      }
      return res;
    } catch {
      setFailed(CONNECTION_ERROR);
      return null;
    }
  }

  async function saveIfChanged() {
    if (!dirty) return null;
    const res = await save(false);
    if (res?.ok) return null;
    if (res?.error === "duplicate") return DUPLICATE_ERROR;
    return res?.error ?? CONNECTION_ERROR;
  }

  useImperativeHandle(handle, () => ({
    saveIfChanged,
    isDirty: () => dirty,
    discard: () => {
      resetOnHide.current = true;
    },
    cancelDiscard: () => {
      resetOnHide.current = false;
    },
    resetNow: resetToSaved,
  }));

  // The new-card page: hold links away while something typed isn't saved. (In CardWizard, the wizard does this.)
  const guard = useLeaveGuard(() => !handle && dirty);

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
          resetOnHide.current = true;
          const next = onSaved === "card" ? `/dashboard/clients/${res.id}` : `/dashboard/clients/${res.id}/edit?step=health`;
          // Inside the transition, so the button stays at "Saving…" until the next page is showing.
          startTransition(() => router.push(next));
        }
      }
    });
  }

  // Disabled until hydrated, so a tap before JavaScript has loaded can't submit the form natively.
  const busy = pending || !hydrated;
  // On the new-card page every save leaves the page, and the form is emptied once it's hidden: nothing can be
  // typed meanwhile, so nothing typed is dropped. (In CardWizard the wizard locks the form when it leaves.)
  const locked = pending && !handle;

  // New-card page: a reset is armed for a save-and-leave or a discard, and is only meant to happen if the page is
  // actually left. If the transition ends with this form still on screen (effects don't run while it's hidden), the
  // navigation didn't happen: disarm, so nothing is reset by a later, unrelated hide.
  useEffect(() => {
    if (!handle && !pending) resetOnHide.current = false;
  }, [pending, handle]);

  return (
    <form
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) submit(false);
      }}
      autoComplete="off"
      className="flex flex-col gap-5"
    >
      {guard.target && (
        <LeavePrompt
          target={guard.target}
          pending={pending}
          startTransition={startTransition}
          onSave={async () => {
            const ok = (await saveIfChanged()) === null;
            if (ok) resetOnHide.current = true;
            return ok;
          }}
          onDiscard={() => {
            resetOnHide.current = true;
          }}
          onClose={guard.close}
        />
      )}
      <div inert={locked} className="grid gap-5 sm:grid-cols-2">
        <label className="label sm:col-span-2">
          Full name
          {flag("fullName")}
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
          {flag("phone")}
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
          {flag("email")}
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
          ID / passport number
          {flag("idNumber")}
          <input
            name="idNumber"
            value={v.idNumber}
            onChange={(e) => set("idNumber", e.target.value)}
            required
            maxLength={30}
            autoComplete="off"
            className="field"
          />
        </label>
        <label className="label">
          Date of birth
          {flag("dateOfBirth")}
          <input
            name="dateOfBirth"
            type="date"
            value={v.dateOfBirth}
            onChange={(e) => set("dateOfBirth", e.target.value)}
            required
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
          Gender
          {flag("gender")}
          <input
            name="gender"
            list="gender-options"
            value={v.gender}
            onChange={(e) => set("gender", e.target.value)}
            required
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
          Occupation
          {flag("occupation")}
          <input
            name="occupation"
            value={v.occupation}
            onChange={(e) => set("occupation", e.target.value)}
            required
            maxLength={100}
            autoComplete="off"
            className="field"
          />
        </label>
        <label className="label sm:col-span-2">
          Address
          {flag("address")}
          <input
            name="address"
            value={v.address}
            onChange={(e) => set("address", e.target.value)}
            required
            maxLength={300}
            autoComplete="off"
            className="field"
          />
        </label>
        <label className="label sm:col-span-2">
          Emergency contact <span className="hint">(name and phone)</span>
          {flag("emergencyContact")}
          <input
            name="emergencyContact"
            value={v.emergencyContact}
            onChange={(e) => set("emergencyContact", e.target.value)}
            required
            maxLength={200}
            autoComplete="off"
            className="field"
          />
        </label>
        <label className="label">
          Initial appointment
          {flag("initialAppointment")}
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
          {flag("clientType")}
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
          <p className="m-0 font-medium">A card with this phone or ID / passport number already exists.</p>
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
          {pending ? "Saving…" : onSaved === "next" ? "Save and continue" : "Save"}
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
