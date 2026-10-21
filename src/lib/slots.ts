// Booking availability. Pure functions so they can be tested without a database.
// The clinic is in South Africa (UTC+2 all year, no daylight saving).

export const TIME_ZONE = "Africa/Johannesburg";
const OFFSET = "+02:00";
export const SLOT_STEP_MIN = 30;
export const LEAD_MIN = 120;
export const HORIZON_DAYS = 56;

export type DayHours = { opens: string; closes: string } | null;
export type Busy = { start: Date; end: Date };

/** A wall-clock time at the clinic ("2026-11-02", "09:00") as an absolute Date. */
export function clinicTime(date: string, time: string): Date {
  return new Date(`${date}T${time.slice(0, 5)}:00${OFFSET}`);
}

/** Today's date at the clinic as YYYY-MM-DD. */
export function clinicDate(now: Date): string {
  return new Date(now.getTime() + 2 * 3600_000).toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function availableSlots({
  date,
  hours,
  durationMin,
  busy,
  now,
}: {
  date: string;
  hours: DayHours;
  durationMin: number;
  busy: Busy[];
  now: Date;
}): string[] {
  if (!hours) return [];
  const earliest = now.getTime() + LEAD_MIN * 60_000;
  const slots: string[] = [];
  for (let m = toMinutes(hours.opens); m + durationMin <= toMinutes(hours.closes); m += SLOT_STEP_MIN) {
    const start = clinicTime(date, toTime(m));
    const end = new Date(start.getTime() + durationMin * 60_000);
    if (start.getTime() < earliest) continue;
    if (busy.some((b) => start < b.end && b.start < end)) continue;
    slots.push(toTime(m));
  }
  return slots;
}

/** Dates (YYYY-MM-DD) within the booking horizon on which the clinic is open. */
export function bookableDates({
  now,
  weekly,
  closures,
}: {
  now: Date;
  weekly: DayHours[]; // index 0 = Sunday
  closures: string[];
}): string[] {
  const today = clinicDate(now);
  const dates: string[] = [];
  for (let i = 0; i < HORIZON_DAYS; i++) {
    const date = addDays(today, i);
    if (weekly[weekday(date)] && !closures.includes(date)) dates.push(date);
  }
  return dates;
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) {
  return new Intl.DateTimeFormat("en-ZA", { ...opts, timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  }).format(d);
}
