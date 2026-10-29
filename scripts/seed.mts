// Seeds treatments and opening hours. Only inserts what's missing, so it never
// overwrites prices, durations or hours that staff have edited in the dashboard.
// To replace everything with the clinic's price list instead, use npm run db:menu.
import { connect } from "./_db.mts";
import { hours, treatments } from "./menu.mts";

const sql = connect();
for (const t of treatments) {
  await sql`
    insert into treatments (slug, name, category, section, duration_min, price_cents, description, sort)
    values (${t.slug}, ${t.name}, ${t.category}, ${t.section}, ${t.minutes}, ${t.priceCents}, ${t.description}, ${t.sort})
    on conflict (slug) do nothing`;
}
for (const [weekday, opens, closes] of hours) {
  await sql`insert into opening_hours (weekday, opens, closes) values (${weekday}, ${opens}, ${closes}) on conflict do nothing`;
}
console.log(`Seeded ${treatments.length} treatments and opening hours.`);
await sql.end();
