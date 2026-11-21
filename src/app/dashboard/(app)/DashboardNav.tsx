"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/lib/icons";
import { SignOutButton } from "../SignOutButton";

const links: { href: string; label: string; short?: string; icon: IconName; count?: "pending" | "enquiries" }[] = [
  { href: "/dashboard", label: "Bookings", icon: "bookings", count: "pending" },
  { href: "/dashboard/calendar", label: "Calendar", icon: "calendarGrid" },
  { href: "/dashboard/enquiries", label: "Enquiries", icon: "chat", count: "enquiries" },
  { href: "/dashboard/clients", label: "Clients", icon: "person" },
  { href: "/dashboard/treatments", label: "Treatments & prices", short: "Treatments", icon: "tag" },
  { href: "/dashboard/specials", label: "Specials", icon: "sparkle" },
  { href: "/dashboard/hours", label: "Opening hours", short: "Hours", icon: "clock" },
  { href: "/dashboard/account", label: "Password", icon: "lock" },
];

const isActive = (href: string, pathname: string) => (href === "/dashboard/clients" ? pathname.startsWith(href) : pathname === href);

// Phones: icon above a short label in a tile, count badge in the corner. Desktop: icon, label, count in a row.
const item =
  "relative flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-[2px] px-2 py-2.5 text-[11px] font-medium tracking-[.1em] uppercase no-underline transition-colors lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-none lg:border-l-2 lg:px-3.5 lg:py-2.5 lg:text-[11.5px] lg:tracking-[.16em]";

// The count shortcuts in the phone bar.
const countLink =
  "inline-flex h-11 min-w-11 flex-none items-center justify-center gap-0.5 rounded-[2px] px-1 text-[#b9c9bc] no-underline hover:text-white";
const countBadge = "min-w-5 rounded-full bg-brand-light px-1.5 py-0.5 text-center text-[12px] leading-none font-bold text-forest-deep";

const PANEL_ID = "dashboard-menu";

/**
 * From lg: the sidebar list. Below lg: a compact bar (the current section, the counts staff open the dashboard for,
 * and a Menu button) with the same tiles in a panel that drops down from it. The panel closes on navigation, on
 * Escape, on a tap outside it, and when focus moves into the page, for example to the card editor's
 * unsaved-changes prompt when it holds a menu link.
 */
export function DashboardNav({ counts }: { counts: { pending: number; enquiries: number } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  // Set when a menu link is tapped. The link is hidden as the menu closes, which would leave focus on <body>.
  const leftByMenu = useRef(false);

  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const inside = (n: EventTarget | null) => n instanceof Node && (!!bar.current?.contains(n) || !!panel.current?.contains(n));
    // On window in the capture phase, added after the card editor's leave guard: it still runs when the guard holds
    // the link (the guard stops the click reaching the link, not other listeners on window).
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("a[href]") && inside(e.target)) {
        leftByMenu.current = true;
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onFocus = (e: FocusEvent) => {
      if (!inside(e.target)) setOpen(false);
    };
    window.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);

  // After navigating from the menu, focus goes back to the Menu button (unless something, such as the card editor's
  // unsaved-changes prompt, has taken it).
  useEffect(() => {
    if (!leftByMenu.current) return;
    leftByMenu.current = false;
    const active = document.activeElement;
    if (!active || active === document.body || panel.current?.contains(active)) button.current?.focus({ preventScroll: true });
  }, [pathname]);

  const current = links.find((l) => isActive(l.href, pathname));

  return (
    <>
      <div ref={bar} className="flex min-w-0 flex-1 items-center gap-1 lg:hidden">
        <span className="min-w-0 flex-1 truncate font-serif text-[20px] leading-tight font-light text-white">
          {current ? (current.short ?? current.label) : "Dashboard"}
        </span>
        {counts.pending > 0 && (
          <Link
            href="/dashboard?view=pending"
            aria-label={`${counts.pending} ${counts.pending === 1 ? "booking" : "bookings"} waiting for confirmation`}
            className={countLink}
          >
            <Icon name="bookings" size={16} strokeWidth={1.5} />
            <span className={countBadge}>{counts.pending}</span>
          </Link>
        )}
        {counts.enquiries > 0 && (
          <Link
            href="/dashboard/enquiries"
            aria-label={`${counts.enquiries} ${counts.enquiries === 1 ? "enquiry" : "enquiries"} not handled yet`}
            className={countLink}
          >
            <Icon name="chat" size={16} strokeWidth={1.5} />
            <span className={countBadge}>{counts.enquiries}</span>
          </Link>
        )}
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          aria-controls={PANEL_ID}
          onClick={() => setOpen((o) => !o)}
          className={`ml-1 inline-flex h-11 flex-none cursor-pointer items-center gap-1.5 rounded-[2px] border px-2.5 text-[11px] font-medium tracking-[.16em] uppercase transition-colors ${
            open ? "border-white/40 bg-white/15 text-white" : "border-white/20 text-brand-light hover:text-white"
          }`}
        >
          <Icon name={open ? "close" : "menu"} size={18} strokeWidth={1.5} />
          Menu
        </button>
      </div>

      {/* Below lg: the panel, hidden until Menu is pressed. From lg it is layout-neutral, so the nav is the sidebar's own child. */}
      <div
        ref={panel}
        id={PANEL_ID}
        className={`max-lg:absolute max-lg:inset-x-0 max-lg:top-full max-lg:border-t max-lg:border-white/10 max-lg:bg-forest-deep max-lg:pt-3 max-lg:pr-[max(1rem,env(safe-area-inset-right))] max-lg:pl-[max(1rem,env(safe-area-inset-left))] max-lg:pb-2 max-lg:shadow-[0_12px_24px_rgba(0,0,0,.25)] lg:contents ${
          open ? "" : "max-lg:hidden"
        }`}
      >
        <nav aria-label="Dashboard" className="grid grid-cols-3 gap-1.5 pb-3 sm:grid-cols-5 lg:flex lg:flex-col lg:gap-0.5 lg:pb-0">
          {links.map((l) => {
            const active = isActive(l.href, pathname);
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
        {/* The desktop sidebar has its own Sign out at the bottom. */}
        <SignOutButton
          iconSize={18}
          formClassName="flex justify-end border-t border-white/10 pt-2 lg:hidden"
          className="flex min-h-11 cursor-pointer items-center gap-2 p-2 text-[11px] font-medium tracking-[.16em] text-brand-light uppercase hover:text-white"
        />
      </div>
      {/* A tap outside the open menu closes it without also pressing whatever is underneath. */}
      {open && <div aria-hidden="true" onClick={() => setOpen(false)} className="fixed inset-0 -z-10 bg-forest-deep/40 lg:hidden" />}
    </>
  );
}
