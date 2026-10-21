import type { Metadata } from "next";
import Image from "next/image";
import { PageHero, SectionHeading } from "@/components/Blocks";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Icon } from "@/components/Icon";
import { corporateProgrammes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Corporate Wellness",
  description: "Workplace massage, employee wellness days, stress and burnout workshops, health screening and first aid training for organisations in KwaZulu-Natal.",
};

export default function CorporatePage() {
  return (
    <>
      <PageHero
        eyebrow="HEALTHIER PEOPLE, STRONGER BUSINESS"
        title="Corporate Wellness Solutions"
        intro="We partner with public and private sector organisations to improve employee wellbeing, with programmes that boost productivity, reduce absenteeism and create healthier workplaces."
        img="/images/service-corporate.jpg"
        alt="Therapist giving a seated chair massage at work"
      />
      <section className="py-[72px]">
        <div className="wrap flex flex-col gap-10">
          <SectionHeading eyebrow="PROGRAMMES" title="What we offer your team" intro="Every programme is customised to your workplace, team size and goals." />
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4 p-0">
            {corporateProgrammes.map((p) => (
              <li key={p.title} className="flex items-center gap-4 rounded-[18px] border border-line bg-white p-5">
                <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-mint text-brand">
                  <Icon name={p.icon} />
                </span>
                <span className="text-[15px] font-semibold text-ink-strong">{p.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="bg-white py-[72px]">
        <div className="wrap flex flex-wrap items-center gap-12">
          <div className="relative h-[380px] min-w-0 flex-[1_1_440px] overflow-hidden rounded-[18px]">
            <Image src="/images/gallery-corporate-event.jpg" alt="Outdoor corporate wellness event with treatment tents" fill sizes="(max-width: 960px) 100vw, 580px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
            <span className="eyebrow">WELLNESS DAYS</span>
            <h2 className="heading">We set up at your office, conference or event</h2>
            <p className="m-0 text-base leading-[1.65] text-ink-muted">
              On-site seated massage, health screening and stress-management sessions. Our team brings everything needed, so your staff can step away from their desks and come back refreshed.
            </p>
          </div>
        </div>
      </section>
      <section id="proposal" className="py-[88px]">
        <div className="wrap flex flex-wrap gap-12">
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
            <span className="eyebrow">REQUEST A PROPOSAL</span>
            <h2 className="heading">Tell us about your team</h2>
            <p className="m-0 text-base leading-[1.65] text-ink-muted">
              Share a little about your organisation, how many people you&rsquo;d like to reach and any dates you have in mind. We&rsquo;ll come back with a tailored proposal.
            </p>
          </div>
          <EnquiryForm kind="corporate" submitLabel="Request a proposal" />
        </div>
      </section>
    </>
  );
}
