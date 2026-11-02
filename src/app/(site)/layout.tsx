import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SpecialsPopup } from "@/components/SpecialsPopup";
import { getActiveSpecials, getWeeklyHours } from "@/lib/data";
import { business, socials } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  name: business.name,
  legalName: business.legalName,
  url: business.url,
  email: business.email,
  telephone: business.phoneE164,
  image: `${business.url}/images/hero-clinic.jpg`,
  logo: `${business.url}/images/logo.png`,
  foundingDate: String(business.founded),
  founder: { "@type": "Person", name: business.founder },
  address: {
    "@type": "PostalAddress",
    streetAddress: business.address.street,
    addressLocality: business.address.locality,
    addressRegion: business.address.region,
    postalCode: business.address.postalCode,
    addressCountry: business.address.country,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: business.phoneE164,
    email: business.email,
    areaServed: "ZA",
    availableLanguage: ["en"],
  },
  // In-clinic in Musgrave; mobile treatments and corporate programmes travel across the region.
  areaServed: [
    { "@type": "City", name: "Durban" },
    { "@type": "AdministrativeArea", name: "eThekwini" },
    { "@type": "AdministrativeArea", name: "KwaZulu-Natal" },
  ],
  // Facebook is left out while its link is only a search (see business.facebook).
  sameAs: socials.filter((s) => s.name !== "WhatsApp" && s.name !== "Facebook").map((s) => s.href),
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Business details for search engines, with the opening hours staff set in the dashboard. */
async function BusinessJsonLd() {
  const weekly = await getWeeklyHours();
  const openingHoursSpecification = weekly.flatMap((h, d) =>
    h ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${dayNames[d]}`, opens: h.opens, closes: h.closes }] : [],
  );
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...jsonLd, openingHoursSpecification }) }} />;
}

async function ActiveSpecialsPopup() {
  return <SpecialsPopup specials={await getActiveSpecials()} />;
}

async function SiteHeader() {
  return <Header showSpecials={(await getActiveSpecials()).length > 0} />;
}

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <BusinessJsonLd />
      <ActiveSpecialsPopup />
      <SiteHeader />
      <main className="w-full">{children}</main>
      <Footer />
    </>
  );
}
