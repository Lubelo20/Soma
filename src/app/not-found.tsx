import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { business } from "@/lib/site";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="w-full">
        <section className="py-24 md:py-32 lg:py-40">
          <div className="wrap flex max-w-[640px] flex-col items-start gap-6">
            <span className="eyebrow">Page not found</span>
            <h1 className="m-0 font-serif text-[clamp(40px,4.6vw,60px)] leading-[1.05] font-light text-ink-strong">
              We couldn&rsquo;t find that page
            </h1>
            <p className="lede">
              The link may be old or mistyped. Have a look at our treatments, book online, or WhatsApp us on {business.phoneDisplay} and we&rsquo;ll
              help.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
              <Link className="btn btn-solid" href="/">
                Back to home
              </Link>
              <Link className="text-link" href="/book">
                Book a treatment
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
