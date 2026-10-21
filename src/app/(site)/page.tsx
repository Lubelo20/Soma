import Image from "next/image";
import Link from "next/link";
import { CtaBand, SectionHeading } from "@/components/Blocks";
import { Icon } from "@/components/Icon";
import { business, gallery, pillars, quals, services, trust } from "@/lib/site";

export default function Home() {
  return (
    <>
      {/* HERO */}
      {/* Full-bleed photo; the text sits on a solid panel rather than a fade, so the image stays clean. */}
      <section id="top" className="relative overflow-hidden bg-forest min-[861px]:flex min-[861px]:min-h-[min(calc(100svh-80px),900px)] min-[861px]:items-center">
        {/* On wide screens the photo is wider than the hero and anchored left, which moves the client's face clear of the text panel. */}
        <div className="relative h-[52svh] min-h-80 min-[861px]:absolute min-[861px]:inset-y-0 min-[861px]:left-0 min-[861px]:h-auto min-[861px]:w-[135%]">
          <Image
            src="/images/hero-massage.jpg"
            alt="Client relaxing during a back massage"
            fill
            priority
            sizes="(max-width: 860px) 100vw, 135vw"
            className="object-cover object-[50%_30%] motion-safe:animate-[hero-settle_2.4s_cubic-bezier(.2,.7,.2,1)_both]"
          />
        </div>

        <div className="wrap relative w-full max-[860px]:-mt-20 max-[860px]:px-4 max-[860px]:pb-4 min-[861px]:py-16">
          <div className="flex max-w-[580px] flex-col gap-6 bg-forest/95 p-8 shadow-[0_30px_60px_-30px_rgba(0,0,0,.6)] backdrop-blur-sm min-[861px]:gap-7 min-[861px]:p-12 motion-safe:animate-[hero-rise_1.1s_ease-out_.15s_both]">
            <span className="eyebrow text-brand-light max-[480px]:text-[10px] max-[480px]:tracking-[.2em]">Wellness · Skincare · Training</span>
            <h1 className="m-0 font-serif text-[clamp(40px,4.6vw,68px)] leading-[1] font-light tracking-[-.015em] text-white">
              Wellness Today,
              <span className="mt-1 block text-brand-light italic">a Brighter Tomorrow</span>
            </h1>
            <p className="m-0 text-[15.5px] leading-[1.85] text-[#cdd5cf]">
              Professional wellness, advanced skincare, corporate wellness and accredited training in Durban, for healthier individuals, stronger workplaces and empowered communities.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-1">
              <Link className="btn btn-light" href="/book">
                Book a treatment
              </Link>
              <a className="text-link text-white hover:text-brand-light" href="#services">
                Explore our services
              </a>
            </div>
          </div>
        </div>

        <div className="absolute right-[max(2.5rem,calc((100vw-1240px)/2+2.5rem))] bottom-10 hidden flex-col gap-1 border-l-2 border-gold bg-cream px-6 py-4 shadow-[0_18px_40px_-20px_rgba(0,0,0,.45)] min-[861px]:flex motion-safe:animate-[hero-rise_1s_ease-out_.8s_both]">
          <span className="text-[10px] font-medium tracking-[.3em] text-gold-deep uppercase">Est. {business.founded}</span>
          <span className="font-serif text-[19px] leading-tight text-ink-strong">Musgrave Park, Durban</span>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-line">
        <div className="wrap grid grid-cols-1 py-4 min-[560px]:grid-cols-2 lg:grid-cols-4">
          {trust.map((t, i) => (
            <div
              key={t.title}
              className={`flex items-center gap-4 py-4 lg:px-6 lg:py-6 lg:first:pl-0 ${i > 0 ? "lg:border-l lg:border-line" : ""}`}
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
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3 md:gap-y-16">
            {services.map((s) => (
              <article key={s.id} className="group flex flex-col gap-6">
                <Link href={s.href} className="relative block aspect-[4/3] overflow-hidden md:aspect-[4/5]" aria-label={s.title}>
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
          <div className="relative aspect-[4/3] min-w-0 overflow-hidden max-lg:order-2 lg:aspect-[5/6]">
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
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {gallery.map((g) => (
              <figure key={g.img} className="m-0 flex flex-col gap-4">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src={g.img} alt={g.alt} fill sizes="(max-width: 1024px) 50vw, 300px" className="object-cover" />
                </div>
                <figcaption className="font-serif text-[15px] text-ink-muted italic md:text-[17px]">{g.caption}</figcaption>
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
