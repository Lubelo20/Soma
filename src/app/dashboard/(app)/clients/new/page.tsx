import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { UUID_RE } from "@/lib/validation";
import { FreshOnOpen } from "../../../FreshOnOpen";
import { DetailsForm } from "../DetailsForm";

export const metadata: Metadata = { title: "New record card" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

export default async function NewRecordCardPage(props: PageProps<"/dashboard/clients/new">) {
  await requireStaff();
  const requested = (await props.searchParams).booking;
  const bookingId = typeof requested === "string" && UUID_RE.test(requested) ? requested : null;

  // From a booking, the name, phone and email are filled in; a booking that isn't found is ignored. A booking made
  // for someone else fills in the treated person's name and phone (if given) and no email: the email is the booker's.
  const [row] = bookingId
    ? await sql<{ clientName: string; clientPhone: string; clientEmail: string; forName: string; forPhone: string }[]>`
        select client_name, client_phone, client_email, for_name, for_phone from bookings where id = ${bookingId}`
    : [];
  const booking = row
    ? row.forName
      ? { clientName: row.forName, clientPhone: row.forPhone, clientEmail: "" }
      : { clientName: row.clientName, clientPhone: row.clientPhone, clientEmail: row.clientEmail }
    : undefined;

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
        {/* Each visit starts empty (or from this booking), never with the last client typed in. */}
        <FreshOnOpen>
          <DetailsForm
            initial={{
              fullName: booking?.clientName ?? "",
              phone: booking?.clientPhone ?? "",
              email: booking?.clientEmail ?? "",
              clientType: "first",
            }}
          />
        </FreshOnOpen>
      </div>
    </div>
  );
}
