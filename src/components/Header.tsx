"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navLinks } from "@/lib/site";
import { Icon } from "./Icon";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur-sm">
      <div className="wrap flex min-h-20 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image src="/images/logo.png" alt="" width={39} height={40} className="h-9 w-auto" priority />
          <span className="flex flex-col leading-[1.15]">
            <span className="text-[15px] font-semibold tracking-[.2em] text-ink-strong">INFINITY SOMA</span>
            <span className="text-[9.5px] tracking-[.42em] text-ink-muted">WELLNESS CLINIC</span>
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
          <Link href="/book" className="btn btn-solid min-h-11 px-6 max-sm:hidden">
            Book now
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
            <Link href="/book" onClick={() => setOpen(false)} className="btn btn-solid mt-4 mb-2">
              Book now
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
