import Image from "next/image";
import Link from "next/link";
import { business, navLinks, socials } from "@/lib/site";
import { Icon } from "./Icon";

async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

const heading = "text-[11px] font-medium tracking-[.32em] text-brand-light uppercase";
const link = "inline-block py-2 text-[#c9cfc9] no-underline transition-colors hover:text-white";

export function Footer() {
  return (
    <footer className="bg-forest-deep pt-14 pb-8 md:pt-20 md:pb-10 text-[#c9cfc9]">
      <div className="wrap flex flex-col gap-14">
        <div className="grid gap-10 md:gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex max-w-[380px] flex-col gap-5">
            <div className="flex items-center gap-3">
              <Image src="/images/logo.png" alt="" width={35} height={36} className="h-9 w-auto" />
              <span className="flex flex-col leading-[1.15]">
                <span className="text-[15px] font-semibold tracking-[.2em] text-white">INFINITY SOMA</span>
                <span className="text-[9.5px] tracking-[.42em] text-[#9aa49d]">WELLNESS CLINIC</span>
              </span>
            </div>
            <p className="m-0 font-serif text-[24px] leading-[1.35] font-light text-white italic">Wellness today, a brighter tomorrow.</p>
            <ul className="m-0 flex list-none gap-2 p-0">
              {socials.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.name} ${s.handle}`}
                    title={`${s.name} ${s.handle}`}
                    className="flex size-11 items-center justify-center border border-white/15 text-[#c9cfc9] transition-colors hover:border-brand-light hover:text-white"
                  >
                    <Icon name={s.icon} size={20} strokeWidth={1.4} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4 text-sm">
            <span className={heading}>Visit</span>
            <p className="m-0 leading-[1.8]">
              {business.address.lines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </p>
            <div className="flex flex-col">
              <a href={`tel:${business.phoneE164}`} className={link}>
                {business.phoneDisplay}
              </a>
              <a href={`mailto:${business.email}`} className={link}>
                {business.email}
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-4 text-sm">
            <span className={heading}>Explore</span>
            <div className="grid grid-cols-2 gap-x-8">
              {[...navLinks, { href: "/book", label: "Book online" }].map((l) => (
                <Link key={l.href} href={l.href} className={link}>
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-white/10 pt-6 text-[12px] tracking-[.04em] text-[#8f9a93]">
          <span>
            © <CopyrightYear /> {business.legalName} · Reg. {business.registration}
          </span>
          <span>
            Design by Lubelo Tech Solutions
          </span>
        </div>
      </div>
    </footer>
  );
}
