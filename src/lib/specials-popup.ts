// When the specials pop-up appears. Pure, so it can be tested without a browser.

const DISMISSED_KEY = "specials-dismissed";

export function shouldOpenPopup(pathname: string, count: number, dismissed: boolean): boolean {
  return count > 0 && !dismissed && pathname !== "/book";
}

// Browser storage can be blocked or throw (private modes, strict settings); the pop-up must still work.
export function wasDismissed(storage: Pick<Storage, "getItem"> | undefined): boolean {
  try {
    return storage?.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markDismissed(storage: Pick<Storage, "setItem"> | undefined): void {
  try {
    storage?.setItem(DISMISSED_KEY, "1");
  } catch {
    // Not stored; dismissalTracker still remembers it until the page is reloaded.
  }
}

/** Remembers a close in memory too, so blocked storage doesn't reopen the pop-up on every page. */
export function dismissalTracker(getStorage: () => (Pick<Storage, "getItem"> & Pick<Storage, "setItem">) | undefined) {
  let closed = false;
  return {
    wasDismissed: () => closed || wasDismissed(getStorage()),
    markDismissed: () => {
      closed = true;
      markDismissed(getStorage());
    },
  };
}

export function wrapIndex(i: number, n: number): number {
  return ((i % n) + n) % n;
}
