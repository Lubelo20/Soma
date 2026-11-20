import { describe, expect, it } from "vitest";
import { bookingFor, treatedName } from "./booking-for";
import { cardForBooking } from "./record-card";

const base = { ticked: true, forName: "Zanele Dube", forPhone: "", bookerName: "Thandi Mokoena", bookerPhone: "082 123 4567" };

describe("bookingFor", () => {
  it("ignores the for-fields when the box is not ticked, whatever was posted", () => {
    expect(bookingFor({ ...base, ticked: false, forPhone: "nonsense" })).toEqual({ forName: "", forPhone: "", errors: {} });
  });

  it("keeps the treated person's name and optional phone when ticked", () => {
    expect(bookingFor(base)).toEqual({ forName: "Zanele Dube", forPhone: "", errors: {} });
    expect(bookingFor({ ...base, forPhone: "+27 71 555 0152" })).toEqual({ forName: "Zanele Dube", forPhone: "+27 71 555 0152", errors: {} });
  });

  it("requires a name of at least 2 characters when ticked", () => {
    for (const forName of ["", "Z"]) {
      expect(bookingFor({ ...base, forName }).errors.forName).toBe("Please enter the name of the person the booking is for.");
    }
  });

  it("rejects a phone that is given but not valid", () => {
    expect(bookingFor({ ...base, forPhone: "12ab" }).errors.forPhone).toBe("Please enter a valid phone number for them.");
  });

  it("treats the booker's own name with no phone, or with the booker's own phone, as booking for themselves", () => {
    const self = { forName: "", forPhone: "", errors: {} };
    expect(bookingFor({ ...base, forName: "  thandi MOKOENA " })).toEqual(self);
    expect(bookingFor({ ...base, forName: "Thandi Mokoena", forPhone: "+27 82 123 4567" })).toEqual(self);
  });

  it("keeps a same-name booking for someone else when they have their own phone (father and son)", () => {
    expect(bookingFor({ ...base, forName: "thandi mokoena", forPhone: "0715550152" })).toEqual({
      forName: "thandi mokoena",
      forPhone: "0715550152",
      errors: {},
    });
  });

  it("still rejects an invalid phone when the names are the same", () => {
    expect(bookingFor({ ...base, forName: "Thandi Mokoena", forPhone: "12ab" }).errors).toEqual({
      forPhone: "Please enter a valid phone number for them.",
    });
  });
});

describe("treatedName", () => {
  it("is the person being treated when the booking was for someone else, else the booker", () => {
    expect(treatedName({ clientName: "Thandi", forName: "Zanele" })).toBe("Zanele");
    expect(treatedName({ clientName: "Thandi", forName: "" })).toBe("Thandi");
    expect(treatedName({ clientName: "Thandi" })).toBe("Thandi");
  });
});

describe("cardForBooking with the treated name", () => {
  const booker = { id: "booker", fullName: "Thandi Mokoena" };
  const friend = { id: "friend", fullName: "Zanele Dube" };
  it("picks the card of the person being treated, not the booker's", () => {
    expect(cardForBooking(treatedName({ clientName: "Thandi Mokoena", forName: "Zanele Dube" }), [booker, friend])).toBe("friend");
    expect(cardForBooking(treatedName({ clientName: "Thandi Mokoena", forName: "" }), [friend, booker])).toBe("booker");
  });
});
