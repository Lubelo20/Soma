import { describe, expect, it } from "vitest";
import {
  areaLabels,
  BODY_AREAS,
  cardForBooking,
  CONSENT_STATEMENTS,
  HEALTH_CONDITIONS,
  isRealDate,
  isValidInitials,
  normalizeInitials,
  sameName,
  unansweredHealthCount,
  healthWarnings,
  isUnder18,
  normalizePhone,
  parseHealth,
  parseMassage,
  parseSkin,
  REQUIRED_CONSENT_COUNT,
} from "./record-card";

const fd = (pairs: [string, string][]) => {
  const f = new FormData();
  pairs.forEach(([k, v]) => f.append(k, v));
  return f;
};

describe("parseHealth", () => {
  it("parses yes/no and notes, unknown answers become null", () => {
    const h = parseHealth(fd([["health.pregnancy", "yes"], ["health.pregnancy.note", "2nd"], ["health.heart", "maybe"]]));
    expect(h.pregnancy).toEqual({ answer: "yes", note: "2nd" });
    expect(h.heart).toEqual({ answer: null, note: "" });
    expect(Object.keys(h)).toHaveLength(11);
  });

  it("caps notes at 500 characters", () => {
    const h = parseHealth(fd([["health.medications.note", "x".repeat(600)]]));
    expect(h.medications.note).toHaveLength(500);
  });
});

describe("parseSkin", () => {
  it("drops 'none' when real options are also ticked", () => {
    const s = parseSkin(fd([["skin.contraindications", "none"], ["skin.contraindications", "activeAcne"]]));
    expect(s.contraindications.selected).toEqual(["activeAcne"]);
  });

  it("keeps 'none' when it is the only option", () => {
    const s = parseSkin(fd([["skin.contraindications", "none"]]));
    expect(s.contraindications.selected).toEqual(["none"]);
  });

  it("keeps only the first skin type and drops unknown values", () => {
    const s = parseSkin(fd([["skin.skinType", "bogus"], ["skin.skinType", "dry"], ["skin.skinType", "oily"]]));
    expect(s.skinType.selected).toEqual(["dry"]);
  });

  it("returns every row with empty defaults and caps note and other", () => {
    const s = parseSkin(fd([["skin.concerns.other", "y".repeat(300)], ["skin.allergies.note", "z".repeat(600)]]));
    expect(Object.keys(s)).toHaveLength(7);
    expect(s.skinType).toEqual({ selected: [], note: "", other: "" });
    expect(s.concerns.other).toHaveLength(200);
    expect(s.allergies.note).toHaveLength(500);
  });
});

describe("parseMassage", () => {
  it("keeps known body areas in order without duplicates", () => {
    const m = parseMassage(fd([["massage.areas", "lowerBack"], ["massage.areas", "nope"], ["massage.areas", "leftShoulder"], ["massage.areas", "lowerBack"]]));
    expect(m.areas).toEqual(["leftShoulder", "lowerBack"]);
  });

  it("caps notes at 2000 characters", () => {
    expect(parseMassage(fd([["massage.notes", "n".repeat(2500)]])).notes).toHaveLength(2000);
  });
});

describe("BODY_AREAS", () => {
  it("has unique ids", () => {
    const ids = BODY_AREAS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("areaLabels", () => {
  it("joins labels, lower-casing all but the first", () => {
    expect(areaLabels(["lowerBack", "leftShoulder"])).toBe("Lower back, left shoulder");
    expect(areaLabels([])).toBe("");
  });
});

describe("healthWarnings", () => {
  it("lists warnings for yes answers, product allergies and contraindications", () => {
    const health = parseHealth(fd([["health.pregnancy", "yes"], ["health.pregnancy.note", "2nd trimester"], ["health.diabetes", "yes"], ["health.heart", "no"]]));
    const skin = parseSkin(fd([["skin.allergies", "yes"], ["skin.allergies.note", "nuts"], ["skin.contraindications", "accutane"]]));
    expect(healthWarnings({ health, skin })).toEqual(["Diabetes", "Pregnancy: 2nd trimester", "Product allergy: nuts", "Contraindication: Accutane"]);
    expect(healthWarnings({ health: null, skin: null })).toEqual([]);
  });

  it("ignores the 'none' contraindication", () => {
    const skin = parseSkin(fd([["skin.contraindications", "none"]]));
    expect(healthWarnings({ skin })).toEqual([]);
  });
});

describe("normalizePhone", () => {
  it("normalises South African phone numbers", () => {
    expect(normalizePhone("063 880 4946")).toBe("27638804946");
    expect(normalizePhone("+27 (63) 880-4946")).toBe("27638804946");
  });
});

describe("isUnder18", () => {
  it("knows who is under 18", () => {
    expect(isUnder18("2008-11-21", "2026-11-20")).toBe(true);
    expect(isUnder18("2008-11-20", "2026-11-20")).toBe(false);
    expect(isUnder18("", "2026-11-20")).toBe(false);
  });
});

describe("consent", () => {
  it("has the six consent statements, five required", () => {
    expect(CONSENT_STATEMENTS).toHaveLength(6);
    expect(CONSENT_STATEMENTS[3]).toBe("I understand there are no refunds on services/products.");
    expect(REQUIRED_CONSENT_COUNT).toBe(5);
  });
});

describe("unansweredHealthCount", () => {
  it("counts conditions with no Yes or No", () => {
    const h = parseHealth(fd([["health.pregnancy", "yes"], ["health.heart", "no"]]));
    expect(unansweredHealthCount(h)).toBe(HEALTH_CONDITIONS.length - 2);
  });
  it("is the full count for an all-unanswered section and 0 when all answered", () => {
    expect(unansweredHealthCount(parseHealth(fd([])))).toBe(HEALTH_CONDITIONS.length);
    const all = parseHealth(fd(HEALTH_CONDITIONS.map(({ key }) => [`health.${key}`, "no"] as [string, string])));
    expect(unansweredHealthCount(all)).toBe(0);
  });
  it("treats a missing or malformed entry as unanswered", () => {
    expect(unansweredHealthCount({ heart: { answer: "maybe" } })).toBe(HEALTH_CONDITIONS.length);
    expect(unansweredHealthCount("nonsense")).toBe(HEALTH_CONDITIONS.length);
  });
});

describe("isRealDate", () => {
  it("accepts real dates from 1900 on", () => {
    expect(isRealDate("2026-02-28")).toBe(true);
    expect(isRealDate("1900-01-01")).toBe(true);
    expect(isRealDate("2024-02-29")).toBe(true);
  });
  it("rejects impossible dates, other formats and years before 1900", () => {
    expect(isRealDate("2026-02-31")).toBe(false);
    expect(isRealDate("2026-2-3")).toBe(false);
    expect(isRealDate("")).toBe(false);
    expect(isRealDate("1899-12-31")).toBe(false);
    expect(isRealDate("0001-01-01")).toBe(false);
  });
});

describe("initials", () => {
  it("strips dots and spaces", () => {
    expect(normalizeInitials(" T.M. ")).toBe("TM");
    expect(normalizeInitials("t. m. k.")).toBe("tmk");
  });
  it("accepts 1 to 6 letters after normalising, in any script", () => {
    expect(isValidInitials("T.M.")).toBe(true);
    expect(isValidInitials("Ž")).toBe(true);
    expect(isValidInitials("A.B.C.D.E.F.")).toBe(true);
  });
  it("rejects empty, digits, other punctuation and more than 6 letters", () => {
    expect(isValidInitials(" . ")).toBe(false);
    expect(isValidInitials("T1")).toBe(false);
    expect(isValidInitials("T-M")).toBe(false);
    expect(isValidInitials("ABCDEFG")).toBe(false);
  });
});

describe("cardForBooking", () => {
  const a = { id: "a", fullName: "Thandi Mokoena" };
  const b = { id: "b", fullName: "Sipho Mokoena" };
  it("prefers the card with the booking's name, ignoring case and spacing", () => {
    expect(cardForBooking("  thandi   MOKOENA ", [b, a])).toBe("a");
  });
  it("opens the only matching card even when the name differs", () => {
    expect(cardForBooking("T. Mokoena", [a])).toBe("a");
  });
  it("gives no card when several match and none by name, or none match", () => {
    expect(cardForBooking("Lerato", [a, b])).toBeNull();
    expect(cardForBooking("Lerato", [])).toBeNull();
  });
  it("takes the first (newest) of several with the same name", () => {
    expect(cardForBooking("Thandi Mokoena", [b, { id: "c", fullName: "Thandi Mokoena" }, a])).toBe("c");
  });
});

describe("sameName", () => {
  it("compares trimmed, case-insensitive, with inner spaces collapsed", () => {
    expect(sameName("Thandi  Mokoena", " thandi mokoena")).toBe(true);
    expect(sameName("Thandi", "Thando")).toBe(false);
  });
});
