"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/lib/icons";

const links: { href: string; label: string; short?: string; icon: IconName; count?: "pending" | "enquiries" }[] = [
  { href: "/dashboard", label: "Bookings", icon: "bookings", count: "pending" },
  { href: "/dashboard/calendar", label: "Calendar", icon: "calendarGrid" },
  { href: "/dashboard/enquiries", label: "Enquiries", icon: "chat", count: "enquiries" },
  { href: "/dashboard/treatments", label: "Treatments & prices", short: "Treatments", icon: "tag" },
  { href: "/dashboard/hours", label: "Opening hours", short: "Hours", icon: "clock" },
  { href: "/dashboard/account", label: "Password", icon: "lock" },
];

// Phones: icon above a short label in a tile, count badge in the corner. Desktop: icon, label, count in a row.
const item =
  "relative flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-[2px] px-2 py-2.5 text-[11px] font-medium tracking-[.1em] uppercase no-underline transition-colors lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-none lg:border-l-2 lg:px-3.5 lg:py-2.5 lg:text-[11.5px] lg:tracking-[.16em]";

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
            className={`${item} ${
              active ? "bg-white/15 text-white lg:border-brand-light lg:bg-white/10" : "bg-white/5 text-[#b9c9bc] hover:bg-white/10 hover:text-white lg:border-transparent lg:bg-transparent"
            }`}
          >
            <span className={active ? "text-brand-light" : "opacity-80"}>
              <Icon name={l.icon} size={20} strokeWidth={1.5} />
            </span>
            {l.short ? (
              <>
                <span className="lg:hidden">{l.short}</span>
                <span className="max-lg:hidden">{l.label}</span>
              </>
            ) : (
              l.label
            )}
            {n > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-5 rounded-full bg-brand-light px-1.5 py-0.5 text-center text-[11px] leading-none font-bold tracking-normal text-forest-deep lg:static lg:ml-auto lg:px-2 lg:py-1">
                {n}
              </span>
            )}
          </Link>
        );
      })}
      <Link href="/" className={`${item} bg-white/5 text-[#8fa394] hover:bg-white/10 hover:text-white lg:border-transparent lg:bg-transparent`}>
        <span className="opacity-80">
          <Icon name="external" size={20} strokeWidth={1.5} />
        </span>
        <span className="lg:hidden">Website</span>
        <span className="max-lg:hidden">View website</span>
      </Link>
    </nav>
  );
}
