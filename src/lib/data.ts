import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sql } from "./db";
import type { DayHours } from "./slots";

export type Treatment = {
  id: number;
  slug: string;
  name: string;
  category: "wellness" | "skincare" | "special";
  section: string;
  description: string;
  durationMin: number;
  priceCents: number | null;
  active: boolean;
  sort: number;
  posterUrl: string | null;
};

/** A package offer with a poster. durationMin is its first session, the only part booked online. */
export type Special = { id: number; name: string; durationMin: number; priceCents: number; posterUrl: string };

/** Specials currently switched on, newest first. Staff edits call updateTag("treatments"). */
export async function getActiveSpecials(): Promise<Special[]> {
  "use cache";
  cacheTag("treatments");
  cacheLife("days");
  const rows = await sql<Special[]>`
    select id, name, duration_min, price_cents, poster_url from treatments
    where active and category = 'special' and poster_url is not null and price_cents is not null
    order by created_at desc, id desc`;
  return rows.map((r) => ({ ...r }));
}

/** Treatments shown on the public site. Staff edits call updateTag("treatments"). */
export async function getActiveTreatments(): Promise<Treatment[]> {
  "use cache";
  cacheTag("treatments");
  cacheLife("days");
  const rows = await sql<Treatment[]>`select * from treatments where active order by category, sort, name`;
  return rows.map((r) => ({ ...r }));
}

/** Weekly hours, index 0 = Sunday. Staff edits call updateTag("hours"). */
export async function getWeeklyHours(): Promise<DayHours[]> {
  "use cache";
  cacheTag("hours");
  cacheLife("days");
  const rows = await sql<{ weekday: number; opens: string | null; closes: string | null }[]>`
    select weekday, to_char(opens, 'HH24:MI') as opens, to_char(closes, 'HH24:MI') as closes from opening_hours`;
  const weekly: DayHours[] = Array(7).fill(null);
  for (const r of rows) weekly[r.weekday] = r.opens && r.closes ? { opens: r.opens, closes: r.closes } : null;
  return weekly;
}

export async function getClosures(): Promise<{ day: string; note: string }[]> {
  "use cache";
  cacheTag("hours");
  cacheLife("days");
  const rows = await sql<{ day: string; note: string }[]>`
    select to_char(day, 'YYYY-MM-DD') as day, note from closures where day >= current_date order by day`;
  return rows.map((r) => ({ ...r }));
}

export function formatPrice(cents: number | null) {
  if (cents == null) return "Price on request";
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: cents % 100 ? 2 : 0 })}`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Opening hours grouped for display, e.g. "Monday – Friday: 09:00 – 17:00". */
export function describeHours(weekly: DayHours[]): string[] {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const lines: string[] = [];
  let i = 0;
  while (i < order.length) {
    const h = weekly[order[i]];
    let j = i;
    while (j + 1 < order.length && JSON.stringify(weekly[order[j + 1]]) === JSON.stringify(h)) j++;
    const days = i === j ? DAY_NAMES[order[i]] : `${DAY_NAMES[order[i]]} – ${DAY_NAMES[order[j]]}`;
    lines.push(`${days}: ${h ? `${h.opens} – ${h.closes}` : "Closed"}`);
    i = j + 1;
  }
  return lines;
}
