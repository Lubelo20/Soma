import { describe, expect, it } from "vitest";
import { FIRST_SESSION_NOTE, staffSpecialNote } from "./special-copy";

describe("special booking wording", () => {
  it("uses the agreed client wording", () => {
    expect(FIRST_SESSION_NOTE).toBe("This books your first session. The clinic will arrange the rest of your package with you.");
  });

  it("tells staff it's a special, its price and that they arrange the rest", () => {
    expect(staffSpecialNote("R1 489")).toContain("SPECIAL");
    expect(staffSpecialNote("R1 489")).toContain("R1 489");
    expect(staffSpecialNote("R1 489")).toContain("arrange the remaining sessions");
  });
});
