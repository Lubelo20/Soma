"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type TransitionStartFunction } from "react";
import { isSigningOut, registerSignOutGuard, requestSignOut } from "../../sign-out";

/** The prompt's target when the user pressed Sign out rather than a link. */
export const SIGN_OUT = "sign-out";

/**
 * Stops a link, or Sign out, from silently leaving a form with unsaved edits. While `hasUnsaved()` is true, a click
 * on any link to another dashboard page is held and an inline prompt is shown instead (see LeavePrompt); Sign out
 * shows the same prompt; closing or reloading the tab asks the browser's own "Leave site?" question (except on the
 * way out after signing out). Only active while the form is on screen.
 */
export function useLeaveGuard(hasUnsaved: () => boolean) {
  const [target, setTarget] = useState<string | null>(null);
  const unsaved = useEffectEvent(hasUnsaved);
  const hold = useEffectEvent((href: string) => setTarget(href));

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!unsaved()) return;
      // Captured on window, before Next's link handler, so the navigation never starts.
      e.preventDefault();
      e.stopPropagation();
      hold(url.pathname + url.search);
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSigningOut() && unsaved()) e.preventDefault();
    };
    window.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    const unregister = registerSignOutGuard({ unsaved: () => unsaved(), askBeforeSignOut: () => hold(SIGN_OUT) });
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
      unregister();
    };
  }, []);

  // A prompt left open when the page was hidden shouldn't greet the user when they come back.
  useLayoutEffect(() => () => setTarget(null), []);

  return { target, close: () => setTarget(null) };
}

/**
 * The inline "unsaved changes" prompt. Save runs `onSave` (true when everything saved) and then goes to the target
 * (or signs out); Discard runs `onDiscard` and goes. It runs in the form's own transition, so the form's buttons
 * and inputs are disabled while it saves, and its own buttons are disabled during any of the form's saves
 * (`pending`); `saving` is whether the prompt itself started the save.
 * For Sign out, Discard doesn't touch the form at all: the edits are only dropped by the sign-out itself (a full
 * page load), so a sign-out that is cancelled (another card's draft, then Keep editing) or fails (offline) leaves
 * the form exactly as it was. `draftId` is the form's own card, whose draft that sign-out would drop anyway.
 */
export function LeavePrompt({
  target,
  backHref,
  pending,
  saving = pending,
  draftId,
  startTransition,
  onStart,
  onSave,
  onDiscard,
  onClose,
}: {
  target: string;
  backHref?: string;
  pending: boolean;
  saving?: boolean;
  draftId?: string;
  startTransition: TransitionStartFunction;
  onStart?: () => void;
  onSave: () => Promise<boolean>;
  onDiscard: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [failed, setFailed] = useState<"save" | "signout" | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const signOut = target === SIGN_OUT;

  useEffect(() => {
    ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    ref.current?.querySelector("button")?.focus({ preventScroll: true });
  }, [target]);

  /**
   * Goes on to the target. Sign-out skips the guards (this form's question has just been answered) and, after a
   * discard, this card's own draft; drafts on other cards are asked about by the sign-out button's prompt.
   */
  async function proceed(discarding: boolean) {
    if (!signOut) {
      startTransition(() => router.push(target));
      return;
    }
    const outcome = await requestSignOut({ skipGuards: true, except: discarding ? draftId : undefined });
    if (outcome === "failed") setFailed("signout");
    else if (outcome === "asked") onClose();
  }

  return (
    <div ref={ref} role="alertdialog" aria-labelledby="leave-prompt-title" className="note flex flex-col gap-3">
      <p id="leave-prompt-title" className="m-0 font-semibold">
        You have changes that aren&rsquo;t saved yet.
      </p>
      {failed === "save" && (
        <p role="alert" className="m-0 text-sm font-medium text-red-700">
          Not saved, so you&rsquo;re still here. See the message on the form. Nothing you typed has been lost.
        </p>
      )}
      {failed === "signout" && (
        <p role="alert" className="m-0 text-sm font-medium text-red-700">
          Not signed out. Check your connection and try again.
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setFailed(null);
            onStart?.();
            startTransition(async () => {
              if (!(await onSave())) {
                setFailed("save");
                return;
              }
              await proceed(false);
            });
          }}
          className="btn btn-solid min-h-12 px-5"
        >
          {saving ? "Saving…" : signOut ? "Save and sign out" : target === backHref ? "Save and go back" : "Save and leave"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setFailed(null);
            if (!signOut) onDiscard();
            onStart?.();
            startTransition(() => proceed(true));
          }}
          className="btn btn-line min-h-12 px-5"
        >
          {signOut ? "Discard and sign out" : "Discard changes"}
        </button>
        <button type="button" disabled={pending} onClick={onClose} className="min-h-11 cursor-pointer px-2 text-sm font-medium text-gold-deep underline">
          Keep editing
        </button>
      </div>
    </div>
  );
}
