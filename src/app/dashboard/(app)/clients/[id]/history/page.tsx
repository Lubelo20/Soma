import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { getCard, getDeletedEntries, getSectionHistory } from "@/lib/clients";
import { clinicDate, formatDate, formatDateTime } from "@/lib/slots";
import { restoreEntry } from "../../../../clients-actions";
import { HealthSummary, MassageSummary, SkinSummary } from "../../Summaries";

export const metadata: Metadata = { title: "Earlier versions" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

const SECTIONS = [
  { key: "health", title: "Health", View: HealthSummary },
  { key: "massage", title: "Massage", View: MassageSummary },
  { key: "skin", title: "Skin", View: SkinSummary },
] as const;

export default async function HistoryPage(props: PageProps<"/dashboard/clients/[id]/history">) {
  await requireStaff();
  const { id } = await props.params;
  const card = await getCard(id);
  if (!card) notFound();
  const [versions, deleted] = await Promise.all([getSectionHistory(card.client.id), getDeletedEntries(card.client.id)]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href={`/dashboard/clients/${card.client.id}`} className="text-sm text-gold-deep">
        ‹ Back to card
      </Link>
      <div>
        <span className="eyebrow">{card.client.fullName}</span>
        <h1 className="page-title">Earlier versions</h1>
      </div>

      {SECTIONS.map(({ key, title, View }) => {
        const mine = versions.filter((v) => v.section === key);
        return (
          <section key={key} className="flex flex-col gap-3">
            <h2 className="m-0 font-serif text-[22px] font-normal text-ink-strong">{title}</h2>
            {mine.length === 0 ? (
              <p className="m-0 text-sm text-ink-muted">No saved versions.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {mine.map((v, i) => (
                  <li key={`${v.savedAt.toISOString()}-${i}`} className="card flex flex-col gap-2 max-sm:p-4">
                    <p className="m-0 text-sm font-semibold text-ink-strong">
                      {formatDateTime(v.savedAt)}
                      {i === 0 && <span className="pill ml-2 bg-mint text-brand-dark">Current</span>}
                    </p>
                    <View answers={v.answers} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <section className="flex flex-col gap-3">
        <h2 className="m-0 font-serif text-[22px] font-normal text-ink-strong">Deleted treatment entries</h2>
        {deleted.length === 0 ? (
          <p className="m-0 text-sm text-ink-muted">No deleted entries.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {deleted.map((e) => (
              <li key={e.id} className="card flex flex-col gap-2 max-sm:p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-ink-strong">{formatDate(e.day, { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className="pill bg-slate-100 text-slate-700">{e.kind}</span>
                  {e.deletedAt && <span className="text-xs text-ink-subtle">removed {formatDate(clinicDate(e.deletedAt), { day: "numeric", month: "short", year: "numeric" })}</span>}
                </div>
                {e.products && <p className="m-0 text-[15px] break-words whitespace-pre-line">{e.products}</p>}
                {e.notes && <p className="m-0 text-[15px] break-words whitespace-pre-line">{e.notes}</p>}
                <form action={restoreEntry}>
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="clientId" value={card.client.id} />
                  <button type="submit" className="btn btn-line min-h-12 px-5 max-sm:w-full">
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
