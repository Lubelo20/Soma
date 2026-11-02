"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Special } from "@/lib/data";
import { markDismissed, shouldOpenPopup, wasDismissed, wrapIndex } from "@/lib/specials-popup";
import { Icon } from "./Icon";
import { PosterZoom } from "./PosterZoom";

const OPEN_DELAY_MS = 2000;

const visitStorage = () => {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

/** Shows the specials that are switched on, one poster at a time, shortly after someone arrives. */
export function SpecialsPopup({ specials }: { specials: Special[] }) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const slider = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Posters only download once the pop-up opens, so visitors who close it quickly or never see it don't pay for them.
  const [opened, setOpened] = useState(false);
  const count = specials.length;

  useEffect(() => {
    if (pathname === "/book") dialog.current?.close();
    if (!shouldOpenPopup(pathname, count, wasDismissed(visitStorage()))) return;
    const timer = setTimeout(() => {
      if (dialog.current && !dialog.current.open) {
        setOpened(true);
        dialog.current.showModal();
      }
    }, OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname, count]);

  if (count === 0) return null;
  const current = specials[Math.min(index, count - 1)];

  function dismiss() {
    markDismissed(visitStorage());
    dialog.current?.close();
  }

  function goTo(i: number) {
    const el = slider.current;
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: wrapIndex(i, count) * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }

  const arrow = "flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink hover:border-brand hover:text-brand";

  return (
    <dialog
      ref={dialog}
      aria-label="Current specials"
      onCancel={() => markDismissed(visitStorage())}
      onClick={(e) => {
        if (e.target === dialog.current) dismiss();
      }}
      className="specials-popup m-auto h-[min(100dvh-24px,860px)] max-h-none w-[min(100vw-20px,560px)] max-w-none flex-col overflow-hidden rounded-[4px] border-none bg-white p-0 backdrop:bg-black/65 open:flex"
    >
      <button type="button" onClick={dismiss} aria-label="Close specials" className="absolute top-2 right-2 z-20 flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink hover:text-gold-deep">
        <Icon name="close" size={20} strokeWidth={1.6} />
      </button>

      <div className="relative min-h-0 flex-1 bg-cream">
        <div
          ref={slider}
          onScroll={(e) => setIndex(wrapIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth), count))}
          className="flex size-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none]"
        >
          {specials.map((s) => (
            <div key={s.id} className="relative size-full flex-none snap-center">
              {opened && <PosterZoom src={s.posterUrl} alt={s.name} sizes="(max-width: 600px) 100vw, 560px" eager />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-none flex-col items-center gap-2 border-t border-line p-3">
        {/* Below the poster rather than over it, because the posters carry text right up to their edges. */}
        {count > 1 && (
          <div className="flex w-full items-center justify-between gap-2">
            <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous special" className={arrow}>
              <span className="flex rotate-180">
                <Icon name="arrow" size={18} strokeWidth={1.6} />
              </span>
            </button>
            <p aria-live="polite" className="m-0 text-[13px] text-ink-muted">
              Special {index + 1} of {count}
            </p>
            <button type="button" onClick={() => goTo(index + 1)} aria-label="Next special" className={arrow}>
              <Icon name="arrow" size={18} strokeWidth={1.6} />
            </button>
          </div>
        )}
        <Link
          href={`/book?treatment=${current.id}`}
          onClick={dismiss}
          aria-label={`Book this special: ${current.name}`}
          className="btn btn-solid w-full"
        >
          Book this special
        </Link>
        <button type="button" onClick={dismiss} className="min-h-11 cursor-pointer border-none bg-transparent px-4 text-sm text-ink-muted underline underline-offset-4 hover:text-ink">
          Not now
        </button>
      </div>
    </dialog>
  );
}
