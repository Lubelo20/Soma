import type { Metadata } from "next";
import { business } from "./site";

/** 1200×630 share image used by WhatsApp, Facebook and X link previews. */
export const shareImage = {
  url: "/images/og-infinity-soma.jpg",
  width: 1200,
  height: 630,
  alt: "Client relaxing during a facial at Infinity Soma Wellness Clinic, Durban",
};

/**
 * Title, description, canonical URL and link-preview tags for one public page. Next.js replaces
 * openGraph as a whole rather than merging it with the root layout's, so every page sets all of it.
 */
export function pageMetadata({ title, description, path }: { title?: string; description: string; path: string }): Metadata {
  const shareTitle = title ? `${title} | ${business.name}` : `${business.name} | Durban`;
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_ZA",
      siteName: business.name,
      title: shareTitle,
      description,
      url: path,
      images: [shareImage],
    },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [shareImage] },
  };
}
