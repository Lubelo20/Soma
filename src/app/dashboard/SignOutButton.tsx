"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { logout } from "./actions";

/**
 * Ends the session, then loads the sign-in page in full. A client-side redirect would leave the cards and lists
 * that Next keeps mounted-but-hidden in this page; a full load discards them. Without JavaScript the plain form
 * action still signs out and the reload lands on the sign-in page.
 */
export function SignOutButton({ className, formClassName, iconSize }: { className: string; formClassName?: string; iconSize: number }) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <form
      action={logout}
      className={formClassName}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        setFailed(false);
        startTransition(async () => {
          try {
            await logout();
          } catch {
            // Offline: the session wasn't ended, so stay here and say so.
            setFailed(true);
            return;
          }
          window.location.replace("/dashboard/login");
        });
      }}
    >
      <button type="submit" disabled={pending} className={className}>
        <Icon name="logout" size={iconSize} strokeWidth={1.5} />
        {pending ? "Signing out…" : failed ? "Not signed out. Try again" : "Sign out"}
      </button>
    </form>
  );
}
