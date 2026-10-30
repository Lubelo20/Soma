"use server";

import { randomInt } from "node:crypto";
import { getActiveTreatments, getClosures, getWeeklyHours } from "@/lib/data";
import { sql } from "@/lib/db";
import { clientIp, countRecent, recordEvent } from "@/lib/rate-limit";
import { emails, sendEmail, staffInbox } from "@/lib/email";
import { enquiryKinds, type EnquiryKind } from "@/lib/site";
import { availableSlots, bookableDates, clinicTime, formatDate, weekday, type Busy } from "@/lib/slots";

const PHONE_RE = /^[+\d][\d\s()-]{7,19}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const field = (fd: FormData, name: string, max = 200) => String(fd.get(name) ?? "").trim().slice(0, max);
// Single-line fields (names, phones, emails) end up in email subjects and headers, so line breaks are removed.
const line = (fd: FormData, name: string, max = 200) => field(fd, name, max).replace(/[\x00-\x1f\x7f]+/g, " ");
// Form spam: each device (IP) can send this many bookings or enquiries per hour.
const PER_HOUR = 5;
const tooMany = "You've sent several requests in a short time. Please WhatsApp or call us instead.";

// ---------- Enquiries ----------

export type EnquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<"name" | "phone" | "email" | "interest", string>>;
  // Echoed back so the form keeps what the visitor typed after a failed submit.
  values?: Record<string, string>;
};

export async function sendEnquiry(kind: EnquiryKind, _prev: EnquiryState, fd: FormData): Promise<EnquiryState> {
  // Honeypot: real visitors never see or fill this field.
  if (fd.get("company")) return { status: "success" };
  if (!(kind in enquiryKinds)) return { status: "error", message: "Unknown form." };

  const values = {
    name: line(fd, "name"),
    phone: line(fd, "phone", 30),
    email: line(fd, "email"),
    interest: line(fd, "interest"),
    message: field(fd, "message", 2000),
  };
  const errors: EnquiryState["errors"] = {};
  if (values.name.length < 2) errors.name = "Please enter your name.";
  if (!PHONE_RE.test(values.phone)) errors.phone = "Please enter a valid phone number.";
  if (values.email && !EMAIL_RE.test(values.email)) errors.email = "Please enter a valid email address.";
  if (!(enquiryKinds[kind].interests as readonly string[]).includes(values.interest)) errors.interest = "Please choose an option.";
  if (Object.keys(errors).length) return { status: "error", errors, values };

  const ip = await clientIp();
  if ((await countRecent("enquiry", ip, 60)) >= PER_HOUR) return { status: "error", values, message: tooMany };
  await recordEvent("enquiry", ip);

  try {
    await sql`
      insert into enquiries (kind, name, phone, email, interest, message)
      values (${kind}, ${values.name}, ${values.phone}, ${values.email}, ${values.interest}, ${values.message})`;
  } catch (err) {
    console.error("[enquiry] save failed", err);
    return { status: "error", values, message: "Sorry, we couldn't send your enquiry. Please WhatsApp or call us instead." };
  }
  const mail = emails.staffNewEnquiry({ kind: enquiryKinds[kind].label, ...values });
  await sendEmail({ to: staffInbox(), ...mail, replyTo: values.email || undefined });
  return { status: "success" };
}

// ---------- Bookings ----------

async function busyOn(date: string): Promise<Busy[]> {
  const rows = await sql<{ startsAt: Date; endsAt: Date }[]>`
    select starts_at, ends_at from bookings
    where status in ('pending', 'confirmed', 'completed')
      and starts_at < ${clinicTime(date, "23:59")} and ends_at > ${clinicTime(date, "00:00")}`;
  return rows.map((r) => ({ start: r.startsAt, end: r.endsAt }));
}

async function slotsFor(treatmentId: number, date: string) {
  const [treatments, weekly, closures] = await Promise.all([getActiveTreatments(), getWeeklyHours(), getClosures()]);
  const treatment = treatments.find((t) => t.id === treatmentId);
  const now = new Date();
  const dates = bookableDates({ now, weekly, closures: closures.map((c) => c.day) });
  if (!treatment || !dates.includes(date)) return { treatment, slots: [] as string[] };
  const hours = weekly[weekday(date)];
  const slots = availableSlots({ date, hours, durationMin: treatment.durationMin, busy: await busyOn(date), now });
  return { treatment, slots };
}

export async function getSlots(treatmentId: number, date: string): Promise<string[]> {
  if (!Number.isInteger(treatmentId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  return (await slotsFor(treatmentId, date)).slots;
}

export type BookingState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<"name" | "phone" | "email" | "slot", string>>;
  booking?: { ref: string; treatmentName: string; when: string; email: string };
};

function newRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "IS-" + Array.from({ length: 6 }, () => chars[randomInt(chars.length)]).join("");
}

export async function createBooking(_prev: BookingState, fd: FormData): Promise<BookingState> {
  if (fd.get("company")) return { status: "error", message: "Something went wrong." };

  const treatmentId = Number(fd.get("treatmentId"));
  const date = field(fd, "date", 10);
  const time = field(fd, "time", 5);
  const name = line(fd, "name");
  const phone = line(fd, "phone", 30);
  const email = line(fd, "email").toLowerCase();
  const notes = field(fd, "notes", 1000);

  const errors: BookingState["errors"] = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!PHONE_RE.test(phone)) errors.phone = "Please enter a valid phone number.";
  if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email address.";
  if (Object.keys(errors).length) return { status: "error", errors };

  // Stops one person or bot holding many slots: a per-device hourly limit, and at most 3 upcoming
  // unconfirmed requests per email address.
  const ip = await clientIp();
  if ((await countRecent("booking", ip, 60)) >= PER_HOUR) return { status: "error", message: tooMany };
  const [{ pending }] = await sql<{ pending: number }[]>`
    select count(*)::int as pending from bookings where client_email = ${email} and status = 'pending' and starts_at > now()`;
  if (pending >= 3) {
    return { status: "error", message: "You already have 3 requests waiting for confirmation. We'll be in touch soon, or WhatsApp us." };
  }
  await recordEvent("booking", ip);

  const { treatment, slots } = await slotsFor(treatmentId, date);
  if (!treatment || !slots.includes(time)) {
    return { status: "error", errors: { slot: "Sorry, that time is no longer available. Please pick another." } };
  }

  const startsAt = clinicTime(date, time);
  const endsAt = new Date(startsAt.getTime() + treatment.durationMin * 60_000);
  const ref = newRef();
  try {
    await sql`
      insert into bookings (ref, treatment_id, treatment_name, starts_at, ends_at, client_name, client_phone, client_email, notes)
      values (${ref}, ${treatment.id}, ${treatment.name}, ${startsAt}, ${endsAt}, ${name}, ${phone}, ${email}, ${notes})`;
  } catch (err) {
    // 23P01 = exclusion violation: someone else took an overlapping slot a moment ago.
    if ((err as { code?: string }).code === "23P01") {
      return { status: "error", errors: { slot: "Sorry, that time was just taken. Please pick another." } };
    }
    console.error("[booking] insert failed", err);
    return { status: "error", message: "Sorry, we couldn't save your booking. Please WhatsApp or call us instead." };
  }

  const when = `${formatDate(date)} at ${time}`;
  const summary = { ref, treatmentName: treatment.name, when, clientName: name };
  await Promise.all([
    sendEmail({ to: email, ...emails.bookingReceived(summary) }),
    sendEmail({ to: staffInbox(), ...emails.staffNewBooking({ ...summary, phone, email, notes }), replyTo: email }),
  ]);
  return { status: "success", booking: { ref, treatmentName: treatment.name, when, email } };
}
