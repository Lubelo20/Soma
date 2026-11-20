// Client record card: field definitions, FormData parsers and health warnings.
// Pure module (no database, no React) so it can be used on server and client.

export type HealthKey =
  | "bloodPressure"
  | "heart"
  | "diabetes"
  | "epilepsy"
  | "respiratory"
  | "pregnancy"
  | "chronicPain"
  | "recentSurgery"
  | "injuries"
  | "skinAllergies"
  | "medications";

export const HEALTH_CONDITIONS: readonly { key: HealthKey; label: string; noteLabel?: string }[] = [
  { key: "bloodPressure", label: "High/low blood pressure" },
  { key: "heart", label: "Heart condition" },
  { key: "diabetes", label: "Diabetes" },
  { key: "epilepsy", label: "Epilepsy/seizures" },
  { key: "respiratory", label: "Asthma or respiratory conditions" },
  { key: "pregnancy", label: "Pregnancy", noteLabel: "Trimester" },
  { key: "chronicPain", label: "Chronic pain/fibromyalgia" },
  { key: "recentSurgery", label: "Recent surgery (last 6 months)" },
  { key: "injuries", label: "Joint or muscle injuries" },
  { key: "skinAllergies", label: "Skin allergies/dermatitis", noteLabel: "Trigger" },
  { key: "medications", label: "Medications", noteLabel: "List" },
];

export type HealthAnswers = Record<HealthKey, { answer: "yes" | "no" | null; note: string }>;

export type SkinKey =
  | "skinType"
  | "concerns"
  | "allergies"
  | "sensitivities"
  | "previousTreatments"
  | "homeCare"
  | "contraindications";

type SkinOption = { value: string; label: string };
type SkinRow = {
  key: SkinKey;
  label: string;
  pick: "one" | "many" | "yesno";
  options: readonly SkinOption[];
  noteLabel?: string;
  hasOther?: boolean;
};

// Sentence-case a camelCase id: "lowerBack" -> "Lower back".
const sentence = (id: string) => {
  const spaced = id.replace(/([A-Z])/g, " $1").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const opts = (...items: (string | [string, string])[]): SkinOption[] =>
  items.map((item) => {
    if (Array.isArray(item)) return { value: item[0], label: item[1] };
    return { value: item, label: sentence(item) };
  });

const YES_NO = opts("yes", "no");

export const SKIN_ROWS: readonly SkinRow[] = [
  { key: "skinType", label: "Skin type", pick: "one", options: opts("normal", "dry", "oily", "combination", "sensitive") },
  {
    key: "concerns",
    label: "Current skin concerns",
    pick: "many",
    options: opts("acne", "hyperpigmentation", "congestion", "aging", "scarring", "texture", ["skinTags", "Skin tags"], "other"),
    hasOther: true,
  },
  { key: "allergies", label: "Allergies to products", pick: "yesno", options: YES_NO, noteLabel: "Specify" },
  {
    key: "sensitivities",
    label: "Sensitivities",
    pick: "many",
    options: opts("fragrance", ["essentialOil", "Essential oil"], "acids", "retinols"),
  },
  {
    key: "previousTreatments",
    label: "Previous skin treatments",
    pick: "many",
    options: opts("chemicalPeel", "microdermabrasion", "dermaplaning", "acneFacial", "none"),
  },
  {
    key: "homeCare",
    label: "Home care products",
    pick: "many",
    options: opts("retinol", ["ahaBha", "AHA/BHA"], "hydrocortisone", ["benzoylPeroxide", "Benzoyl peroxide"], ["spf", "SPF"], "none", "other"),
    hasOther: true,
  },
  {
    key: "contraindications",
    label: "Contraindications present",
    pick: "many",
    options: opts("activeAcne", "openWounds", "photosensitivity", ["accutane", "Accutane"], "none"),
  },
];

export type SkinAnswers = Record<SkinKey, { selected: string[]; note: string; other: string }>;

const areas = (view: "front" | "back" | "side", ids: string[]) =>
  ids.map((id) => ({ id, label: sentence(id), view }));

export const BODY_AREAS: readonly { id: string; label: string; view: "front" | "back" | "side" }[] = [
  ...areas("front", [
    "head", "neck", "leftShoulder", "rightShoulder", "chest", "abdomen", "leftArm", "rightArm",
    "leftHand", "rightHand", "hips", "leftThigh", "rightThigh", "leftKnee", "rightKnee",
    "leftShin", "rightShin", "leftFoot", "rightFoot",
  ]),
  ...areas("back", [
    "upperBack", "midBack", "lowerBack", "glutes", "leftHamstring", "rightHamstring", "leftCalf", "rightCalf",
  ]),
  { id: "sideNeck", label: "Side of neck", view: "side" },
  { id: "sideHip", label: "Side of hip", view: "side" },
  { id: "sideLeg", label: "Outer leg", view: "side" },
];

export type MassageAnswers = { areas: string[]; notes: string };

export const CONSENT_STATEMENTS: readonly string[] = [
  "I confirm the information provided is accurate and truthful.",
  "I will inform my therapist of any health changes.",
  "I understand treatment results vary per individual.",
  "I understand there are no refunds on services/products.",
  "I consent to treatment under the therapist's professional judgment.",
  "I consent to the use of my before and after photos, provided my permission is obtained prior to use.",
];

export const REQUIRED_CONSENT_COUNT = 5;

const text = (fd: FormData, name: string, max: number): string => {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};

export function parseHealth(fd: FormData): HealthAnswers {
  const out = {} as HealthAnswers;
  for (const { key } of HEALTH_CONDITIONS) {
    const a = fd.get(`health.${key}`);
    out[key] = {
      answer: a === "yes" || a === "no" ? a : null,
      note: text(fd, `health.${key}.note`, 500),
    };
  }
  return out;
}

export function parseSkin(fd: FormData): SkinAnswers {
  const out = {} as SkinAnswers;
  for (const row of SKIN_ROWS) {
    const valid = new Set(row.options.map((o) => o.value));
    let selected = fd
      .getAll(`skin.${row.key}`)
      .filter((v): v is string => typeof v === "string" && valid.has(v));
    selected = [...new Set(selected)];
    if (row.pick !== "many") selected = selected.slice(0, 1);
    if (selected.length > 1 && selected.includes("none")) selected = selected.filter((v) => v !== "none");
    out[row.key] = {
      selected,
      note: text(fd, `skin.${row.key}.note`, 500),
      other: text(fd, `skin.${row.key}.other`, 200),
    };
  }
  return out;
}

export function parseMassage(fd: FormData): MassageAnswers {
  const picked = new Set(fd.getAll("massage.areas").filter((v): v is string => typeof v === "string"));
  return {
    areas: BODY_AREAS.filter((a) => picked.has(a.id)).map((a) => a.id),
    notes: text(fd, "massage.notes", 2000),
  };
}

export function healthWarnings(card: { health?: HealthAnswers | null; skin?: SkinAnswers | null }): string[] {
  const warnings: string[] = [];
  if (card.health) {
    for (const { key, label } of HEALTH_CONDITIONS) {
      const entry = card.health[key];
      if (entry?.answer !== "yes") continue;
      warnings.push(entry.note ? `${label}: ${entry.note}` : label);
    }
  }
  if (card.skin) {
    const allergies = card.skin.allergies;
    if (allergies?.selected.includes("yes")) {
      warnings.push(allergies.note ? `Product allergy: ${allergies.note}` : "Product allergy");
    }
    const row = SKIN_ROWS.find((r) => r.key === "contraindications");
    for (const o of row?.options ?? []) {
      if (o.value !== "none" && card.skin.contraindications?.selected.includes(o.value)) {
        warnings.push(`Contraindication: ${o.label}`);
      }
    }
  }
  return warnings;
}

export function areaLabels(ids: string[]): string {
  return ids
    .map((id) => BODY_AREAS.find((a) => a.id === id)?.label ?? id)
    .map((label, i) => (i === 0 ? label : label.toLowerCase()))
    .join(", ");
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("0") ? `27${digits.slice(1)}` : digits;
}

export function isUnder18(dob: string, today: string): boolean {
  if (!dob) return false;
  const cutoff = `${Number(today.slice(0, 4)) - 18}${today.slice(4)}`;
  return dob > cutoff;
}
