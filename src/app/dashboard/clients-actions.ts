"use server";

import { refresh } from "next/cache";
import { audit } from "@/lib/audit";
import { SIGNED_OUT, requireStaff, staffCheck } from "@/lib/auth";
import { findDuplicates } from "@/lib/clients";
import { sql } from "@/lib/db";
import {
  BODY_AREAS,
  HEALTH_CONDITIONS,
  SKIN_ROWS,
  normalizePhone,
  parseHealth,
  parseMassage,
  parseSkin,
  type HealthAnswers,
  type MassageAnswers,
  type SkinAnswers,
} from "@/lib/record-card";
import { clinicDate } from "@/lib/slots";
import { EMAIL_RE, PHONE_RE } from "@/lib/validation";

export type ClientResult = {
  error?: string;
  ok?: boolean;
  id?: string;
  // Other cards with the same phone or ID number, returned with error "duplicate".
  duplicates?: { id: string; fullName: string }[];
  // Echoed back on errors so forms keep what was typed.
  values?: Record<string, string>;
};

// ---------- Therapist names ----------

export async function saveTherapist(_prev: ClientResult, fd: FormData): Promise<ClientResult> {
  const name = String(fd.get("name") ?? "").trim().replace(/\s+/g, " ");
  const values = { name };
  if (!(await staffCheck())) return { error: SIGNED_OUT, values };
  const id = Number(fd.get("id")) || null;

  if (name.length < 2 || name.length > 60) return { error: "Name must be 2–60 characters.", values };
  const [clash] = await sql`select 1 from therapists where active and lower(name) = lower(${name}) and id is distinct from ${id}`;
  if (clash) return { error: "That name is already on the list.", values };

  let savedId: number;
  if (id) {
    const [row] = await sql<{ id: number }[]>`update therapists set name = ${name} where id = ${id} returning id`;
    if (!row) return { error: "That therapist no longer exists." };
    savedId = row.id;
  } else {
    const [row] = await sql<{ id: number }[]>`insert into therapists (name) values (${name}) returning id`;
    savedId = row.id;
  }
  audit("therapist saved", { id: savedId });
  refresh();
  return { ok: true };
}

export async function setTherapistActive(fd: FormData) {
  await requireStaff();
  const id = Number(fd.get("id"));
  const active = fd.get("active") === "true";
  if (!Number.isInteger(id)) return;
  const [row] = await sql<{ id: number }[]>`update therapists set active = ${active} where id = ${id} returning id`;
  if (row) audit(active ? "therapist restored" : "therapist removed", { id: row.id });
  refresh();
}

// ---------- Client details ----------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A real YYYY-MM-DD calendar date (rejects 2026-02-31). */
function isRealDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const text = (fd: FormData, name: string) => String(fd.get(name) ?? "");
// Single-line fields: control characters (including line breaks) are removed.
const oneLine = (fd: FormData, name: string) => text(fd, name).replace(/[\x00-\x1f\x7f]+/g, " ").trim();

export async function saveDetails(_prev: ClientResult, fd: FormData): Promise<ClientResult> {
  const today = clinicDate(new Date());
  const rawId = text(fd, "id").trim();
  const values: Record<string, string> = {
    ...(rawId ? { id: rawId } : {}),
    fullName: oneLine(fd, "fullName").replace(/\s+/g, " "),
    phone: oneLine(fd, "phone"),
    email: oneLine(fd, "email").toLowerCase(),
    idNumber: oneLine(fd, "idNumber"),
    dateOfBirth: text(fd, "dateOfBirth").trim(),
    gender: oneLine(fd, "gender"),
    address: oneLine(fd, "address"),
    emergencyContact: oneLine(fd, "emergencyContact"),
    occupation: oneLine(fd, "occupation"),
    initialAppointment: text(fd, "initialAppointment").trim() || today,
    clientType: text(fd, "clientType").trim() || "first",
  };
  if (!(await staffCheck())) return { error: SIGNED_OUT, values };

  const v = values;
  if (rawId && !UUID.test(rawId)) return { error: "That record card no longer exists.", values };
  const id = rawId || null;

  let error: string | null = null;
  if (v.fullName.length < 2 || v.fullName.length > 120) error = "Please enter the client's full name.";
  else if (v.phone.length > 30 || !PHONE_RE.test(v.phone)) error = "Please enter a valid phone number.";
  else if (v.email.length > 200 || (v.email && !EMAIL_RE.test(v.email))) error = "Please enter a valid email address.";
  else if (v.idNumber.length > 30) error = "The ID number is too long (30 characters at most).";
  else if (v.dateOfBirth && (!isRealDate(v.dateOfBirth) || v.dateOfBirth > today)) error = "Please enter a valid date of birth.";
  else if (v.gender.length > 30) error = "Gender is too long (30 characters at most).";
  else if (v.address.length > 300) error = "The address is too long (300 characters at most).";
  else if (v.emergencyContact.length > 200) error = "The emergency contact is too long (200 characters at most).";
  else if (v.occupation.length > 100) error = "Occupation is too long (100 characters at most).";
  else if (!isRealDate(v.initialAppointment)) error = "Please enter a valid date for the initial appointment.";
  else if (v.clientType !== "first" && v.clientType !== "returning") error = "Please choose first-time or returning client.";
  if (error) return { error, values };

  const phoneDigits = normalizePhone(v.phone);
  const dob = v.dateOfBirth || null;

  let existing: { phoneDigits: string; idNumber: string } | undefined;
  if (id) {
    [existing] = await sql<{ phoneDigits: string; idNumber: string }[]>`select phone_digits, id_number from clients where id = ${id}`;
    if (!existing) return { error: "That record card no longer exists.", values };
  }

  // Warn about another card with the same phone or ID number, unless staff said it is a different person.
  // On an existing card this only runs when one of those two was changed.
  const changed = !existing || existing.phoneDigits !== phoneDigits || existing.idNumber !== v.idNumber;
  if (changed && text(fd, "differentPerson") !== "on") {
    const duplicates = await findDuplicates({ phone: v.phone, idNumber: v.idNumber, excludeId: id ?? undefined });
    if (duplicates.length > 0) return { error: "duplicate", duplicates, values };
  }

  let savedId: string;
  if (id) {
    const [row] = await sql<{ id: string }[]>`
      update clients set full_name = ${v.fullName}, phone = ${v.phone}, phone_digits = ${phoneDigits}, email = ${v.email},
        id_number = ${v.idNumber}, date_of_birth = ${dob}, gender = ${v.gender}, address = ${v.address},
        emergency_contact = ${v.emergencyContact}, occupation = ${v.occupation},
        initial_appointment = ${v.initialAppointment}, client_type = ${v.clientType}, updated_at = now()
      where id = ${id} returning id`;
    if (!row) return { error: "That record card no longer exists.", values };
    savedId = row.id;
  } else {
    const [row] = await sql<{ id: string }[]>`
      insert into clients (full_name, phone, phone_digits, email, id_number, date_of_birth, gender, address,
        emergency_contact, occupation, initial_appointment, client_type)
      values (${v.fullName}, ${v.phone}, ${phoneDigits}, ${v.email}, ${v.idNumber}, ${dob}, ${v.gender}, ${v.address},
        ${v.emergencyContact}, ${v.occupation}, ${v.initialAppointment}, ${v.clientType})
      returning id`;
    savedId = row.id;
  }
  audit(id ? "client details updated" : "client added", { id: savedId });
  refresh();
  return { ok: true, id: savedId };
}

// ---------- Health, massage and skin sections ----------

type Section = "health" | "massage" | "skin";
const SECTIONS: readonly Section[] = ["health", "massage", "skin"];

const PARSERS = { health: parseHealth, massage: parseMassage, skin: parseSkin } as const;

/**
 * Stored answers written back as form fields, with ticked options in their defined order, so they can be run
 * through the same parser as a fresh save. Anything unexpected in an older row is simply dropped.
 */
function asFormData(section: Section, answers: unknown): FormData {
  const fd = new FormData();
  const a = (answers ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  if (section === "health") {
    const h = a as Partial<HealthAnswers>;
    for (const { key } of HEALTH_CONDITIONS) {
      const entry = h[key];
      if (entry?.answer) fd.set(`health.${key}`, str(entry.answer));
      fd.set(`health.${key}.note`, str(entry?.note));
    }
  } else if (section === "skin") {
    const sk = a as Partial<SkinAnswers>;
    for (const row of SKIN_ROWS) {
      const entry = sk[row.key];
      const picked = new Set(Array.isArray(entry?.selected) ? entry.selected : []);
      for (const o of row.options) if (picked.has(o.value)) fd.append(`skin.${row.key}`, o.value);
      fd.set(`skin.${row.key}.note`, str(entry?.note));
      fd.set(`skin.${row.key}.other`, str(entry?.other));
    }
  } else {
    const m = a as Partial<MassageAnswers>;
    const picked = new Set(Array.isArray(m.areas) ? m.areas : []);
    for (const area of BODY_AREAS) if (picked.has(area.id)) fd.append("massage.areas", area.id);
    fd.set("massage.notes", str(m.notes));
  }
  return fd;
}

/** Parsed answers in one fixed shape and key order, so equal answers always give equal JSON. */
const canonical = (section: Section, answers: unknown) => PARSERS[section](asFormData(section, answers));

/**
 * Saves one section of a record card. Sections are append-only: a new version is added only when the answers
 * differ from the newest saved version, so pressing Next without changes adds nothing. Answers are never logged.
 */
export async function saveSection(section: Section, _prev: ClientResult, fd: FormData): Promise<ClientResult> {
  if (!(await staffCheck())) return { error: SIGNED_OUT };
  if (!SECTIONS.includes(section)) return { error: "That section doesn't exist." };
  const id = String(fd.get("clientId") ?? "").trim();
  if (!UUID.test(id)) return { error: "That record card no longer exists." };

  const answers = canonical(section, PARSERS[section](fd));
  const json = JSON.stringify(answers);

  const outcome = await sql.begin(async (tx) => {
    // Locks the card so two saves of the same section can't both add a version.
    const [client] = await tx`select id from clients where id = ${id} for update`;
    if (!client) return "missing" as const;
    const [newest] = await tx<{ answers: unknown }[]>`
      select answers from client_sections where client_id = ${id} and section = ${section}
      order by saved_at desc, id desc limit 1`;
    if (newest && JSON.stringify(canonical(section, newest.answers)) === json) return "unchanged" as const;
    await tx`insert into client_sections (client_id, section, answers) values (${id}, ${section}, ${tx.json(JSON.parse(json))})`;
    await tx`update clients set updated_at = now() where id = ${id}`;
    return "saved" as const;
  });

  if (outcome === "missing") return { error: "That record card no longer exists." };
  if (outcome === "saved") {
    audit("client section saved", { id, section });
    refresh();
  }
  return { ok: true, id };
}
