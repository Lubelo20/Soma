import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { DetailsForm } from "../DetailsForm";

export const metadata: Metadata = { title: "New record card" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewRecordCardPage(props: PageProps<"/dashboard/clients/new">) {
  await requireStaff();
  const requested = (await props.searchParams).booking;
  const bookingId = typeof requested === "string" && UUID.test(requested) ? requested : null;

  // From a booking, the name, phone and email are filled in; a booking that isn't found is ignored.
  const [booking] = bookingId
    ? await sql<{ clientName: string; clientPhone: string; clientEmail: string }[]>`
        select client_name, client_phone, client_email from bookings where id = ${bookingId}`
    : [];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/dashboard/clients" className="text-sm text-gold-deep">
        ‹ Clients
      </Link>
      <div>
        <span className="eyebrow">Client details</span>
        <h1 className="page-title">New record card</h1>
      </div>
      <div className="card">
        <DetailsForm
          initial={{
            fullName: booking?.clientName ?? "",
            phone: booking?.clientPhone ?? "",
            email: booking?.clientEmail ?? "",
            clientType: "first",
          }}
        />
      </div>
    </div>
  );
}
