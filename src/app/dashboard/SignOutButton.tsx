"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { cardDrafts } from "./(app)/clients/card-drafts";
import { logout } from "./actions";
import { onDraftsBeforeSignOut, requestSignOut, signOutNow } from "./sign-out";

/**
 * Ends the session, then loads the sign-in page in full. A client-side redirect would leave the cards and lists
 * that Next keeps mounted-but-hidden in this page; a full load discards them. Unsaved edits are asked about first:
 * on the open card editor by its own prompt, and for drafts left on other cards by the prompt here.
 * Without JavaScript the plain form action still signs out and the reload lands on the sign-in page.
 */
export function SignOutButton({ className, formClassName, iconSize }: { className: string; formClassName?: string; iconSize: number }) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const [draftsPrompt, setDraftsPrompt] = useState<string | null>(null); // the id of a card with a draft

  useEffect(
    () =>
      onDraftsBeforeSignOut(() => {
        setDraftsPrompt(cardDrafts.firstId() ?? null);
      }),
    [],
  );

  function run(action: () => Promise<string>) {
    setFailed(false);
    startTransition(async () => {
      if ((await action()) === "failed") setFailed(true);
    });
  }

  return (
    <form
      action={logout}
      className={`relative ${formClassName ?? ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        setDraftsPrompt(null);
        run(() => requestSignOut());
      }}
    >
      <button type="submit" disabled={pending} className={className}>
        <Icon name="logout" size={iconSize} strokeWidth={1.5} />
        {pending ? "Signing out…" : failed ? "Not signed out. Try again" : "Sign out"}
      </button>
      {draftsPrompt && (
        <div
          role="alertdialog"
          aria-labelledby="signout-drafts-title"
          className="card absolute top-full right-0 z-30 mt-2 flex w-72 max-w-[calc(100vw-2.5rem)] flex-col gap-3 text-ink normal-case lg:top-auto lg:right-auto lg:bottom-full lg:left-0 lg:mt-0 lg:mb-2"
        >
          <p id="signout-drafts-title" className="m-0 text-[15px] font-semibold tracking-normal text-ink-strong">
            You have unsaved changes to a card.
          </p>
          <Link
            href={`/dashboard/clients/${draftsPrompt}/edit`}
            onClick={() => setDraftsPrompt(null)}
            className="btn btn-solid min-h-12 px-5 tracking-normal"
          >
            Review and save
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setDraftsPrompt(null);
              run(() => signOutNow());
            }}
            className="btn btn-line min-h-12 px-5 tracking-normal"
          >
            Discard and sign out
          </button>
          <button
            type="button"
            onClick={() => setDraftsPrompt(null)}
            className="min-h-11 cursor-pointer text-sm font-medium tracking-normal text-gold-deep underline"
          >
            Keep editing
          </button>
        </div>
      )}
    </form>
  );
}
