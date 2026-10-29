"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Bookings", count: "pending" as const },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/enquiries", label: "Enquiries", count: "enquiries" as const },
  { href: "/dashboard/treatments", label: "Treatments & prices" },
  { href: "/dashboard/hours", label: "Opening hours" },
  { href: "/dashboard/account", label: "Password" },
];

export function DashboardNav({ counts }: { counts: { pending: number; enquiries: number } }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-3 lg:mx-0 lg:flex-col lg:gap-0.5 lg:px-0 lg:pb-0">
      {links.map((l) => {
        const active = pathname === l.href;
        const n = l.count ? counts[l.count] : 0;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-none items-center justify-between gap-3 border-l-2 px-3.5 py-2.5 text-[11.5px] font-medium tracking-[.16em] uppercase no-underline transition-colors ${
              active ? "border-brand-light bg-white/10 text-white" : "border-transparent text-[#b9c9bc] hover:bg-white/5 hover:text-white"
            }`}
          >
            {l.label}
            {n > 0 && <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold tracking-normal text-forest-deep">{n}</span>}
          </Link>
        );
      })}
      <Link
        href="/"
        className="flex-none border-l-2 border-transparent px-3.5 py-2.5 text-[11.5px] font-medium tracking-[.16em] text-[#8fa394] uppercase no-underline hover:text-white"
      >
        View website ↗
      </Link>
    </nav>
  );
}
