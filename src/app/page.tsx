import Image from "next/image";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/lib/icons";
import { business, gallery, navLinks, pillars, quals, services, trust } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  name: business.name,
  legalName: business.legalName,
  url: business.url,
  email: business.email,
  telephone: business.phoneE164,
  image: `${business.url}/images/hero-massage.jpg`,
  logo: `${business.url}/images/logo.png`,
  foundingDate: String(business.founded),
  founder: { "@type": "Person", name: business.founder },
  address: {
    "@type": "PostalAddress",
    streetAddress: business.address.street,
    addressLocality: business.address.locality,
    addressRegion: business.address.region,
    postalCode: business.address.postalCode,
    addressCountry: business.address.country,
  },
  sameAs: [business.instagram],
};

const contactItems: { icon: IconName; label: string; value: React.ReactNode }[] = [
  {
    icon: "phone",
    label: "CELL / WHATSAPP",
    value: <a href={`tel:${business.phoneE164}`} className="text-ink-strong no-underline hover:text-brand">{business.phoneDisplay}</a>,
  },
  {
    icon: "mail",
    label: "EMAIL",
    value: <a href={`mailto:${business.email}`} className="text-ink-strong no-underline hover:text-brand">{business.email}</a>,
  },
  {
    icon: "pin",
    label: "VISIT US",
    value: business.address.lines.map((l) => <span key={l} className="block">{l}</span>),
  },
  { icon: "clock", label: "HOURS", value: business.hours ?? "By appointment. Call or WhatsApp to book" },
];

async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="w-full">
        {/* HERO */}
        <section id="top" className="relative overflow-hidden bg-forest">
          <div className="absolute inset-y-0 right-0 w-full opacity-45 min-[861px]:w-[62%] min-[861px]:opacity-100">
            <Image
              src="/images/hero-massage.jpg"
              alt="Client relaxing during a back massage"
              fill
              priority
              sizes="(max-width: 860px) 100vw, 62vw"
              className="object-cover object-[60%_30%]"
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,42,29,.6),#0B2A1D)] min-[861px]:bg-[linear-gradient(90deg,#0B2A1D_0%,#0B2A1D_38%,rgba(11,42,29,.55)_58%,rgba(11,42,29,0)_80%)]" />
          <div className="wrap relative pt-20 pb-24 md:pt-28 md:pb-30">
            <div className="flex max-w-[600px] flex-col gap-7">
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
                <a className="btn btn-solid" href="#contact">
                  Book a treatment
                  <Icon name="arrow" size={18} strokeWidth={2} />
                </a>
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
            <div className="flex max-w-[640px] flex-col gap-3">
              <span className="eyebrow">OUR SERVICES</span>
              <h2 className="heading">Care for body, skin and workplace</h2>
              <p className="m-0 text-base leading-[1.65] text-ink-muted">
                Book in-clinic at Musgrave Park, or bring our therapists to your home, office or event.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(330px,100%),1fr))] gap-6">
              {services.map((s) => (
                <article key={s.id} id={s.id} className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-white">
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
                    <a className="btn btn-line mt-2 self-start" href="#contact">
                      {s.cta}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* TRAINING */}
        <section id="training" className="bg-white py-[88px]">
          <div className="wrap flex flex-wrap items-center gap-12">
            <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
              <span className="eyebrow">SKILLS FOR A BRIGHTER FUTURE</span>
              <h2 className="heading">Accredited Skills Development</h2>
              <p className="m-0 text-base leading-[1.65] text-ink-muted">
                QCTO-accredited occupational training that combines classroom teaching, hands-on practice in our working clinic and workplace placement with partner spas. Built for school leavers, unemployed matriculants and anyone ready for a career in wellness.
              </p>
              <div className="flex flex-col gap-2.5 rounded-[14px] bg-mint-soft px-5 py-[18px] text-[13px] text-ink-body">
                <span>
                  <strong className="text-ink-strong">QCTO Skills Development Provider</strong> · {business.qcto}
                </span>
                <span>
                  <strong className="text-ink-strong">HWSETA Stakeholder</strong> · T-Number {business.hwseta}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="pb-1.5 text-xs font-semibold tracking-[.2em] text-ink-subtle">OUR QUALIFICATIONS</span>
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
              <a className="btn btn-solid mt-2 self-start" href="#contact">
                Enquire about training
              </a>
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
        <section id="about" className="py-[88px]">
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
              <p className="m-0 text-base leading-[1.65] text-ink-muted">
                Our in-house team of qualified somatologists works alongside a network of senior lecturers, doctoral-level researchers and skills development facilitators.
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

        {/* CORPORATE CTA */}
        <section className="bg-forest py-[72px]">
          <div className="wrap flex flex-wrap items-center justify-between gap-8">
            <div className="flex max-w-[700px] flex-col gap-3">
              <span className="text-xs font-semibold tracking-[.24em] text-brand-light">HEALTHIER PEOPLE, STRONGER BUSINESS</span>
              <h2 className="m-0 font-serif text-[clamp(28px,3.4vw,40px)] leading-[1.2] font-normal text-white">Plan a wellness day for your team</h2>
              <p className="m-0 text-base leading-[1.6] text-[#c9dace]">
                On-site seated massage, health screening and stress-management sessions, set up at your office, conference or community event.
              </p>
            </div>
            <div className="flex flex-wrap gap-3.5">
              <a className="btn btn-solid" href="#contact">
                Request a proposal
              </a>
              <a className="btn btn-ghost" href={business.whatsapp} target="_blank" rel="noopener noreferrer">
                WhatsApp us
              </a>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="py-[88px]">
          <div className="wrap flex flex-wrap gap-12">
            <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
              <span className="eyebrow">GET IN TOUCH</span>
              <h2 className="heading">Book a treatment or enquire about training</h2>
              <div className="flex flex-col gap-[18px] pt-2">
                {contactItems.map((c) => (
                  <div key={c.label} className="flex items-start gap-3.5">
                    <span className="flex size-11 flex-none items-center justify-center rounded-full bg-mint text-brand">
                      <Icon name={c.icon} size={20} strokeWidth={1.6} />
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold tracking-[.14em] text-ink-subtle">{c.label}</span>
                      <span className="text-base font-semibold text-ink-strong">{c.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <EnquiryForm />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-forest-deep pt-14 pb-8 text-mint-line">
        <div className="wrap flex flex-col gap-8">
          <div className="flex flex-wrap justify-between gap-8">
            <div className="flex max-w-[360px] flex-col gap-3">
              <div className="flex items-center gap-3">
                <Image src="/images/logo.png" alt="" width={36} height={36} />
                <span className="text-base font-bold tracking-[.06em] text-white">INFINITY SOMA WELLNESS CLINIC</span>
              </div>
              <p className="m-0 text-sm leading-[1.6]">Integrated wellness, aesthetics and skills development in Durban.</p>
            </div>
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2.5 text-sm">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="text-mint-line no-underline hover:text-white">
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap justify-between gap-4 border-t border-[#1e3a2b] pt-5 text-[12.5px] text-[#9fb8a7]">
            <span>
              © <CopyrightYear /> {business.legalName} · Reg. {business.registration}
            </span>
            <span>
              QCTO SDP {business.qcto} · HWSETA {business.hwseta}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
