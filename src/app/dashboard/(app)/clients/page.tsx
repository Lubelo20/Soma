import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { searchClients } from "@/lib/clients";
import { formatDate } from "@/lib/slots";

export const metadata: Metadata = { title: "Clients" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

export default async function ClientsPage(props: PageProps<"/dashboard/clients">) {
  await requireStaff();
  const requested = (await props.searchParams).q;
  const q = (typeof requested === "string" ? requested : "").trim().slice(0, 100);
  const clients = await searchClients(q);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Record cards</span>
          <h1 className="page-title">Clients</h1>
        </div>
        <Link href="/dashboard/clients/new" className="btn btn-solid min-h-11 px-5">
          New record card
        </Link>
      </div>

      <form action="/dashboard/clients" method="get" role="search" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name or phone"
          aria-label="Search name or phone"
          maxLength={100}
          autoComplete="off"
          className="field min-w-0 flex-1"
        />
        <button type="submit" className="btn btn-line min-h-12 px-5">
          Search
        </button>
      </form>

      {clients.length === 0 ? (
        <p className="note">{q ? "No record cards match that search." : "No record cards yet."}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {clients.map((c) => (
            <li key={c.id} className="card flex flex-col gap-2 p-0">
              <Link href={`/dashboard/clients/${c.id}`} className="flex min-h-14 flex-col gap-1 px-4 py-3 no-underline sm:px-6">
                <span className="font-semibold text-ink-strong">{c.fullName}</span>
                <span className="text-sm text-ink-muted">
                  {c.phone} · {c.lastVisit ? `Last visit ${formatDate(c.lastVisit, { day: "numeric", month: "short", year: "numeric" })}` : "No visits yet"}
                </span>
                {c.warnings.length > 0 && (
                  <span className="flex flex-wrap gap-1.5 pt-1">
                    {c.warnings.slice(0, 2).map((w) => (
                      <span key={w} className="pill bg-amber-100 text-amber-900">
                        <span aria-hidden="true">⚠ </span>
                        {w}
                      </span>
                    ))}
                    {c.warnings.length > 2 && <span className="pill bg-slate-100 text-slate-700">+{c.warnings.length - 2} more</span>}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/dashboard/clients/therapists" className="text-link self-start">
        Therapist names
      </Link>
    </div>
  );
}
