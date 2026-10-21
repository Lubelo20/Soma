"use client";

import { useActionState } from "react";
import { NewStaffFields } from "@/components/NewStaffFields";
import { setupFirstStaff } from "../actions";

export function SetupForm() {
  const [state, action, pending] = useActionState(setupFirstStaff, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-body">
        <span>
          Setup code <span className="font-normal text-ink-subtle">(SETUP_CODE in Vercel → Settings → Environment Variables)</span>
        </span>
        <input name="code" autoComplete="off" required className="field" />
      </label>
      <NewStaffFields passwordLabel="Choose a password" />
      {state.error && <p className="m-0 text-sm font-medium text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-solid border-none">
        {pending ? "Creating account…" : "Create account & sign in"}
      </button>
    </form>
  );
}
