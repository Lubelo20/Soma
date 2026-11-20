"use server";

import { refresh } from "next/cache";
import { audit } from "@/lib/audit";
import { SIGNED_OUT, requireStaff, staffCheck } from "@/lib/auth";
import { sql } from "@/lib/db";

export type ClientResult = {
  error?: string;
  ok?: boolean;
  id?: string;
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
