"use client";

import { useActionState } from "react";
import { updatePassword } from "../../actions";
import { PasswordInput } from "../../PasswordInput";

const labelClass = "label";

export default function AccountPage() {
  const [state, action, pending] = useActionState(updatePassword, {});
  return (
    <div className="flex max-w-md flex-col gap-6">
      <h1 className="page-title">Password</h1>
      <p className="m-0 text-[15px] leading-relaxed text-ink-muted">
        All staff share one password. Changing it signs out every other phone and computer, so do this whenever someone leaves the team, then
        tell the rest of the staff the new one.
      </p>
      <form action={action} className="flex flex-col gap-4 card">
        <h2 className="m-0 font-serif text-[24px] leading-tight text-ink-strong">Change the staff password</h2>
        <label className={labelClass}>
          Current password
          <PasswordInput name="current" autoComplete="current-password" required />
        </label>
        <label className={labelClass}>
          <span>
            New password <span className="hint">(at least 10 characters)</span>
          </span>
          <PasswordInput name="next" autoComplete="new-password" minLength={10} required />
        </label>
        <label className={labelClass}>
          Confirm new password
          <PasswordInput name="confirm" autoComplete="new-password" minLength={10} required />
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
