import { business } from "./site";

export type EmailContent = {
  /** Preview line shown beside the subject in the inbox list. */
  preheader: string;
  title: string;
  greeting?: string;
  intro: string[];
  details?: [label: string, value: string][];
  /** Highlighted message below the details. */
  note?: string;
  button?: { label: string; href: string };
  /** Closing paragraphs below the button. */
  after?: string[];
};

const website = business.url.replace("https://", "");
const addressLine = business.address.lines.join(", ");

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Clients can type line breaks into their notes and messages.
const toHtml = (value: string) => escapeHtml(value).replace(/\r?\n/g, "<br>");

const FONT = "Arial,Helvetica,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

const paragraph = (value: string) =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:24px;color:#3a443e;">${toHtml(value)}</p>`;

const detailsTable = (details: [string, string][]) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;border-collapse:collapse;">
    ${details
      .map(
        ([label, value]) => `<tr>
      <td valign="top" width="38%" style="padding:12px 12px 12px 0;border-top:1px solid #e3ddd2;font-family:${FONT};font-size:14px;line-height:20px;color:#545d57;">${escapeHtml(label)}</td>
      <td valign="top" style="padding:12px 0;border-top:1px solid #e3ddd2;font-family:${FONT};font-size:15px;line-height:20px;font-weight:bold;color:#141c18;word-break:break-word;">${toHtml(value)}</td>
    </tr>`,
      )
      .join("")}
  </table>`;

const noteBox = (note: string) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr><td style="padding:14px 16px;background-color:#e4f1df;border-radius:6px;font-family:${FONT};font-size:15px;line-height:22px;color:#141c18;">${toHtml(note)}</td></tr>
  </table>`;

const buttonLink = ({ label, href }: { label: string; href: string }) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr><td bgcolor="#147c10" style="border-radius:6px;">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:bold;line-height:20px;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;

function renderHtml(c: EmailContent) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(c.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f4ee;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(c.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f4ee">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e3ddd2;border-radius:8px;border-collapse:separate;overflow:hidden;">
      <tr><td bgcolor="#147c10" style="padding:22px 32px;border-bottom:3px solid #b8975f;border-radius:8px 8px 0 0;">
        <div style="font-family:${SERIF};font-size:24px;line-height:30px;color:#ffffff;">Infinity Soma</div>
        <div style="font-family:${FONT};font-size:12px;line-height:18px;letter-spacing:1.5px;text-transform:uppercase;color:#e4f1df;">Wellness Clinic</div>
      </td></tr>
      <tr><td style="padding:32px 32px 12px;">
        <h1 style="margin:0 0 20px;font-family:${SERIF};font-size:26px;line-height:32px;font-weight:normal;color:#141c18;">${escapeHtml(c.title)}</h1>
        ${c.greeting ? paragraph(c.greeting) : ""}
        ${c.intro.map(paragraph).join("")}
        ${c.details?.length ? detailsTable(c.details) : ""}
        ${c.note ? noteBox(c.note) : ""}
        ${c.button ? buttonLink(c.button) : ""}
        ${(c.after ?? []).map(paragraph).join("")}
      </td></tr>
      <tr><td style="padding:20px 32px 24px;border-top:1px solid #e3ddd2;font-family:${FONT};font-size:13px;line-height:20px;color:#545d57;">
        <strong style="color:#141c18;">${escapeHtml(business.name)}</strong><br>
        ${escapeHtml(addressLine)}<br>
        ${escapeHtml(business.phoneDisplay)} (call or WhatsApp)<br>
        <a href="${escapeHtml(business.url)}" style="color:#126d0e;">${escapeHtml(website)}</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function renderText(c: EmailContent) {
  return [
    c.greeting,
    ...c.intro,
    c.details?.map(([label, value]) => `${label}: ${value}`).join("\n"),
    c.note,
    c.button && `${c.button.label}: ${c.button.href}`,
    ...(c.after ?? []),
    `${business.name}\n${addressLine}\n${business.phoneDisplay} (call or WhatsApp)\n${website}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** One email in two forms: the designed version, and plain text for mail apps that don't show HTML. */
export function renderEmail(content: EmailContent) {
  return { html: renderHtml(content), text: renderText(content) };
}
