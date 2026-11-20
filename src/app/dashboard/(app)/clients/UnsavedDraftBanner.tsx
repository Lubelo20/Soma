"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { cardDrafts } from "./card-drafts";

/**
 * On the card: says when this card's editor was left with unsaved edits (they're kept in memory, not saved), so a
 * therapist never mistakes an unsaved health answer for a saved one. Never shown in the server HTML: drafts exist
 * only in this tab's memory.
 */
export function UnsavedDraftBanner({ clientId }: { clientId: string }) {
  const step = useSyncExternalStore(
    cardDrafts.subscribe,
    () => {
      const d = cardDrafts.get(clientId);
      if (!d) return null;
      return d.health ? "health" : d.massage ? "massage" : d.skin ? "skin" : "details";
    },
    () => null,
  );
  if (!step) return null;
  return (
    <section role="region" aria-label="Unsaved changes" className="rounded-[3px] border-4 border-amber-500 bg-amber-50 p-4 sm:p-5">
      <h2 className="m-0 mb-1 text-lg font-bold text-amber-950">You have unsaved changes to this card.</h2>
      <p className="m-0 text-[15px] text-amber-950">
        They are not on the card yet.{" "}
        <Link href={`/dashboard/clients/${clientId}/edit?step=${step}`} className="font-semibold underline">
          Review and save
        </Link>
      </p>
    </section>
  );
}
