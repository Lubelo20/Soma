import type { Metadata } from "next";
import { CtaBand, PageHero, SectionHeading } from "@/components/Blocks";
import { TreatmentMenu } from "@/components/TreatmentMenu";

export const metadata: Metadata = {
  title: "Skincare & Aesthetics",
  description: "Skin consultations, facials, chemical peels, dermaplaning, microdermabrasion, LED therapy, acne, pigmentation and anti-ageing treatments in Durban.",
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
      <section className="py-24 md:py-28">
        <div className="wrap flex flex-col gap-12">
          <SectionHeading
            eyebrow="SKINCARE MENU"
            title="Treatments for every skin goal"
            intro="Not sure where to start? Book a skin consultation and we'll build a treatment plan around your skin."
          />
          <TreatmentMenu category="skincare" />
        </div>
      </section>
      <CtaBand
        eyebrow="START WITH A CONSULTATION"
        title="Not sure which treatment is right for you?"
        body="A one-on-one skin analysis is the best first step. We'll recommend treatments and home care that suit your skin."
        primary={{ href: "/book", label: "Book a consultation" }}
      />
    </>
  );
}
