import { cardDrafts } from "./(app)/clients/card-drafts";
import { logout } from "./actions";

// Signing out, shared by the sign-out buttons and the unsaved-changes prompts. Pages with a form that can hold
// unsaved edits register a guard; signing out first asks that form (its own inline prompt), then about drafts
// left on other cards (the sign-out button's prompt), and only then ends the session.

type Guard = { unsaved: () => boolean; askBeforeSignOut: () => void };
const guards = new Set<Guard>();
const draftListeners = new Set<() => void>();
let signingOut = false;

export function registerSignOutGuard(guard: Guard) {
  guards.add(guard);
  return () => {
    guards.delete(guard);
  };
}

/** The sign-out buttons listen for this: there are unsaved drafts on cards that aren't open. */
export function onDraftsBeforeSignOut(listener: () => void) {
  draftListeners.add(listener);
  return () => {
    draftListeners.delete(listener);
  };
}

/** True once sign-out has gone ahead, so leave guards don't ask "Leave site?" on the way to the sign-in page. */
export const isSigningOut = () => signingOut;

export type SignOutOutcome = "asked" | "failed";

/**
 * Signs out unless something unsaved needs an answer first ("asked"). On success the sign-in page loads in full and
 * this never resolves usefully; "failed" means the session couldn't be ended (offline) and nothing changed.
 */
export async function requestSignOut({ skipGuards = false } = {}): Promise<SignOutOutcome | "done"> {
  if (!skipGuards) {
    for (const g of guards) {
      if (g.unsaved()) {
        g.askBeforeSignOut();
        return "asked";
      }
    }
  }
  if (cardDrafts.hasAny()) {
    draftListeners.forEach((l) => l());
    return "asked";
  }
  return signOutNow();
}

/** Ends the session, drops every draft, and loads the sign-in page in full (discarding all hidden pages). */
export async function signOutNow(): Promise<"failed" | "done"> {
  try {
    await logout();
  } catch {
    return "failed";
  }
  cardDrafts.clearAll();
  signingOut = true;
  window.location.replace("/dashboard/login");
  return "done";
}
