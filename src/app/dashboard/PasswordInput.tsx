"use client";

import { useState, type ComponentProps } from "react";

/** Password field with a Show/Hide toggle, so staff can check what they typed. */
export function PasswordInput(props: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative flex">
      <input {...props} type={visible ? "text" : "password"} className="field w-full pr-20" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex min-w-16 cursor-pointer items-center justify-center px-4 text-[11px] font-medium tracking-[.16em] text-forest uppercase hover:text-brand"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </span>
  );
}
