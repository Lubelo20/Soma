import type { Metadata } from "next";
import Image from "next/image";
import { Accreditations, CtaBand, PageHero, SectionHeading } from "@/components/Blocks";
import { Icon } from "@/components/Icon";
import { business, pillars, socialImpact } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description: "Founded in 2023 by Banathi Sihonqo, Infinity Soma integrates wellness services, accredited training and corporate health programmes in Durban.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="ABOUT US"
        title="A Holistic Approach to Health and Wellbeing"
        intro="A multidisciplinary wellness, aesthetics, corporate wellness and skills development organisation committed to improving health, wellbeing, employability and community empowerment."
        img="/images/about-reception.jpg"
        alt="Infinity Soma reception area"
      />
      <section className="py-16 md:py-24 lg:py-32">
        <div className="wrap grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-0">
          <div className="flex flex-col gap-6 md:border-r md:border-line md:pr-16">
            <span className="eyebrow">Our vision</span>
            <p className="m-0 font-serif text-[clamp(24px,2.4vw,30px)] leading-[1.4] font-light text-ink-strong">
              To become the leading wellness, aesthetics and occupational training provider in KwaZulu-Natal, recognised for innovation, excellence, community empowerment and holistic healthcare.
            </p>
          </div>
          <div className="flex flex-col gap-6 md:pl-16">
            <span className="eyebrow">Our mission</span>
            <p className="m-0 font-serif text-[clamp(24px,2.4vw,30px)] leading-[1.4] font-light text-ink-strong">
              To improve quality of life by integrating wellness services, accredited occupational training and corporate health programmes that enhance physical health, mental wellbeing, employability and organisational productivity.
            </p>
          </div>
        </div>
      </section>
      <section className="bg-white py-16 md:py-24 lg:py-32">
        <div className="wrap grid items-center gap-10 lg:gap-16 lg:grid-cols-2">
          <div className="relative aspect-[4/3] min-w-0 overflow-hidden lg:aspect-[4/5]">
            <Image src="/images/gallery-team.jpg" alt="Infinity Soma team at the clinic reception" fill sizes="(max-width: 1024px) 100vw, 580px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            <span className="eyebrow">Leadership</span>
            <h2 className="heading">{business.founder}</h2>
            <span className="font-serif text-[20px] text-gold-deep italic">Founder &amp; Managing Director</span>
            <p className="lede">
              {business.founder} founded Infinity Soma in {business.founded} and provides its strategic leadership, overseeing regulatory compliance, business growth and the quality of every wellness and training service.
            </p>
            <p className="lede">
              Our in-house team of qualified somatologists is supported by an independent advisory board of healthcare professionals, academics and industry experts, and a network of senior lecturers, doctoral-level researchers and skills development facilitators.
            </p>
          </div>
        </div>
      </section>
      <section className="py-16 md:py-24 lg:py-32">
        <div className="wrap flex flex-col gap-10 md:gap-16">
          <SectionHeading center eyebrow="Why Infinity Soma" title="What sets us apart" />
          <ul className="m-0 grid list-none grid-cols-2 border-t border-line p-0 md:grid-cols-5">
            {pillars.map((p) => (
              <li key={p.label} className="flex flex-col items-center gap-4 border-b border-line px-4 py-10 text-center md:border-b-0 md:not-first:border-l">
                <span className="text-gold">
                  <Icon name={p.icon} size={30} strokeWidth={1} />
                </span>
                <span className="font-serif text-[19px] leading-snug text-ink-strong">{p.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="bg-white py-16 md:py-24 lg:py-32">
        <div className="wrap grid gap-10 lg:gap-16 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading
            eyebrow="Social impact"
            title="Empowering our communities"
            intro="We are dedicated to creating sustainable social impact beyond the treatment room."
          />
          <ul className="m-0 grid list-none grid-cols-1 border-t border-line p-0 sm:grid-cols-2 sm:gap-x-10">
            {socialImpact.map((s) => (
              <li key={s} className="flex items-center gap-4 border-b border-line py-5 text-[15px] text-ink-body">
                <span className="text-gold">
                  <Icon name="leaf" size={16} strokeWidth={1.4} />
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Accreditations />
      <CtaBand
        eyebrow="VISIT US"
        title="Experience Infinity Soma for yourself"
        body={`Find us at ${business.address.lines.join(", ")}, or book online in a few clicks.`}
        primary={{ href: "/book", label: "Book a treatment" }}
      />
    </>
  );
}
