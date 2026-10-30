"use server";

import { timingSafeEqual } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { MIN_PASSWORD, changePassword, endSession, requireStaff, setPassword, startSession, verifyPassword } from "@/lib/auth";
import { sql } from "@/lib/db";
import { clearEvents, clientIp, countRecent, recordEvent } from "@/lib/rate-limit";
import { emails, sendEmail } from "@/lib/email";
import { formatDateTime } from "@/lib/slots";

export type FormResult = {
  error?: string;
  ok?: boolean;
  // Echoed back on errors so forms keep what was typed (never includes passwords).
  values?: Record<string, string>;
};

const str = (fd: FormData, name: string, max = 500) => String(fd.get(name) ?? "").trim().slice(0, max);

// ---------- Auth ----------

// Password guessing: 5 wrong tries per device (IP) and 50 overall in 15 minutes, then sign-in pauses.
const LOGIN_WINDOW_MIN = 15;

export async function login(_prev: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  const ip = await clientIp();
  const [mine, everyone] = await Promise.all([
    countRecent("login-fail", ip, LOGIN_WINDOW_MIN),
    countRecent("login-fail", "*", LOGIN_WINDOW_MIN),
  ]);
  if (mine >= 5 || everyone >= 50) return { error: `Too many attempts. Please wait ${LOGIN_WINDOW_MIN} minutes and try again.` };
  if (!(await verifyPassword(String(fd.get("password") ?? "")))) {
    await Promise.all([recordEvent("login-fail", ip), recordEvent("login-fail", "*")]);
    return { error: "Incorrect password." };
  }
  await clearEvents("login-fail", ip);
  await startSession();
  redirect("/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/dashboard/login");
}

export async function updatePassword(_prev: FormResult, fd: FormData): Promise<FormResult> {
  await requireStaff();
  const next = String(fd.get("next") ?? "");
  if (next.length < MIN_PASSWORD) return { error: `New password must be at least ${MIN_PASSWORD} characters.` };
  if (next !== fd.get("confirm")) return { error: "New passwords don't match." };
  const ok = await changePassword(String(fd.get("current") ?? ""), next);
  return ok ? { ok: true } : { error: "Current password is incorrect." };
}

/** One-time setup: chooses the shared staff password. Only works while none is set and the SETUP_CODE matches. */
export async function setupPassword(_prev: FormResult, fd: FormData): Promise<FormResult> {
  const ip = await clientIp();
  if ((await countRecent("login-fail", ip, LOGIN_WINDOW_MIN)) >= 5) {
    return { error: `Too many attempts. Please wait ${LOGIN_WINDOW_MIN} minutes and try again.` };
  }
  const expected = process.env.SETUP_CODE ?? "";
  const given = str(fd, "code", 200);
  const codeOk =
    expected.length >= 16 && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  const values = { code: given };
  if (!codeOk) {
    await recordEvent("login-fail", ip);
    return { error: "That setup code is not correct.", values };
  }

  const password = String(fd.get("password") ?? "");
  if (password.length < MIN_PASSWORD) return { error: `Password must be at least ${MIN_PASSWORD} characters.`, values };
  if (password !== fd.get("confirm")) return { error: "Passwords don't match.", values };

  // Only saved if no password exists yet, so two people can't both set it.
  if (!(await setPassword(password, { onlyIfUnset: true }))) return { error: "The dashboard is already set up. Please sign in." };
  await startSession();
  redirect("/dashboard");
}

// ---------- Bookings ----------

type Transition = { from: string[]; to: string; email?: "confirmed" | "declined" | "cancelled" };
const transitions: Record<string, Transition> = {
  confirm: { from: ["pending"], to: "confirmed", email: "confirmed" },
  decline: { from: ["pending"], to: "declined", email: "declined" },
  cancel: { from: ["confirmed"], to: "cancelled", email: "cancelled" },
  complete: { from: ["confirmed"], to: "completed" },
};

export async function updateBooking(fd: FormData) {
  await requireStaff();
  const id = str(fd, "id", 36);
  const t = transitions[str(fd, "action", 20)];
  const reason = str(fd, "reason", 1000);
  if (!t) return;

  const [b] = await sql<{ ref: string; treatmentName: string; startsAt: Date; clientName: string; clientEmail: string }[]>`
    update bookings set status = ${t.to}, staff_note = ${reason}, updated_at = now()
    where id = ${id} and status in ${sql(t.from)}
    returning ref, treatment_name, starts_at, client_name, client_email`;

  if (b && t.email) {
    const summary = { ref: b.ref, treatmentName: b.treatmentName, when: formatDateTime(b.startsAt), clientName: b.clientName };
    const mail =
      t.email === "confirmed"
        ? emails.bookingConfirmed(summary)
        : t.email === "declined"
          ? emails.bookingDeclined({ ...summary, reason })
          : emails.bookingCancelled({ ...summary, reason });
    await sendEmail({ to: b.clientEmail, ...mail });
  }
  refresh();
}

// ---------- Treatments ----------

export async function saveTreatment(_prev: FormResult, fd: FormData): Promise<FormResult> {
  await requireStaff();
  const id = Number(fd.get("id")) || null;
  const name = str(fd, "name", 120);
  const category = str(fd, "category", 20);
  const section = str(fd, "section", 60);
  const description = str(fd, "description", 600);
  const durationMin = Number(fd.get("durationMin"));
  const priceRaw = str(fd, "price", 20).replace(/[R\s,]/gi, "");
  const priceCents = priceRaw === "" ? null : Math.round(Number(priceRaw) * 100);
  const active = fd.get("active") === "on";

  if (name.length < 2) return { error: "Name is required." };
  if (!["wellness", "skincare"].includes(category)) return { error: "Choose a category." };
  if (!Number.isInteger(durationMin) || durationMin < 10 || durationMin > 480) return { error: "Duration must be 10–480 minutes." };
  if (priceCents !== null && (!Number.isFinite(priceCents) || priceCents < 0)) return { error: "Price must be a number, e.g. 450 or 450.00." };

  if (id) {
    await sql`
      update treatments set name = ${name}, category = ${category}, section = ${section}, description = ${description},
        duration_min = ${durationMin}, price_cents = ${priceCents}, active = ${active}
      where id = ${id}`;
  } else {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await sql`
      insert into treatments (slug, name, category, section, description, duration_min, price_cents, active, sort)
      values (${`${base}-${Date.now().toString(36)}`}, ${name}, ${category}, ${section}, ${description}, ${durationMin}, ${priceCents}, ${active},
        (select coalesce(max(sort), 0) + 1 from treatments))`;
  }
  updateTag("treatments");
  refresh();
  return { ok: true };
}

// ---------- Hours ----------

export async function saveHours(_prev: FormResult, fd: FormData): Promise<FormResult> {
  await requireStaff();
  const rows: { weekday: number; opens: string | null; closes: string | null }[] = [];
  for (let d = 0; d < 7; d++) {
    const open = fd.get(`open-${d}`) === "on";
    const opens = str(fd, `opens-${d}`, 5);
    const closes = str(fd, `closes-${d}`, 5);
    if (open && !(/^\d{2}:\d{2}$/.test(opens) && /^\d{2}:\d{2}$/.test(closes) && opens < closes)) {
      return { error: "Each open day needs an opening time before its closing time." };
    }
    rows.push({ weekday: d, opens: open ? opens : null, closes: open ? closes : null });
  }
  await sql.begin(async (tx) => {
    for (const r of rows) {
      await tx`
        insert into opening_hours (weekday, opens, closes) values (${r.weekday}, ${r.opens}, ${r.closes})
        on conflict (weekday) do update set opens = excluded.opens, closes = excluded.closes`;
    }
  });
  updateTag("hours");
  refresh();
  return { ok: true };
}

export async function addClosure(fd: FormData) {
  await requireStaff();
  const day = str(fd, "day", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  await sql`insert into closures (day, note) values (${day}, ${str(fd, "note", 120)}) on conflict (day) do update set note = excluded.note`;
  updateTag("hours");
  refresh();
}

export async function removeClosure(fd: FormData) {
  await requireStaff();
  await sql`delete from closures where day = ${str(fd, "day", 10)}`;
  updateTag("hours");
  refresh();
}

// ---------- Enquiries ----------

export async function setEnquiryHandled(fd: FormData) {
  await requireStaff();
  await sql`update enquiries set handled = ${fd.get("handled") === "true"} where id = ${Number(fd.get("id"))}`;
  refresh();
}
