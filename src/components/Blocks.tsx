import Image from "next/image";
import Link from "next/link";
import { business } from "@/lib/site";

/** Dark green banner at the top of inner pages. */
export function PageHero({ eyebrow, title, intro, img, alt }: { eyebrow: string; title: string; intro: string; img?: string; alt?: string }) {
  return (
    <section className="relative overflow-hidden bg-forest">
      {/* Photo sits beside the text on wide screens and above it on phones, never behind it. */}
      {img && (
        <div className="relative h-64 min-[640px]:h-80 min-[861px]:absolute min-[861px]:inset-y-0 min-[861px]:right-0 min-[861px]:h-auto min-[861px]:w-1/2">
          <Image src={img} alt={alt ?? ""} fill priority sizes="(max-width: 860px) 100vw, 50vw" className="object-cover" />
        </div>
      )}
      <div className="wrap relative py-12 min-[861px]:py-24">
        <div className={`flex max-w-[580px] flex-col gap-5 ${img ? "min-[861px]:max-w-[46%]" : ""}`}>
          <span className="text-xs font-semibold tracking-[.28em] text-brand-light">{eyebrow}</span>
          <h1 className="m-0 font-serif text-[clamp(36px,5vw,56px)] leading-[1.08] font-normal text-white">{title}</h1>
          <p className="m-0 text-[17px] leading-[1.6] text-[#dce8df]">{intro}</p>
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="flex max-w-[640px] flex-col gap-3">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="heading">{title}</h2>
      {intro && <p className="m-0 text-base leading-[1.65] text-ink-muted">{intro}</p>}
    </div>
  );
}

/** Dark call-to-action band. */
export function CtaBand({
  eyebrow,
  title,
  body,
  primary,
}: {
  eyebrow: string;
  title: string;
  body: string;
  primary: { href: string; label: string };
}) {
  return (
    <section className="bg-forest py-[72px]">
      <div className="wrap flex flex-wrap items-center justify-between gap-8">
        <div className="flex max-w-[700px] flex-col gap-3">
          <span className="text-xs font-semibold tracking-[.24em] text-brand-light">{eyebrow}</span>
          <h2 className="m-0 font-serif text-[clamp(28px,3.4vw,40px)] leading-[1.2] font-normal text-white">{title}</h2>
          <p className="m-0 text-base leading-[1.6] text-[#c9dace]">{body}</p>
        </div>
        <div className="flex flex-wrap gap-3.5">
          <Link className="btn btn-solid" href={primary.href}>
            {primary.label}
          </Link>
          <a className="btn btn-ghost" href={business.whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp us
          </a>
        </div>
      </div>
    </section>
  );
}
