import type { Metadata } from "next";
import { PageHero } from "@/components/Blocks";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Icon } from "@/components/Icon";
import { describeHours, getWeeklyHours } from "@/lib/data";
import type { IconName } from "@/lib/icons";
import { business } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Visit Infinity Soma Wellness Clinic at Musgrave Park, Durban, call or WhatsApp +27 63 880 4946, or send us an enquiry.",
};

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.address.street}, Musgrave, Durban ${business.address.postalCode}`)}`;

async function Hours() {
  const lines = describeHours(await getWeeklyHours());
  return lines.map((l) => (
    <span key={l} className="block">
      {l}
    </span>
  ));
}

export default function ContactPage() {
  const items: { icon: IconName; label: string; value: React.ReactNode }[] = [
    {
      icon: "phone",
      label: "CELL / WHATSAPP",
      value: (
        <>
          <a href={`tel:${business.phoneE164}`} className="text-ink-strong no-underline hover:text-brand">
            {business.phoneDisplay}
          </a>
          <a href={business.whatsapp} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-brand">
            Chat on WhatsApp →
          </a>
        </>
      ),
    },
    {
      icon: "mail",
      label: "EMAIL",
      value: (
        <a href={`mailto:${business.email}`} className="text-ink-strong no-underline hover:text-brand">
          {business.email}
        </a>
      ),
    },
    {
      icon: "pin",
      label: "VISIT US",
      value: (
        <>
          {business.address.lines.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-brand">
            Get directions →
          </a>
        </>
      ),
    },
    { icon: "clock", label: "HOURS", value: <Hours /> },
  ];

  return (
    <>
      <PageHero
        eyebrow="GET IN TOUCH"
        title="We'd love to hear from you"
        intro="Questions about a treatment, a mobile visit, corporate wellness or training? Send us a message, call or WhatsApp."
      />
      <section className="py-[88px]">
        <div className="wrap flex flex-wrap gap-12">
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-[18px]">
            {items.map((c) => (
              <div key={c.label} className="flex items-start gap-3.5">
                <span className="flex size-11 flex-none items-center justify-center rounded-full bg-mint text-brand">
                  <Icon name={c.icon} size={20} strokeWidth={1.6} />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold tracking-[.14em] text-ink-subtle">{c.label}</span>
                  <span className="text-base font-semibold text-ink-strong">{c.value}</span>
                </div>
              </div>
            ))}
          </div>
          <EnquiryForm />
        </div>
      </section>
    </>
  );
}
