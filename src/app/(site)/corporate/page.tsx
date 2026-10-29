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
        img="/images/corporate-seated-massage.jpg"
        alt="Therapist giving a seated neck and shoulder massage at an expo"
      />
      <section className="py-16 md:py-24 lg:py-32">
        <div className="wrap flex flex-col gap-14">
          <SectionHeading center eyebrow="Programmes" title="What we offer your team" intro="Every programme is customised to your workplace, team size and goals." />
          <ul className="m-0 grid list-none grid-cols-1 border-t border-line p-0 sm:grid-cols-2 sm:gap-x-12 lg:grid-cols-3">
            {corporateProgrammes.map((p) => (
              <li key={p.title} className="flex items-center gap-4 border-b border-line py-6">
                <span className="flex-none text-gold">
                  <Icon name={p.icon} size={22} strokeWidth={1.2} />
                </span>
                <span className="font-serif text-[20px] leading-snug text-ink-strong">{p.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="bg-white py-16 md:py-24 lg:py-32">
        <div className="wrap grid items-center gap-10 lg:gap-16 lg:grid-cols-2">
          <div className="relative aspect-[4/3] min-w-0 overflow-hidden">
            <Image src="/images/race-day-tent.jpg" alt="Infinity Soma massage tent at an outdoor event" fill sizes="(max-width: 1024px) 100vw, 580px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            <span className="eyebrow">Wellness days</span>
            <h2 className="heading">We set up at your office, conference or event</h2>
            <p className="lede">
              On-site seated massage, health screening and stress-management sessions. Our team brings everything needed, so your staff can step away from their desks and come back refreshed.
            </p>
          </div>
        </div>
      </section>
      <section id="proposal" className="py-16 md:py-24 lg:py-32">
        <div className="wrap flex flex-wrap gap-10 lg:gap-16">
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-6">
            <span className="eyebrow">Request a proposal</span>
            <h2 className="heading">Tell us about your team</h2>
            <p className="lede">
              Share a little about your organisation, how many people you&rsquo;d like to reach and any dates you have in mind. We&rsquo;ll come back with a tailored proposal.
            </p>
          </div>
          <EnquiryForm kind="corporate" submitLabel="Request a proposal" />
        </div>
      </section>
    </>
  );
}
