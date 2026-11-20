import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { getCard } from "@/lib/clients";
import { FreshOnOpen } from "../../../../FreshOnOpen";
import { CardWizard, type Step } from "../../CardWizard";

export const metadata: Metadata = { title: "Edit record card" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

const STEPS: readonly Step[] = ["details", "health", "massage", "skin"];

export default async function EditRecordCardPage(props: PageProps<"/dashboard/clients/[id]/edit">) {
  await requireStaff();
  const { id } = await props.params;
  const requested = (await props.searchParams).step;
  const step = STEPS.find((s) => s === requested) ?? "health";

  const card = await getCard(id);
  if (!card) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <FreshOnOpen>
        <CardWizard
          client={card.client}
          health={card.health}
          massage={card.massage}
          skin={card.skin}
          initialStep={step}
          heading={
            <div>
              <span className="eyebrow">Record card</span>
              <h1 className="page-title">{card.client.fullName}</h1>
            </div>
          }
        />
      </FreshOnOpen>
    </div>
  );
}
