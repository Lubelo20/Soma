import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import type { Treatment } from "@/lib/data";
import { sql } from "@/lib/db";
import { TreatmentEditor } from "./TreatmentEditor";

export const metadata: Metadata = { title: "Treatments & prices" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

export default async function TreatmentsAdminPage() {
  await requireStaff();
  const treatments = await sql<Treatment[]>`select * from treatments order by category, sort, name`;
  const missingPrices = treatments.filter((t) => t.active && t.priceCents == null).length;

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <h1 className="m-0 font-serif text-[34px] font-normal">Treatments &amp; prices</h1>
      <p className="m-0 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
        Changes appear on the website straight away. The length in minutes decides which time slots clients can book. Leave the price empty to show &ldquo;Price on request&rdquo;.
      </p>
      {missingPrices > 0 && (
        <p className="m-0 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {missingPrices} active treatment{missingPrices === 1 ? " has" : "s have"} no price yet, and the lengths are placeholders. Please check each one.
        </p>
      )}

      <details className="rounded-[18px] border border-dashed border-brand bg-white p-6">
        <summary className="cursor-pointer font-semibold text-brand">+ Add a new treatment</summary>
        <div className="pt-5">
          <TreatmentEditor isNew treatment={{ name: "", category: "wellness", description: "", durationMin: 60, priceCents: null, active: true }} />
        </div>
      </details>

      {(["wellness", "skincare"] as const).map((cat) => (
        <section key={cat} className="flex flex-col gap-4">
          <h2 className="m-0 text-xs font-semibold tracking-[.2em] text-ink-subtle uppercase">{cat === "wellness" ? "Wellness & massage" : "Skincare & aesthetics"}</h2>
          {treatments
            .filter((t) => t.category === cat)
            .map((t) => (
              <div key={t.id} className={`rounded-[18px] border border-line bg-white p-6 ${t.active ? "" : "opacity-60"}`}>
                <TreatmentEditor treatment={t} />
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}
