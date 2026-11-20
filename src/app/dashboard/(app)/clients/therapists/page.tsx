import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { listTherapists } from "@/lib/clients";
import { setTherapistActive } from "../../../clients-actions";
import { FreshOnOpen } from "../../../FreshOnOpen";
import { TherapistForm } from "./TherapistForm";

export const metadata: Metadata = { title: "Therapist names" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

export default async function TherapistNamesPage() {
  await requireStaff();
  const all = await listTherapists(true);
  const active = all.filter((t) => t.active);
  const removed = all.filter((t) => !t.active);

  // FreshOnOpen: a "Saved" tick or error from an earlier visit isn't shown when the page is opened again.
  return (
    <FreshOnOpen>
      <div className="flex max-w-3xl flex-col gap-6">
        <Link href="/dashboard/clients" className="text-sm text-gold-deep">
          ‹ Clients
        </Link>
        <h1 className="page-title">Therapist names</h1>
        <p className="m-0 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
          These names appear in the Therapist list when you add a treatment entry. Removing a name keeps it on past entries.
        </p>

        <div className="card">
          <TherapistForm />
        </div>

        <section className="flex flex-col gap-2">
          <span className="eyebrow">On the list · {active.length}</span>
          {active.length === 0 && <p className="note">No names yet. Add the first one above.</p>}
          {active.map((t) => (
            <div key={t.id} className="card flex flex-col gap-3">
              <TherapistForm id={t.id} name={t.name} />
              <details className="border-t border-line-soft pt-3">
                <summary className="cursor-pointer text-sm font-medium text-red-700">Remove {t.name}</summary>
                <form action={setTherapistActive} className="mt-3 flex max-w-md flex-col gap-3">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="active" value="false" />
                  <p className="m-0 text-sm leading-relaxed text-ink-muted">
                    Remove {t.name} from the list? Past entries keep the name. You can restore it later.
                  </p>
                  <button type="submit" className="btn min-h-10 border-none bg-red-700 px-5 text-white hover:bg-red-800 sm:self-start">
                    Remove name
                  </button>
                </form>
              </details>
            </div>
          ))}
        </section>

        {removed.length > 0 && (
          <details className="flex flex-col gap-3">
            <summary className="cursor-pointer text-gold-deep">
              <span className="eyebrow">Removed · {removed.length}</span>
            </summary>
            <div className="flex flex-col gap-2 pt-3">
              {removed.map((t) => (
                <form key={t.id} action={setTherapistActive} className="card flex items-center gap-3">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="active" value="true" />
                  <span className="min-w-0 flex-1 text-ink-body">{t.name}</span>
                  <button type="submit" className="btn btn-solid min-h-10 px-5">
                    Restore
                  </button>
                </form>
              ))}
            </div>
          </details>
        )}
      </div>
    </FreshOnOpen>
  );
}
