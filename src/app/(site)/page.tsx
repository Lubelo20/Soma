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
        <div className="relative h-72 min-[640px]:h-96 min-[861px]:absolute min-[861px]:inset-y-0 min-[861px]:right-0 min-[861px]:h-auto min-[861px]:w-[52%]">
          <Image
            src="/images/hero-massage.jpg"
            alt="Client relaxing during a back massage"
            fill
            priority
            sizes="(max-width: 860px) 100vw, 52vw"
            className="object-cover object-[60%_30%]"
          />
        </div>
        <div className="wrap relative pt-12 pb-16 min-[861px]:pt-28 min-[861px]:pb-30">
          <div className="flex max-w-[600px] flex-col gap-7 min-[861px]:max-w-[44%]">
            <span className="text-xs font-semibold tracking-[.28em] text-brand-light">DURBAN · EST. {business.founded}</span>
            <h1 className="m-0 font-serif text-[clamp(42px,6vw,72px)] leading-[1.04] font-normal text-white">
              Wellness Today
              <br />
              <span className="text-brand-light">A Brighter Tomorrow</span>
            </h1>
            <p className="m-0 text-lg leading-[1.6] text-[#dce8df]">
              Professional wellness, advanced skincare, corporate wellness and accredited occupational training — for healthier individuals, stronger workplaces and empowered communities.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link className="btn btn-solid" href="/book">
                Book a treatment
                <Icon name="arrow" size={18} strokeWidth={2} />
              </Link>
              <a className="btn btn-ghost" href="#services">
                Explore our services
              </a>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute right-16 bottom-14 hidden -rotate-[8deg] text-right font-script text-[44px] leading-[1.05] text-white min-[861px]:block"
        >
          Health
          <br />
          Wellbeing
          <br />
          Empowerment
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-line bg-white">
        <div className="wrap grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 py-7">
          {trust.map((t) => (
            <div key={t.title} className="flex items-center gap-3.5">
              <span className="flex size-11 flex-none items-center justify-center rounded-full bg-mint text-brand">
                <Icon name={t.icon} strokeWidth={1.6} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-ink-strong">{t.title}</span>
                <span className="text-[12.5px] text-ink-subtle">{t.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="pt-[88px] pb-[72px]">
        <div className="wrap flex flex-col gap-10">
          <SectionHeading
            eyebrow="OUR SERVICES"
            title="Care for body, skin and workplace"
            intro="Book in-clinic at Musgrave Park, or bring our therapists to your home, office or event."
          />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(330px,100%),1fr))] gap-6">
            {services.map((s) => (
              <article key={s.id} className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-white">
                <div className="relative h-60 w-full">
                  <Image src={s.img} alt={s.alt} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col gap-3.5 px-7 pt-7 pb-6">
                  <span className="text-[11.5px] font-semibold tracking-[.22em] text-brand">{s.eyebrow}</span>
                  <h3 className="m-0 font-serif text-[28px] leading-[1.15] font-normal">{s.title}</h3>
                  <p className="m-0 text-[15px] leading-[1.6] text-ink-muted">{s.body}</p>
                  <ul className="mt-auto grid list-none grid-cols-3 gap-x-2 gap-y-4 border-t border-line-soft p-0 pt-[18px] pb-1.5">
                    {s.items.map((i) => (
                      <li key={i.label} className="flex flex-col items-center gap-2 text-center">
                        <span className="flex size-[46px] items-center justify-center rounded-full border-[1.5px] border-mint-line text-brand">
                          <Icon name={i.icon} />
                        </span>
                        <span className="text-xs leading-[1.3] text-ink-body">{i.label}</span>
                      </li>
                    ))}
                  </ul>
                  <Link className="btn btn-line mt-2 self-start" href={s.href}>
                    {s.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TRAINING */}
      <section className="bg-white py-[88px]">
        <div className="wrap flex flex-wrap items-center gap-12">
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
            <span className="eyebrow">SKILLS FOR A BRIGHTER FUTURE</span>
            <h2 className="heading">Accredited Skills Development</h2>
            <p className="m-0 text-base leading-[1.65] text-ink-muted">
              QCTO-accredited occupational training that combines classroom teaching, hands-on practice in our working clinic and workplace placement with partner spas. Built for school leavers, unemployed matriculants and anyone ready for a career in wellness.
            </p>
            <div className="flex flex-col gap-1">
              {quals.map((q) => (
                <div key={q.saqa} className="flex items-center gap-4 border-b border-line-soft py-3.5">
                  <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-mint text-brand">
                    <Icon name={q.icon} />
                  </span>
                  <div className="flex flex-col gap-[3px]">
                    <span className="text-[15.5px] font-bold text-ink-strong">{q.title}</span>
                    <span className="text-[12.5px] text-ink-subtle">SAQA ID: {q.saqa} | NQF Level 4</span>
                  </div>
                </div>
              ))}
            </div>
            <Link className="btn btn-solid mt-2 self-start" href="/training">
              Explore training programmes
            </Link>
          </div>
          <div className="grid min-w-0 flex-[1_1_440px] grid-cols-2 gap-4">
            <div className="relative col-span-2 h-[340px] overflow-hidden rounded-[18px]">
              <Image src="/images/training-facial.jpg" alt="Trainer guiding learners through a facial treatment" fill sizes="(max-width: 960px) 100vw, 560px" className="object-cover" />
            </div>
            <div className="relative h-[200px] overflow-hidden rounded-[18px]">
              <Image src="/images/training-room.jpg" alt="Infinity Soma training room with massage beds" fill sizes="(max-width: 960px) 50vw, 280px" className="object-cover" />
            </div>
            <div className="relative h-[200px] overflow-hidden rounded-[18px]">
              <Image src="/images/training-team.jpg" alt="Infinity Soma somatologists in clinic uniforms" fill sizes="(max-width: 960px) 50vw, 280px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-[88px]">
        <div className="wrap flex flex-wrap-reverse items-center gap-12">
          <div className="relative h-[460px] min-w-0 flex-[1_1_440px] overflow-hidden rounded-[18px]">
            <Image src="/images/about-reception.jpg" alt="Infinity Soma reception area" fill sizes="(max-width: 960px) 100vw, 580px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
            <span className="eyebrow">ABOUT US</span>
            <h2 className="heading">A Holistic Approach to Health and Wellbeing</h2>
            <p className="m-0 text-base leading-[1.65] text-ink-muted">
              Founded in {business.founded} by {business.founder}, Infinity Soma integrates wellness services, accredited training and corporate health programmes to improve quality of life, enhance employability and empower communities.
            </p>
            <ul className="grid list-none grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-4 p-0 pt-2">
              {pillars.map((p) => (
                <li key={p.label} className="flex flex-col items-center gap-2 text-center">
                  <span className="flex size-[52px] items-center justify-center rounded-full border-[1.5px] border-mint-line text-brand">
                    <Icon name={p.icon} size={24} />
                  </span>
                  <span className="text-[12.5px] leading-[1.3] text-ink-body">{p.label}</span>
                </li>
              ))}
            </ul>
            <Link className="btn btn-line self-start" href="/about">
              More about us
            </Link>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="bg-white py-20">
        <div className="wrap flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-3">
              <span className="eyebrow">IN THE COMMUNITY</span>
              <h2 className="m-0 font-serif text-[clamp(30px,3.6vw,40px)] leading-[1.15] font-normal">Clinic, campus and events</h2>
            </div>
            <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand hover:text-brand-dark">
              Follow @{business.instagramHandle}
            </a>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            {gallery.map((g) => (
              <figure key={g.img} className="m-0 flex flex-col gap-2.5">
                <div className="relative h-[260px] overflow-hidden rounded-2xl">
                  <Image src={g.img} alt={g.alt} fill sizes="(max-width: 640px) 100vw, 300px" className="object-cover" />
                </div>
                <figcaption className="text-[13px] text-ink-muted">{g.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="BOOK ONLINE"
        title="Choose your treatment and time"
        body="Pick a slot that suits you and we'll confirm by email. Prefer to chat? WhatsApp us any time."
        primary={{ href: "/book", label: "Book a treatment" }}
      />
    </>
  );
}
