"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { business, navLinks, socials } from "@/lib/site";
import { Icon } from "./Icon";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur-sm">
      <div className="wrap flex min-h-20 items-center justify-between gap-3 sm:gap-6">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image src="/images/logo.png" alt="" width={39} height={40} className="h-9 w-auto" priority />
          <span className="flex flex-col leading-[1.15] whitespace-nowrap">
            <span className="text-[13px] font-semibold tracking-[.18em] text-ink-strong sm:text-[15px] sm:tracking-[.2em]">INFINITY SOMA</span>
            <span className="text-[8.5px] tracking-[.36em] text-ink-muted sm:text-[9.5px] sm:tracking-[.42em]">WELLNESS CLINIC</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden gap-9 text-[11.5px] font-medium tracking-[.2em] uppercase lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`border-b py-1 transition-colors hover:text-gold-deep ${isActive(l.href) ? "border-gold text-ink-strong" : "border-transparent text-ink-body"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/book" className="btn btn-solid min-h-11 px-6 max-sm:min-h-10 max-sm:px-4">
            <span className="sm:hidden">Book</span>
            <span className="max-sm:hidden">Book now</span>
          </Link>
          <button
            type="button"
            className="flex size-11 items-center justify-center text-ink hover:text-gold-deep lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? "close" : "menu"} size={24} strokeWidth={1.4} />
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-cream lg:hidden">
          <div className="wrap flex flex-col py-4">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`border-b border-line-soft py-4 font-serif text-[22px] last:border-0 hover:text-gold-deep ${isActive(l.href) ? "text-gold-deep" : "text-ink"}`}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/book" onClick={() => setOpen(false)} className="btn btn-solid mt-4">
              Book now
            </Link>
            <div className="mt-4 mb-2 flex flex-wrap items-center justify-between gap-4">
              <a href={`tel:${business.phoneE164}`} className="text-[13px] tracking-[.04em] text-ink-body no-underline lining-nums">
                Call {business.phoneDisplay}
              </a>
              <ul className="m-0 flex list-none gap-1 p-0">
                {socials.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${s.name} ${s.handle}`}
                      className="flex size-11 items-center justify-center text-ink hover:text-gold-deep"
                    >
                      <Icon name={s.icon} size={22} strokeWidth={1.3} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
