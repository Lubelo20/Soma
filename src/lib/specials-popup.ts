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
    // Not remembered: it may open again on the next page, which is harmless.
  }
}

export function wrapIndex(i: number, n: number): number {
  return ((i % n) + n) % n;
}
