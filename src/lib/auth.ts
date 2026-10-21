import "server-only";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";

const COOKIE = "soma_session";
const SESSION_DAYS = 30;

export type Staff = { id: number; email: string; name: string };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Compared against when the email is unknown, so failed logins take the same time either way.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function verifyLogin(email: string, password: string): Promise<Staff | null> {
  const [row] = await sql<(Staff & { passwordHash: string })[]>`
    select id, email, name, password_hash from staff where email = ${email.trim().toLowerCase()}`;
  const ok = await bcrypt.compare(password, row?.passwordHash ?? DUMMY_HASH);
  return row && ok ? { id: row.id, email: row.email, name: row.name } : null;
}

export async function startSession(staffId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await sql`insert into sessions (token_hash, staff_id, expires_at) values (${hashToken(token)}, ${staffId}, ${expires})`;
  await sql`delete from sessions where expires_at < now()`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await sql`delete from sessions where token_hash = ${hashToken(token)}`;
  jar.delete(COOKIE);
}

export async function currentStaff(): Promise<Staff | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await sql<Staff[]>`
    select s.id, s.email, s.name from sessions x join staff s on s.id = x.staff_id
    where x.token_hash = ${hashToken(token)} and x.expires_at > now()`;
  return row ?? null;
}

/** Use at the top of every dashboard page and server action. */
export async function requireStaff(): Promise<Staff> {
  const staff = await currentStaff();
  if (!staff) redirect("/dashboard/login");
  return staff;
}

export async function changePassword(staffId: number, current: string, next: string) {
  const [row] = await sql<{ passwordHash: string }[]>`select password_hash from staff where id = ${staffId}`;
  if (!row || !(await bcrypt.compare(current, row.passwordHash))) return false;
  await sql`update staff set password_hash = ${await bcrypt.hash(next, 12)} where id = ${staffId}`;
  return true;
}
