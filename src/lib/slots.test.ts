import { describe, expect, it } from "vitest";
import { availableSlots, bookableDates, clinicTime } from "./slots";

const monday = "2026-11-02"; // a Monday
const hours = { opens: "09:00", closes: "17:00" };
const longAgo = new Date("2026-01-01T00:00:00Z");

describe("clinicTime", () => {
  it("interprets times in South African time (UTC+2)", () => {
    expect(clinicTime(monday, "09:00").toISOString()).toBe("2026-11-02T07:00:00.000Z");
  });
});

describe("availableSlots", () => {
  it("offers every 30-minute start that fits the treatment before closing", () => {
    const slots = availableSlots({ date: monday, hours, durationMin: 60, busy: [], now: longAgo });
    expect(slots[0]).toBe("09:00");
    expect(slots.at(-1)).toBe("16:00");
    expect(slots).toHaveLength(15);
  });

  it("returns nothing on a closed day", () => {
    expect(availableSlots({ date: monday, hours: null, durationMin: 60, busy: [], now: longAgo })).toEqual([]);
  });

  it("skips any start that would overlap an existing booking", () => {
    const busy = [{ start: clinicTime(monday, "11:00"), end: clinicTime(monday, "12:00") }];
    const slots = availableSlots({ date: monday, hours, durationMin: 60, busy, now: longAgo });
    expect(slots).toContain("10:00"); // ends exactly when the booking starts
    expect(slots).not.toContain("10:30");
    expect(slots).not.toContain("11:00");
    expect(slots).not.toContain("11:30");
    expect(slots).toContain("12:00"); // starts exactly when the booking ends
  });

  it("requires at least two hours' notice", () => {
    const now = clinicTime(monday, "10:10");
    const slots = availableSlots({ date: monday, hours, durationMin: 30, busy: [], now });
    expect(slots[0]).toBe("12:30");
  });
});

describe("bookableDates", () => {
  it("lists the next 8 weeks, skipping closed weekdays and closures", () => {
    const now = clinicTime("2026-10-31", "08:00"); // Saturday
    const weekly = [null, hours, hours, hours, hours, hours, { opens: "09:00", closes: "13:00" }];
    const dates = bookableDates({ now, weekly, closures: ["2026-11-03"] });
    expect(dates[0]).toBe("2026-10-31");
    expect(dates).not.toContain("2026-11-01"); // Sunday
    expect(dates).not.toContain("2026-11-03"); // closure
    expect(dates).toContain("2026-11-02");
    expect(dates.at(-1)! <= "2026-12-26").toBe(true);
  });
});
