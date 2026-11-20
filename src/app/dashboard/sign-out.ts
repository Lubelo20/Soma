import { cardDrafts } from "./(app)/clients/card-drafts";
import { logout } from "./actions";

// Signing out, shared by the sign-out buttons and the unsaved-changes prompts. Pages with a form that can hold
// unsaved edits register a guard; signing out first asks that form (its own inline prompt), then about drafts
// left on other cards (the sign-out button's prompt), and only then ends the session.

type Guard = { unsaved: () => boolean; askBeforeSignOut: () => void };
const guards = new Set<Guard>();
type DraftsPromptContext = { afterGuard: boolean };
const draftListeners = new Set<(ctx: DraftsPromptContext) => void>();
let signingOut = false;

// Closing or reloading the tab ends the in-memory drafts too, so ask first wherever the user is in the dashboard
// (the card editor's own guard only covers the editor while it's on screen). Not on the way out after sign-out.
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    if (!signingOut && cardDrafts.hasAny()) e.preventDefault();
  });
}

export function registerSignOutGuard(guard: Guard) {
  guards.add(guard);
  return () => {
    guards.delete(guard);
  };
}

/**
 * The sign-out buttons listen for this: there are unsaved drafts on cards that aren't open. `afterGuard`: the open
 * form's own prompt was already answered (so the drafts prompt needn't ask the form again).
 */
export function onDraftsBeforeSignOut(listener: (ctx: DraftsPromptContext) => void) {
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
 * skipGuards: the open form's prompt was just answered. except: that form's own card, whose draft the user chose
 * to discard. draftsAccepted: the user already chose to discard drafts on other cards.
 */
export async function requestSignOut({
  skipGuards = false,
  except,
  draftsAccepted = false,
}: { skipGuards?: boolean; except?: string; draftsAccepted?: boolean } = {}): Promise<SignOutOutcome | "done"> {
  if (!skipGuards) {
    for (const g of guards) {
      if (g.unsaved()) {
        g.askBeforeSignOut();
        return "asked";
      }
    }
  }
  const drafts = except ? cardDrafts.hasOtherThan(except) : cardDrafts.hasAny();
  if (drafts && !draftsAccepted) {
    draftListeners.forEach((l) => l({ afterGuard: skipGuards }));
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
