"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <form action={action} className="flex w-full max-w-[400px] flex-col gap-5 rounded-[18px] border border-line bg-white p-8">
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="" width={35} height={36} className="h-9 w-auto" />
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold tracking-[.06em] text-ink-strong">INFINITY SOMA</span>
            <span className="text-xs text-ink-subtle">Staff dashboard</span>
          </div>
        </div>
        <h1 className="m-0 font-serif text-[28px] font-normal">Sign in</h1>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-body">
          Email
          <input type="email" name="email" autoComplete="username" required className="field" />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-body">
          Password
          <input type="password" name="password" autoComplete="current-password" required className="field" />
        </label>
        {state.error && <p className="m-0 text-sm font-medium text-red-700">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn btn-solid border-none">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
