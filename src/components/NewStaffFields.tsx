const labelClass = "flex flex-col gap-1.5 text-[13px] font-semibold text-ink-body";

/** Name, email and password inputs shared by the setup page and the Staff page. */
export function NewStaffFields({ passwordLabel = "Password", values }: { passwordLabel?: string; values?: Record<string, string> }) {
  return (
    <>
      <label className={labelClass}>
        Full name
        <input name="name" defaultValue={values?.name} autoComplete="off" required className="field" />
      </label>
      <label className={labelClass}>
        Email
        <input type="email" name="email" defaultValue={values?.email} autoComplete="off" required className="field" />
      </label>
      <label className={labelClass}>
        <span>
          {passwordLabel} <span className="font-normal text-ink-subtle">(at least 10 characters)</span>
        </span>
        <input type="password" name="password" autoComplete="new-password" minLength={10} required className="field" />
      </label>
    </>
  );
}
