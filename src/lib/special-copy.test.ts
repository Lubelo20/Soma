import { describe, expect, it } from "vitest";
import { FIRST_SESSION_NOTE, clientSpecialLines, staffSpecialLines } from "./special-copy";

describe("special booking wording", () => {
  it("uses the agreed client wording", () => {
    expect(FIRST_SESSION_NOTE).toBe("This books your first session. The clinic will arrange the rest of your package with you.");
  });

  it("tells the client the package price and that only the first session is booked", () => {
    expect(clientSpecialLines("R1 489")).toContain("Package price: R1 489");
    expect(clientSpecialLines("R1 489")).toContain(FIRST_SESSION_NOTE);
  });

  it("tells staff it's a special, its price and that they arrange the rest", () => {
    expect(staffSpecialLines("R1 489")).toContain("SPECIAL");
    expect(staffSpecialLines("R1 489")).toContain("R1 489");
    expect(staffSpecialLines("R1 489")).toContain("arrange the remaining sessions");
  });
});
