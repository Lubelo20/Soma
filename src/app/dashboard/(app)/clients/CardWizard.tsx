"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import type { ClientDetails } from "@/lib/clients";
import {
  parseHealth,
  parseMassage,
  parseSkin,
  type HealthAnswers,
  type MassageAnswers,
  type SkinAnswers,
} from "@/lib/record-card";
import { saveSection } from "../../clients-actions";
import { DetailsForm } from "./DetailsForm";
import { HealthForm, MassageForm, SkinForm, sectionFormData } from "./SectionForms";

const STEPS = ["details", "health", "massage", "skin"] as const;
export type Step = (typeof STEPS)[number];
type Section = Exclude<Step, "details">;
type Answers = { health: HealthAnswers; massage: MassageAnswers; skin: SkinAnswers };

const TITLES: Record<Step, string> = { details: "Details", health: "Health", massage: "Massage", skin: "Skin" };
const TOTAL_STEPS = 5; // the fifth is the consent screen
const SECTIONS: Section[] = ["health", "massage", "skin"];
const CONNECTION_ERROR = "Couldn't save. Check your connection and try again.";

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

const fingerprint = (section: Section, a: Answers) => JSON.stringify([...sectionFormData(section, a[section]).entries()]);

/**
 * Edits a record card. Below lg: one section per screen with Back and Next (Next saves first, Back doesn't),
 * the step kept in ?step= so a reload stays put. From lg: every section on one page, each with its own Save.
 * All answers live here in React state, so moving between steps or a failed save never loses them.
 * Nothing is kept in browser storage.
 */
export function CardWizard({
  client,
  health,
  massage,
  skin,
  initialStep,
}: {
  client: ClientDetails;
  health: HealthAnswers | null;
  massage: MassageAnswers | null;
  skin: SkinAnswers | null;
  initialStep: Step;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("step");
  const step: Step = isStep(requested) ? requested : initialStep;
  const wide = useWide();

  const [answers, setAnswers] = useState<Answers>(() => initialAnswers({ health, massage, skin }));
  // Fingerprint of each section as last saved, and of the save that earned a "Saved" tick.
  const [saved, setSaved] = useState<Record<Section, string>>(() => {
    const a = initialAnswers({ health, massage, skin });
    return { health: fingerprint("health", a), massage: fingerprint("massage", a), skin: fingerprint("skin", a) };
  });
  const [ticked, setTicked] = useState<Record<Section, string | null>>({ health: null, massage: null, skin: null });
  const [errors, setErrors] = useState<Record<Section, string | null>>({ health: null, massage: null, skin: null });
  const [pending, startTransition] = useTransition();
  const [leaving, setLeaving] = useState(false);
  const [savingNow, setSavingNow] = useState<Section | null>(null);
  const busy = pending || leaving;

  const signHref = `/dashboard/sign/${client.id}`;

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

  function goTo(next: Step) {
    window.history.pushState(null, "", `?step=${next}`);
    window.scrollTo(0, 0);
  }

  function next() {
    if (step === "details") return;
    startTransition(async () => {
      if (!(await save(step))) return;
      const i = STEPS.indexOf(step);
      if (i === STEPS.length - 1) {
        setLeaving(true);
        router.push(signHref);
      } else {
        goTo(STEPS[i + 1]);
      }
    });
  }

  function saveOne(section: Section) {
    setSavingNow(section);
    startTransition(async () => {
      await save(section);
      setSavingNow(null);
    });
  }

  // Desktop: save whatever changed, then go to signing.
  function ready() {
    startTransition(async () => {
      for (const s of SECTIONS) {
        if (fingerprint(s, answers) !== saved[s] && !(await save(s))) return;
      }
      setLeaving(true);
      router.push(signHref);
    });
  }

  const forms: Record<Section, ReactNode> = {
    health: <HealthForm value={answers.health} onChange={(v) => update("health", v)} />,
    massage: <MassageForm value={answers.massage} onChange={(v) => update("massage", v)} />,
    skin: <SkinForm value={answers.skin} onChange={(v) => update("skin", v)} />,
  };
  const stepIndex = STEPS.indexOf(step);
  const currentError = step === "details" ? null : errors[step];
  const firstError = SECTIONS.find((s) => errors[s] !== null);
  const unsavedElsewhere = SECTIONS.some((s) => fingerprint(s, answers) !== saved[s]);

  return (
    <div className="flex flex-col gap-6">
      <p className="m-0 text-sm font-medium text-ink-muted lg:hidden" aria-live="polite">
        Step {stepIndex + 1} of {TOTAL_STEPS} · {TITLES[step]}
      </p>

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
            <DetailsForm initial={client} onSaved={wide ? "stay" : "next"} />
          ) : (
            <>
              {forms[s]}
              <div className="hidden flex-wrap items-center gap-4 border-t border-line-soft pt-4 lg:flex">
                <button type="button" disabled={busy} onClick={() => saveOne(s)} className="btn btn-solid min-h-11 px-6">
                  {pending && savingNow === s ? "Saving…" : "Save"}
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

      {/* Wide screens: the end of the one-page card. */}
      <div className="hidden flex-col gap-3 lg:flex">
        {unsavedElsewhere && (
          <p className="m-0 text-sm text-ink-muted">Unsaved health, massage and skin answers are saved first.</p>
        )}
        <button type="button" disabled={busy} onClick={ready} className="btn btn-solid min-h-12 self-start px-6">
          {busy && savingNow === null ? "Saving…" : "Ready for the client to sign"}
        </button>
        {firstError && (
          <p role="alert" className="m-0 text-sm font-medium text-red-700">
            {TITLES[firstError]}: {errors[firstError]}
          </p>
        )}
      </div>

      {/* Phones: Back and Next stay in reach at the bottom of the screen. */}
      {step !== "details" && (
        <div className="sticky bottom-0 z-10 -mx-5 flex flex-col gap-2 border-t border-line bg-cream/95 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          {currentError && (
            <p role="alert" className="m-0 text-sm font-medium text-red-700">
              {currentError}
            </p>
          )}
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
              {busy ? "Saving…" : step === "skin" ? "To consent" : "Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
