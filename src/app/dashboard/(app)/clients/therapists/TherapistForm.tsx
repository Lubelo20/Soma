"use client";

import { useActionState } from "react";
import { saveTherapist } from "../../../clients-actions";
import { Icon } from "@/components/Icon";

/** Adds a therapist name (no id) or renames one (with id). The add form clears after a successful add. */
export function TherapistForm({ id, name = "" }: { id?: number; name?: string }) {
  const [state, action, pending] = useActionState(saveTherapist, {});
  // After a successful add the form remounts empty via key; errors keep what was typed.
  const typed = state.values?.name ?? name;
  return (
    <form action={action} key={id ? undefined : state.ok ? "added" : "typing"} className="flex flex-wrap items-center gap-3">
      {id && <input type="hidden" name="id" value={id} />}
      <label className="label min-w-48 flex-1">
        <span className={id ? "sr-only" : ""}>{id ? `Rename ${name}` : "New therapist name"}</span>
        <input name="name" defaultValue={typed} required minLength={2} maxLength={60} className="field" />
      </label>
      <button type="submit" disabled={pending} className="btn btn-solid min-h-10 px-5">
        {pending ? "Saving…" : id ? "Rename" : "Add"}
      </button>
      {state.error && <span className="text-sm font-medium text-red-700">{state.error}</span>}
      {state.ok && id && (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
          <Icon name="check" size={16} strokeWidth={2} />
          Saved
        </span>
      )}
    </form>
  );
}
