import type { Metadata } from "next";
import Image from "next/image";
import { PageHero, SectionHeading } from "@/components/Blocks";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Icon } from "@/components/Icon";
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
      <section className="border-b border-line bg-white">
        <div className="wrap flex flex-wrap gap-x-10 gap-y-3 py-6 text-sm text-ink-body">
          <span>
            <strong className="text-ink-strong">QCTO Skills Development Provider</strong> · {business.qcto}
          </span>
          <span>
            <strong className="text-ink-strong">HWSETA Stakeholder</strong> · T-Number {business.hwseta}
          </span>
        </div>
      </section>
      <section className="py-[72px]">
        <div className="wrap flex flex-col gap-10">
          <SectionHeading eyebrow="OUR QUALIFICATIONS" title="Occupational certificates" />
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4 p-0">
            {quals.map((q) => (
              <li key={q.saqa} className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-7">
                <span className="flex size-12 items-center justify-center rounded-xl bg-mint text-brand">
                  <Icon name={q.icon} size={24} />
                </span>
                <h3 className="m-0 font-serif text-[24px] leading-[1.2] font-normal">{q.title}</h3>
                <span className="text-sm text-ink-subtle">SAQA ID: {q.saqa} · NQF Level 4</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="bg-white py-[72px]">
        <div className="wrap flex flex-wrap items-center gap-12">
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-6">
            <SectionHeading eyebrow="HOW YOU LEARN" title="Learn, practise, get placed" />
            <ol className="m-0 flex list-none flex-col gap-5 p-0">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex size-9 flex-none items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-bold text-ink-strong">{s.title}</span>
                    <span className="text-[15px] text-ink-muted">{s.body}</span>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-2 rounded-[14px] bg-mint-soft px-5 py-4">
              <span className="text-xs font-semibold tracking-[.2em] text-ink-subtle">TRAINING SOLUTIONS</span>
              <span className="text-[15px] text-ink-body">{trainingSolutions.join(" · ")}</span>
            </div>
          </div>
          <div className="relative h-[420px] min-w-0 flex-[1_1_440px] overflow-hidden rounded-[18px]">
            <Image src="/images/training-facial.jpg" alt="Trainer guiding learners through a facial treatment" fill sizes="(max-width: 960px) 100vw, 580px" className="object-cover" />
          </div>
        </div>
      </section>
      <section id="enrol" className="py-[88px]">
        <div className="wrap flex flex-wrap gap-12">
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
            <span className="eyebrow">ENROL OR PARTNER WITH US</span>
            <h2 className="heading">Start your career in wellness</h2>
            <p className="m-0 text-base leading-[1.65] text-ink-muted">
              Ask about intake dates, entry requirements and fees, or about learnerships and skills development partnerships for your organisation.
            </p>
          </div>
          <EnquiryForm kind="training" submitLabel="Send training enquiry" />
        </div>
      </section>
    </>
  );
}
