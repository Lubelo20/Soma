import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getWeeklyHours } from "@/lib/data";
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

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <BusinessJsonLd />
      <Header />
      <main className="w-full">{children}</main>
      <Footer />
    </>
  );
}
