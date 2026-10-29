import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { accreditations, business } from "@/lib/site";

/** Dark evergreen banner at the top of inner pages. */
export function PageHero({ eyebrow, title, intro, img, alt }: { eyebrow: string; title: string; intro: string; img?: string; alt?: string }) {
  return (
    <section className="relative overflow-hidden bg-forest">
      {/* Photo sits beside the text on wide screens and above it on phones, never behind it. */}
      {img && (
        <div className="relative h-64 min-[640px]:h-80 min-[861px]:absolute min-[861px]:inset-y-0 min-[861px]:right-0 min-[861px]:h-auto min-[861px]:w-1/2">
          <Image src={img} alt={alt ?? ""} fill priority sizes="(max-width: 860px) 100vw, 50vw" className="object-cover" />
        </div>
      )}
      <div className="wrap relative py-16 min-[861px]:py-32">
        <div className={`flex max-w-[620px] flex-col gap-6 ${img ? "min-[861px]:max-w-[44%]" : ""}`}>
          <span className="eyebrow text-brand-light">{eyebrow}</span>
          <h1 className="m-0 font-serif text-[clamp(40px,5.4vw,68px)] leading-[1.04] font-light tracking-[-.01em] text-white">{title}</h1>
          <p className="m-0 text-[16px] leading-[1.8] text-[#cdd5cf]">{intro}</p>
        </div>
      </div>
    </section>
  );
}

/** QCTO and HWSETA credentials with their full registration numbers. */
export function Accreditations({ intro }: { intro?: string }) {
  return (
    <section className="border-y border-line bg-white py-16 md:py-20">
      <div className="wrap flex flex-col gap-10">
        <SectionHeading center eyebrow="Accreditation" title="Nationally accredited and registered" intro={intro} />
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 md:gap-6">
          {accreditations.map((a) => (
            <li key={a.body} className="flex gap-5 border border-line bg-cream p-6 sm:p-8">
              <span className="flex-none pt-1 text-gold">
                <Icon name={a.icon} size={34} strokeWidth={1} />
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-[10.5px] font-medium tracking-[.22em] text-ink-subtle uppercase">{a.bodyFull}</span>
                <span className="font-serif text-[26px] leading-tight text-ink-strong">{a.title}</span>
                <span className="text-[14.5px] text-ink-muted">
                  {a.numberLabel}: <strong className="font-semibold tracking-[.02em] break-all text-ink-strong">{a.number}</strong>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, intro, center }: { eyebrow: string; title: string; intro?: string; center?: boolean }) {
  return (
    <div className={`flex max-w-[680px] flex-col gap-5 ${center ? "mx-auto items-center text-center" : ""}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="heading">{title}</h2>
      {intro && <p className="lede">{intro}</p>}
    </div>
  );
}

/** Dark call-to-action band. With `img`, the photo fills one half and the text sits on a solid panel beside it. */
export function CtaBand({
  eyebrow,
  title,
  body,
  primary,
  img,
  alt,
}: {
  eyebrow: string;
  title: string;
  body: string;
  primary: { href: string; label: string };
  img?: string;
  alt?: string;
}) {
  const buttons = (
    <>
      <Link className="btn btn-light" href={primary.href}>
        {primary.label}
      </Link>
      <a className="btn btn-ghost" href={business.whatsapp} target="_blank" rel="noopener noreferrer">
        WhatsApp us
      </a>
    </>
  );

  if (img) {
    return (
      <section className="relative overflow-hidden bg-forest">
        <div className="relative h-72 min-[640px]:h-96 min-[861px]:absolute min-[861px]:inset-y-0 min-[861px]:left-0 min-[861px]:h-auto min-[861px]:w-1/2">
          <Image src={img} alt={alt ?? ""} fill sizes="(max-width: 860px) 100vw, 50vw" className="object-cover" />
        </div>
        <div className="wrap relative flex py-14 min-[861px]:justify-end min-[861px]:py-32">
          <div className="flex max-w-[520px] flex-col items-start gap-6 min-[861px]:w-[46%]">
            <span className="eyebrow text-brand-light">{eyebrow}</span>
            <h2 className="m-0 font-serif text-[clamp(34px,4.2vw,52px)] leading-[1.1] font-light text-white">{title}</h2>
            <p className="m-0 text-[15.5px] leading-[1.8] text-[#c3ccc6]">{body}</p>
            <div className="mt-4 flex flex-wrap gap-4">{buttons}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-forest py-16 md:py-24 lg:py-28">
      <div className="wrap flex flex-col items-center gap-6 text-center">
        <span className="eyebrow text-brand-light">{eyebrow}</span>
        <h2 className="m-0 max-w-[760px] font-serif text-[clamp(34px,4.2vw,52px)] leading-[1.1] font-light text-white">{title}</h2>
        <p className="m-0 max-w-[560px] text-[15.5px] leading-[1.8] text-[#c3ccc6]">{body}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4">{buttons}</div>
      </div>
    </section>
  );
}
