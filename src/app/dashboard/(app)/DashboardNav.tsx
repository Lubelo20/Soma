"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Bookings", count: "pending" as const },
  { href: "/dashboard/enquiries", label: "Enquiries", count: "enquiries" as const },
  { href: "/dashboard/treatments", label: "Treatments & prices" },
  { href: "/dashboard/hours", label: "Opening hours" },
  { href: "/dashboard/staff", label: "Staff" },
  { href: "/dashboard/account", label: "Account" },
];

export function DashboardNav({ counts }: { counts: { pending: number; enquiries: number } }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto lg:flex-col">
      {links.map((l) => {
        const active = pathname === l.href;
        const n = l.count ? counts[l.count] : 0;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-none items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium no-underline ${
              active ? "bg-mint text-brand-dark" : "text-ink hover:bg-mint-soft"
            }`}
          >
            {l.label}
            {n > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{n}</span>}
          </Link>
        );
      })}
      <Link href="/" className="flex-none rounded-xl px-3.5 py-2.5 text-sm text-ink-subtle no-underline hover:bg-mint-soft">
        View website ↗
      </Link>
    </nav>
  );
}
