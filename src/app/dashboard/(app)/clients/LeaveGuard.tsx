"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useTransition } from "react";

/**
 * Stops a link from silently leaving a form with unsaved edits. While `hasUnsaved()` is true, a click on any link
 * to another dashboard page is held and an inline prompt is shown instead (see LeavePrompt); closing or reloading
 * the tab asks the browser's own "Leave site?" question. Only active while the form is on screen.
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
      if (unsaved()) e.preventDefault();
    };
    window.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  // A prompt left open when the page was hidden shouldn't greet the user when they come back.
  useLayoutEffect(() => () => setTarget(null), []);

  return { target, hold: setTarget, close: () => setTarget(null) };
}

/**
 * The inline "unsaved changes" prompt. Save runs `onSave` (true when everything saved) and then goes to the
 * target; Discard runs `onDiscard` and goes. Errors from a failed save are shown by the form itself.
 */
export function LeavePrompt({
  target,
  backHref,
  onSave,
  onDiscard,
  onClose,
}: {
  target: string;
  backHref?: string;
  onSave: () => Promise<boolean>;
  onDiscard: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    ref.current?.querySelector("button")?.focus({ preventScroll: true });
  }, [target]);

  const go = () => startTransition(() => router.push(target));

  return (
    <div ref={ref} role="alertdialog" aria-labelledby="leave-prompt-title" className="note flex flex-col gap-3">
      <p id="leave-prompt-title" className="m-0 font-semibold">
        You have changes that aren&rsquo;t saved yet.
      </p>
      {failed && (
        <p role="alert" className="m-0 text-sm font-medium text-red-700">
          Not saved, so you&rsquo;re still here. See the message on the form. Nothing you typed has been lost.
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setFailed(false);
            startTransition(async () => {
              if (!(await onSave())) {
                setFailed(true);
                return;
              }
              startTransition(() => router.push(target));
            });
          }}
          className="btn btn-solid min-h-12 px-5"
        >
          {pending ? "Saving…" : target === backHref ? "Save and go back" : "Save and leave"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            onDiscard();
            go();
          }}
          className="btn btn-line min-h-12 px-5"
        >
          Discard changes
        </button>
        <button type="button" disabled={pending} onClick={onClose} className="min-h-11 cursor-pointer px-2 text-sm font-medium text-gold-deep underline">
          Keep editing
        </button>
      </div>
    </div>
  );
}
