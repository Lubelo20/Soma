"use server";

import { business, interests } from "@/lib/site";

export type EnquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<"name" | "phone" | "interest", string>>;
  // Echoed back so the form keeps what the visitor typed after a failed submit.
  values?: { name: string; phone: string; interest: string; message: string };
};

export async function sendEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("company")) return { status: "success" };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const interest = String(formData.get("interest") ?? "");
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);

  const errors: EnquiryState["errors"] = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!/^[+\d][\d\s()-]{7,}$/.test(phone)) errors.phone = "Please enter a valid phone number.";
  if (!(interests as readonly string[]).includes(interest)) errors.interest = "Please choose an option.";
  const values = { name, phone, interest, message };
  if (Object.keys(errors).length) return { status: "error", errors, values };

  const text = [`Name: ${name}`, `Phone / WhatsApp: ${phone}`, `Interested in: ${interest}`, "", message || "(no message)"].join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No email provider configured yet (local preview): log the enquiry instead.
    console.log(`[enquiry]\n${text}`);
    return { status: "success" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ENQUIRY_FROM ?? "Infinity Soma Website <onboarding@resend.dev>",
      to: process.env.ENQUIRY_TO ?? business.email,
      subject: `Website enquiry: ${interest} (${name})`,
      text,
    }),
  });

  if (!res.ok) {
    console.error("[enquiry] email failed", res.status, await res.text());
    return {
      status: "error",
      values,
      message: "Sorry, we couldn't send your enquiry. Please WhatsApp or call us instead.",
    };
  }

  return { status: "success" };
}
