// "I'm booking for someone else": the booker's own details stay in client_name/phone/email, the person being
// treated goes in for_name/for_phone (empty when the booking is for the booker). Pure, so it can be tested.
import { sameName } from "./record-card";
import { PHONE_RE } from "./validation";

type ForErrors = { forName?: string; forPhone?: string };

/**
 * The for-fields to store, from already-cleaned single-line values. Not ticked: always empty, whatever was posted.
 * Ticked with the booker's own name: a booking for themselves, so also empty.
 */
export function bookingFor(input: { ticked: boolean; forName: string; forPhone: string; bookerName: string }): {
  forName: string;
  forPhone: string;
  errors: ForErrors;
} {
  const none = { forName: "", forPhone: "", errors: {} };
  if (!input.ticked) return none;
  const forName = input.forName.trim();
  const forPhone = input.forPhone.trim();
  const errors: ForErrors = {};
  const nameOk = forName.length >= 2 && forName.length <= 200;
  if (nameOk && sameName(forName, input.bookerName)) return none;
  if (!nameOk) errors.forName = "Please enter the name of the person the booking is for.";
  if (forPhone && !PHONE_RE.test(forPhone)) errors.forPhone = "Please enter a valid phone number for them.";
  return { forName, forPhone, errors };
}

/** The name of the person being treated: for_name when the booking was made for someone else, else the booker's. */
export const treatedName = (b: { clientName: string; forName?: string | null }) => b.forName || b.clientName;
