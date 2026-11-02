import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("sendEmail reply address", () => {
  const sent: { reply_to: string }[] = [];

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
});
