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
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="wrap flex min-h-20 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image src="/images/logo.png" alt="" width={39} height={40} className="h-10 w-auto" priority />
          <span className="flex flex-col leading-[1.1]">
            <span className="text-[17px] font-bold tracking-[.06em] text-ink-strong">INFINITY SOMA</span>
            <span className="text-[10.5px] tracking-[.32em] text-ink-muted">WELLNESS CLINIC</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden gap-7 text-sm font-medium lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`hover:text-brand ${isActive(l.href) ? "text-brand" : "text-ink"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/book" className="btn btn-solid min-h-11 px-5 max-sm:hidden">
            Book now
          </Link>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-mint lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? "close" : "menu"} size={24} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-white lg:hidden">
          <div className="wrap flex flex-col py-3">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`border-b border-line-soft py-3.5 text-base font-medium last:border-0 hover:text-brand ${isActive(l.href) ? "text-brand" : "text-ink"}`}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/book" onClick={() => setOpen(false)} className="btn btn-solid mt-3 mb-2">
              Book now
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
