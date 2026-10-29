import Link from "next/link";
import { formatPrice, getActiveTreatments, type Treatment } from "@/lib/data";
import { bySection } from "@/lib/sections";

function TreatmentCard({ t }: { t: Treatment }) {
  return (
    <li className="flex flex-col gap-3 border-b border-line py-8">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h4 className="m-0 font-serif text-[26px] leading-[1.15] font-normal">{t.name}</h4>
        <span aria-hidden="true" className="hidden min-w-6 flex-1 translate-y-[-4px] border-b border-dotted border-ink/25 sm:block" />
        <span className="basis-full font-serif text-[19px] text-gold-deep italic sm:basis-auto">{formatPrice(t.priceCents)}</span>
      </div>
      <p className="m-0 max-w-[520px] text-[14.5px] leading-[1.75] text-ink-muted">{t.description}</p>
      <div className="flex items-center justify-between gap-4 pt-1">
        <span className="text-[11px] tracking-[.22em] text-ink-subtle uppercase">{t.durationMin} minutes</span>
        <Link href={`/book?treatment=${t.id}`} className="text-link">
          Book
        </Link>
      </div>
    </li>
  );
}

// Treatments without a description (e.g. waxing) read better as a short price list.
function TreatmentRow({ t }: { t: Treatment }) {
  return (
    <li className="border-b border-line">
      <Link href={`/book?treatment=${t.id}`} className="group flex items-baseline gap-4 py-4 text-inherit no-underline">
        <span className="font-serif text-[20px] leading-tight group-hover:text-brand">{t.name}</span>
        <span aria-hidden="true" className="min-w-6 flex-1 translate-y-[-4px] border-b border-dotted border-ink/25" />
        <span className="font-serif text-[18px] whitespace-nowrap text-gold-deep italic">{formatPrice(t.priceCents)}</span>
      </Link>
    </li>
  );
}

/** Price list for one category, grouped by section, read from the database (cached; refreshed when staff edit treatments). */
export async function TreatmentMenu({ category }: { category: Treatment["category"] }) {
  const sections = bySection((await getActiveTreatments()).filter((t) => t.category === category));
  const anchor = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (
    <div className="flex flex-col gap-16 md:gap-20">
      {/* Shortcuts to each section; a sideways-scrolling row on phones, where the menu gets long. */}
      {sections.filter((s) => s.title).length > 1 && (
        <nav aria-label="Menu sections" className="-mx-5 -mb-6 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:-mb-8 md:flex-wrap md:px-0">
          {sections
            .filter((s) => s.title)
            .map((s) => (
              <a
                key={s.title}
                href={`#${anchor(s.title)}`}
                className="flex min-h-11 flex-none items-center rounded-full border border-line bg-white px-4 text-[13px] whitespace-nowrap text-ink-body no-underline transition-colors hover:border-brand hover:text-brand"
              >
                {s.title}
              </a>
            ))}
        </nav>
      )}
      {sections.map((s) => {
        const compact = s.items.every((t) => !t.description);
        return (
          <section key={s.title} id={s.title ? anchor(s.title) : undefined} className="flex scroll-mt-24 flex-col gap-2">
            {s.title && (
              <h3 className="m-0 flex items-center gap-5 font-serif text-[clamp(28px,3vw,36px)] leading-tight font-light text-ink-strong">
                {s.title}
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
              </h3>
            )}
            {compact && <p className="m-0 pt-2 text-[14.5px] text-ink-muted">Tap any treatment to book.</p>}
            <ul className={`m-0 grid list-none grid-cols-1 gap-x-16 p-0 lg:grid-cols-2 ${compact ? "md:grid-cols-2" : ""}`}>
              {s.items.map((t) => (compact ? <TreatmentRow key={t.id} t={t} /> : <TreatmentCard key={t.id} t={t} />))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
