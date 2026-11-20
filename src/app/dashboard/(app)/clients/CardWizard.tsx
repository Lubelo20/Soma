"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import type { ClientDetails } from "@/lib/clients";
import { CONNECTION_ERROR } from "@/lib/form-messages";
import {
  parseHealth,
  parseMassage,
  parseSkin,
  type HealthAnswers,
  type MassageAnswers,
  type SkinAnswers,
} from "@/lib/record-card";
import { saveSection } from "../../clients-actions";
import { DetailsForm, type DetailsHandle } from "./DetailsForm";
import { cardDrafts } from "./card-drafts";
import { LeavePrompt, useLeaveGuard } from "./LeaveGuard";
import { HealthForm, MassageForm, SkinForm, sectionFormData } from "./SectionForms";

const STEPS = ["details", "health", "massage", "skin"] as const;
export type Step = (typeof STEPS)[number];
type Section = Exclude<Step, "details">;
type Answers = { health: HealthAnswers; massage: MassageAnswers; skin: SkinAnswers };

const TITLES: Record<Step, string> = { details: "Details", health: "Health", massage: "Massage", skin: "Skin" };
const TOTAL_STEPS = 5; // the fifth is the consent screen
const SECTIONS: Section[] = ["health", "massage", "skin"];

const isStep = (s: string | null): s is Step => STEPS.includes(s as Step);

// Wide screens (the Tailwind lg breakpoint) show the whole card on one page.
const LG = "(min-width: 64rem)";
const subscribe = (onChange: () => void) => {
  const m = window.matchMedia(LG);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
};
const useWide = () => useSyncExternalStore(subscribe, () => window.matchMedia(LG).matches, () => false);

// Saved answers over a blank section, so a row added to the form later still has a value.
function initialAnswers(saved: { health: HealthAnswers | null; massage: MassageAnswers | null; skin: SkinAnswers | null }): Answers {
  const blank = new FormData();
  const health = parseHealth(blank);
  const skin = parseSkin(blank);
  for (const k of Object.keys(health) as (keyof HealthAnswers)[]) health[k] = { ...health[k], ...saved.health?.[k] };
  for (const k of Object.keys(skin) as (keyof SkinAnswers)[]) skin[k] = { ...skin[k], ...saved.skin?.[k] };
  return { health, skin, massage: { ...parseMassage(blank), ...saved.massage } };
}

const fingerprints = (a: Answers): Record<Section, string> => ({
  health: fingerprint("health", a),
  massage: fingerprint("massage", a),
  skin: fingerprint("skin", a),
});

const fingerprint = (section: Section, a: Answers) => JSON.stringify([...sectionFormData(section, a[section]).entries()]);

/**
 * Edits a record card. Below lg: one section per screen with Back and Next (Next saves first, Back doesn't) and
 * "Save and back to card"; the step is kept in ?step= so a reload stays put. From lg: every section on one page,
 * each with its own Save. All answers live here in React state, so moving between steps or a failed save never
 * loses them. Leaving by a link with anything unsaved shows an inline prompt; closing the tab asks first.
 * Nothing is kept in browser storage. The page wraps this in FreshOnOpen, so each visit starts from server data,
 * unless the editor was last left with unsaved edits by Back, a swipe or a history jump: those are kept in the
 * in-memory card draft (card-drafts.ts, keyed by this card's id) and the next visit starts from them, with a note.
 */
export function CardWizard({
  client,
  health,
  massage,
  skin,
  initialStep,
  heading,
}: {
  client: ClientDetails;
  health: HealthAnswers | null;
  massage: MassageAnswers | null;
  skin: SkinAnswers | null;
  initialStep: Step;
  heading: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("step");
  const step: Step = isStep(requested) ? requested : initialStep;
  const wide = useWide();

  // Unsaved edits left on this card earlier (only ever read under this card's own id).
  const [draft] = useState(() => cardDrafts.get(client.id));
  const [fromDraft, setFromDraft] = useState(draft !== undefined);
  // Whether the draft still holds unsaved client details (cleared when they save, or on Discard).
  const detailsInDraft = useSyncExternalStore(
    cardDrafts.subscribe,
    () => cardDrafts.get(client.id)?.details !== undefined,
    () => false,
  );
  const [answers, setAnswers] = useState<Answers>(() => {
    const server = initialAnswers({ health, massage, skin });
    return { health: draft?.health ?? server.health, massage: draft?.massage ?? server.massage, skin: draft?.skin ?? server.skin };
  });
  // Fingerprint of each section as last saved, and of the save that earned a "Saved" tick.
  const [saved, setSaved] = useState<Record<Section, string>>(() => fingerprints(initialAnswers({ health, massage, skin })));
  const [ticked, setTicked] = useState<Record<Section, string | null>>({ health: null, massage: null, skin: null });
  const [errors, setErrors] = useState<Record<Section, string | null>>({ health: null, massage: null, skin: null });
  const [pending, startTransition] = useTransition();
  // What the pending transition is doing, for the button that says "Saving…".
  const [doing, setDoing] = useState<Section | "next" | "ready" | "back" | "prompt" | null>(null);
  const details = useRef<DetailsHandle>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const busy = pending;

  const cardHref = `/dashboard/clients/${client.id}`;
  const signHref = `/dashboard/sign/${client.id}`;

  const dirtySections = SECTIONS.filter((s) => fingerprint(s, answers) !== saved[s]);
  const guard = useLeaveGuard(() => dirtySections.length > 0 || Boolean(details.current?.isDirty()));

  // While a save that leaves the page is in flight, nothing can be typed (it would be dropped once hidden).
  const locked = pending && (doing === "ready" || doing === "back" || doing === "prompt" || (doing === "next" && step === "skin"));

  // Next keeps this page mounted but hidden after leaving it. When hidden: messages and ticks go; after
  // "Discard changes", the answers go back to the newest saved ones, so Back doesn't bring discarded edits back;
  // otherwise any unsaved sections are kept in the card draft for the next time this card's editor opens.
  const discardOnHide = useRef(false);
  const latest = useRef({ server: { health, massage, skin }, answers, saved });
  useEffect(() => {
    latest.current = { server: { health, massage, skin }, answers, saved };
  }, [health, massage, skin, answers, saved]);
  useLayoutEffect(
    () => () => {
      setErrors({ health: null, massage: null, skin: null });
      setTicked({ health: null, massage: null, skin: null });
      setDetailsError(null);
      setDoing(null);
      if (discardOnHide.current) {
        discardOnHide.current = false;
        const fresh = initialAnswers(latest.current.server);
        setAnswers(fresh);
        setSaved(fingerprints(fresh));
        setFromDraft(false);
        cardDrafts.clear(client.id);
        return;
      }
      const { answers: now, saved: was } = latest.current;
      const changed = (s: Section) => fingerprint(s, now) !== was[s];
      cardDrafts.update(client.id, {
        health: changed("health") ? now.health : undefined,
        massage: changed("massage") ? now.massage : undefined,
        skin: changed("skin") ? now.skin : undefined,
      });
    },
    // Runs only when hidden or unmounted; client.id is fixed for the editor's life (FreshOnOpen keys it per visit).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /** The "changes from earlier" note's Discard: back to the saved answers now, and the draft is dropped. */
  function discardDraft() {
    cardDrafts.clear(client.id);
    const fresh = initialAnswers({ health, massage, skin });
    setAnswers(fresh);
    setSaved(fingerprints(fresh));
    setErrors({ health: null, massage: null, skin: null });
    setDetailsError(null);
    details.current?.resetNow();
    setFromDraft(false);
  }

  function update<S extends Section>(section: S, value: Answers[S]) {
    setAnswers((prev) => ({ ...prev, [section]: value }));
    setErrors((prev) => ({ ...prev, [section]: null }));
  }

  /** Saves one section; true when it was saved (or had nothing new to save). */
  async function save(section: Section): Promise<boolean> {
    const print = fingerprint(section, answers);
    const fd = sectionFormData(section, answers[section]);
    fd.set("clientId", client.id);
    setErrors((prev) => ({ ...prev, [section]: null }));
    try {
      const res = await saveSection(section, {}, fd);
      if (res.ok) {
        cardDrafts.update(client.id, { [section]: undefined });
        setSaved((prev) => ({ ...prev, [section]: print }));
        setTicked((prev) => ({ ...prev, [section]: print }));
        return true;
      }
      setErrors((prev) => ({ ...prev, [section]: res.error ?? CONNECTION_ERROR }));
    } catch {
      setErrors((prev) => ({ ...prev, [section]: CONNECTION_ERROR }));
    }
    return false;
  }

  /**
   * Saves every section with unsaved edits, details included. True only when all of them saved; otherwise each
   * failed section shows its error and everything typed stays in place.
   */
  async function saveAll(): Promise<boolean> {
    setDetailsError(null);
    let ok = true;
    const detailsFailed = details.current ? await details.current.saveIfChanged() : null;
    if (detailsFailed) {
      setDetailsError(detailsFailed);
      ok = false;
    }
    for (const s of SECTIONS) {
      if (fingerprint(s, answers) !== saved[s] && !(await save(s))) ok = false;
    }
    if (ok) cardDrafts.clear(client.id);
    return ok;
  }

  function goTo(next: Step) {
    window.history.pushState(null, "", `?step=${next}`);
    window.scrollTo(0, 0);
  }

  function next() {
    if (step === "details") return;
    setDoing("next");
    startTransition(async () => {
      if (!(await save(step))) return;
      const i = STEPS.indexOf(step);
      if (i === STEPS.length - 1) {
        // Inside the transition, so the buttons stay disabled until the signing screen is showing.
        startTransition(() => router.push(signHref));
      } else {
        goTo(STEPS[i + 1]);
      }
    });
  }

  function saveOne(section: Section) {
    setDoing(section);
    startTransition(async () => {
      await save(section);
    });
  }

  /** Saves everything unsaved, then goes to `href` only if every save worked. */
  function saveAndGo(href: string, what: "ready" | "back") {
    setDoing(what);
    startTransition(async () => {
      if (await saveAll()) startTransition(() => router.push(href));
    });
  }

  const forms: Record<Section, ReactNode> = {
    health: <HealthForm value={answers.health} onChange={(v) => update("health", v)} />,
    massage: <MassageForm value={answers.massage} onChange={(v) => update("massage", v)} />,
    skin: <SkinForm value={answers.skin} onChange={(v) => update("skin", v)} />,
  };
  const stepIndex = STEPS.indexOf(step);
  const allErrors = [
    ...(detailsError ? [`Client details: ${detailsError}`] : []),
    ...SECTIONS.filter((s) => errors[s] !== null).map((s) => `${TITLES[s]}: ${errors[s]}`),
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link href={cardHref} className="self-start text-sm text-gold-deep">
        ‹ Back to card
      </Link>
      {guard.target && (
        <LeavePrompt
          target={guard.target}
          backHref={cardHref}
          pending={pending && doing === "prompt"}
          startTransition={startTransition}
          onStart={() => setDoing("prompt")}
          onSave={saveAll}
          onDiscard={() => {
            discardOnHide.current = true;
            details.current?.discard();
            cardDrafts.clear(client.id);
          }}
          onClose={guard.close}
        />
      )}
      {heading}

      {fromDraft && (dirtySections.length > 0 || detailsInDraft) && (
        <div role="status" className="flex flex-col gap-3 rounded-[3px] border-4 border-amber-500 bg-amber-50 p-4 text-amber-950 sm:p-5">
          <p className="m-0 font-semibold">You have changes from earlier that aren&rsquo;t saved yet.</p>
          <p className="m-0 text-[15px]">Check them, then save as usual.</p>
          <button type="button" disabled={busy} onClick={discardDraft} className="btn btn-line min-h-12 px-5 sm:self-start">
            Discard changes
          </button>
        </div>
      )}

      <p className="m-0 text-sm font-medium text-ink-muted lg:hidden" aria-live="polite">
        Step {stepIndex + 1} of {TOTAL_STEPS} · {TITLES[step]}
      </p>

      <div inert={locked} className="flex flex-col gap-6">
      {STEPS.map((s) => (
        <section
          key={s}
          aria-labelledby={`section-${s}`}
          className={`card flex flex-col gap-5 p-4 sm:p-6 ${s === step ? "" : "hidden lg:flex"}`}
        >
          <h2 id={`section-${s}`} className="m-0 font-serif text-[28px] leading-tight font-light text-ink-strong">
            {s === "details" ? "Client details" : TITLES[s]}
          </h2>
          {s === "details" ? (
            <DetailsForm initial={client} onSaved={wide ? "stay" : "next"} handle={details} draftId={client.id} draft={draft?.details} />
          ) : (
            <>
              {forms[s]}
              <div className="hidden flex-wrap items-center gap-4 border-t border-line-soft pt-4 lg:flex">
                <button type="button" disabled={busy} onClick={() => saveOne(s)} className="btn btn-solid min-h-11 px-6">
                  {pending && doing === s ? "Saving…" : "Save"}
                </button>
                {ticked[s] !== null && ticked[s] === fingerprint(s, answers) && (
                  <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                    <Icon name="check" size={16} strokeWidth={2} />
                    Saved
                  </span>
                )}
                {errors[s] && (
                  <p role="alert" className="m-0 text-sm font-medium text-red-700">
                    {errors[s]}
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      ))}
      </div>

      {/* Wide screens: the end of the one-page card. */}
      <div className="hidden flex-col gap-3 lg:flex">
        <p className="m-0 text-sm text-ink-muted">Anything not saved yet, in any section, is saved first.</p>
        <button type="button" disabled={busy} onClick={() => saveAndGo(signHref, "ready")} className="btn btn-solid min-h-12 self-start px-6">
          {pending && doing === "ready" ? "Saving…" : "Ready for the client to sign"}
        </button>
        {allErrors.length > 0 && (
          <div role="alert" className="flex flex-col gap-1 text-sm font-medium text-red-700">
            <p className="m-0">Not saved yet. Nothing you typed has been lost.</p>
            {allErrors.map((e) => (
              <p key={e} className="m-0">
                {e}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Phones: Back, Next and "Save and back to card" stay in reach at the bottom of the screen. */}
      <div className="sticky bottom-0 z-10 -mx-5 flex flex-col gap-2 border-t border-line bg-cream/95 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {allErrors.length > 0 && (
          <div role="alert" className="flex flex-col gap-1 text-sm font-medium text-red-700">
            {allErrors.map((e) => (
              <p key={e} className="m-0">
                {e}
              </p>
            ))}
          </div>
        )}
        {step !== "details" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => goTo(STEPS[stepIndex - 1])}
              className="btn btn-line min-h-12 px-4"
            >
              Back
            </button>
            <button type="button" disabled={busy} onClick={next} className="btn btn-solid min-h-12 px-4">
              {pending && doing === "next" ? "Saving…" : step === "skin" ? "To consent" : "Next"}
            </button>
          </div>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => saveAndGo(cardHref, "back")}
          className="min-h-11 cursor-pointer text-sm font-medium text-gold-deep underline disabled:opacity-60"
        >
          {pending && doing === "back" ? "Saving…" : "Save and back to card"}
        </button>
      </div>
    </div>
  );
}
