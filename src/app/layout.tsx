import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { shareImage } from "@/lib/seo";
import { business } from "@/lib/site";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const description =
  "Wellness treatments, advanced skincare, corporate wellness and QCTO-accredited occupational training in Musgrave, Durban. Mobile and in-clinic.";

export const metadata: Metadata = {
  metadataBase: new URL(business.url),
  title: {
    default: `${business.name} | Massage & Skincare, Durban`,
    template: "%s | Infinity Soma",
  },
  description,
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: business.name,
    title: business.name,
    description,
    images: [shareImage],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-ZA"
      data-scroll-behavior="smooth"
      className={`${montserrat.variable} ${cormorant.variable} antialiased`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
