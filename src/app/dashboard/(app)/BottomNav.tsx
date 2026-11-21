"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/lib/icons";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Bookings", icon: "bookings" },
  { href: "/dashboard/calendar", label: "Calendar", icon: "calendarGrid" },
  { href: "/dashboard/clients", label: "Clients", icon: "person" },
];

const isActive = (href: string, pathname: string) => (href === "/dashboard/clients" ? pathname.startsWith(href) : pathname === href);

/**
 * Below lg: the three sections staff use most, in a bar fixed to the bottom of the screen (the Menu at the top still
 * lists everything). Not on the card editor, which has its own sticky Back / Next bar. A spacer in the page flow keeps
 * the end of every page clear of the bar. It sits under the top bar's open menu and its overlay (z-40) and under the
 * idle-lock cover (z-[1000]).
 */
export function BottomNav({ pending }: { pending: number }) {
  const pathname = usePathname();
  if (/^\/dashboard\/clients\/[^/]+\/edit$/.test(pathname)) return null;

  return (
    <>
      <div aria-hidden="true" className="h-[calc(3.5rem+env(safe-area-inset-bottom))] flex-none lg:hidden" />
      <nav
        aria-label="Main"
        className="dashboard-bottom-bar fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-forest-deep pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] shadow-[0_-6px_18px_rgba(0,0,0,.12)] lg:hidden"
      >
        <ul className="m-0 grid list-none grid-cols-3 p-0">
          {links.map((l) => {
            const active = isActive(l.href, pathname);
            const n = l.href === "/dashboard" ? pending : 0;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={n > 0 ? `${l.label}, ${n} waiting for confirmation` : undefined}
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-[.1em] uppercase no-underline transition-colors ${
                    active ? "text-white" : "text-[#b9c9bc] hover:text-white"
                  }`}
                >
                  {/* The current section: a light bar along the top edge and a brighter icon. */}
                  {active && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-brand-light" />}
                  <span className={`relative ${active ? "text-brand-light" : "opacity-80"}`}>
                    <Icon name={l.icon} size={22} strokeWidth={1.5} />
                    {n > 0 && (
                      <span className="absolute -top-1.5 left-[calc(100%-6px)] min-w-5 rounded-full bg-brand-light px-1.5 py-0.5 text-center text-[11px] leading-none font-bold tracking-normal text-forest-deep">
                        {n}
                      </span>
                    )}
                  </span>
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
