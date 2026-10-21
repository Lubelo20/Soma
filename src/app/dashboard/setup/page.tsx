import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { sql } from "@/lib/db";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = { title: "Set up" };

async function SetupGate() {
  await connection();
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from staff`;
  if (count > 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="m-0 text-[15px] leading-relaxed text-ink-muted">
          The dashboard is already set up. Sign in, then add other staff from the <strong>Staff</strong> page.
        </p>
        <Link href="/dashboard/login" className="btn btn-solid">
          Go to sign in
        </Link>
      </div>
    );
  }
  return <SetupForm />;
}

export default function SetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="flex w-full max-w-[440px] flex-col gap-5 card p-8">
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="" width={35} height={36} className="h-9 w-auto" />
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold tracking-[.2em] text-ink-strong">INFINITY SOMA</span>
            <span className="text-[9.5px] tracking-[.3em] text-ink-subtle uppercase">Staff dashboard</span>
          </div>
        </div>
        <h1 className="m-0 font-serif text-[32px] leading-tight font-light">Create the first staff account</h1>
        <Suspense fallback={<p className="text-ink-subtle">Loading…</p>}>
          <SetupGate />
        </Suspense>
      </div>
    </div>
  );
}
