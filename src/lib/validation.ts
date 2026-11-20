// Shared by the public booking and enquiry forms and the dashboard record card.
export const PHONE_RE = /^[+\d][\d\s()-]{7,19}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Record card, booking and other row ids. Never a name or phone: the uuid is the only client data allowed in a URL.
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Whole-number ids from forms (treatment entries), so "1.5" or "1e10" never reaches SQL.
export const INT_ID_RE = /^\d{1,9}$/;

/** Client details that must be filled in (everything but email), in form order: the first problem, or null. */
export function firstMissingDetail(v: Record<string, string>): string | null {
  if (!v.idNumber.trim()) return "Please enter the client's ID or passport number.";
  if (!v.dateOfBirth.trim()) return "Please enter the client's date of birth.";
  if (!v.gender.trim()) return "Please enter the client's gender.";
  if (!v.occupation.trim()) return "Please enter the client's occupation.";
  if (!v.address.trim()) return "Please enter the client's address.";
  if (!v.emergencyContact.trim()) return "Please enter an emergency contact (name and phone).";
  return null;
}
