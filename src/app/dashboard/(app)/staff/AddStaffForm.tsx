"use client";

import { useActionState } from "react";
import { NewStaffFields } from "@/components/NewStaffFields";
import { addStaff } from "../../actions";

export function AddStaffForm() {
  const [state, action, pending] = useActionState(addStaff, {});
  return (
    <form action={action} className="flex flex-col gap-4 card">
      <h2 className="m-0 font-serif text-[24px] leading-tight text-ink-strong">Add a staff member</h2>
      <NewStaffFields passwordLabel="Temporary password" values={state.values} />
      <p className="m-0 text-[13px] text-ink-subtle">Share the password with them in person; they can change it under Account after signing in.</p>
      {state.error && <p className="m-0 text-sm font-medium text-red-700">{state.error}</p>}
      {state.ok && <p className="m-0 text-sm font-medium text-brand">Account created ✓</p>}
      <button type="submit" disabled={pending} className="btn btn-solid border-none">
        {pending ? "Adding…" : "Add staff member"}
      </button>
    </form>
  );
}
