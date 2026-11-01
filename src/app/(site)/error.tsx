"use client";

import Link from "next/link";
import { business } from "@/lib/site";

// Shown inside the normal header and footer when a page fails to load. No error details reach the visitor.
export default function SiteError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <section className="py-24 md:py-32 lg:py-40">
      <div className="wrap flex max-w-[640px] flex-col items-start gap-6">
        <span className="eyebrow">Something went wrong</span>
        <h1 className="m-0 font-serif text-[clamp(40px,4.6vw,60px)] leading-[1.05] font-light text-ink-strong">This page didn&rsquo;t load</h1>
        <p className="lede">
          Please try again in a moment. If it keeps happening, WhatsApp or call us on {business.phoneDisplay} and we&rsquo;ll help you book.
        </p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
          <button type="button" onClick={() => retry()} className="btn btn-solid border-none">
            Try again
          </button>
          <Link className="text-link" href="/">
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
