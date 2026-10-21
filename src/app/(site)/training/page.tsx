import type { Metadata } from "next";
import Image from "next/image";
import { PageHero, SectionHeading } from "@/components/Blocks";
import { EnquiryForm } from "@/components/EnquiryForm";
import { business, quals, trainingSolutions } from "@/lib/site";

export const metadata: Metadata = {
  title: "Accredited Training",
  description: "QCTO-accredited occupational qualifications in Durban: Manual Skin Care Therapist, Body Massage Therapist and Beauty Therapist (NQF Level 4).",
};

const steps = [
  { title: "Classroom teaching", body: "Theory and foundations taught by experienced facilitators." },
  { title: "Hands-on practice", body: "Practical training in our working clinic, with real clients." },
  { title: "Workplace placement", body: "Experience with partner spas to prepare you for employment." },
];

export default function TrainingPage() {
  return (
    <>
      <PageHero
        eyebrow="SKILLS FOR A BRIGHTER FUTURE"
        title="Accredited Skills Development"
        intro="Nationally recognised occupational qualifications for school leavers, unemployed matriculants and anyone ready for a career in wellness."
        img="/images/training-team.jpg"
        alt="Infinity Soma somatologists in clinic uniforms"
      />
      <section className="border-b border-line">
        <div className="wrap flex flex-wrap gap-x-12 gap-y-3 py-7 text-[12px] tracking-[.16em] text-ink-subtle uppercase">
          <span>
            <span className="text-ink-strong">QCTO Skills Development Provider</span> · {business.qcto}
          </span>
          <span>
            <span className="text-ink-strong">HWSETA Stakeholder</span> · T-Number {business.hwseta}
          </span>
        </div>
      </section>
      <section className="py-24 md:py-32">
        <div className="wrap flex flex-col gap-14">
          <SectionHeading center eyebrow="Our qualifications" title="Occupational certificates" />
          <ul className="m-0 grid list-none grid-cols-1 border-t border-line p-0 md:grid-cols-3 md:border-b">
            {quals.map((q, i) => (
              <li key={q.saqa} className="flex flex-col items-center gap-4 border-b border-line px-6 py-12 text-center md:border-b-0 md:not-first:border-l">
                <span className="font-serif text-[20px] text-gold-deep italic">0{i + 1}</span>
                <h3 className="m-0 font-serif text-[28px] leading-[1.15] font-light">{q.title}</h3>
                <span className="text-[11px] tracking-[.2em] text-ink-subtle uppercase">SAQA ID {q.saqa} · NQF Level 4</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="bg-white py-24 md:py-32">
        <div className="wrap grid items-center gap-16 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-10">
            <SectionHeading eyebrow="How you learn" title="Learn, practise, get placed" />
            <ol className="m-0 flex list-none flex-col border-t border-line p-0">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-6 border-b border-line py-6">
                  <span className="font-serif text-[22px] leading-none text-gold-deep italic">0{i + 1}</span>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-serif text-[22px] leading-tight text-ink-strong">{s.title}</span>
                    <span className="text-[15px] leading-[1.7] text-ink-muted">{s.body}</span>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-3">
              <span className="text-[10.5px] font-medium tracking-[.3em] text-gold-deep uppercase">Training solutions</span>
              <span className="text-[15px] leading-[1.8] text-ink-body">{trainingSolutions.join(" · ")}</span>
            </div>
          </div>
          <div className="relative aspect-[4/5] min-w-0 overflow-hidden">
            <Image src="/images/training-facial.jpg" alt="Trainer guiding learners through a facial treatment" fill sizes="(max-width: 1024px) 100vw, 580px" className="object-cover" />
          </div>
        </div>
      </section>
      <section id="enrol" className="py-24 md:py-32">
        <div className="wrap flex flex-wrap gap-16">
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-6">
            <span className="eyebrow">Enrol or partner with us</span>
            <h2 className="heading">Start your career in wellness</h2>
            <p className="lede">
              Ask about intake dates, entry requirements and fees, or about learnerships and skills development partnerships for your organisation.
            </p>
          </div>
          <EnquiryForm kind="training" submitLabel="Send training enquiry" />
        </div>
      </section>
    </>
  );
}
