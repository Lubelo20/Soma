import type { Metadata } from "next";
import { CtaBand, PageHero, SectionHeading } from "@/components/Blocks";
import { TreatmentMenu } from "@/components/TreatmentMenu";

export const metadata: Metadata = {
  title: "Skincare & Aesthetics",
  description: "Somatology facials, chemical peels, dermaplaning, microdermabrasion, LED therapy, needling, Lamprobe and ladies' and men's waxing in Musgrave, Durban.",
};

export default function SkincarePage() {
  return (
    <>
      <PageHero
        eyebrow="RADIANT, HEALTHY SKIN"
        title="Advanced Skincare and Aesthetics"
        intro="Evidence-based skincare solutions to reveal your natural radiance, delivered with client-centred care."
        img="/images/service-skincare.jpg"
        alt="Facial treatment with a mask brush"
      />
      <section className="py-16 md:py-24 lg:py-28">
        <div className="wrap flex flex-col gap-12">
          <SectionHeading
            eyebrow="SKINCARE & WAXING MENU"
            title="Treatments for every skin goal"
            intro="Facials, advanced skin treatments and waxing for ladies and men, all performed by qualified somatologists."
          />
          <TreatmentMenu category="skincare" />
        </div>
      </section>
      <CtaBand
        eyebrow="NOT SURE WHERE TO START?"
        title="Not sure which treatment is right for you?"
        body="Tell us about your skin and what you'd like to change. We'll recommend the treatments and home care that suit you."
        primary={{ href: "/contact", label: "Ask our team" }}
      />
    </>
  );
}
