import "server-only";
import { business } from "./site";
import { renderEmail } from "./email-template";
import { FIRST_SESSION_NOTE, staffSpecialNote } from "./special-copy";

// Links always use the clinic's own domain, so a stale hosting setting can't send people elsewhere.
const siteUrl = business.url;
export const staffInbox = () => process.env.STAFF_EMAIL ?? business.email;

/**
 * Sends an email through Resend. Without RESEND_API_KEY the email is skipped (and, in
 * local development, printed to the server console instead). Never throws: a failed email
 * must not fail the booking it belongs to.
 */
export async function sendEmail({ to, subject, text, html, replyTo }: { to: string; subject: string; text: string; html?: string; replyTo?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // In development the email is printed so it can be checked. In production the details would land
    // in the hosting logs, so only the fact that it wasn't sent is recorded.
    if (process.env.NODE_ENV === "production") console.warn("[email] not sent: RESEND_API_KEY is not set");
    else console.log(`[email] to=${to} subject="${subject}"\n${text}\n`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? `${business.name} <onboarding@resend.dev>`,
        to,
        subject,
        text,
        html,
        reply_to: replyTo ?? staffInbox(),
      }),
    });
    if (!res.ok) console.error("[email] Resend error", res.status, await res.text());
  } catch (err) {
    console.error("[email] send failed", err);
  }
}

// specialPrice is set only when a special was booked.
type BookingSummary = { ref: string; treatmentName: string; when: string; clientName: string; specialPrice?: string };
const specialPriceRow = (b: BookingSummary): [string, string][] => (b.specialPrice ? [["Package price", b.specialPrice]] : []);
const clientSpecialNote = (b: BookingSummary) => (b.specialPrice ? FIRST_SESSION_NOTE : undefined);

const whatsappUs = `WhatsApp us on ${business.phoneDisplay}`;

export const emails = {
  bookingReceived: (b: BookingSummary) => ({
    subject: `We've received your booking request (${b.ref})`,
    ...renderEmail({
      preheader: `We'll confirm your ${b.treatmentName} booking by email shortly.`,
      title: "We've received your request",
      greeting: `Hi ${b.clientName},`,
      intro: ["Thank you for booking with us. Your request is not confirmed yet. We'll confirm by email shortly."],
      details: [["Treatment", b.treatmentName], ["When", b.when], ["Reference", b.ref], ...specialPriceRow(b)],
      note: clientSpecialNote(b),
      after: [`Need to change something? Reply to this email or ${whatsappUs}.`],
    }),
  }),
  bookingConfirmed: (b: BookingSummary) => ({
    subject: `Your booking is confirmed: ${b.when}`,
    ...renderEmail({
      preheader: `See you on ${b.when}.`,
      title: "Your booking is confirmed",
      greeting: `Hi ${b.clientName},`,
      intro: ["Good news, your booking is confirmed."],
      details: [
        ["Treatment", b.treatmentName],
        ["When", b.when],
        ["Where", business.address.lines.join(", ")],
        ["Reference", b.ref],
        ...specialPriceRow(b),
      ],
      note: clientSpecialNote(b),
      after: ["Please arrive 10 minutes early. If you can't make it, let us know as soon as possible."],
    }),
  }),
  bookingDeclined: (b: BookingSummary & { reason: string }) => ({
    subject: `About your booking request (${b.ref})`,
    ...renderEmail({
      preheader: "Please choose another time for your booking.",
      title: "About your booking request",
      greeting: `Hi ${b.clientName},`,
      intro: [`Unfortunately we can't accommodate your request for ${b.treatmentName} on ${b.when}.`, ...(b.reason ? [b.reason] : [])],
      button: { label: "Choose another time", href: `${siteUrl}/book` },
      after: [`Or ${whatsappUs}.`],
    }),
  }),
  bookingCancelled: (b: BookingSummary & { reason: string }) => ({
    subject: `Your booking has been cancelled (${b.ref})`,
    ...renderEmail({
      preheader: `Your booking on ${b.when} has been cancelled.`,
      title: "Your booking has been cancelled",
      greeting: `Hi ${b.clientName},`,
      intro: [`Your booking for ${b.treatmentName} on ${b.when} has been cancelled.`, ...(b.reason ? [b.reason] : [])],
      button: { label: "Book again", href: `${siteUrl}/book` },
      after: [`Or ${whatsappUs}.`],
    }),
  }),
  staffNewBooking: (b: BookingSummary & { phone: string; email: string; notes: string }) => ({
    subject: `New booking request: ${b.treatmentName}, ${b.when}`,
    ...renderEmail({
      preheader: `${b.clientName}, ${b.when}`,
      title: "New booking request",
      intro: ["A new booking request needs confirming."],
      details: [
        ["Client", b.clientName],
        ["Phone / WhatsApp", b.phone],
        ["Email", b.email],
        ["Treatment", b.treatmentName],
        ["When", b.when],
        ["Reference", b.ref],
        ["Notes", b.notes || "(none)"],
      ],
      note: b.specialPrice ? staffSpecialNote(b.specialPrice) : undefined,
      button: { label: "Confirm or decline", href: `${siteUrl}/dashboard` },
    }),
  }),
  staffNewEnquiry: (e: { kind: string; name: string; phone: string; email: string; interest: string; message: string }) => ({
    subject: `New ${e.kind} enquiry from ${e.name}`,
    ...renderEmail({
      preheader: `${e.name} is interested in ${e.interest}.`,
      title: `New ${e.kind} enquiry`,
      intro: [],
      details: [
        ["Name", e.name],
        ["Phone / WhatsApp", e.phone],
        ["Email", e.email || "(not given)"],
        ["Interested in", e.interest],
      ],
      note: e.message || "(no message)",
      button: { label: "View all enquiries", href: `${siteUrl}/dashboard/enquiries` },
    }),
  }),
};
