import "server-only";
import { headers } from "next/headers";
import { sql } from "./db";

export type RateKind = "login-fail" | "booking" | "enquiry";

// Created on first use too, so a deploy never depends on a migration having run first.
let ready: Promise<unknown> | undefined;
const ensureTable = () =>
  (ready ??= sql
    .unsafe(
      `create table if not exists rate_events (kind text not null, key text not null, at timestamptz not null default now());
       create index if not exists rate_events_lookup on rate_events (kind, key, at);`,
    )
    .catch((err) => {
      ready = undefined;
      throw err;
    }));

/** The visitor's IP address as reported by Vercel's edge ("local" in development). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

/** How many events of this kind and key happened in the last `minutes`. */
export async function countRecent(kind: RateKind, key: string, minutes: number) {
  await ensureTable();
  const [row] = await sql<{ n: number }[]>`
    select count(*)::int as n from rate_events
    where kind = ${kind} and key = ${key} and at > now() - make_interval(mins => ${minutes})`;
  return row.n;
}

export async function recordEvent(kind: RateKind, key: string) {
  await ensureTable();
  await sql`insert into rate_events (kind, key) values (${kind}, ${key})`;
  await sql`delete from rate_events where at < now() - interval '1 day'`;
}

export async function clearEvents(kind: RateKind, key: string) {
  await ensureTable();
  await sql`delete from rate_events where kind = ${kind} and key = ${key}`;
}
