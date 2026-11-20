"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
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
  // Open when signing out found drafts on other cards: a card with a draft, and whether the open form's own prompt
  // was already answered.
  const [draftsPrompt, setDraftsPrompt] = useState<{ id: string; afterGuard: boolean } | null>(null);
  const titleId = useId(); // two of these buttons are in the layout (phone header, desktop sidebar)

  // The button lives in the layout and stays mounted: close its prompt when the page changes, so it can't later
  // sign out over a form on another page.
  const pathname = usePathname();
  const [promptPath, setPromptPath] = useState(pathname);
  if (promptPath !== pathname) {
    setPromptPath(pathname);
    setDraftsPrompt(null);
  }

  useEffect(
    () =>
      onDraftsBeforeSignOut(({ afterGuard }) => {
        const id = cardDrafts.firstId();
        setDraftsPrompt(id ? { id, afterGuard } : null);
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
          aria-labelledby={titleId}
          className="card absolute top-full right-0 z-30 mt-2 flex w-72 max-w-[calc(100vw-2.5rem)] flex-col gap-3 text-ink normal-case lg:top-auto lg:right-auto lg:bottom-full lg:left-0 lg:mt-0 lg:mb-2"
        >
          <p id={titleId} className="m-0 text-[15px] font-semibold tracking-normal text-ink-strong">
            You have unsaved changes to a card.
          </p>
          <Link
            href={`/dashboard/clients/${draftsPrompt.id}/edit`}
            onClick={() => setDraftsPrompt(null)}
            className="btn btn-solid min-h-12 px-5 tracking-normal"
          >
            Review and save
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const { afterGuard } = draftsPrompt;
              setDraftsPrompt(null);
              // The open form is still asked first, unless its own prompt is what led here.
              run(() => (afterGuard ? signOutNow() : requestSignOut({ draftsAccepted: true })));
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
