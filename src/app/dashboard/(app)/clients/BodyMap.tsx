"use client";

import { useId, type KeyboardEvent } from "react";
import { BODY_AREAS, areaLabels } from "@/lib/record-card";
import { VIEWS, VIEW_BOX, poly, type ViewDef } from "./body-map-shapes";

// The three figures share one row at every width. On a 360px phone each is about 90px wide (0.58px per
// drawing unit); on larger screens they grow to at most 230px each.

const LABEL = new Map(BODY_AREAS.map((a) => [a.id, a.label]));

/**
 * Areas of tension or discomfort, marked on front, back and side figures or from the list underneath
 * (both stay in sync). The parent keeps the value and sends it as "massage.areas".
 */
export function BodyMap({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  // useId output can hold characters that break url(#…) references, so keep only the safe ones.
  const uid = "bm" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const selected = new Set(value);
  // Always in the order of BODY_AREAS, so the saved list reads head to toe.
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(BODY_AREAS.filter((a) => next.has(a.id)).map((a) => a.id));
  };
  const onKey = (id: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(id);
    }
  };
  const ordered = BODY_AREAS.filter((a) => selected.has(a.id)).map((a) => a.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-2 sm:gap-4">
        {VIEWS.map((v) => (
          <Figure key={v.view} def={v} clipId={`${uid}-${v.view}`} selected={selected} toggle={toggle} onKey={onKey} />
        ))}
      </div>

      <p role="status" className="sr-only">
        Marked: {ordered.length > 0 ? areaLabels(ordered) : "No areas marked"}
      </p>
      <div className="flex flex-col gap-2 border-t border-line-soft pt-3 text-sm text-ink-body">
        <p className="m-0">
          <span className="font-semibold text-ink-strong">Marked:</span>
          {ordered.length === 0 && " nothing yet"}
        </p>
        {ordered.length > 0 && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {ordered.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  aria-label={`Remove ${LABEL.get(id) ?? id}`}
                  className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-full border border-[#b3261e] bg-[#fdf1f0] py-1 pr-2.5 pl-3 text-[13px] text-[#b3261e] transition-colors hover:bg-[#f9e0de]"
                >
                  {LABEL.get(id) ?? id}
                  <span aria-hidden="true" className="font-bold">
                    ×
                  </span>
                </button>
              ))}
            </div>
            <p className="m-0 text-[12.5px] text-ink-muted">Tap a name to remove it.</p>
          </>
        )}
      </div>

      <details className="border-t border-line-soft pt-3">
        <summary className="min-h-11 cursor-pointer content-center text-sm font-medium text-brand">Pick from a list instead</summary>
        <div className="flex flex-col gap-4 pt-3">
          {VIEWS.map((v) => (
            <div key={v.view} role="group" aria-label={v.title} className="flex flex-col gap-2">
              <span className="text-[11.5px] font-medium tracking-[.2em] text-ink-body uppercase">{v.title}</span>
              <div className="flex flex-wrap gap-2">
                {BODY_AREAS.filter((a) => a.view === v.view).map((a) => {
                  const on = selected.has(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(a.id)}
                      className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm transition-colors ${
                        on ? "border-[#7d1712] bg-[#b3261e] text-white" : "border-line bg-white text-ink hover:border-[#b3261e]"
                      }`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

/** One figure: thick outline, base fill, the zones cut to the silhouette, then the anatomy lines on top. */
function Figure({
  def,
  clipId,
  selected,
  toggle,
  onKey,
}: {
  def: ViewDef;
  clipId: string;
  selected: Set<string>;
  toggle: (id: string) => void;
  onKey: (id: string) => (e: KeyboardEvent) => void;
}) {
  return (
    <figure className="m-0 flex max-w-[230px] min-w-0 flex-1 flex-col items-center gap-0.5">
      <figcaption className="text-[10.5px] font-medium tracking-[.2em] text-gold-deep uppercase sm:text-[11.5px]">
        {def.title}
      </figcaption>
      <div className="relative w-full">
        {def.marks && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[8%] flex justify-between px-[12%] text-[11px] font-bold text-gold-deep sm:text-xs"
          >
            <span>{def.marks[0]}</span>
            <span>{def.marks[1]}</span>
          </div>
        )}
        <svg
          viewBox={VIEW_BOX}
          role="group"
          aria-label={`${def.title} of the body`}
          className="block h-auto w-full touch-manipulation select-none"
        >
          <defs>
            <clipPath id={clipId}>
              {def.silhouette.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </clipPath>
          </defs>
          {/* The outline goes first and twice as thick, so only its outer half shows and the seam down the centre is covered. */}
          <g aria-hidden="true" className="pointer-events-none">
            {def.silhouette.map((d, i) => (
              <path key={`o${i}`} d={d} fill="none" stroke="#56705d" strokeWidth={3} strokeLinejoin="round" />
            ))}
            {def.silhouette.map((d, i) => (
              <path key={`b${i}`} d={d} fill="#f1ece4" />
            ))}
          </g>
          {def.zones.map((z) => {
            const on = selected.has(z.id);
            const label = LABEL.get(z.id) ?? z.id;
            return (
              <g
                key={z.id}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                aria-label={label}
                onClick={() => toggle(z.id)}
                onKeyDown={onKey(z.id)}
                className="group cursor-pointer outline-none"
              >
                <title>{label}</title>
                {/* The tap area: invisible and not cut to the body; shows as a dashed line when focused. */}
                <path
                  d={poly(z.hit)}
                  fill="transparent"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  className="stroke-transparent group-focus-visible:stroke-gold-deep"
                />
                <path
                  d={z.d}
                  clipPath={`url(#${clipId})`}
                  strokeWidth={1.2}
                  className={`stroke-white transition-colors group-focus-visible:stroke-gold-deep group-focus-visible:[stroke-width:3] ${
                    on ? "fill-[#b3261e]" : "fill-mint group-hover:fill-mint-line"
                  }`}
                />
              </g>
            );
          })}
          <g aria-hidden="true" className="pointer-events-none" fill="none" stroke="#8aa291" strokeWidth={0.9} strokeLinecap="round">
            {def.details.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </svg>
      </div>
      {def.marks && (
        <span className="hidden text-center text-xs text-ink-subtle sm:block">
          Client&apos;s {def.marks[0] === "L" ? "left" : "right"} on the left
        </span>
      )}
    </figure>
  );
}
