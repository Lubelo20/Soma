"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { CONNECTION_ERROR } from "@/lib/form-messages";
import { CONSENT_STATEMENTS, REQUIRED_CONSENT_COUNT, isValidInitials, normalizeInitials } from "@/lib/record-card";
import { SIGNATURE_VIEWBOX, isValidSignaturePath, strokesToPath, type Point } from "@/lib/signature";
import { signConsent } from "../../clients-actions";
import { useHydrated } from "../../useHydrated";

const TICK_ERROR = `Please tick statements 1 to ${REQUIRED_CONSENT_COUNT}.`;
const INITIALS_ERROR = "Please enter your initials.";
const SIGN_ERROR = "Please sign in the box.";

const VW = SIGNATURE_VIEWBOX.width;
const VH = SIGNATURE_VIEWBOX.height;
const MAX_POINTS = 4000; // keeps the stored path well under its 60,000-character limit
const MIN_STEP = 1; // viewbox units; closer points add nothing visible
const BASELINE = 270; // three quarters of the way down the box

const countPoints = (strokes: Point[][]) => strokes.reduce((n, s) => n + s.length, 0);
const clamp = (n: number, max: number) => Math.min(max, Math.max(0, n));

function inkStyle(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

/** A one-point stroke (a tap: the dot on an i, a full stop) shown as a dot the width of the line. */
function dot(ctx: CanvasRenderingContext2D, [x, y]: Point) {
  ctx.beginPath();
  ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
}

/**
 * A finger signature box (5:3). Strokes are kept in viewbox coordinates (600×360) in the parent's ref, so the drawing
 * survives a failed save and is redrawn at the new size when the phone rotates.
 */
function SignaturePad({ strokesRef, disabled }: { strokesRef: React.RefObject<Point[][]>; disabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointer = useRef<number | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    // Resizing the backing store clears it and resets the context.
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(w / VW, 0, 0, h / VH, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, VW, VH);
    ctx.strokeStyle = "#d6cfc2";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(24, BASELINE);
    ctx.lineTo(VW - 24, BASELINE);
    ctx.stroke();
    ctx.fillStyle = "#c3bcb0";
    ctx.font = "32px sans-serif";
    ctx.fillText("×", 30, BASELINE - 12);
    inkStyle(ctx);
    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue;
      if (stroke.length === 1) {
        dot(ctx, stroke[0]);
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (const [x, y] of stroke.slice(1)) ctx.lineTo(x, y);
      ctx.stroke();
    }
  }, [strokesRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    redraw();
    // Rotation and layout changes resize the box; zoom changes the pixel ratio and fires a window resize.
    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    window.addEventListener("resize", redraw);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", redraw);
      // Hidden after leaving the page: wipe the pixels, so the signature isn't kept in the hidden page.
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [redraw]);

  const toPoint = (e: { clientX: number; clientY: number }, rect: DOMRect): Point => [
    clamp(((e.clientX - rect.left) / rect.width) * VW, VW),
    clamp(((e.clientY - rect.top) / rect.height) * VH, VH),
  ];

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled || activePointer.current !== null) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    if (countPoints(strokesRef.current) >= MAX_POINTS) return;
    // Capture keeps the stroke going if the finger slides out of the box.
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointer.current = e.pointerId;
    const p = toPoint(e, e.currentTarget.getBoundingClientRect());
    strokesRef.current.push([p]);
    const ctx = e.currentTarget.getContext("2d");
    if (ctx) {
      inkStyle(ctx);
      dot(ctx, p);
    }
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerId !== activePointer.current) return;
    e.preventDefault();
    const canvas = e.currentTarget;
    const ctx = canvas.getContext("2d");
    const stroke = strokesRef.current.at(-1);
    if (!ctx || !stroke) return;
    const rect = canvas.getBoundingClientRect();
    const coalesced = e.nativeEvent.getCoalescedEvents?.() ?? [];
    let total = countPoints(strokesRef.current);
    inkStyle(ctx);
    for (const ev of coalesced.length > 0 ? coalesced : [e.nativeEvent]) {
      if (total >= MAX_POINTS) break;
      const p = toPoint(ev, rect);
      const prev = stroke[stroke.length - 1];
      if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) < MIN_STEP) continue;
      stroke.push(p);
      total++;
      ctx.beginPath();
      ctx.moveTo(prev[0], prev[1]);
      ctx.lineTo(p[0], p[1]);
      ctx.stroke();
    }
  }

  function end(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerId !== activePointer.current) return;
    activePointer.current = null;
  }

  function clear() {
    strokesRef.current.splice(0);
    activePointer.current = null;
    redraw();
  }

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-2">
      <span id="signature-label" className="text-[16px] font-semibold text-ink-strong">
        Sign here with your finger
      </span>
      <div className="overflow-hidden rounded-[3px] border-2 border-[#d6cfc2] bg-white">
        <canvas
          ref={canvasRef}
          role="img"
          aria-labelledby="signature-label"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
          className="block aspect-[5/3] w-full cursor-crosshair touch-none bg-white select-none"
        />
      </div>
      <button
        type="button"
        onClick={clear}
        disabled={disabled}
        className="inline-flex min-h-11 cursor-pointer items-center self-end px-2 text-sm font-medium text-gold-deep underline disabled:opacity-60"
      >
        Clear
      </button>
    </div>
  );
}

/**
 * The client-facing consent form. Ticks, initials and strokes all stay in this component, so any failed save
 * (signed out, offline, validation) keeps everything the client did. Nothing is put in browser storage.
 * Next keeps a left page mounted but hidden; this form clears itself when hidden, so opening the signing screen
 * again (or Back) never shows an earlier client's ticks, initials or signature. The page also wraps it in
 * FreshOnOpen.
 */
export function SignatureForm({ clientId, today }: { clientId: string; today: string }) {
  const router = useRouter();
  const [ticked, setTicked] = useState<boolean[]>(() => CONSENT_STATEMENTS.map(() => false));
  const [initials, setInitials] = useState("");
  const strokesRef = useRef<Point[][]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Disabled until hydrated, so a tap before JavaScript has loaded can't submit the form natively.
  const hydrated = useHydrated();
  const busy = pending || !hydrated;

  useLayoutEffect(
    () => () => {
      setTicked(CONSENT_STATEMENTS.map(() => false));
      setInitials("");
      setMessage(null);
      strokesRef.current.splice(0);
    },
    [],
  );

  function submit() {
    // Same checks, in the same order, as signConsent, so the client gets the message without a round trip.
    const typed = normalizeInitials(initials);
    let error: string | null = null;
    if (ticked.slice(0, REQUIRED_CONSENT_COUNT).some((t) => !t)) error = TICK_ERROR;
    else if (!isValidInitials(typed)) error = INITIALS_ERROR;
    // The server's own rule: taps and tiny scribbles don't count as a signature.
    else if (!isValidSignaturePath(strokesToPath(strokesRef.current))) error = SIGN_ERROR;
    if (error) {
      setMessage(error);
      return;
    }

    const fd = new FormData();
    fd.set("clientId", clientId);
    ticked.forEach((t, i) => t && fd.append("agree", String(i)));
    fd.set("initials", typed);
    fd.set("signature", strokesToPath(strokesRef.current));
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await signConsent({}, fd);
        if (res.ok && res.id) {
          const card = `/dashboard/clients/${res.id}`;
          // Replace, so Back from the card doesn't return to a signed form. Inside the transition, so the
          // button stays at "Saving…" until the card is showing.
          startTransition(() => router.replace(card));
        } else {
          setMessage(res.error ?? CONNECTION_ERROR);
        }
      } catch {
        setMessage(CONNECTION_ERROR);
      }
    });
  }

  return (
    <form
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) submit();
      }}
      noValidate
      autoComplete="off"
      className="flex flex-col gap-6"
    >
      <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
        <legend className="sr-only">Statements</legend>
        {CONSENT_STATEMENTS.map((statement, i) => (
          <label
            key={i}
            className="flex min-h-14 cursor-pointer items-start gap-4 rounded-[3px] border-2 border-line bg-white px-4 py-3.5 text-[17px] leading-snug text-ink-strong transition-colors has-[:checked]:border-brand has-[:checked]:bg-mint has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40"
          >
            <input
              type="checkbox"
              name="agree"
              value={i}
              checked={ticked[i]}
              disabled={busy}
              onChange={(e) => {
                const on = e.target.checked;
                setTicked((prev) => prev.map((t, j) => (j === i ? on : t)));
              }}
              className="mt-0.5 size-6 flex-none cursor-pointer accent-brand"
            />
            <span>
              <span className="font-semibold">{i + 1}.</span> {statement}
              {i >= REQUIRED_CONSENT_COUNT && <span className="text-ink-muted"> (optional)</span>}
            </span>
          </label>
        ))}
      </fieldset>

      <label className="label" htmlFor="consent-initials">
        Initials
        <input
          id="consent-initials"
          name="initials"
          value={initials}
          onChange={(e) => setInitials(e.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={12}
          disabled={busy}
          className="field w-36 text-[18px] tracking-[.15em] uppercase"
        />
      </label>

      <SignaturePad strokesRef={strokesRef} disabled={busy} />

      <p className="m-0 text-[16px] text-ink-body">Date: {today}</p>

      <div className="flex flex-col gap-3">
        {message && (
          <p role="alert" className="m-0 text-[15px] font-medium text-red-700">
            {message}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn btn-solid min-h-14 px-8 max-sm:w-full sm:self-start">
          {pending ? "Saving…" : "Sign and finish"}
        </button>
        <Link href={`/dashboard/clients/${clientId}`} className="inline-flex min-h-11 items-center self-center text-sm text-ink-muted underline sm:self-start">
          Cancel
        </Link>
      </div>
    </form>
  );
}
