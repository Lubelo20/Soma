import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/slots";
import { setEnquiryHandled } from "../../actions";

export const metadata: Metadata = { title: "Enquiries" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

type Enquiry = { id: number; kind: string; name: string; phone: string; email: string; interest: string; message: string; handled: boolean; createdAt: Date };

const kindLabel: Record<string, string> = { general: "General", corporate: "Corporate", training: "Training" };

export default async function EnquiriesPage() {
  await requireStaff();
  const enquiries = await sql<Enquiry[]>`select * from enquiries order by handled, created_at desc limit 300`;

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <h1 className="m-0 font-serif text-[34px] font-normal">Enquiries</h1>
      {enquiries.length === 0 ? (
        <p className="rounded-[18px] border border-line bg-white p-8 text-ink-muted">No enquiries yet.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {enquiries.map((e) => (
            <li key={e.id} className={`flex flex-col gap-3 rounded-[18px] border border-line bg-white p-6 ${e.handled ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-bold text-ink-strong">{e.name}</span>
                  <span className="text-[15px] text-ink-body">{e.interest}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-subtle">{formatDateTime(e.createdAt)}</span>
                  <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold tracking-wide text-brand-dark uppercase">{kindLabel[e.kind] ?? e.kind}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
                <a href={`tel:${e.phone}`}>{e.phone}</a>
                {e.email && <a href={`mailto:${e.email}`}>{e.email}</a>}
              </div>
              {e.message && <p className="m-0 text-[15px] leading-relaxed whitespace-pre-line text-ink-body">{e.message}</p>}
              <form action={setEnquiryHandled}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="handled" value={String(!e.handled)} />
                <button type="submit" className={`btn ${e.handled ? "btn-line" : "btn-solid"} min-h-10 border-none px-5`}>
                  {e.handled ? "Mark as not handled" : "Mark as handled"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
