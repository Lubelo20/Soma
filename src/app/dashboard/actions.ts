"use server";

import { timingSafeEqual } from "node:crypto";
import { del } from "@vercel/blob";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { MIN_PASSWORD, changePassword, endSession, requireStaff, setPassword, startSession, verifyPassword } from "@/lib/auth";
import { formatPrice } from "@/lib/data";
import { sql } from "@/lib/db";
import { clearEvents, clientIp, countRecent, recordEvent } from "@/lib/rate-limit";
import { emails, sendEmail } from "@/lib/email";
import { isBlobUrl } from "@/lib/poster";
import { parsePriceCents } from "@/lib/price";
import { formatDateTime } from "@/lib/slots";

export type FormResult = {
  error?: string;
  ok?: boolean;
  // Echoed back on errors so forms keep what was typed (never includes passwords).
  values?: Record<string, string>;
};

const str = (fd: FormData, name: string, max = 500) => String(fd.get(name) ?? "").trim().slice(0, max);

// Audit trail in the hosting logs (Vercel → Logs): sign-ins and every staff change, with no client details.
const audit = (event: string, detail: Record<string, string | number | boolean> = {}) => console.info(`[audit] ${event}`, JSON.stringify(detail));

// ---------- Auth ----------

// Password guessing: 5 wrong tries per device (IP) and 50 overall in 15 minutes, then sign-in pauses.
const LOGIN_WINDOW_MIN = 15;

export async function login(_prev: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  const ip = await clientIp();
  const [mine, everyone] = await Promise.all([
    countRecent("login-fail", ip, LOGIN_WINDOW_MIN),
    countRecent("login-fail", "*", LOGIN_WINDOW_MIN),
  ]);
  if (mine >= 5 || everyone >= 50) {
    audit("sign-in blocked", { ip });
    return { error: `Too many attempts. Please wait ${LOGIN_WINDOW_MIN} minutes and try again.` };
  }
  if (!(await verifyPassword(String(fd.get("password") ?? "")))) {
    await Promise.all([recordEvent("login-fail", ip), recordEvent("login-fail", "*")]);
    audit("sign-in failed", { ip });
    return { error: "Incorrect password." };
  }
  await clearEvents("login-fail", ip);
  audit("signed in", { ip });
  await startSession();
  redirect("/dashboard");
}

export async function logout() {
  await endSession();
  audit("signed out");
  redirect("/dashboard/login");
}

export async function updatePassword(_prev: FormResult, fd: FormData): Promise<FormResult> {
  await requireStaff();
  const next = String(fd.get("next") ?? "");
  if (next.length < MIN_PASSWORD) return { error: `New password must be at least ${MIN_PASSWORD} characters.` };
  if (next !== fd.get("confirm")) return { error: "New passwords don't match." };
  const ok = await changePassword(String(fd.get("current") ?? ""), next);
  audit(ok ? "password changed" : "password change refused: wrong current password");
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
    audit("setup code rejected", { ip });
    return { error: "That setup code is not correct.", values };
  }

  const password = String(fd.get("password") ?? "");
  if (password.length < MIN_PASSWORD) return { error: `Password must be at least ${MIN_PASSWORD} characters.`, values };
  if (password !== fd.get("confirm")) return { error: "Passwords don't match.", values };

  // Only saved if no password exists yet, so two people can't both set it.
  if (!(await setPassword(password, { onlyIfUnset: true }))) return { error: "The dashboard is already set up. Please sign in." };
  audit("dashboard set up", { ip });
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

  const [b] = await sql<{ ref: string; treatmentName: string; startsAt: Date; clientName: string; clientEmail: string; isSpecial: boolean; bookedPriceCents: number | null }[]>`
    update bookings set status = ${t.to}, staff_note = ${reason}, updated_at = now()
    where id = ${id} and status in ${sql(t.from)}
    returning ref, treatment_name, starts_at, client_name, client_email, is_special, booked_price_cents`;

  if (b) audit(`booking ${t.to}`, { ref: b.ref });
  if (b && t.email) {
    const summary = {
      ref: b.ref,
      treatmentName: b.treatmentName,
      when: formatDateTime(b.startsAt),
      clientName: b.clientName,
      // From the booking, not the treatment: the special may have changed or been deleted since.
      specialPrice: b.isSpecial ? formatPrice(b.bookedPriceCents) : undefined,
    };
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
  const price = parsePriceCents(str(fd, "price", 20));
  const active = fd.get("active") === "on";

  if (name.length < 2) return { error: "Name is required." };
  if (!["wellness", "skincare"].includes(category)) return { error: "Choose a category." };
  if (!Number.isInteger(durationMin) || durationMin < 10 || durationMin > 480) return { error: "Duration must be 10–480 minutes." };
  if (!price.ok) return { error: "Price must be a number, e.g. 450 or 450,50." };
  const priceCents = price.cents;

  if (id) {
    await sql`
      update treatments set name = ${name}, category = ${category}, section = ${section}, description = ${description},
        duration_min = ${durationMin}, price_cents = ${priceCents}, active = ${active}
      where id = ${id} and category <> 'special'`;
  } else {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await sql`
      insert into treatments (slug, name, category, section, description, duration_min, price_cents, active, sort)
      values (${`${base}-${Date.now().toString(36)}`}, ${name}, ${category}, ${section}, ${description}, ${durationMin}, ${priceCents}, ${active},
        (select coalesce(max(sort), 0) + 1 from treatments))`;
  }
  audit(id ? "treatment updated" : "treatment added", { name, priceCents: priceCents ?? "on request", active });
  updateTag("treatments");
  refresh();
  return { ok: true };
}

/** Removes a treatment for good. Bookings keep their own copy of its name, and their link to it is cleared. */
export async function deleteTreatment(fd: FormData) {
  await requireStaff();
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return;
  const [t] = await sql<{ name: string }[]>`delete from treatments where id = ${id} and category <> 'special' returning name`;
  if (t) audit("treatment deleted", { name: t.name });
  updateTag("treatments");
  refresh();
}

// ---------- Specials ----------

// A leftover file costs little, so a failed clean-up never fails what staff were doing.
async function removePoster(url: string | null | undefined) {
  if (!url || !isBlobUrl(url)) return;
  try {
    await del(url);
  } catch (err) {
    console.error("[specials] couldn't remove old poster", err);
  }
}

export async function saveSpecial(_prev: FormResult, fd: FormData): Promise<FormResult> {
  await requireStaff();
  const id = Number(fd.get("id")) || null;
  const name = str(fd, "name", 120);
  const durationMin = Number(fd.get("durationMin"));
  const price = parsePriceCents(str(fd, "price", 20));
  const posterUrl = str(fd, "posterUrl", 1000);

  if (name.length < 2) return { error: "Name is required." };
  if (!price.ok || price.cents === null) return { error: "Enter the package price from the poster, e.g. 1489 or 1462,50." };
  if (!Number.isInteger(durationMin) || durationMin < 10 || durationMin > 480) return { error: "First session must be 10–480 minutes." };
  if (!isBlobUrl(posterUrl)) return { error: "Please upload a poster." };

  if (id) {
    const [old] = await sql<{ posterUrl: string | null }[]>`select poster_url from treatments where id = ${id} and category = 'special'`;
    if (!old) return { error: "That special no longer exists." };
    await sql`
      update treatments set name = ${name}, duration_min = ${durationMin}, price_cents = ${price.cents}, poster_url = ${posterUrl}
      where id = ${id} and category = 'special'`;
    if (old.posterUrl !== posterUrl) await removePoster(old.posterUrl);
  } else {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    // Starts switched off, so nothing appears on the website until someone chooses to show it.
    await sql`
      insert into treatments (slug, name, category, section, duration_min, price_cents, poster_url, active, sort)
      values (${`special-${base}-${Date.now().toString(36)}`}, ${name}, 'special', 'Specials', ${durationMin}, ${price.cents}, ${posterUrl}, false,
        (select coalesce(max(sort), 0) + 1 from treatments))`;
  }
  audit(id ? "special updated" : "special added", { name, priceCents: price.cents });
  updateTag("treatments");
  refresh();
  return { ok: true };
}

export async function setSpecialActive(fd: FormData) {
  await requireStaff();
  const id = Number(fd.get("id"));
  const active = fd.get("active") === "true";
  if (!Number.isInteger(id)) return;
  const [s] = await sql<{ name: string }[]>`update treatments set active = ${active} where id = ${id} and category = 'special' returning name`;
  if (s) audit(active ? "special switched on" : "special switched off", { name: s.name });
  updateTag("treatments");
  refresh();
}

export async function deleteSpecial(fd: FormData) {
  await requireStaff();
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return;
  const [s] = await sql<{ name: string; posterUrl: string | null }[]>`delete from treatments where id = ${id} and category = 'special' returning name, poster_url`;
  if (s) {
    audit("special deleted", { name: s.name });
    await removePoster(s.posterUrl);
  }
  updateTag("treatments");
  refresh();
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
  audit("opening hours updated");
  updateTag("hours");
  refresh();
  return { ok: true };
}

export async function addClosure(fd: FormData) {
  await requireStaff();
  const day = str(fd, "day", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  audit("closure added", { day });
  await sql`insert into closures (day, note) values (${day}, ${str(fd, "note", 120)}) on conflict (day) do update set note = excluded.note`;
  updateTag("hours");
  refresh();
}

export async function removeClosure(fd: FormData) {
  await requireStaff();
  await sql`delete from closures where day = ${str(fd, "day", 10)}`;
  audit("closure removed", { day: str(fd, "day", 10) });
  updateTag("hours");
  refresh();
}

// ---------- Enquiries ----------

export async function setEnquiryHandled(fd: FormData) {
  await requireStaff();
  audit("enquiry marked", { id: Number(fd.get("id")), handled: fd.get("handled") === "true" });
  await sql`update enquiries set handled = ${fd.get("handled") === "true"} where id = ${Number(fd.get("id"))}`;
  refresh();
}
