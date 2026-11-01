import "server-only";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { sql } from "./db";
import { SESSION_COOKIE as COOKIE } from "./session-cookie";

// A session ends after 12 hours without dashboard activity (the database expiry slides forward on each
// request), and after 30 days at most, when the cookie itself expires.
const SESSION_DAYS = 30;
const IDLE_HOURS = 12;

const PASSWORD_KEY = "dashboard_password_hash";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Compared against when no password is set yet, so a failed sign-in takes the same time either way.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

async function passwordHash(): Promise<string | null> {
  const [row] = await sql<{ value: string }[]>`select value from settings where key = ${PASSWORD_KEY}`;
  return row?.value ?? null;
}

export async function hasPassword() {
  return (await passwordHash()) !== null;
}

/** Checks a password against the one shared staff password. */
export async function verifyPassword(password: string) {
  const hash = await passwordHash();
  const ok = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return hash !== null && ok;
}

export async function startSession() {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await sql`insert into sessions (token_hash, expires_at) values (${hashToken(token)}, now() + make_interval(hours => ${IDLE_HOURS}))`;
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

// Cached per request: the layout, page and actions all ask, but the session is checked (and its idle
// expiry extended) once.
export const isSignedIn = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const [row] = await sql`
    update sessions set expires_at = now() + make_interval(hours => ${IDLE_HOURS})
    where token_hash = ${hashToken(token)} and expires_at > now()
    returning 1`;
  return Boolean(row);
});

/** Use at the top of every dashboard page and server action. */
export async function requireStaff() {
  if (!(await isSignedIn())) redirect("/dashboard/login");
}

export const MIN_PASSWORD = 12;

/** Sets the shared password. With onlyIfUnset, does nothing (and returns false) if one already exists. */
export async function setPassword(password: string, { onlyIfUnset = false } = {}) {
  const hash = await bcrypt.hash(password, 12);
  const rows = onlyIfUnset
    ? await sql`insert into settings (key, value) values (${PASSWORD_KEY}, ${hash}) on conflict (key) do nothing returning key`
    : await sql`insert into settings (key, value) values (${PASSWORD_KEY}, ${hash}) on conflict (key) do update set value = excluded.value returning key`;
  return rows.length > 0;
}

/** Changes the shared password and signs out every other device, so whoever no longer knows it loses access. */
export async function changePassword(current: string, next: string) {
  if (!(await verifyPassword(current))) return false;
  await setPassword(next);
  const token = (await cookies()).get(COOKIE)?.value ?? "";
  await sql`delete from sessions where token_hash <> ${hashToken(token)}`;
  return true;
}
