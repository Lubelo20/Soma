import type { Metadata } from "next";
import { PageHero } from "@/components/Blocks";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Icon } from "@/components/Icon";
import { describeHours, getWeeklyHours } from "@/lib/data";
import type { IconName } from "@/lib/icons";
import { business, socials } from "@/lib/site";

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
          <a href={`tel:${business.phoneE164}`} className="text-ink-strong no-underline hover:text-gold-deep">
            {business.phoneDisplay}
          </a>
          <a href={business.whatsapp} target="_blank" rel="noopener noreferrer" className="text-link mt-3 self-start">
            Chat on WhatsApp
          </a>
        </>
      ),
    },
    {
      icon: "mail",
      label: "EMAIL",
      value: (
        <a href={`mailto:${business.email}`} className="text-ink-strong no-underline hover:text-gold-deep">
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
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-link mt-3 self-start">
            Get directions
          </a>
        </>
      ),
    },
    { icon: "clock", label: "HOURS", value: <Hours /> },
    {
      icon: "people",
      label: "FOLLOW US",
      value: socials.map((s) => (
        <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-ink-strong no-underline hover:text-gold-deep">
          <span className="text-gold">
            <Icon name={s.icon} size={20} strokeWidth={1.3} />
          </span>
          {s.name} <span className="text-[17px] text-ink-muted">{s.handle}</span>
        </a>
      )),
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="GET IN TOUCH"
        title="We'd love to hear from you"
        intro="Questions about a treatment, a mobile visit, corporate wellness or training? Send us a message, call or WhatsApp."
        texture="/images/marble-green.jpg"
      />
      <section className="py-16 md:py-24 lg:py-32">
        <div className="wrap flex flex-wrap gap-10 lg:gap-16">
          <div className="flex min-w-0 flex-[1_1_360px] flex-col border-t border-line">
            {items.map((c) => (
              <div key={c.label} className="flex items-start gap-5 border-b border-line py-7">
                <span className="flex-none pt-1 text-gold">
                  <Icon name={c.icon} size={22} strokeWidth={1.2} />
                </span>
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-medium tracking-[.3em] text-gold-deep">{c.label}</span>
                  <span className="flex flex-col font-serif text-[22px] leading-[1.4] text-ink-strong lining-nums">{c.value}</span>
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
