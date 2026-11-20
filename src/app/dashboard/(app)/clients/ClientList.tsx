"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ClientListItem } from "@/lib/clients";
import { CONNECTION_ERROR } from "@/lib/form-messages";
import { formatDate } from "@/lib/slots";
import { searchClientsAction } from "../../clients-actions";
import { useHydrated } from "../../useHydrated";

const LIMIT = 50; // searchClients returns at most this many
const DEBOUNCE_MS = 300;

/**
 * The client list with its search. The search runs through a server action, never a ?q= link, so a name or phone
 * number is never in a URL or the browser history. With no search term the list is the server's newest 50.
 */
export function ClientList({ initial }: { initial: ClientListItem[] }) {
  const hydrated = useHydrated();
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ term: string; clients: ClientListItem[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const latest = useRef(0); // only the newest search's answer is shown
  const timer = useRef<number | undefined>(undefined);

  const term = q.trim();

  function search(value: string) {
    window.clearTimeout(timer.current);
    const t = value.trim();
    if (t === "") return;
    const n = ++latest.current;
    startTransition(async () => {
      try {
        const res = await searchClientsAction(t);
        if (n !== latest.current) return;
        if (res.clients) {
          setFound({ term: t, clients: res.clients });
          setError(null);
        } else {
          setError(res.error ?? CONNECTION_ERROR);
        }
      } catch {
        if (n === latest.current) setError(CONNECTION_ERROR);
      }
    });
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const clients = term === "" ? initial : found?.term === term ? found.clients : null;

  return (
    <>
      <form
        method="post"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (hydrated) search(q);
        }}
        className="flex gap-2"
      >
        <input
          type="search"
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            setError(null);
            window.clearTimeout(timer.current);
            if (value.trim() !== "") timer.current = window.setTimeout(() => search(value), DEBOUNCE_MS);
          }}
          placeholder="Search name or phone"
          aria-label="Search name or phone"
          maxLength={100}
          autoComplete="off"
          className="field min-w-0 flex-1"
        />
        <button type="submit" disabled={!hydrated} className="btn btn-line min-h-12 px-5">
          Search
        </button>
      </form>

      {error && (
        <p role="alert" className="m-0 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {clients === null ? (
        <p className="m-0 text-sm text-ink-muted" role="status">
          {pending ? "Searching…" : ""}
        </p>
      ) : clients.length === 0 ? (
        <p className="note">{term ? "No record cards match that search." : "No record cards yet."}</p>
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-busy={pending}>
            {clients.map((c) => (
              <li key={c.id} className="card flex flex-col gap-2 p-0">
                <Link href={`/dashboard/clients/${c.id}`} className="flex min-h-14 flex-col gap-1 px-4 py-3 no-underline sm:px-6">
                  <span className="font-semibold text-ink-strong">{c.fullName}</span>
                  <span className="text-sm text-ink-muted">
                    {c.phone} ·{" "}
                    {c.lastVisit ? `Last visit ${formatDate(c.lastVisit, { day: "numeric", month: "short", year: "numeric" })}` : "No visits yet"}
                  </span>
                  {(c.warnings.length > 0 || c.healthIncomplete) && (
                    <span className="flex flex-wrap gap-1.5 pt-1">
                      {c.warnings.slice(0, 2).map((w) => (
                        <span key={w} className="pill bg-amber-100 text-amber-900">
                          <span aria-hidden="true">⚠ </span>
                          {w}
                        </span>
                      ))}
                      {c.warnings.length > 2 && <span className="pill bg-slate-100 text-slate-700">+{c.warnings.length - 2} more</span>}
                      {c.healthIncomplete && <span className="pill bg-slate-100 text-slate-700">Health incomplete</span>}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {clients.length === LIMIT && <p className="m-0 text-sm text-ink-muted">Showing the first 50. Search to find others.</p>}
        </>
      )}
    </>
  );
}
