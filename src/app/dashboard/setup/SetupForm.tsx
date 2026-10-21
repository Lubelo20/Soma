"use client";

import { useActionState } from "react";
import { NewStaffFields } from "@/components/NewStaffFields";
import { setupFirstStaff } from "../actions";

export function SetupForm() {
  const [state, action, pending] = useActionState(setupFirstStaff, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="label">
        <span>
          Setup code <span className="hint">(SETUP_CODE in Vercel → Settings → Environment Variables)</span>
        </span>
        <input name="code" defaultValue={state.values?.code} autoComplete="off" required className="field" />
      </label>
      <NewStaffFields passwordLabel="Choose a password" values={state.values} />
      {state.error && <p className="m-0 text-sm font-medium text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-solid border-none">
        {pending ? "Creating account…" : "Create account & sign in"}
      </button>
    </form>
  );
}
