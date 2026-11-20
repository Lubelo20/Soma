import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { getCard } from "@/lib/clients";
import { clinicDate, formatDate } from "@/lib/slots";
import { FreshOnOpen } from "../../FreshOnOpen";
import { SignatureForm } from "./SignatureForm";

export const metadata: Metadata = { title: "Consent" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

// The client holds the phone on this screen, so only their first name is shown: nothing else from the card.
export default async function SignPage(props: PageProps<"/dashboard/sign/[id]">) {
  await requireStaff();
  const { id } = await props.params;
  const card = await getCard(id);
  if (!card) notFound();

  const firstName = card.client.fullName.trim().split(/\s+/)[0] ?? "";
  const today = formatDate(clinicDate(new Date()), { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-serif text-[32px] leading-tight font-light text-ink-strong sm:text-[38px]">Consent for {firstName}</h1>
        <p className="m-0 text-[16px] text-ink-body">Please read each statement, tick it, then add your initials and signature.</p>
      </div>
      <FreshOnOpen>
        <SignatureForm clientId={card.client.id} today={today} />
      </FreshOnOpen>
    </div>
  );
}
