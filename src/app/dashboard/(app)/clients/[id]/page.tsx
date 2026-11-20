import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { getCard, listTherapists } from "@/lib/clients";
import { sameName, unansweredHealthCount } from "@/lib/record-card";
import { clinicDate, formatDate, formatDateTime } from "@/lib/slots";
import { deleteClient, deleteEntry } from "../../../clients-actions";
import { StatusPill, whatsappLink, type BookingStatus } from "../../BookingActions";
import { DetailsSummary, HealthSummary, MassageSummary, SignatureView, SkinSummary, SnapshotView } from "../Summaries";
import { TreatmentEntryForm } from "../TreatmentEntryForm";
import { UnsavedDraftBanner } from "../UnsavedDraftBanner";

export const metadata: Metadata = { title: "Record card" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

const SHORT_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
// Consent rows come from jsonb: only string statements are shown, so a malformed row can't break the page.
const statementsOf = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function Section({ title, edit, updated, children }: { title: string; edit?: string; updated?: Date; children: React.ReactNode }) {
  return (
    <section className="card flex flex-col gap-3 max-sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="m-0 font-serif text-[22px] font-normal text-ink-strong">{title}</h2>
        {edit && (
          <Link href={edit} className="inline-flex min-h-11 items-center text-sm font-medium text-gold-deep">
            Edit
          </Link>
        )}
      </div>
      {children}
      {updated && <p className="m-0 text-xs text-ink-subtle">Last updated {formatDateTime(updated)}</p>}
    </section>
  );
}

export default async function RecordCardPage(props: PageProps<"/dashboard/clients/[id]">) {
  await requireStaff();
  const { id } = await props.params;
  const [card, therapists] = await Promise.all([getCard(id), listTherapists()]);
  if (!card) notFound();

  const { client } = card;
  const base = `/dashboard/clients/${client.id}`;
  const signSoon = `/dashboard/sign/${client.id}`;
  const today = clinicDate(new Date());
  const consent = card.consents[0];
  const hasWarnings = card.warnings.length > 0;
  // A saved health section can still have conditions answered neither Yes nor No (Next pressed on an untouched
  // step): that must not look like "no conditions".
  const unanswered = card.health ? unansweredHealthCount(card.health) : 0;
  const sectionSaved = card.sectionsSavedAt;

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <Link href="/dashboard/clients" className="text-sm text-gold-deep">
        ‹ All clients
      </Link>
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Record card</span>
        <h1 className="page-title">{client.fullName}</h1>
        <p className="m-0 text-[15px]">
          <a href={`tel:${client.phone}`}>{client.phone}</a> ·{" "}
          <a href={whatsappLink(client.phone)} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </p>
      </div>

      {hasWarnings && (
        <section role="region" aria-label="Health warnings" className="rounded-[3px] border-4 border-red-700 bg-red-50 p-4 sm:p-5">
          <h2 className="m-0 mb-2 text-lg font-bold tracking-wide text-red-900 uppercase">
            <span aria-hidden="true">⚠ </span>Health warnings
          </h2>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[17px] font-semibold text-red-950">
            {card.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}
      <UnsavedDraftBanner clientId={client.id} />
      {!card.health ? (
        <section role="region" aria-label="Health history" className="rounded-[3px] border-4 border-amber-500 bg-amber-50 p-4 sm:p-5">
          <h2 className="m-0 mb-1 text-lg font-bold text-amber-950">Health history not filled in yet</h2>
          <p className="m-0 text-[15px] text-amber-950">
            This does not mean the client has no conditions.{" "}
            <Link href={`${base}/edit?step=health`} className="font-semibold underline">
              Fill in the health history
            </Link>
          </p>
        </section>
      ) : (
        unanswered > 0 && (
          <section role="region" aria-label="Health history" className="rounded-[3px] border-4 border-amber-500 bg-amber-50 p-4 sm:p-5">
            <h2 className="m-0 mb-1 text-lg font-bold text-amber-950">Health history incomplete: {unanswered} not answered</h2>
            <p className="m-0 text-[15px] text-amber-950">
              An unanswered question does not mean the client doesn&rsquo;t have that condition.{" "}
              <Link href={`${base}/edit?step=health`} className="font-semibold underline">
                Finish the health history
              </Link>
            </p>
          </section>
        )
      )}

      <div className="flex flex-col gap-2">
        {consent ? (
          <p className="m-0 text-[15px] font-medium text-brand-dark">
            Consent on file, signed {formatDateTime(consent.signedAt)}
            {!card.changedSinceSigned && (
              <>
                {" · "}
                <Link href={signSoon} className="font-normal text-ink-muted underline">
                  Sign again
                </Link>
              </>
            )}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="pill bg-slate-100 text-slate-700">No consent yet</span>
            <Link href={signSoon} className="btn btn-solid min-h-12 px-5 max-sm:w-full">
              Get signature
            </Link>
          </div>
        )}
        {card.changedSinceSigned && (
          <div className="note flex flex-wrap items-center gap-3">
            <span className="font-semibold">Health history changed since last signed</span>
            <Link href={signSoon} className="font-semibold underline">
              Get a new signature
            </Link>
          </div>
        )}
      </div>

      <Section title="Details" edit={`${base}/edit?step=details`}>
        <DetailsSummary details={client} />
      </Section>
      <Section title="Health" edit={`${base}/edit?step=health`} updated={sectionSaved.health}>
        {card.health ? <HealthSummary answers={card.health} /> : <p className="m-0 text-sm text-ink-muted">Not filled in yet.</p>}
      </Section>
      <Section title="Massage" edit={`${base}/edit?step=massage`} updated={sectionSaved.massage}>
        {card.massage ? <MassageSummary answers={card.massage} /> : <p className="m-0 text-sm text-ink-muted">Not filled in yet.</p>}
      </Section>
      <Section title="Skin" edit={`${base}/edit?step=skin`} updated={sectionSaved.skin}>
        {card.skin ? <SkinSummary answers={card.skin} /> : <p className="m-0 text-sm text-ink-muted">Not filled in yet.</p>}
      </Section>

      <Section title="Treatments">
        <details className="rounded-[3px] border border-dashed border-brand p-4">
          <summary className="cursor-pointer font-semibold text-brand">+ Add a treatment entry</summary>
          <div className="pt-4">
            <TreatmentEntryForm clientId={client.id} therapists={therapists} bookings={card.bookings} today={today} />
          </div>
        </details>
        {card.entries.length === 0 ? (
          <p className="m-0 text-sm text-ink-muted">No treatments logged yet.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {card.entries.map((e) => (
              <li key={e.id} className="flex flex-col gap-2 rounded-[3px] border border-line-soft p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-ink-strong">{formatDate(e.day, SHORT_DATE)}</span>
                  <span className={`pill ${e.kind === "skin" ? "bg-mint text-brand-dark" : "bg-slate-100 text-slate-700"}`}>{e.kind}</span>
                  {e.therapistName && <span className="text-sm text-ink-muted">{e.therapistName}</span>}
                  {e.editedAt && <span className="text-xs text-ink-subtle">edited {formatDate(clinicDate(e.editedAt), SHORT_DATE)}</span>}
                </div>
                {e.products && (
                  <p className="m-0 text-[15px] break-words whitespace-pre-line">
                    <span className="text-ink-subtle">Products/tools: </span>
                    {e.products}
                  </p>
                )}
                {e.notes && <p className="m-0 text-[15px] break-words whitespace-pre-line">{e.notes}</p>}
                <div className="flex flex-col gap-2">
                  <details>
                    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-gold-deep">Edit</summary>
                    <div className="pt-3">
                      <TreatmentEntryForm clientId={client.id} therapists={therapists} bookings={card.bookings} entry={e} today={today} />
                    </div>
                  </details>
                  <details>
                    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-red-700">Delete</summary>
                    <form action={deleteEntry} className="flex max-w-md flex-col gap-3 pb-2">
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="clientId" value={client.id} />
                      <p className="m-0 text-sm text-ink-muted">Remove this entry? You can restore it from Earlier versions.</p>
                      <button type="submit" className="btn min-h-12 border-none bg-red-700 px-5 text-white hover:bg-red-800 sm:self-start">
                        Remove entry
                      </button>
                    </form>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Bookings">
        {card.bookings.length === 0 ? (
          <p className="m-0 text-sm text-ink-muted">No online bookings match this client&rsquo;s phone or email.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {card.bookings.map((b) => (
              <li key={b.id} className="flex flex-col gap-1 border-b border-line-soft pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-ink-strong">{formatDateTime(b.startsAt)}</span>
                  <StatusPill status={b.status as BookingStatus} />
                </div>
                <span className="text-[15px] text-ink-body">
                  {b.treatmentName}
                  {!sameName(b.clientName, client.fullName) && <span className="text-ink-muted"> (booked as {b.clientName})</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Consents">
        {card.consents.length === 0 ? (
          <p className="m-0 text-sm text-ink-muted">No signed consents yet.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {card.consents.map((c) => (
              <li key={c.id} className="flex flex-col gap-1">
                <span className="font-semibold text-ink-strong">Signed {formatDateTime(c.signedAt)}</span>
                <span className="text-sm text-ink-muted">Photo consent: {c.photoConsent ? "Yes" : "No"}</span>
                <details>
                  <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-gold-deep">View</summary>
                  <div className="flex flex-col gap-4 pt-2">
                    {statementsOf(c.statements).length > 0 && (
                      <ol className="m-0 flex list-decimal flex-col gap-1 pl-5 text-[15px]">
                        {statementsOf(c.statements).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    )}
                    <p className="m-0 text-[15px]">Initials: {typeof c.initials === "string" ? c.initials : ""}</p>
                    <SignatureView path={c.signaturePath} />
                    <div className="border-t border-line-soft pt-3">
                      <p className="m-0 mb-3 text-sm font-semibold text-ink-strong">The card as signed</p>
                      <SnapshotView snapshot={c.snapshot} />
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="flex flex-col items-start gap-3">
        <Link href={`${base}/history`} className="text-link">
          Earlier versions and deleted entries
        </Link>
        <details className="w-full">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-red-700">Delete this client</summary>
          <form action={deleteClient} className="flex max-w-md flex-col gap-3 pb-2">
            <input type="hidden" name="id" value={client.id} />
            <p className="m-0 text-sm text-ink-muted">
              Delete {client.fullName}&rsquo;s record card, consents and treatment entries permanently? Bookings are not affected.
            </p>
            <button type="submit" className="btn min-h-12 border-none bg-red-700 px-5 text-white hover:bg-red-800 sm:self-start">
              Delete client
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}
