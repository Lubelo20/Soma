import { describe, expect, it } from "vitest";
import { bookingFor, treatedName } from "./booking-for";
import { cardForBooking } from "./record-card";

const base = { ticked: true, forName: "Zanele Dube", forPhone: "", bookerName: "Thandi Mokoena" };

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

  it("treats the booker's own name as booking for themselves", () => {
    expect(bookingFor({ ...base, forName: "  thandi MOKOENA ", forPhone: "0715550152" })).toEqual({ forName: "", forPhone: "", errors: {} });
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
