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

describe("bookings made for someone else", () => {
  const forOther = { ...booking, forName: "Zanele Dube" };
  const clientMails = async () => {
    const { emails } = await import("./email");
    return [
      emails.bookingReceived(forOther),
      emails.bookingConfirmed(forOther),
      emails.bookingDeclined({ ...forOther, reason: "" }),
      emails.bookingCancelled({ ...forOther, reason: "" }),
    ];
  };

  it("still greets the booker and says who the treatment is for", async () => {
    for (const mail of await clientMails()) {
      for (const version of [mail.html, mail.text]) {
        expect(version).toContain("Hi Thandi,");
        expect(version).toContain("Zanele Dube");
      }
    }
  });

  it("uses the agreed wording in the plain-text versions", async () => {
    const [received, confirmed, declined, cancelled] = await clientMails();
    expect(received.text).toContain("For: Zanele Dube");
    expect(received.text).toContain("Your request for Zanele Dube is not confirmed yet.");
    expect(confirmed.text).toContain("For: Zanele Dube");
    expect(confirmed.text).toContain("Good news, your booking for Zanele Dube is confirmed.");
    expect(confirmed.text).toContain("Please ask Zanele Dube to arrive 10 minutes early.");
    expect(declined.text).toContain("Unfortunately we can't accommodate your request for Zanele Dube: Classic Facial on Wednesday, 18 November at 16:00.");
    expect(cancelled.text).toContain("Your booking for Zanele Dube: Classic Facial on Wednesday, 18 November at 16:00 has been cancelled.");
  });

  it("leaves the wording unchanged for a booking for the booker themselves", async () => {
    const { emails } = await import("./email");
    for (const mail of [emails.bookingReceived(booking), emails.bookingConfirmed({ ...booking, forName: "" })]) {
      expect(mail.text).not.toContain("For:");
      expect(mail.text).not.toContain(" for Thandi");
    }
    expect(emails.bookingReceived(booking).text).toContain("Thank you for booking with us. Your request is not confirmed yet.");
    expect(emails.bookingConfirmed(booking).text).toContain("Please arrive 10 minutes early.");
    expect(emails.bookingDeclined({ ...booking, reason: "" }).text).toContain(
      "Unfortunately we can't accommodate your request for Classic Facial on Wednesday, 18 November at 16:00.",
    );
  });

  it("shows staff who it is for and who booked it, with the booker's contact details", async () => {
    const { emails } = await import("./email");
    const mail = emails.staffNewBooking({ ...forOther, forPhone: "+27 71 555 0152", phone: "0821234567", email: "t@example.com", notes: "" });
    for (const line of ["For: Zanele Dube", "Their phone: +27 71 555 0152", "Booked by: Thandi", "Phone / WhatsApp: 0821234567", "Email: t@example.com"]) {
      expect(mail.text).toContain(line);
    }
    expect(mail.html).toContain("Booked by");
    const noPhone = emails.staffNewBooking({ ...forOther, phone: "0821234567", email: "t@example.com", notes: "" });
    expect(noPhone.text).toContain("Their phone: (not given)");
    const self = emails.staffNewBooking({ ...booking, phone: "0821234567", email: "t@example.com", notes: "" });
    expect(self.text).toContain("Client: Thandi");
    expect(self.text).not.toContain("Booked by");
  });

  it("escapes the treated person's name so it can't add HTML", async () => {
    const { emails } = await import("./email");
    const evil = { ...booking, forName: "<b>x</b>" };
    const all = [
      emails.bookingReceived(evil),
      emails.bookingConfirmed(evil),
      emails.bookingDeclined({ ...evil, reason: "" }),
      emails.bookingCancelled({ ...evil, reason: "" }),
      emails.staffNewBooking({ ...evil, forPhone: "<i>1</i>", phone: "0821234567", email: "t@example.com", notes: "" }),
    ];
    for (const mail of all) {
      expect(mail.html).not.toContain("<b>x</b>");
      expect(mail.html).not.toContain("<i>");
      expect(mail.html).toContain("&lt;b&gt;x&lt;/b&gt;");
      expect(mail.text).toContain("<b>x</b>");
    }
  });
});
