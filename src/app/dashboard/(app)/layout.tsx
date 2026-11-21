import type { Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense, cache } from "react";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { IdleLock } from "../IdleLock";
import { SignOutButton } from "../SignOutButton";
import { BottomNav } from "./BottomNav";
import { DashboardNav } from "./DashboardNav";

// Lets the page reach under the phone's rounded corners and home bar, so env(safe-area-inset-*) has values for the
// bottom bar (and the card editor's sticky bar). The edge paddings below keep content clear of a landscape notch.
export const viewport: Viewport = { viewportFit: "cover" };

// The top bar and the bottom bar both show counts; one query per request.
const getCounts = cache(async () => {
  await requireStaff();
  const [counts] = await sql<{ pending: number; enquiries: number }[]>`
    select (select count(*)::int from bookings where status = 'pending') as pending,
           (select count(*)::int from enquiries where not handled) as enquiries`;
  return counts;
});

async function Sidebar() {
  const { pending, enquiries } = await getCounts();
  return (
    <>
      <DashboardNav counts={{ pending, enquiries }} />
      <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-5 text-sm max-lg:hidden">
        <SignOutButton
          iconSize={20}
          className="flex cursor-pointer items-center gap-3 p-0 px-3.5 text-[11.5px] font-medium tracking-[.16em] text-brand-light uppercase hover:text-white"
        />
      </div>
    </>
  );
}

async function BottomBar() {
  const { pending } = await getCounts();
  return <BottomNav pending={pending} />;
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Below lg this is a compact bar that stays at the top while scrolling; the menu opens from it (DashboardNav). */}
      <aside className="sticky top-0 z-40 flex min-h-14 items-center gap-2 bg-forest-deep py-1.5 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] text-white sm:pr-[max(1.25rem,env(safe-area-inset-right))] sm:pl-[max(1.25rem,env(safe-area-inset-left))] lg:flex-col lg:items-stretch lg:gap-6 lg:h-screen lg:w-64 lg:flex-none lg:p-6 lg:z-auto">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex min-h-11 items-center gap-3 no-underline max-lg:-mx-2 max-lg:px-2 lg:min-h-0">
            <Image src="/images/logo.png" alt="" width={31} height={32} className="h-8 w-auto" />
            <span className="flex flex-col leading-[1.15] max-lg:sr-only">
              <span className="text-[13px] font-semibold tracking-[.2em] text-white">INFINITY SOMA</span>
              <span className="text-[9.5px] tracking-[.3em] text-[#8fa394] uppercase">Staff dashboard</span>
            </span>
          </Link>
        </div>
        <Suspense fallback={<div className="max-lg:flex-1 lg:h-40" />}>
          <Sidebar />
        </Suspense>
      </aside>
      <div className="min-w-0 flex-1 p-5 max-lg:pr-[max(1.25rem,env(safe-area-inset-right))] max-lg:pl-[max(1.25rem,env(safe-area-inset-left))] lg:p-12">
        <Suspense fallback={<p className="text-ink-subtle">Loading…</p>}>{children}</Suspense>
      </div>
      <Suspense fallback={null}>
        <BottomBar />
      </Suspense>
      <IdleLock />
    </div>
  );
}
