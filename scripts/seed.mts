// Seeds treatments and opening hours. Only inserts what's missing, so it never
// overwrites prices, durations or hours that staff have edited in the dashboard.
import { connect } from "./_db.mts";

// Durations are placeholders until the clinic confirms them; prices start empty ("Price on request").
const treatments: [slug: string, name: string, category: "wellness" | "skincare", minutes: number, description: string][] = [
  ["swedish-massage", "Swedish Massage", "wellness", 60, "Long, flowing strokes to ease muscle tension, improve circulation and help you fully relax."],
  ["deep-tissue-massage", "Deep Tissue Massage", "wellness", 60, "Firm, focused pressure on deeper muscle layers to relieve chronic tension and knots."],
  ["aromatherapy-massage", "Aromatherapy Massage", "wellness", 60, "A soothing full-body massage with essential oils chosen to calm or uplift."],
  ["hot-stone-therapy", "Hot Stone Therapy", "wellness", 75, "Warm basalt stones melt away tension and deepen relaxation."],
  ["pregnancy-massage", "Pregnancy Massage", "wellness", 60, "Gentle, supported massage adapted for comfort during pregnancy."],
  ["lymphatic-drainage", "Lymphatic Drainage", "wellness", 60, "Light, rhythmic techniques that support the lymphatic system and reduce fluid retention."],
  ["sports-recovery", "Sports Recovery Treatment", "wellness", 60, "Targeted massage to speed recovery, reduce soreness and keep you moving."],
  ["body-exfoliation-wrap", "Body Exfoliation & Wrap", "wellness", 60, "Polish away dry skin, then nourish and hydrate with a body wrap."],
  ["skin-consultation", "Skin Consultation", "skincare", 30, "A one-on-one skin analysis and a treatment plan tailored to your goals."],
  ["deep-cleansing-facial", "Deep Cleansing Facial", "skincare", 60, "Cleansing, exfoliation and extractions for clear, refreshed skin."],
  ["chemical-peel", "Chemical Peel", "skincare", 45, "Professional-grade peels to refine texture, brighten and even out skin tone."],
  ["dermaplaning", "Dermaplaning", "skincare", 45, "Gentle manual exfoliation that removes dead skin and fine facial hair for a smooth finish."],
  ["microdermabrasion", "Microdermabrasion", "skincare", 45, "Mechanical exfoliation to soften fine lines, congestion and dullness."],
  ["led-light-therapy", "LED Light Therapy", "skincare", 30, "Non-invasive light therapy to calm inflammation and support skin repair."],
  ["acne-management", "Acne Management", "skincare", 60, "A targeted treatment programme to clear breakouts and calm the skin."],
  ["hyperpigmentation-treatment", "Hyperpigmentation Treatment", "skincare", 60, "Treatments to fade dark marks and even out skin tone."],
  ["anti-ageing-treatment", "Anti-Ageing Treatment", "skincare", 60, "Firming, hydrating treatments to soften fine lines and restore radiance."],
];

// Placeholder hours until the clinic confirms: Mon–Fri 09:00–17:00, Sat 09:00–13:00, Sun closed.
const hours: [weekday: number, opens: string | null, closes: string | null][] = [
  [0, null, null],
  [1, "09:00", "17:00"],
  [2, "09:00", "17:00"],
  [3, "09:00", "17:00"],
  [4, "09:00", "17:00"],
  [5, "09:00", "17:00"],
  [6, "09:00", "13:00"],
];

const sql = connect();
for (const [i, [slug, name, category, minutes, description]] of treatments.entries()) {
  await sql`
    insert into treatments (slug, name, category, duration_min, description, sort)
    values (${slug}, ${name}, ${category}, ${minutes}, ${description}, ${i})
    on conflict (slug) do nothing`;
}
for (const [weekday, opens, closes] of hours) {
  await sql`insert into opening_hours (weekday, opens, closes) values (${weekday}, ${opens}, ${closes}) on conflict do nothing`;
}
console.log(`Seeded ${treatments.length} treatments and opening hours.`);
await sql.end();
