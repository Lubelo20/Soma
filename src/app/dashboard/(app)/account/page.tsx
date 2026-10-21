"use client";

import { useActionState } from "react";
import { updatePassword } from "../../actions";

const labelClass = "label";

export default function AccountPage() {
  const [state, action, pending] = useActionState(updatePassword, {});
  return (
    <div className="flex max-w-md flex-col gap-6">
      <h1 className="page-title">Account</h1>
      <form action={action} className="flex flex-col gap-4 card">
        <h2 className="m-0 font-serif text-[24px] leading-tight text-ink-strong">Change password</h2>
        <label className={labelClass}>
          Current password
          <input type="password" name="current" autoComplete="current-password" required className="field" />
        </label>
        <label className={labelClass}>
          <span>
            New password <span className="hint">(at least 10 characters)</span>
          </span>
          <input type="password" name="next" autoComplete="new-password" minLength={10} required className="field" />
        </label>
        <label className={labelClass}>
          Confirm new password
          <input type="password" name="confirm" autoComplete="new-password" minLength={10} required className="field" />
        </label>
        {state.error && <p className="m-0 text-sm font-medium text-red-700">{state.error}</p>}
        {state.ok && <p className="m-0 text-sm font-medium text-brand">Password updated ✓</p>}
        <button type="submit" disabled={pending} className="btn btn-solid border-none">
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
