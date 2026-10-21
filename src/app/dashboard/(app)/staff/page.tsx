import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/slots";
import { removeStaff } from "../../actions";
import { AddStaffForm } from "./AddStaffForm";

export const metadata: Metadata = { title: "Staff" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

export default async function StaffPage() {
  const me = await requireStaff();
  const staff = await sql<{ id: number; name: string; email: string; createdAt: Date }[]>`
    select id, name, email, created_at from staff order by created_at`;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="page-title">Staff</h1>
      <p className="m-0 text-[15px] leading-relaxed text-ink-muted">Everyone listed here can sign in and manage bookings, enquiries, treatments and hours.</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {staff.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-4 card px-5 py-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-ink-strong">
                {s.name} {s.id === me.id && <span className="hint">(you)</span>}
              </span>
              <span className="text-sm text-ink-muted">
                {s.email} · added {formatDateTime(s.createdAt)}
              </span>
            </div>
            {s.id !== me.id && (
              <details>
                <summary className="cursor-pointer list-none text-sm font-semibold text-red-700">Remove</summary>
                <form action={removeStaff} className="mt-2">
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="btn min-h-9 border-none bg-red-700 px-4 text-white hover:bg-red-800">
                    Yes, remove {s.name.split(" ")[0]}
                  </button>
                </form>
              </details>
            )}
          </li>
        ))}
      </ul>
      <AddStaffForm />
    </div>
  );
}
