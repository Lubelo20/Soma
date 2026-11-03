// What clients and staff are told when a special is booked. A special is a package of several
// sessions, but a booking holds only the first one, so this wording must appear wherever it's booked.

export const FIRST_SESSION_NOTE = "This books your first session. The clinic will arrange the rest of your package with you.";

export const staffSpecialNote = (priceLabel: string) =>
  `SPECIAL, package price ${priceLabel}. This books the first session only, so please arrange the remaining sessions with the client.`;
