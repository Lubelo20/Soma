import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { logout } from "../actions";
import { DashboardNav } from "./DashboardNav";

async function Sidebar() {
  const staff = await requireStaff();
  const [{ pending, enquiries }] = await sql<{ pending: number; enquiries: number }[]>`
    select (select count(*)::int from bookings where status = 'pending') as pending,
           (select count(*)::int from enquiries where not handled) as enquiries`;
  return (
    <>
      <DashboardNav counts={{ pending, enquiries }} />
      <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4 text-sm max-lg:hidden">
        <span className="text-ink-subtle">Signed in as</span>
        <span className="font-semibold text-ink-strong">{staff.name}</span>
        <form action={logout}>
          <button type="submit" className="cursor-pointer p-0 text-sm font-semibold text-brand hover:text-brand-dark">
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
      <aside className="flex flex-col gap-6 border-b border-line bg-white p-5 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:flex-none lg:border-r lg:border-b-0">
        <Link href="/dashboard" className="flex items-center gap-3 no-underline">
          <Image src="/images/logo.png" alt="" width={31} height={32} className="h-8 w-auto" />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-[.06em] text-ink-strong">INFINITY SOMA</span>
            <span className="text-[11px] text-ink-subtle">Staff dashboard</span>
          </span>
        </Link>
        <Suspense fallback={<div className="h-40" />}>
          <Sidebar />
        </Suspense>
      </aside>
      <div className="min-w-0 flex-1 p-5 lg:p-10">
        <Suspense fallback={<p className="text-ink-subtle">Loading…</p>}>{children}</Suspense>
      </div>
    </div>
  );
}
