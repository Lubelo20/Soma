import Image from "next/image";
import Link from "next/link";
import { CtaBand, SectionHeading } from "@/components/Blocks";
import { Icon } from "@/components/Icon";
import { business, gallery, pillars, quals, services, trust } from "@/lib/site";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section id="top" className="relative overflow-hidden bg-forest">
        {/* Photo sits beside the text on wide screens and above it on phones, never behind it. */}
        <div className="relative h-72 min-[640px]:h-96 min-[861px]:absolute min-[861px]:inset-y-0 min-[861px]:right-0 min-[861px]:h-auto min-[861px]:w-[50%]">
          <Image
            src="/images/hero-massage.jpg"
            alt="Client relaxing during a back massage"
            fill
            priority
            sizes="(max-width: 860px) 100vw, 50vw"
            className="object-cover object-[60%_30%]"
          />
        </div>
        <div className="wrap relative pt-14 pb-20 min-[861px]:pt-36 min-[861px]:pb-40">
          <div className="flex max-w-[600px] flex-col gap-8 min-[861px]:max-w-[44%]">
            <span className="eyebrow text-brand-light">Durban · Est. {business.founded}</span>
            <h1 className="m-0 font-serif text-[clamp(48px,6.4vw,88px)] leading-[.98] font-light tracking-[-.015em] text-white">
              Wellness Today
              <span className="mt-2 block text-brand-light italic">a Brighter Tomorrow</span>
            </h1>
            <p className="m-0 max-w-[480px] text-[16px] leading-[1.85] text-[#cdd5cf]">
              Professional wellness, advanced skincare, corporate wellness and accredited occupational training, for healthier individuals, stronger workplaces and empowered communities.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-5 pt-2">
              <Link className="btn btn-light" href="/book">
                Book a treatment
              </Link>
              <a className="text-link text-white hover:text-brand-light" href="#services">
                Explore our services
              </a>
            </div>
            <span className="pt-6 text-[10.5px] tracking-[.36em] text-[#9aa79f] uppercase">Health · Wellbeing · Empowerment</span>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-line">
        <div className="wrap grid grid-cols-1 py-4 min-[560px]:grid-cols-2 lg:grid-cols-4">
          {trust.map((t, i) => (
            <div
              key={t.title}
              className={`flex items-center gap-4 py-6 lg:px-6 lg:first:pl-0 ${i > 0 ? "lg:border-l lg:border-line" : ""}`}
            >
              <span className="flex-none text-gold">
                <Icon name={t.icon} size={26} strokeWidth={1.1} />
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-[18px] leading-tight text-ink-strong">{t.title}</span>
                <span className="text-[12px] tracking-[.04em] text-ink-subtle">{t.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-24 md:py-32">
        <div className="wrap flex flex-col gap-16">
          <SectionHeading
            center
            eyebrow="Our services"
            title="Care for body, skin and workplace"
            intro="Book in-clinic at Musgrave Park, or bring our therapists to your home, office or event."
          />
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-3">
            {services.map((s) => (
              <article key={s.id} className="group flex flex-col gap-6">
                <Link href={s.href} className="relative block aspect-[4/5] overflow-hidden" aria-label={s.title}>
                  <Image
                    src={s.img}
                    alt={s.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                  />
                </Link>
                <div className="flex flex-1 flex-col gap-4">
                  <span className="text-[10.5px] font-medium tracking-[.3em] text-gold-deep uppercase">{s.eyebrow}</span>
                  <h3 className="m-0 font-serif text-[30px] leading-[1.1] font-light">{s.title}</h3>
                  <p className="m-0 text-[15px] leading-[1.75] text-ink-muted">{s.body}</p>
                  <p className="m-0 text-[13px] leading-[1.9] text-ink-subtle">{s.items.map((i) => i.label).join(" · ")}</p>
                  <Link className="text-link mt-auto self-start pt-2" href={s.href}>
                    {s.cta}
                    <Icon name="arrow" size={14} strokeWidth={1.4} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TRAINING */}
      <section className="bg-white py-24 md:py-32">
        <div className="wrap grid items-center gap-16 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-6">
            <span className="eyebrow">Skills for a brighter future</span>
            <h2 className="heading">Accredited Skills Development</h2>
            <p className="lede">
              QCTO-accredited occupational training that combines classroom teaching, hands-on practice in our working clinic and workplace placement with partner spas. Built for school leavers, unemployed matriculants and anyone ready for a career in wellness.
            </p>
            <ol className="m-0 flex list-none flex-col p-0">
              {quals.map((q, i) => (
                <li key={q.saqa} className="flex items-baseline gap-6 border-b border-line py-5 first:border-t">
                  <span className="font-serif text-[15px] text-gold-deep italic">0{i + 1}</span>
                  <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <span className="font-serif text-[23px] leading-tight text-ink-strong">{q.title}</span>
                    <span className="text-[11px] tracking-[.18em] text-ink-subtle uppercase">SAQA {q.saqa} · NQF 4</span>
                  </div>
                </li>
              ))}
            </ol>
            <Link className="btn btn-solid mt-4 self-start" href="/training">
              Explore training
            </Link>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-4">
            <div className="relative col-span-2 aspect-[16/10] overflow-hidden">
              <Image src="/images/training-facial.jpg" alt="Trainer guiding learners through a facial treatment" fill sizes="(max-width: 1024px) 100vw, 580px" className="object-cover" />
            </div>
            <div className="relative aspect-square overflow-hidden">
              <Image src="/images/training-room.jpg" alt="Infinity Soma training room with massage beds" fill sizes="(max-width: 1024px) 50vw, 290px" className="object-cover" />
            </div>
            <div className="relative aspect-square overflow-hidden">
              <Image src="/images/training-team.jpg" alt="Infinity Soma somatologists in clinic uniforms" fill sizes="(max-width: 1024px) 50vw, 290px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-24 md:py-32">
        <div className="wrap grid items-center gap-16 lg:grid-cols-2">
          <div className="relative aspect-[4/5] min-w-0 overflow-hidden max-lg:order-2 lg:aspect-[5/6]">
            <Image src="/images/about-reception.jpg" alt="Infinity Soma reception area" fill sizes="(max-width: 1024px) 100vw, 580px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            <span className="eyebrow">About us</span>
            <h2 className="heading">A Holistic Approach to Health and Wellbeing</h2>
            <p className="lede">
              Founded in {business.founded} by {business.founder}, Infinity Soma integrates wellness services, accredited training and corporate health programmes to improve quality of life, enhance employability and empower communities.
            </p>
            <ul className="m-0 grid list-none grid-cols-1 border-t border-line p-0 min-[480px]:grid-cols-2">
              {pillars.map((p) => (
                <li key={p.label} className="flex items-center gap-3.5 border-b border-line py-4 text-[14px] text-ink-body">
                  <span className="text-gold">
                    <Icon name={p.icon} size={20} strokeWidth={1.2} />
                  </span>
                  {p.label}
                </li>
              ))}
            </ul>
            <Link className="text-link mt-2 self-start" href="/about">
              More about us
              <Icon name="arrow" size={14} strokeWidth={1.4} />
            </Link>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="bg-white py-24 md:py-28">
        <div className="wrap flex flex-col gap-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-5">
              <span className="eyebrow">In the community</span>
              <h2 className="heading">Clinic, campus and events</h2>
            </div>
            <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="text-link">
              Follow @{business.instagramHandle}
            </a>
          </div>
          <div className="grid grid-cols-1 gap-6 min-[560px]:grid-cols-2 lg:grid-cols-4">
            {gallery.map((g) => (
              <figure key={g.img} className="m-0 flex flex-col gap-4">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src={g.img} alt={g.alt} fill sizes="(max-width: 560px) 100vw, (max-width: 1024px) 50vw, 300px" className="object-cover" />
                </div>
                <figcaption className="font-serif text-[17px] text-ink-muted italic">{g.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Book online"
        title="Choose your treatment and time"
        body="Pick a slot that suits you and we'll confirm by email. Prefer to chat? WhatsApp us any time."
        primary={{ href: "/book", label: "Book a treatment" }}
      />
    </>
  );
}
