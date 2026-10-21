import Link from "next/link";
import { formatPrice, getActiveTreatments, type Treatment } from "@/lib/data";

/** Price list for one category, read from the database (cached; refreshed when staff edit treatments). */
export async function TreatmentMenu({ category }: { category: Treatment["category"] }) {
  const treatments = (await getActiveTreatments()).filter((t) => t.category === category);
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4 p-0">
      {treatments.map((t) => (
        <li key={t.id} className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <h3 className="m-0 font-serif text-[22px] leading-[1.2] font-normal">{t.name}</h3>
            <span className="flex-none pt-1 text-sm font-semibold text-brand">{formatPrice(t.priceCents)}</span>
          </div>
          <p className="m-0 text-[15px] leading-[1.6] text-ink-muted">{t.description}</p>
          <div className="mt-auto flex items-center justify-between gap-4 border-t border-line-soft pt-4">
            <span className="text-[13px] text-ink-subtle">{t.durationMin} minutes</span>
            <Link href={`/book?treatment=${t.id}`} className="btn btn-line min-h-10 px-5">
              Book
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
