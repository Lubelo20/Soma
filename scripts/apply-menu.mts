// Usage: npm run db:menu
// Makes the database match the clinic's price list in scripts/menu.mts: adds or updates every listed
// treatment (overwriting dashboard edits to those), hides treatments that aren't on the list (kept, so
// past bookings still link to them) and sets the weekly opening hours. Closed days are left alone.
import { connect } from "./_db.mts";
import { hours, treatments } from "./menu.mts";

const sql = connect();
await sql.begin(async (tx) => {
  for (const t of treatments) {
    await tx`
      insert into treatments (slug, name, category, section, duration_min, price_cents, description, sort, active)
      values (${t.slug}, ${t.name}, ${t.category}, ${t.section}, ${t.minutes}, ${t.priceCents}, ${t.description}, ${t.sort}, true)
      on conflict (slug) do update set
        name = excluded.name, category = excluded.category, section = excluded.section, duration_min = excluded.duration_min,
        price_cents = excluded.price_cents, description = excluded.description, sort = excluded.sort, active = true`;
  }
  const hidden = await tx`update treatments set active = false where active and slug not in ${tx(treatments.map((t) => t.slug))} returning name`;
  for (const [weekday, opens, closes] of hours) {
    await tx`
      insert into opening_hours (weekday, opens, closes) values (${weekday}, ${opens}, ${closes})
      on conflict (weekday) do update set opens = excluded.opens, closes = excluded.closes`;
  }
  console.log(`Price list applied: ${treatments.length} treatments, ${hidden.length} hidden (${hidden.map((r) => r.name).join(", ") || "none"}).`);
});
await sql.end();
