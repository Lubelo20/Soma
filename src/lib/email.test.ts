import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const booking = { ref: "IS-TEST01", treatmentName: "Classic Facial", when: "Wednesday, 18 November at 16:00", clientName: "Thandi" };

describe("sendEmail", () => {
  const sent: { reply_to: string; text: string; html?: string }[] = [];

  beforeEach(() => {
    sent.length = 0;
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("STAFF_EMAIL", "bookings@infinitysoma.co.za");
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)));
      return new Response("{}");
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends client replies to the staff inbox by default", async () => {
    const { sendEmail } = await import("./email");
    await sendEmail({ to: "client@example.com", subject: "s", text: "t" });
    expect(sent[0].reply_to).toBe("bookings@infinitysoma.co.za");
  });

  it("keeps an explicit reply address", async () => {
    const { sendEmail } = await import("./email");
    await sendEmail({ to: "staff@example.com", subject: "s", text: "t", replyTo: "client@example.com" });
    expect(sent[0].reply_to).toBe("client@example.com");
  });

  it("sends the designed version and the plain-text version together", async () => {
    const { emails, sendEmail } = await import("./email");
    await sendEmail({ to: "client@example.com", ...emails.bookingReceived(booking) });
    expect(sent[0].html).toContain("<table");
    expect(sent[0].text).toContain("IS-TEST01");
  });
});

describe("email links", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the clinic's own domain when no address is configured", async () => {
    vi.stubEnv("SITE_URL", "");
    const { emails } = await import("./email");
    const staff = emails.staffNewBooking({ ...booking, phone: "0821234567", email: "t@example.com", notes: "" });
    expect(staff.html).toContain("https://www.infinitysoma.co.za/dashboard");
    expect(staff.text).toContain("https://www.infinitysoma.co.za/dashboard");
  });

  it("never links clients or staff to a temporary vercel.app address", async () => {
    vi.stubEnv("SITE_URL", "https://soma-sigma-wine.vercel.app");
    const { emails } = await import("./email");
    const all = [
      emails.staffNewBooking({ ...booking, phone: "0821234567", email: "t@example.com", notes: "" }),
      emails.bookingDeclined({ ...booking, reason: "" }),
      emails.bookingCancelled({ ...booking, reason: "" }),
      emails.staffNewEnquiry({ kind: "corporate", name: "Sipho", phone: "0821234567", email: "", interest: "Wellness day", message: "" }),
    ];
    for (const mail of all) expect(mail.html + mail.text).not.toContain("vercel.app");
  });
});

describe("special bookings", () => {
  const special = { ...booking, specialPrice: "R1 788" };

  it("tells the client the package price and that only the first session is booked", async () => {
    const { emails } = await import("./email");
    const { FIRST_SESSION_NOTE } = await import("./special-copy");
    for (const mail of [emails.bookingReceived(special), emails.bookingConfirmed(special)]) {
      for (const version of [mail.html, mail.text]) {
        expect(version).toContain("Package price");
        expect(version).toContain("R1 788");
        expect(version).toContain(FIRST_SESSION_NOTE);
      }
    }
  });

  it("tells staff to arrange the remaining sessions", async () => {
    const { emails } = await import("./email");
    const mail = emails.staffNewBooking({ ...special, phone: "0821234567", email: "t@example.com", notes: "" });
    expect(mail.text).toContain("arrange the remaining sessions");
    expect(mail.html).toContain("arrange the remaining sessions");
  });

  it("leaves special wording out of normal bookings", async () => {
    const { emails } = await import("./email");
    expect(emails.bookingReceived(booking).text).not.toContain("Package price");
  });
});
