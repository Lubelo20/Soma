"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login } from "../actions";
import { PasswordInput } from "../PasswordInput";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <form action={action} className="flex w-full max-w-[400px] flex-col gap-5 card p-8">
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="" width={35} height={36} className="h-9 w-auto" />
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold tracking-[.2em] text-ink-strong">INFINITY SOMA</span>
            <span className="text-[9.5px] tracking-[.3em] text-ink-subtle uppercase">Staff dashboard</span>
          </div>
        </div>
        <h1 className="m-0 font-serif text-[32px] leading-tight font-light">Sign in</h1>
        {/* Hidden username so password managers save this under one name. Kept outside the label so the label names the password field. */}
        <input type="text" name="username" value="Infinity Soma staff" autoComplete="username" readOnly hidden />
        <label className="label">
          Staff password
          <PasswordInput name="password" autoComplete="current-password" required autoFocus />
        </label>
        {state.error && <p className="m-0 text-sm font-medium text-red-700">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn btn-solid border-none">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
