// Pure, so both the server session check (src/lib/auth.ts) and the on-screen idle lock can use it.

/** A dashboard session ends after this many minutes without activity, and the screen locks after the same time. */
export const IDLE_MINUTES = 60;
