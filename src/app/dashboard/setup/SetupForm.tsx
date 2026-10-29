"use client";

import { useActionState } from "react";
import { setupPassword } from "../actions";

export function SetupForm() {
  const [state, action, pending] = useActionState(setupPassword, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="label">
        <span>
          Setup code <span className="hint">(SETUP_CODE in Vercel → Settings → Environment Variables)</span>
        </span>
        <input name="code" defaultValue={state.values?.code} autoComplete="off" required className="field" />
      </label>
      <p className="m-0 text-[14px] leading-relaxed text-ink-muted">All staff sign in with this one password. Share it only with the team.</p>
      <label className="label">
        <span>
          Staff password <span className="hint">(at least 10 characters)</span>
        </span>
        <input type="password" name="password" autoComplete="new-password" minLength={10} required className="field" />
      </label>
      <label className="label">
        Confirm password
        <input type="password" name="confirm" autoComplete="new-password" minLength={10} required className="field" />
      </label>
      {state.error && <p className="m-0 text-sm font-medium text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-solid border-none">
        {pending ? "Saving…" : "Save & sign in"}
      </button>
    </form>
  );
}
