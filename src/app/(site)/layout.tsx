import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { business } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  name: business.name,
  legalName: business.legalName,
  url: business.url,
  email: business.email,
  telephone: business.phoneE164,
  image: `${business.url}/images/hero-massage.jpg`,
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
  sameAs: [business.instagram],
};

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="w-full">{children}</main>
      <Footer />
    </>
  );
}
