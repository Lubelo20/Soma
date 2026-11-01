import { business } from "@/lib/site";

/** Home › Page breadcrumb for search results (structured data only; the site is one level deep). */
export function BreadcrumbJsonLd({ name, path }: { name: string; path: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: business.url },
      { "@type": "ListItem", position: 2, name, item: `${business.url}${path}` },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
