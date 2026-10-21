import "server-only";
import { business } from "./site";

const siteUrl = () => process.env.SITE_URL ?? business.url;
export const staffInbox = () => process.env.STAFF_EMAIL ?? business.email;

/**
 * Sends a plain-text email through Resend. Without RESEND_API_KEY (local development)
 * the email is printed to the server console instead. Never throws: a failed email
 * must not fail the booking it belongs to.
 */
export async function sendEmail({ to, subject, text, replyTo }: { to: string; subject: string; text: string; replyTo?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email] to=${to} subject="${subject}"\n${text}\n`);
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
        reply_to: replyTo ?? business.email,
      }),
    });
    if (!res.ok) console.error("[email] Resend error", res.status, await res.text());
  } catch (err) {
    console.error("[email] send failed", err);
  }
}

const signature = `\n\n${business.name}\n${business.address.lines.join(", ")}\n${business.phoneDisplay} (call or WhatsApp)\n${business.url.replace("https://", "")}`;

type BookingSummary = { ref: string; treatmentName: string; when: string; clientName: string };

export const emails = {
  bookingReceived: (b: BookingSummary) => ({
    subject: `We've received your booking request (${b.ref})`,
    text: `Hi ${b.clientName},\n\nThank you for booking with us. Your request is not confirmed yet. We'll confirm by email shortly.\n\nTreatment: ${b.treatmentName}\nWhen: ${b.when}\nReference: ${b.ref}\n\nNeed to change something? Reply to this email or WhatsApp us on ${business.phoneDisplay}.${signature}`,
  }),
  bookingConfirmed: (b: BookingSummary) => ({
    subject: `Your booking is confirmed: ${b.when}`,
    text: `Hi ${b.clientName},\n\nGood news, your booking is confirmed.\n\nTreatment: ${b.treatmentName}\nWhen: ${b.when}\nWhere: ${business.address.lines.join(", ")}\nReference: ${b.ref}\n\nPlease arrive 10 minutes early. If you can't make it, let us know as soon as possible.${signature}`,
  }),
  bookingDeclined: (b: BookingSummary & { reason: string }) => ({
    subject: `About your booking request (${b.ref})`,
    text: `Hi ${b.clientName},\n\nUnfortunately we can't accommodate your request for ${b.treatmentName} on ${b.when}.${b.reason ? `\n\n${b.reason}` : ""}\n\nPlease choose another time at ${siteUrl()}/book or WhatsApp us on ${business.phoneDisplay}.${signature}`,
  }),
  bookingCancelled: (b: BookingSummary & { reason: string }) => ({
    subject: `Your booking has been cancelled (${b.ref})`,
    text: `Hi ${b.clientName},\n\nYour booking for ${b.treatmentName} on ${b.when} has been cancelled.${b.reason ? `\n\n${b.reason}` : ""}\n\nTo book again, visit ${siteUrl()}/book or WhatsApp us on ${business.phoneDisplay}.${signature}`,
  }),
  staffNewBooking: (b: BookingSummary & { phone: string; email: string; notes: string }) => ({
    subject: `New booking request: ${b.treatmentName}, ${b.when}`,
    text: `A new booking request needs confirming.\n\nClient: ${b.clientName}\nPhone / WhatsApp: ${b.phone}\nEmail: ${b.email}\nTreatment: ${b.treatmentName}\nWhen: ${b.when}\nReference: ${b.ref}\nNotes: ${b.notes || "(none)"}\n\nConfirm or decline: ${siteUrl()}/dashboard`,
  }),
  staffNewEnquiry: (e: { kind: string; name: string; phone: string; email: string; interest: string; message: string }) => ({
    subject: `New ${e.kind} enquiry from ${e.name}`,
    text: `Name: ${e.name}\nPhone / WhatsApp: ${e.phone}\nEmail: ${e.email || "(not given)"}\nInterested in: ${e.interest}\n\n${e.message || "(no message)"}\n\nView all enquiries: ${siteUrl()}/dashboard/enquiries`,
  }),
};
