import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import type { Treatment } from "@/lib/data";
import { bySection } from "@/lib/sections";
import { sql } from "@/lib/db";
import { TreatmentEditor } from "./TreatmentEditor";

export const metadata: Metadata = { title: "Treatments & prices" };
// Staff always need live data, so these pages render on request rather than from a prefetched shell.
export const instant = false;

export default async function TreatmentsAdminPage() {
  await requireStaff();
  const treatments = await sql<Treatment[]>`select * from treatments order by category, sort, name`;
  const missingPrices = treatments.filter((t) => t.active && t.priceCents == null).length;
  const sectionNames = [...new Set(treatments.map((t) => t.section).filter(Boolean))];

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <h1 className="page-title">Treatments &amp; prices</h1>
      <p className="m-0 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
        Changes appear on the website straight away. The length in minutes decides which time slots clients can book. Leave the price empty to show &ldquo;Price on request&rdquo;.
      </p>
      {missingPrices > 0 && (
        <p className="note">
          {missingPrices} active treatment{missingPrices === 1 ? " has" : "s have"} no price yet, so {missingPrices === 1 ? "it shows" : "they show"} &ldquo;Price on request&rdquo;.
        </p>
      )}

      {/* Suggestions for every Section field on this page. */}
      <datalist id="treatment-sections">
        {sectionNames.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <details className="card border-dashed border-brand">
        <summary className="cursor-pointer font-semibold text-brand">+ Add a new treatment</summary>
        <div className="pt-5">
          <TreatmentEditor isNew treatment={{ name: "", category: "wellness", section: "", description: "", durationMin: 60, priceCents: null, active: true }} />
        </div>
      </details>

      {(["wellness", "skincare"] as const).map((cat) => (
        <section key={cat} className="flex flex-col gap-6">
          <h2 className="m-0 font-serif text-[30px] leading-tight font-light text-ink-strong">{cat === "wellness" ? "Treatments page" : "Skincare page"}</h2>
          {bySection(treatments.filter((t) => t.category === cat && t.active)).map((s) => (
            <details key={s.title} className="flex flex-col gap-3">
              <summary className="cursor-pointer text-gold-deep">
                <span className="eyebrow">
                  {s.title || "No section"} · {s.items.length}
                </span>
              </summary>
              <div className="flex flex-col gap-3 pt-3">
                {s.items.map((t) => (
                  <div key={t.id} className="card">
                    <TreatmentEditor treatment={t} />
                  </div>
                ))}
              </div>
            </details>
          ))}
        </section>
      ))}

      {treatments.some((t) => !t.active) && (
        <details className="flex flex-col gap-3">
          <summary className="cursor-pointer text-gold-deep">
            <span className="eyebrow">Hidden from the website · {treatments.filter((t) => !t.active).length}</span>
          </summary>
          <div className="flex flex-col gap-3 pt-3">
            {treatments
              .filter((t) => !t.active)
              .map((t) => (
                <div key={t.id} className="card opacity-60">
                  <TreatmentEditor treatment={t} />
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}
