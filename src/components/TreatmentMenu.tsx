import Link from "next/link";
import { formatPrice, getActiveTreatments, type Treatment } from "@/lib/data";

/** Price list for one category, read from the database (cached; refreshed when staff edit treatments). */
export async function TreatmentMenu({ category }: { category: Treatment["category"] }) {
  const treatments = (await getActiveTreatments()).filter((t) => t.category === category);
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-x-16 p-0 lg:grid-cols-2">
      {treatments.map((t) => (
        <li key={t.id} className="flex flex-col gap-3 border-b border-line py-8">
          <div className="flex items-baseline gap-4">
            <h3 className="m-0 font-serif text-[26px] leading-[1.15] font-normal">{t.name}</h3>
            <span aria-hidden="true" className="min-w-6 flex-1 translate-y-[-4px] border-b border-dotted border-ink/25" />
            <span className="flex-none font-serif text-[19px] text-gold-deep italic">{formatPrice(t.priceCents)}</span>
          </div>
          <p className="m-0 max-w-[520px] text-[14.5px] leading-[1.75] text-ink-muted">{t.description}</p>
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-[11px] tracking-[.22em] text-ink-subtle uppercase">{t.durationMin} minutes</span>
            <Link href={`/book?treatment=${t.id}`} className="text-link">
              Book
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
