import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { logout } from "../actions";
import { DashboardNav } from "./DashboardNav";

async function Sidebar() {
  await requireStaff();
  const [{ pending, enquiries }] = await sql<{ pending: number; enquiries: number }[]>`
    select (select count(*)::int from bookings where status = 'pending') as pending,
           (select count(*)::int from enquiries where not handled) as enquiries`;
  return (
    <>
      <DashboardNav counts={{ pending, enquiries }} />
      <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-5 text-sm max-lg:hidden">
        <form action={logout}>
          <button type="submit" className="cursor-pointer p-0 text-[11.5px] font-medium tracking-[.16em] text-brand-light uppercase hover:text-white">
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex flex-col gap-5 bg-forest-deep px-5 pt-5 pb-0 text-white lg:gap-6 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex-none lg:p-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 no-underline">
            <Image src="/images/logo.png" alt="" width={31} height={32} className="h-8 w-auto" />
            <span className="flex flex-col leading-[1.15]">
              <span className="text-[13px] font-semibold tracking-[.2em] text-white">INFINITY SOMA</span>
              <span className="text-[9.5px] tracking-[.3em] text-[#8fa394] uppercase">Staff dashboard</span>
            </span>
          </Link>
          {/* On phones the sidebar footer is hidden, so sign-out lives up here. */}
          <form action={logout} className="lg:hidden">
            <button type="submit" className="cursor-pointer p-2 text-[11px] font-medium tracking-[.16em] text-brand-light uppercase hover:text-white">
              Sign out
            </button>
          </form>
        </div>
        <Suspense fallback={<div className="h-40" />}>
          <Sidebar />
        </Suspense>
      </aside>
      <div className="min-w-0 flex-1 p-5 lg:p-12">
        <Suspense fallback={<p className="text-ink-subtle">Loading…</p>}>{children}</Suspense>
      </div>
    </div>
  );
}
