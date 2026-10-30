import type { MetadataRoute } from "next";
import { business, navLinks } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", ...navLinks.map((l) => l.href), "/book"].map((path) => ({ url: `${business.url}${path}` }));
}
