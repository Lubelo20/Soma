import type { Metadata } from "next";
import Image from "next/image";
import { requireStaff } from "@/lib/auth";
import { formatPrice, type Treatment } from "@/lib/data";
import { sql } from "@/lib/db";
import { deleteSpecial, setSpecialActive } from "../../actions";
import { SpecialEditor } from "./SpecialEditor";

export const metadata: Metadata = { title: "Specials" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

function SpecialRow({ s }: { s: Treatment }) {
  return (
    <li className="card flex flex-col gap-4 max-sm:p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-24 w-[70px] flex-none overflow-hidden bg-cream">
          {s.posterUrl && <Image src={s.posterUrl} alt="" fill sizes="70px" className="object-cover object-top" />}
        </div>
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="font-semibold text-ink-strong">{s.name}</span>
          <span className="text-sm text-ink-muted">
            {formatPrice(s.priceCents)} · first session {s.durationMin} min
          </span>
        </div>
        <form action={setSpecialActive} className="flex items-center gap-3">
          <input type="hidden" name="id" value={s.id} />
          <input type="hidden" name="active" value={String(!s.active)} />
          <button
            type="submit"
            role="switch"
            aria-checked={s.active}
            aria-label={`Show ${s.name} on the website`}
            className={`relative h-7 w-12 flex-none cursor-pointer rounded-full border-none transition-colors ${s.active ? "bg-brand" : "bg-slate-300"}`}
          >
            <span className={`absolute top-1 size-5 rounded-full bg-white transition-all ${s.active ? "left-6" : "left-1"}`} />
          </button>
          <span className="w-7 text-sm font-semibold text-ink-strong">{s.active ? "On" : "Off"}</span>
        </form>
      </div>

      <details className="border-t border-line-soft pt-3">
        <summary className="cursor-pointer text-sm font-medium text-ink-body">Edit</summary>
        <div className="pt-4">
          <SpecialEditor special={{ id: s.id, name: s.name, durationMin: s.durationMin, priceCents: s.priceCents, posterUrl: s.posterUrl }} />
        </div>
      </details>
      <details className="border-t border-line-soft pt-3">
        <summary className="cursor-pointer text-sm font-medium text-red-700">Delete</summary>
        <form action={deleteSpecial} className="mt-3 flex max-w-md flex-col gap-3">
          <input type="hidden" name="id" value={s.id} />
          <p className="m-0 text-sm leading-relaxed text-ink-muted">
            Delete {s.name} and its poster permanently? Existing bookings keep their details. To take it down temporarily, switch it off instead.
          </p>
          <button type="submit" className="btn min-h-10 border-none bg-red-700 px-5 text-white hover:bg-red-800 sm:self-start">
            Delete special
          </button>
        </form>
      </details>
    </li>
  );
}

export default async function SpecialsAdminPage() {
  await requireStaff();
  const specials = await sql<Treatment[]>`select * from treatments where category = 'special' order by created_at desc, id desc`;

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <h1 className="page-title">Specials</h1>
      <p className="m-0 max-w-2xl text-[15px] leading-relaxed text-ink-muted">Specials switched on appear in the website pop-up straight away, newest first.</p>

      <details className="card border-dashed border-brand">
        <summary className="cursor-pointer font-semibold text-brand">+ Add a new special</summary>
        <div className="pt-5">
          <SpecialEditor />
        </div>
      </details>

      {specials.length === 0 ? (
        <p className="card m-0 text-ink-muted">No specials yet.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {specials.map((s) => (
            <SpecialRow key={s.id} s={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
