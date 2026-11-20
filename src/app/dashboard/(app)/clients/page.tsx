import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { searchClients } from "@/lib/clients";
import { FreshOnOpen } from "../../FreshOnOpen";
import { ClientList } from "./ClientList";

export const metadata: Metadata = { title: "Clients" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

export default async function ClientsPage() {
  await requireStaff();
  // The newest 50; searching happens in ClientList through a server action, so no name or phone is in the URL.
  const clients = await searchClients("");

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

      {/* Fresh on each visit: a search from earlier isn't shown when the list is opened again. */}
      <FreshOnOpen>
        <ClientList initial={clients} />
      </FreshOnOpen>

      <Link href="/dashboard/clients/therapists" className="text-link self-start">
        Therapist names
      </Link>
    </div>
  );
}
