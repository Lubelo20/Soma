// Shared by the public booking and enquiry forms and the dashboard record card.
export const PHONE_RE = /^[+\d][\d\s()-]{7,19}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Record card, booking and other row ids. Never a name or phone: the uuid is the only client data allowed in a URL.
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Whole-number ids from forms (treatment entries), so "1.5" or "1e10" never reaches SQL.
export const INT_ID_RE = /^\d{1,9}$/;
