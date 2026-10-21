import type { Metadata } from "next";
import { Great_Vibes, Libre_Caslon_Text, Montserrat } from "next/font/google";
import { business } from "@/lib/site";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const caslon = Libre_Caslon_Text({
  variable: "--font-caslon",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const vibes = Great_Vibes({
  variable: "--font-vibes",
  subsets: ["latin"],
  weight: "400",
});

const description =
  "Wellness treatments, advanced skincare, corporate wellness and QCTO-accredited occupational training in Musgrave, Durban. Mobile and in-clinic.";

export const metadata: Metadata = {
  metadataBase: new URL(business.url),
  title: {
    default: `${business.name} | Massage, Skincare & Training in Durban`,
    template: `%s | ${business.name}`,
  },
  description,
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: business.name,
    title: business.name,
    description,
    images: [{ url: "/images/hero-massage.jpg", width: 1350, height: 700 }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-ZA"
      className={`${montserrat.variable} ${caslon.variable} ${vibes.variable} antialiased`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
