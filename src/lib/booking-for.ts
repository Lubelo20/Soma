// "I'm booking for someone else": the booker's own details stay in client_name/phone/email, the person being
// treated goes in for_name/for_phone (empty when the booking is for the booker). Pure, so it can be tested.
import { normalizePhone, sameName } from "./record-card";
import { PHONE_RE } from "./validation";

type ForErrors = { forName?: string; forPhone?: string };

/**
 * The for-fields to store, from already-cleaned single-line values. Not ticked: always empty, whatever was posted.
 * Ticked with the booker's own name and no phone, or the booker's own phone: a booking for themselves, so also
 * empty. The same name with a different phone (a father booking for his son) stays a booking for someone else.
 * Values arrive already trimmed to 200 characters by the action's line() helper.
 */
export function bookingFor(input: { ticked: boolean; forName: string; forPhone: string; bookerName: string; bookerPhone: string }): {
  forName: string;
  forPhone: string;
  errors: ForErrors;
} {
  const none = { forName: "", forPhone: "", errors: {} };
  if (!input.ticked) return none;
  const forName = input.forName.trim();
  const forPhone = input.forPhone.trim();
  const errors: ForErrors = {};
  if (forName.length < 2) errors.forName = "Please enter the name of the person the booking is for.";
  if (forPhone && !PHONE_RE.test(forPhone)) errors.forPhone = "Please enter a valid phone number for them.";
  if (errors.forName || errors.forPhone) return { forName, forPhone, errors };
  const bookersOwnPhone = forPhone === "" || normalizePhone(forPhone) === normalizePhone(input.bookerPhone);
  if (sameName(forName, input.bookerName) && bookersOwnPhone) return none;
  return { forName, forPhone, errors };
}

/** The name of the person being treated: for_name when the booking was made for someone else, else the booker's. */
export const treatedName = (b: { clientName: string; forName?: string | null }) => b.forName || b.clientName;
