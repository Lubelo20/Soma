import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand, PageHero, SectionHeading } from "@/components/Blocks";
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
      <section className="py-[88px]">
        <div className="wrap grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-8">
            <span className="eyebrow">OUR VISION</span>
            <p className="m-0 font-serif text-[22px] leading-[1.45]">
              To become the leading wellness, aesthetics and occupational training provider in KwaZulu-Natal, recognised for innovation, excellence, community empowerment and holistic healthcare.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-8">
            <span className="eyebrow">OUR MISSION</span>
            <p className="m-0 font-serif text-[22px] leading-[1.45]">
              To improve quality of life by integrating wellness services, accredited occupational training and corporate health programmes that enhance physical health, mental wellbeing, employability and organisational productivity.
            </p>
          </div>
        </div>
      </section>
      <section className="bg-white py-[88px]">
        <div className="wrap flex flex-wrap items-center gap-12">
          <div className="relative h-[440px] min-w-0 flex-[1_1_400px] overflow-hidden rounded-[18px]">
            <Image src="/images/gallery-team.jpg" alt="Infinity Soma team at the clinic reception" fill sizes="(max-width: 960px) 100vw, 560px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
            <span className="eyebrow">LEADERSHIP</span>
            <h2 className="heading">{business.founder}</h2>
            <span className="text-sm font-semibold text-ink-subtle">Founder &amp; Managing Director</span>
            <p className="m-0 text-base leading-[1.65] text-ink-muted">
              {business.founder} founded Infinity Soma in {business.founded} and provides its strategic leadership, overseeing regulatory compliance, business growth and the quality of every wellness and training service.
            </p>
            <p className="m-0 text-base leading-[1.65] text-ink-muted">
              Our in-house team of qualified somatologists is supported by an independent advisory board of healthcare professionals, academics and industry experts, and a network of senior lecturers, doctoral-level researchers and skills development facilitators.
            </p>
          </div>
        </div>
      </section>
      <section className="py-[88px]">
        <div className="wrap flex flex-col gap-10">
          <SectionHeading eyebrow="WHY INFINITY SOMA" title="What sets us apart" />
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-6 p-0">
            {pillars.map((p) => (
              <li key={p.label} className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-[60px] items-center justify-center rounded-full border-[1.5px] border-mint-line bg-white text-brand">
                  <Icon name={p.icon} size={26} />
                </span>
                <span className="text-sm font-semibold text-ink-body">{p.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="bg-white py-[88px]">
        <div className="wrap flex flex-col gap-10">
          <SectionHeading
            eyebrow="SOCIAL IMPACT"
            title="Empowering our communities"
            intro="We are dedicated to creating sustainable social impact beyond the treatment room."
          />
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3 p-0">
            {socialImpact.map((s) => (
              <li key={s} className="flex items-center gap-3 rounded-xl bg-mint-soft px-4 py-3.5 text-[15px] text-ink-body">
                <span className="text-brand">
                  <Icon name="leaf" size={18} strokeWidth={1.8} />
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand
        eyebrow="VISIT US"
        title="Experience Infinity Soma for yourself"
        body={`Find us at ${business.address.lines.join(", ")}, or book online in a few clicks.`}
        primary={{ href: "/book", label: "Book a treatment" }}
      />
    </>
  );
}
