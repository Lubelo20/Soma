import type { Metadata } from "next";
import { CtaBand, PageHero, SectionHeading } from "@/components/Blocks";
import { TreatmentMenu } from "@/components/TreatmentMenu";

export const metadata: Metadata = {
  title: "Massage & Wellness Treatments",
  description: "Swedish, deep tissue, hot stone, gua sha, aromatherapy and prenatal massage, lymphatic drainage, reflexology, pedicures and manicures in Musgrave, Durban.",
};

export default function TreatmentsPage() {
  return (
    <>
      <PageHero
        eyebrow="WELLNESS & THERAPY"
        title="Wellness and Therapeutic Services"
        intro="Professional treatments designed to promote relaxation, recovery and overall wellbeing. They support stress management, pain relief, better circulation and faster recovery."
        img="/images/wellness-hot-stones.jpg"
        alt="Hot stone massage"
      />
      <section className="py-16 md:py-24 lg:py-28">
        <div className="wrap flex flex-col gap-12">
          <SectionHeading
            eyebrow="TREATMENT MENU"
            title="Choose your treatment"
            intro="All treatments are performed by qualified somatologists at our Musgrave Park clinic. Book online and we'll confirm your time by email."
          />
          <TreatmentMenu category="wellness" />
        </div>
      </section>
      <CtaBand
        eyebrow="MOBILE TREATMENTS"
        title="We can come to you"
        body="Prefer your home, office, event or race day? Our therapists bring the treatment to you across Durban and beyond. Send us an enquiry to arrange a visit."
        primary={{ href: "/contact", label: "Arrange a mobile visit" }}
        img="/images/athlete-recovery.jpg"
        alt="Therapist stretching an athlete's leg on a massage bed at a race event"
      />
    </>
  );
}
