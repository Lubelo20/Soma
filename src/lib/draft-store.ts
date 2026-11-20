// In-memory drafts of unsaved record-card edits, keyed by the card's id. Pure: no React, no browser storage.
// The browser-side instance lives in JavaScript memory only, so a reload, a closed tab or sign-out (which
// clears it before a full page load) ends it.

import { UUID_RE } from "./validation";

export type DraftStore<D extends object> = {
  /** A copy of the draft for this id, or undefined. */
  get(id: string): D | undefined;
  has(id: string): boolean;
  hasAny(): boolean;
  /** Whether any card other than this one has a draft. */
  hasOtherThan(id: string): boolean;
  /** Some id with a draft (the oldest), or undefined. */
  firstId(): string | undefined;
  /** Merges parts into this id's draft. A part given as undefined is removed; a draft with no parts is dropped. */
  update(id: string, patch: { [K in keyof D]?: D[K] | undefined }): void;
  clear(id: string): void;
  clearAll(): void;
  subscribe(listener: () => void): () => void;
};

export function createDraftStore<D extends object>(): DraftStore<D> {
  const drafts = new Map<string, D>();
  const listeners = new Set<() => void>();
  const changed = () => listeners.forEach((l) => l());

  return {
    get: (id) => {
      const d = drafts.get(id);
      return d ? { ...d } : undefined;
    },
    has: (id) => drafts.has(id),
    hasAny: () => drafts.size > 0,
    hasOtherThan: (id) => [...drafts.keys()].some((k) => k !== id),
    firstId: () => drafts.keys().next().value,
    update(id, patch) {
      if (!UUID_RE.test(id)) return;
      const next: Record<string, unknown> = { ...drafts.get(id) };
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) delete next[k];
        else next[k] = v;
      }
      if (Object.keys(next).length === 0) drafts.delete(id);
      else drafts.set(id, next as D);
      changed();
    },
    clear(id) {
      drafts.delete(id);
      changed();
    },
    clearAll() {
      drafts.clear();
      changed();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
