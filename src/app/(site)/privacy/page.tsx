import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { PageHero } from "@/components/Blocks";
import { pageMetadata } from "@/lib/seo";
import { business } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Notice: Your Personal Information",
  description:
    "How Infinity Soma Wellness Clinic collects, uses and protects the personal information you share when you book a treatment or send an enquiry, under POPIA.",
  path: "/privacy",
});

const UPDATED = "1 November 2026";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Who we are",
    body: (
      <p>
        {business.legalName} (registration {business.registration}), {business.address.lines.join(", ")}, is the responsible party for the
        personal information described here. Our information officer is {business.founder}, Founder &amp; Managing Director. You can reach us at{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a> or {business.phoneDisplay}.
      </p>
    ),
  },
  {
    title: "What we collect",
    body: (
      <ul>
        <li>
          <strong>When you book:</strong> your name, phone or WhatsApp number, email address, the treatment, date and time you choose, and any
          notes you add.
        </li>
        <li>
          <strong>Health information:</strong> the booking form lets you tell us about pregnancy, injuries, allergies or skin concerns. This is
          optional. If you share it, you consent to us using it only to make your treatment safe and suitable.
        </li>
        <li>
          <strong>When you send an enquiry:</strong> your name, phone number, email address (optional), what you&rsquo;re interested in and your
          message.
        </li>
      </ul>
    ),
  },
  {
    title: "Why we use it",
    body: (
      <p>
        To confirm, change or cancel your booking, to reply to your enquiry, to prepare your treatment safely, and to keep the records we need
        for accounting and legal purposes. We don&rsquo;t sell your information or use it for advertising, and we only send you marketing if you
        ask for it.
      </p>
    ),
  },
  {
    title: "Cookies",
    body: (
      <p>
        The public website doesn&rsquo;t use analytics, advertising or tracking cookies. The only cookie is a sign-in cookie used by our staff
        dashboard.
      </p>
    ),
  },
  {
    title: "Who we share it with",
    body: (
      <p>
        Only the service providers that run the website for us: Vercel (website hosting), Neon (secure database) and Resend (booking emails).
        They process the information on our instructions and protect it under their own data processing agreements. Their systems are located
        outside South Africa, in countries with data protection laws comparable to POPIA.
      </p>
    ),
  },
  {
    title: "How we protect it",
    body: (
      <p>
        Information is sent over encrypted connections (HTTPS) and stored in an encrypted database. Only our staff can see bookings and
        enquiries, through a password-protected dashboard.
      </p>
    ),
  },
  {
    title: "How long we keep it",
    body: (
      <p>
        We keep booking and enquiry records only for as long as we need them for the reasons above and to meet our legal and tax obligations,
        and then delete them.
      </p>
    ),
  },
  {
    title: "Your rights",
    body: (
      <p>
        You may ask to see the personal information we hold about you, ask us to correct or delete it, or object to how we use it. Email{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a> and we&rsquo;ll respond within 30 days. If you&rsquo;re not satisfied, you can
        complain to the Information Regulator (South Africa) at{" "}
        <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">
          inforegulator.org.za
        </a>
        .
      </p>
    ),
  },
  {
    title: "If something goes wrong",
    body: (
      <p>
        If we believe your personal information has been accessed without authorisation, we will notify the Information Regulator and you as
        soon as reasonably possible, as POPIA requires.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <BreadcrumbJsonLd name="Privacy Notice" path="/privacy" />
      <PageHero
        eyebrow="PRIVACY"
        title="Privacy Notice"
        intro="How we collect, use and protect your personal information under the Protection of Personal Information Act (POPIA)."
      />
      <section className="py-16 md:py-24">
        <div className="wrap flex max-w-[760px] flex-col gap-10">
          <p className="m-0 text-[13px] tracking-[.04em] text-ink-subtle">Last updated {UPDATED}</p>
          {sections.map((s) => (
            <div key={s.title} className="flex flex-col gap-3 text-[15.5px] leading-[1.8] text-ink-body [&_li]:mb-2 [&_p]:m-0 [&_ul]:m-0 [&_ul]:pl-5">
              <h2 className="m-0 font-serif text-[28px] leading-tight font-light text-ink-strong">{s.title}</h2>
              {s.body}
            </div>
          ))}
          <p className="m-0 text-[15px] text-ink-muted">
            Questions? <Link href="/contact">Contact us</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
