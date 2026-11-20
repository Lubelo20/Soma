import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

// Optimistic check only: visitors with no session cookie go straight to sign-in instead of
// seeing a flash of the dashboard shell. Every dashboard page and action still verifies the
// session against the database (requireStaff() or staffCheck()).
// Server action calls are let through, so a form whose session has ended gets the action's own
// "Your session has ended" answer (and keeps what was typed) instead of a redirect it can't follow.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  if (request.method === "POST" && request.headers.has("next-action")) return NextResponse.next();
  return NextResponse.redirect(new URL("/dashboard/login", request.url));
}

export const config = {
  matcher: ["/dashboard", "/dashboard/((?!login|setup).*)"],
};
