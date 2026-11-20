"use client";

import type { KeyboardEvent } from "react";
import { BODY_AREAS, areaLabels } from "@/lib/record-card";

type View = "front" | "back" | "side";

// Drawing units: each figure is 160 x 368. On a 360px phone a figure is drawn about 260px wide (1.65px per
// unit), so the smallest tap targets (22-26 units, the neck and feet) are 36-43px.
const W = 160;
const H = 368;

/** A rounded rectangle as a path. */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 -${2 * rx} 0z`;

// Each area: the shape that is drawn, and a larger invisible rectangle [x, y, w, h] that takes the tap.
// Tap rectangles never overlap. Front view: the client's right is on the viewer's left. Back view: the
// client's left is on the viewer's left.
type Region = { id: string; d: string; hit: [number, number, number, number] };

const FRONT: Region[] = [
  { id: "head", d: ellipse(80, 22, 16, 20), hit: [44, 0, 72, 42] },
  { id: "neck", d: rr(72, 43, 16, 17, 5), hit: [44, 42, 72, 22] },
  { id: "rightShoulder", d: rr(32, 64, 23, 26, 11), hit: [4, 64, 52, 28] },
  { id: "leftShoulder", d: rr(105, 64, 23, 26, 11), hit: [104, 64, 52, 28] },
  { id: "chest", d: rr(57, 64, 46, 56, 9), hit: [56, 64, 48, 58] },
  { id: "rightArm", d: rr(32, 93, 20, 96, 9), hit: [4, 92, 50, 100] },
  { id: "leftArm", d: rr(108, 93, 20, 96, 9), hit: [106, 92, 50, 100] },
  { id: "abdomen", d: rr(59, 122, 42, 44, 8), hit: [54, 122, 52, 44] },
  { id: "rightHand", d: rr(31, 192, 21, 30, 9), hit: [4, 192, 50, 36] },
  { id: "leftHand", d: rr(108, 192, 21, 30, 9), hit: [106, 192, 50, 36] },
  { id: "hips", d: rr(55, 168, 50, 34, 11), hit: [54, 166, 52, 38] },
  { id: "rightThigh", d: rr(55, 205, 24, 62, 10), hit: [54, 204, 26, 64] },
  { id: "leftThigh", d: rr(81, 205, 24, 62, 10), hit: [80, 204, 26, 64] },
  { id: "rightKnee", d: rr(57, 270, 21, 23, 10), hit: [30, 268, 50, 28] },
  { id: "leftKnee", d: rr(82, 270, 21, 23, 10), hit: [80, 268, 50, 28] },
  { id: "rightShin", d: rr(58, 296, 19, 45, 8), hit: [30, 296, 50, 46] },
  { id: "leftShin", d: rr(83, 296, 19, 45, 8), hit: [80, 296, 50, 46] },
  { id: "rightFoot", d: rr(52, 344, 26, 18, 8), hit: [30, 342, 50, 26] },
  { id: "leftFoot", d: rr(82, 344, 26, 18, 8), hit: [80, 342, 50, 26] },
];

const BACK: Region[] = [
  { id: "upperBack", d: rr(32, 64, 96, 42, 12), hit: [4, 62, 152, 44] },
  { id: "midBack", d: rr(57, 108, 46, 30, 6), hit: [40, 106, 80, 34] },
  { id: "lowerBack", d: rr(58, 140, 44, 26, 6), hit: [40, 140, 80, 28] },
  { id: "glutes", d: rr(55, 168, 50, 34, 12), hit: [40, 168, 80, 36] },
  { id: "leftHamstring", d: rr(55, 205, 24, 62, 10), hit: [30, 204, 50, 64] },
  { id: "rightHamstring", d: rr(81, 205, 24, 62, 10), hit: [80, 204, 50, 64] },
  { id: "leftCalf", d: rr(58, 296, 19, 45, 8), hit: [30, 294, 50, 48] },
  { id: "rightCalf", d: rr(83, 296, 19, 45, 8), hit: [80, 294, 50, 48] },
];
// Parts drawn for context on the back view only; they can't be marked from here.
const BACK_CONTEXT = [
  ellipse(80, 22, 16, 20),
  rr(72, 43, 16, 17, 5),
  rr(32, 108, 20, 81, 9),
  rr(108, 108, 20, 81, 9),
  rr(31, 192, 21, 30, 9),
  rr(108, 192, 21, 30, 9),
  rr(57, 270, 21, 23, 10),
  rr(82, 270, 21, 23, 10),
  rr(58, 344, 20, 18, 8),
  rr(82, 344, 20, 18, 8),
];

// Profile facing the viewer's right.
const SIDE: Region[] = [
  { id: "sideNeck", d: rr(72, 43, 17, 18, 5), hit: [30, 42, 100, 24] },
  { id: "sideHip", d: rr(61, 166, 38, 38, 13), hit: [30, 160, 100, 46] },
  { id: "sideLeg", d: rr(64, 206, 30, 136, 12), hit: [30, 206, 100, 138] },
];
const SIDE_CONTEXT = [
  ellipse(82, 22, 17, 20),
  rr(60, 64, 40, 98, 14),
  rr(72, 72, 16, 110, 8),
  rr(64, 344, 40, 18, 8),
];

const FIGURES: { view: View; title: string; regions: Region[]; context: string[]; marks: [string, string] | null }[] = [
  { view: "front", title: "Front", regions: FRONT, context: [], marks: ["R", "L"] },
  { view: "back", title: "Back", regions: BACK, context: BACK_CONTEXT, marks: ["L", "R"] },
  { view: "side", title: "Side", regions: SIDE, context: SIDE_CONTEXT, marks: null },
];

const LABEL = new Map(BODY_AREAS.map((a) => [a.id, a.label]));

/**
 * Areas of tension or discomfort, marked on front, back and side outlines or from the list underneath
 * (both stay in sync). The parent keeps the value and sends it as "massage.areas".
 */
export function BodyMap({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
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
    <div className="flex flex-col gap-5">
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
        {FIGURES.map((f) => (
          <figure
            key={f.view}
            className="m-0 flex w-[88%] max-w-[300px] shrink-0 snap-center flex-col items-center gap-2 rounded-[3px] border border-line-soft bg-cream/60 p-2 sm:w-auto sm:max-w-none"
          >
            <figcaption className="text-[11.5px] font-medium tracking-[.2em] text-ink-body uppercase">{f.title}</figcaption>
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full max-w-[270px] touch-manipulation select-none">
              {f.context.map((d, i) => (
                <path key={i} d={d} aria-hidden="true" className="fill-white stroke-line" strokeWidth={1.2} strokeDasharray="3 2" />
              ))}
              {f.regions.map((r) => {
                const on = selected.has(r.id);
                const [x, y, w, h] = r.hit;
                return (
                  <g
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={on}
                    aria-label={LABEL.get(r.id) ?? r.id}
                    onClick={() => toggle(r.id)}
                    onKeyDown={onKey(r.id)}
                    className="group cursor-pointer outline-none"
                  >
                    <rect x={x} y={y} width={w} height={h} fill="transparent" />
                    <path
                      d={r.d}
                      strokeWidth={1.4}
                      className={`transition-colors group-focus-visible:stroke-gold-deep group-focus-visible:[stroke-width:3] ${
                        on ? "fill-brand stroke-brand-dark" : "fill-mint-soft stroke-forest/45 group-hover:fill-mint"
                      }`}
                    />
                  </g>
                );
              })}
              {f.marks && (
                <g aria-hidden="true" className="fill-gold-deep text-[13px] font-semibold">
                  <text x={10} y={22}>
                    {f.marks[0]}
                  </text>
                  <text x={W - 10} y={22} textAnchor="end">
                    {f.marks[1]}
                  </text>
                </g>
              )}
            </svg>
            {f.marks && (
              <span className="text-xs text-ink-subtle">
                Client&apos;s {f.marks[0] === "L" ? "left" : "right"} on the left
              </span>
            )}
          </figure>
        ))}
      </div>

      <p role="status" className="m-0 text-sm text-ink-body">
        <span className="font-medium text-ink-strong">Marked: </span>
        {ordered.length > 0 ? areaLabels(ordered) : "No areas marked"}
      </p>

      <div className="flex flex-col gap-4 border-t border-line-soft pt-4">
        <p className="m-0 text-sm text-ink-muted">Or tap the areas in this list:</p>
        {FIGURES.map((f) => (
          <div key={f.view} role="group" aria-label={f.title} className="flex flex-col gap-2">
            <span className="text-[11.5px] font-medium tracking-[.2em] text-ink-body uppercase">{f.title}</span>
            <div className="flex flex-wrap gap-2">
              {BODY_AREAS.filter((a) => a.view === f.view).map((a) => {
                const on = selected.has(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(a.id)}
                    className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm transition-colors ${
                      on ? "border-brand bg-brand text-cream" : "border-line bg-white text-ink hover:border-brand"
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
    </div>
  );
}
