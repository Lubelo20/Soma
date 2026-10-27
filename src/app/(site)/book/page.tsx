import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHero } from "@/components/Blocks";
import { BookingForm } from "@/components/BookingForm";
import { formatPrice, getActiveTreatments, getClosures, getWeeklyHours } from "@/lib/data";
import { business } from "@/lib/site";
import { bookableDates } from "@/lib/slots";

export const metadata: Metadata = {
  title: "Book a Treatment",
  description: "Book a massage, facial or skincare treatment online at Infinity Soma Wellness Clinic, Musgrave, Durban.",
};

async function Booking({ searchParams }: { searchParams: PageProps<"/book">["searchParams"] }) {
  await connection(); // available dates depend on today's date
  const [{ treatment }, treatments, weekly, closures] = await Promise.all([searchParams, getActiveTreatments(), getWeeklyHours(), getClosures()]);
  const dates = bookableDates({ now: new Date(), weekly, closures: closures.map((c) => c.day) });
  const initialId = Number(treatment);
  return (
    <BookingForm
      treatments={treatments.map((t) => ({ id: t.id, name: t.name, category: t.category, durationMin: t.durationMin, price: formatPrice(t.priceCents) }))}
      dates={dates}
      initialTreatmentId={treatments.some((t) => t.id === initialId) ? initialId : undefined}
    />
  );
}

export default function BookPage(props: PageProps<"/book">) {
  return (
    <>
      <PageHero
        eyebrow="BOOK ONLINE"
        title="Book a treatment"
        intro="Choose your treatment, date and time. We'll hold the slot and confirm your booking by email."
      />
      <section className="py-14 md:py-24">
        <div className="wrap flex flex-wrap items-start gap-12">
          <div className="min-w-0 flex-[2_1_560px]">
            <Suspense fallback={<div className="h-[600px] border border-line bg-white" />}>
              <Booking searchParams={props.searchParams} />
            </Suspense>
          </div>
          <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-5 border-t border-gold/60 pt-8 text-[14.5px] leading-[1.8] text-ink-body lg:sticky lg:top-28">
            <span className="eyebrow">Good to know</span>
            <p className="m-0">Your time is held as soon as you request it. The clinic will confirm by email, usually the same day.</p>
            <p className="m-0">Treatments take place at {business.address.lines.join(", ")}.</p>
            <p className="m-0">
              Want us to come to you, or booking for a group?{" "}
              <a href="/contact" className="text-ink-strong underline decoration-gold underline-offset-4">Send an enquiry</a> or{" "}
              <a href={business.whatsapp} target="_blank" rel="noopener noreferrer" className="text-ink-strong underline decoration-gold underline-offset-4">
                WhatsApp us
              </a>
              .
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
