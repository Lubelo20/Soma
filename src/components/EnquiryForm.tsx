"use client";

import { useActionState } from "react";
import { sendEnquiry, type EnquiryState } from "@/app/actions";
import { business, enquiryKinds, type EnquiryKind } from "@/lib/site";

const initial: EnquiryState = { status: "idle" };

const labelClass = "flex flex-col gap-1.5 text-[13px] font-semibold text-ink-body";

function FieldError({ msg }: { msg?: string }) {
  return msg ? <span className="text-xs font-medium text-red-700">{msg}</span> : null;
}

export function EnquiryForm({ kind = "general", submitLabel = "Send enquiry" }: { kind?: EnquiryKind; submitLabel?: string }) {
  const [state, action, pending] = useActionState(sendEnquiry.bind(null, kind), initial);
  const interests = enquiryKinds[kind].interests;

  if (state.status === "success") {
    return (
      <div className="flex min-w-0 flex-[1_1_480px] flex-col items-start gap-4 rounded-[18px] border border-line bg-white p-8">
        <h3 className="m-0 font-serif text-[28px] font-normal">Thank you, we&rsquo;ve got your enquiry</h3>
        <p className="m-0 text-[15px] leading-relaxed text-ink-muted">
          Our team will get back to you shortly. For a faster reply, message us on WhatsApp.
        </p>
        <a className="btn btn-solid" href={business.whatsapp}>
          WhatsApp us
        </a>
      </div>
    );
  }

  const err = state.errors ?? {};
  const v = state.values;

  return (
    <form
      action={action}
      noValidate
      className="box-border grid min-w-0 flex-[1_1_480px] grid-cols-1 gap-[18px] rounded-[18px] border border-line bg-white p-6 sm:grid-cols-2 sm:p-8"
    >
      <label className={labelClass}>
        Full name
        <input type="text" name="name" defaultValue={v?.name} autoComplete="name" required className="field" aria-invalid={!!err.name} />
        <FieldError msg={err.name} />
      </label>
      <label className={labelClass}>
        Phone / WhatsApp
        <input type="tel" name="phone" defaultValue={v?.phone} autoComplete="tel" required className="field" aria-invalid={!!err.phone} />
        <FieldError msg={err.phone} />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        <span>
          Email <span className="font-normal text-ink-subtle">(optional)</span>
        </span>
        <input type="email" name="email" defaultValue={v?.email} autoComplete="email" className="field" aria-invalid={!!err.email} />
        <FieldError msg={err.email} />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        I&rsquo;m interested in
        <select name="interest" className="field" defaultValue={v?.interest ?? interests[0]}>
          {interests.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
        <FieldError msg={err.interest} />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        Message
        <textarea name="message" defaultValue={v?.message} rows={4} maxLength={2000} className="field resize-y py-3" />
      </label>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state.message && <p className="m-0 text-sm font-medium text-red-700 sm:col-span-2">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn btn-solid border-none sm:col-span-2">
        {pending ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
