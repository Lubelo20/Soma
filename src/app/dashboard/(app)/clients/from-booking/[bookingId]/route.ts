import { NextResponse } from "next/server";
import { staffCheck } from "@/lib/auth";
import { clientForBooking } from "@/lib/clients";
import { sql } from "@/lib/db";
import { UUID_RE } from "@/lib/validation";

// Opens the record card for a booking's client, or starts a new card prefilled from the booking. Among cards with
// the booking's phone or email, the one with the booking's name wins; else the only one; else a new card, where
// saving lists the existing cards (see clientForBooking).
// Reading the session cookie makes this handler dynamic, so the redirect is never cached.
export async function GET(request: Request, ctx: RouteContext<"/dashboard/clients/from-booking/[bookingId]">) {
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));
  if (!(await staffCheck())) return go("/dashboard/login");

  const { bookingId } = await ctx.params;
  if (!UUID_RE.test(bookingId)) return go("/dashboard/clients");
  const [booking] = await sql`select 1 from bookings where id = ${bookingId}`;
  if (!booking) return go("/dashboard/clients");

  const clientId = await clientForBooking(bookingId);
  return go(clientId ? `/dashboard/clients/${clientId}` : `/dashboard/clients/new?booking=${bookingId}`);
}
