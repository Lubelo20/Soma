import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { PageHero } from "@/components/Blocks";
import { PosterZoom } from "@/components/PosterZoom";
import { formatPrice, getActiveSpecials } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { FIRST_SESSION_NOTE } from "@/lib/special-copy";

// Not in the sitemap, because its content comes and goes.
export const metadata: Metadata = pageMetadata({
  title: "Current Specials",
  description: "Current wellness and skincare package specials at Infinity Soma Wellness Clinic in Musgrave, Durban. Book your first session online.",
  path: "/specials",
});

export default async function SpecialsPage() {
  const specials = await getActiveSpecials();
  return (
    <>
      <BreadcrumbJsonLd name="Specials" path="/specials" />
      <PageHero eyebrow="CURRENT OFFERS" title="Specials" intro="Our current packages. Book your first session online and we'll arrange the rest with you." />
      <section className="py-14 md:py-24">
        {specials.length === 0 ? (
          <div className="wrap flex flex-col items-start gap-5">
            <p className="lede">No specials right now, but our full menu is always available.</p>
            <Link href="/treatments" className="btn btn-solid">
              View treatments
            </Link>
          </div>
        ) : (
          <ul className="wrap m-0 grid list-none grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
            {specials.map((s) => (
              <li key={s.id} className="flex min-w-0 flex-col gap-4">
                <div className="relative aspect-[2/3] w-full bg-white">
                  <PosterZoom src={s.posterUrl} alt={s.name} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px" />
                </div>
                <h2 className="m-0 font-serif text-[26px] leading-[1.15] font-normal">{s.name}</h2>
                <p className="m-0 font-serif text-[21px] text-gold-deep italic lining-nums">{formatPrice(s.priceCents)}</p>
                <p className="m-0 text-[14.5px] leading-[1.75] text-ink-muted">{FIRST_SESSION_NOTE}</p>
                <Link href={`/book?treatment=${s.id}`} aria-label={`Book this special: ${s.name}`} className="btn btn-solid mt-auto self-start">
                  Book this special
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
