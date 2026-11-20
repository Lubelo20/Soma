"use client";

import { useRouter } from "next/navigation";
import { Fragment, type ReactNode } from "react";

/**
 * With Cache Components, Next keeps recently visited pages mounted but hidden and restores their React state,
 * including when the same page is opened again with a link. Wrapped in this, a form starts from fresh server data
 * each time its page is opened (a link, router.push or router.replace), while browser Back/Forward still restores
 * it as it was. See node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md (bfcacheId).
 */
export function FreshOnOpen({ children }: { children: ReactNode }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
