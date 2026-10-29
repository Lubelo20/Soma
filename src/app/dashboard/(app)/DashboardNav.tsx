"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Bookings", count: "pending" as const },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/enquiries", label: "Enquiries", count: "enquiries" as const },
  { href: "/dashboard/treatments", label: "Treatments & prices", short: "Treatments" },
  { href: "/dashboard/hours", label: "Opening hours", short: "Hours" },
  { href: "/dashboard/account", label: "Password" },
];

export function DashboardNav({ counts }: { counts: { pending: number; enquiries: number } }) {
  const pathname = usePathname();
  // On phones every link shows at once in a grid, so nothing hides off-screen; on desktop it's the sidebar list.
  return (
    <nav aria-label="Dashboard" className="grid grid-cols-3 gap-1.5 pb-4 sm:grid-cols-4 lg:flex lg:flex-col lg:gap-0.5 lg:pb-0">
      {links.map((l) => {
        const active = pathname === l.href;
        const n = l.count ? counts[l.count] : 0;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-[2px] px-2 text-[11px] font-medium tracking-[.1em] uppercase no-underline transition-colors lg:justify-between lg:gap-3 lg:rounded-none lg:border-l-2 lg:px-3.5 lg:py-2.5 lg:text-[11.5px] lg:tracking-[.16em] ${
              active ? "bg-white/15 text-white lg:border-brand-light lg:bg-white/10" : "bg-white/5 text-[#b9c9bc] hover:bg-white/10 hover:text-white lg:border-transparent lg:bg-transparent"
            }`}
          >
            {"short" in l ? (
              <>
                <span className="lg:hidden">{l.short}</span>
                <span className="max-lg:hidden">{l.label}</span>
              </>
            ) : (
              l.label
            )}
            {n > 0 && <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold tracking-normal text-forest-deep">{n}</span>}
          </Link>
        );
      })}
      <Link
        href="/"
        className="flex min-h-11 items-center justify-center rounded-[2px] px-2 text-[11px] font-medium tracking-[.1em] text-[#8fa394] uppercase no-underline hover:text-white lg:justify-start lg:rounded-none lg:border-l-2 lg:border-transparent lg:px-3.5 lg:py-2.5 lg:text-[11.5px] lg:tracking-[.16em]"
      >
        <span className="lg:hidden">Website ↗</span>
        <span className="max-lg:hidden">View website ↗</span>
      </Link>
    </nav>
  );
}
