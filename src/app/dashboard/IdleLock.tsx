"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { IDLE_MINUTES } from "@/lib/session-rules";
import { sessionActive } from "./actions";

const IDLE_MS = IDLE_MINUTES * 60_000;
const IDLE_TEXT = IDLE_MINUTES === 60 ? "an hour" : `${IDLE_MINUTES} minutes`;
// "input" is the only event voice dictation fires.
const ACTIVITY = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel", "input"] as const;

// Shared by every IdleLock in the page (the dashboard and the signing screen each have one), so moving between
// them neither resets nor loses the idle time.
let lastActivity = Date.now();
let lockedNow = false;

type State = "open" | "checking" | "locked" | "ended" | "offline";

/**
 * Covers the whole screen after IDLE_MINUTES without a tap, click or key press in this tab, so a phone or screen
 * left open doesn't keep showing a card. It is only a cover: nothing underneath is reloaded or cleared, so typed
 * answers survive. Continue asks the server whether the session is still valid before lifting it.
 * A page restored from the browser's back-forward cache (for example, Back after signing out) is covered too
 * until the session has been checked.
 */
export function IdleLock() {
  const [state, setState] = useState<State>("open");
  const [pending, startTransition] = useTransition();
  const coverRef = useRef<HTMLDivElement>(null);

  function checkSession() {
    startTransition(async () => {
      try {
        if (await sessionActive()) {
          lockedNow = false;
          lastActivity = Date.now();
          setState("open");
        } else {
          setState("ended");
        }
      } catch {
        setState("offline");
      }
    });
  }

  const checkRestored = useEffectEvent(checkSession);

  useEffect(() => {
    const lock = () => {
      lockedNow = true;
      setState((s) => (s === "open" ? "locked" : s));
    };
    const check = () => {
      if (lockedNow || Date.now() - lastActivity >= IDLE_MS) lock();
    };
    const onActivity = () => {
      if (!lockedNow) lastActivity = Date.now();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return check();
      // Restored from the back-forward cache: the session may have ended (or been signed out) meanwhile.
      lockedNow = true;
      setState("checking");
      checkRestored();
    };

    check();
    const timer = window.setInterval(check, 15_000);
    for (const type of ACTIVITY) window.addEventListener(type, onActivity, { capture: true, passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.clearInterval(timer);
      for (const type of ACTIVITY) window.removeEventListener(type, onActivity, { capture: true });
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  // When this layout is hidden by a navigation, drop its cover: the other layout's lock takes over (lockedNow stays).
  useLayoutEffect(() => () => setState("open"), []);

  const covered = state !== "open";

  // While covered, everything else on the page is inert: no tabbing to, or reading out, what is underneath.
  useEffect(() => {
    if (!covered) return;
    const cover = coverRef.current;
    const others = [...document.body.children].filter((el) => el !== cover && !el.hasAttribute("inert"));
    for (const el of others) el.setAttribute("inert", "");
    cover?.querySelector<HTMLElement>("button, a")?.focus();
    return () => {
      for (const el of others) el.removeAttribute("inert");
    };
  }, [covered]);

  if (!covered) return null;
  return createPortal(
    <div
      ref={coverRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-lock-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-cream px-4 py-10"
    >
      <div className="card flex w-full max-w-md flex-col gap-4">
        <p id="idle-lock-title" className="m-0 text-[17px] font-semibold text-ink-strong">
          {state === "checking"
            ? "Checking your session…"
            : state === "ended"
              ? "Your session has ended. Sign in again in a new tab, then tap Continue."
              : `This screen was locked after ${IDLE_TEXT} without activity.`}
        </p>
        {state === "offline" && (
          <p role="alert" className="m-0 text-sm font-medium text-red-700">
            Couldn&rsquo;t check your session. Check your connection and try again.
          </p>
        )}
        {state === "ended" && (
          <a href="/dashboard/login" target="_blank" rel="noopener" className="text-link self-start">
            Open the sign-in page in a new tab
          </a>
        )}
        {state !== "checking" && (
          <button type="button" disabled={pending} onClick={checkSession} className="btn btn-solid min-h-12 px-6 max-sm:w-full sm:self-start">
            {pending ? "Checking…" : "Continue"}
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
