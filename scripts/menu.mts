// The clinic's treatment menu and opening hours, from their October 2026 price list.
// Waxing lengths weren't on the price list, so those are estimates staff can adjust in the dashboard.
// Items without a description show as a compact price list on the website.

type Item = [slug: string, name: string, minutes: number, rands: number, description?: string];
type Section = { category: "wellness" | "skincare"; section: string; items: Item[] };

export const menu: Section[] = [
  {
    category: "wellness",
    section: "Massage Therapy",
    items: [
      ["swedish-massage-30", "Swedish Massage", 30, 260, "Long, flowing strokes to ease muscle tension, improve circulation and help you fully relax."],
      ["swedish-massage", "Swedish Massage", 60, 360, "Long, flowing strokes to ease muscle tension, improve circulation and help you fully relax."],
      ["deep-tissue-massage", "Deep Tissue Massage", 60, 400, "Firm, focused pressure on deeper muscle layers to relieve chronic tension and knots."],
      ["hot-stone-therapy", "Hot Stone Massage", 60, 400, "Warm basalt stones melt away tension and deepen relaxation."],
      ["gua-sha-deep-harmony", "Gua Sha Deep Harmony", 60, 420, "Massage combined with gua sha tools to release deep tension and boost circulation."],
      ["g5-massage", "G5 Massage", 30, 300, "Vibration massage that breaks up muscle tension and stimulates circulation."],
      ["aromatherapy-massage", "Aromatherapy Massage", 60, 450, "A soothing full-body massage with essential oils chosen to calm or uplift."],
      ["lymphatic-drainage", "Lymphatic Drainage", 60, 430, "Light, rhythmic techniques that support the lymphatic system and reduce fluid retention."],
      ["pregnancy-massage", "Prenatal Massage", 60, 450, "Gentle, supported massage adapted for comfort during pregnancy."],
    ],
  },
  {
    category: "wellness",
    section: "Holistic Wellness",
    items: [
      ["reflexology", "Reflexology", 45, 400, "Pressure on reflex points of the feet to restore balance and bring deep relaxation."],
      ["indian-head-massage", "Indian Head Massage", 20, 250, "Massage of the scalp, neck and shoulders to release tension and clear the mind."],
    ],
  },
  {
    category: "wellness",
    section: "Body Treatments",
    items: [["back-exfoliation", "Back Exfoliation", 30, 270, "A deep cleanse and exfoliation for smoother, clearer skin on the back."]],
  },
  {
    category: "wellness",
    section: "Nail, Hand & Foot",
    items: [
      ["full-pedicure", "Full Pedicure", 40, 360, "Soak, exfoliation, nail and cuticle care, finished with a foot massage."],
      ["paraffin-wax-add-on", "Paraffin Wax Add-on", 15, 45, "Warm paraffin to soften and hydrate hands or feet. Add it to a pedicure or manicure."],
      ["basic-manicure", "Basic Manicure", 25, 190, "Shaping, cuticle care and hand massage for neat, healthy nails."],
    ],
  },
  {
    category: "skincare",
    section: "Skin & Facial Treatments",
    items: [
      ["classic-somatology-facial", "Classic Somatology Facial", 60, 440, "Cleansing, exfoliation, extractions and a mask, tailored to your skin."],
      ["chemical-peel", "Chemical Peel", 60, 400, "Professional-grade peels to refine texture, brighten and even out skin tone."],
      ["microdermabrasion", "Microdermabrasion", 60, 450, "Mechanical exfoliation to soften fine lines, congestion and dullness."],
      ["dermaplaning", "Dermaplaning Glow Facial", 60, 450, "Gentle exfoliation that removes dead skin and fine facial hair for a smooth, glowing finish."],
      ["teen-acne-facial", "Teen Acne Facial", 60, 450, "A deep-cleansing facial that calms breakouts and teaches good skin habits."],
      ["led-light-therapy", "LED Light Therapy Add-on", 15, 150, "Light therapy added to any facial to calm inflammation and support skin repair."],
      ["lamprobe", "Lamprobe (Skin Tags, DPN)", 60, 750, "Precise radio-frequency treatment that removes skin tags and DPN (small dark raised spots)."],
      ["needling", "Needling", 60, 650, "Microneedling to stimulate collagen, refine texture and soften scarring."],
    ],
  },
  {
    category: "skincare",
    section: "Ladies' Waxing",
    items: [
      ["wax-ladies-upper-lip", "Ladies' Upper Lip Wax", 10, 50],
      ["wax-ladies-chin", "Ladies' Chin Wax", 10, 60],
      ["wax-ladies-full-face", "Ladies' Full Face Wax", 30, 220],
      ["wax-ladies-underarms", "Ladies' Underarm Wax", 15, 140],
      ["wax-ladies-bikini-line", "Ladies' Bikini Line Wax", 20, 180],
      ["wax-ladies-brazilian", "Ladies' Brazilian Wax", 30, 350],
      ["wax-ladies-half-legs", "Ladies' Half Leg Wax", 30, 220],
      ["wax-ladies-full-legs", "Ladies' Full Leg Wax", 45, 350],
      ["wax-ladies-half-arms", "Ladies' Half Arm Wax", 20, 180],
      ["wax-ladies-full-arms", "Ladies' Full Arm Wax", 30, 260],
      ["wax-ladies-stomach", "Ladies' Stomach Wax", 15, 180],
      ["wax-ladies-full-body", "Ladies' Full Body Wax", 90, 700],
    ],
  },
  {
    category: "skincare",
    section: "Men's Waxing",
    items: [
      ["wax-men-beard-line", "Men's Beard Line Wax", 15, 120],
      ["wax-men-chin", "Men's Chin Wax", 10, 65],
      ["wax-men-neck", "Men's Neck Wax", 15, 120],
      ["wax-men-cheekbones", "Men's Cheekbone Wax", 10, 120],
      ["wax-men-chest", "Men's Chest Wax", 30, 320],
      ["wax-men-back", "Men's Back Wax", 30, 380],
      ["wax-men-shoulders", "Men's Shoulder Wax", 20, 180],
      ["wax-men-half-arms", "Men's Half Arm Wax", 20, 220],
      ["wax-men-full-arms", "Men's Full Arm Wax", 30, 300],
      ["wax-men-half-legs", "Men's Half Leg Wax", 30, 280],
      ["wax-men-full-legs", "Men's Full Leg Wax", 45, 450],
      ["wax-men-full-body", "Men's Full Body Wax", 90, 850],
    ],
  },
];

/** Flattened, with a sort position that keeps the price list's order. */
export const treatments = menu.flatMap((s) => s.items.map((item) => ({ category: s.category, section: s.section, item }))).map(
  ({ category, section, item: [slug, name, minutes, rands, description = ""] }, sort) => ({
    slug,
    name,
    category,
    section,
    minutes,
    priceCents: rands * 100,
    description,
    sort,
  }),
);

// Index 0 = Sunday. Mon–Fri 09:00–17:00, Sat 09:00–15:00, Sun closed.
export const hours: [weekday: number, opens: string | null, closes: string | null][] = [
  [0, null, null],
  [1, "09:00", "17:00"],
  [2, "09:00", "17:00"],
  [3, "09:00", "17:00"],
  [4, "09:00", "17:00"],
  [5, "09:00", "17:00"],
  [6, "09:00", "15:00"],
];
