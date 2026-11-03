import { describe, expect, it } from "vitest";
import { renderEmail } from "./email-template";

const base = { preheader: "Your request is in", title: "Booking received", intro: ["Thank you."] };

describe("renderEmail", () => {
  it("escapes anything a client typed so it can't add HTML to the email", () => {
    const { html } = renderEmail({ ...base, greeting: 'Hi <img src=x onerror="a()">', details: [["Notes", "<script>x</script> & more"]] });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt; &amp; more");
  });

  it("keeps the plain-text version readable and unescaped", () => {
    const { text } = renderEmail({ ...base, greeting: "Hi Thandi & Sipho,", details: [["Treatment", "Skin & Glow"]] });
    expect(text).toContain("Hi Thandi & Sipho,");
    expect(text).toContain("Treatment: Skin & Glow");
    expect(text).not.toContain("&amp;");
    expect(text).not.toContain("<");
  });

  it("shows the button as a link in HTML and as an address in text", () => {
    const { html, text } = renderEmail({ ...base, button: { label: "Confirm or decline", href: "https://www.infinitysoma.co.za/dashboard" } });
    expect(html).toContain('href="https://www.infinitysoma.co.za/dashboard"');
    expect(html).toContain("Confirm or decline");
    expect(text).toContain("Confirm or decline: https://www.infinitysoma.co.za/dashboard");
  });

  it("includes the clinic's name and contact details in both versions", () => {
    const { html, text } = renderEmail(base);
    for (const version of [html, text]) {
      expect(version).toContain("Infinity Soma Wellness Clinic");
      expect(version).toContain("+27 63 880 4946");
      expect(version).toContain("www.infinitysoma.co.za");
    }
  });
});
