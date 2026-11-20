"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False in the server HTML and until React has hydrated, then true. Forms that save through a click handler keep
 * their buttons disabled until then, so a tap before JavaScript has loaded can't submit the form natively (which
 * would put what was typed in the URL, or clear the form).
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
