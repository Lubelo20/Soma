import { describe, expect, it } from "vitest";
import { firstMissingDetail } from "./validation";

const full = {
  idNumber: "8001015009087",
  dateOfBirth: "1980-01-01",
  gender: "Female",
  occupation: "Nurse",
  address: "1 Main Road",
  emergencyContact: "Sam 0821234567",
};

describe("firstMissingDetail", () => {
  it("returns null for a complete set", () => {
    expect(firstMissingDetail(full)).toBeNull();
  });
  it("names each missing field, in form order", () => {
    expect(firstMissingDetail({ ...full, idNumber: "" })).toBe("Please enter the client's ID or passport number.");
    expect(firstMissingDetail({ ...full, dateOfBirth: "" })).toBe("Please enter the client's date of birth.");
    expect(firstMissingDetail({ ...full, gender: "" })).toBe("Please enter the client's gender.");
    expect(firstMissingDetail({ ...full, occupation: "" })).toBe("Please enter the client's occupation.");
    expect(firstMissingDetail({ ...full, address: "" })).toBe("Please enter the client's address.");
    expect(firstMissingDetail({ ...full, emergencyContact: "" })).toBe("Please enter an emergency contact (name and phone).");
  });
  it("reports the first of several missing fields", () => {
    expect(firstMissingDetail({ ...full, address: "", occupation: "", gender: "" })).toBe("Please enter the client's gender.");
    expect(firstMissingDetail({ idNumber: "", dateOfBirth: "", gender: "", occupation: "", address: "", emergencyContact: "" })).toBe(
      "Please enter the client's ID or passport number.",
    );
  });
  it("treats whitespace-only as missing", () => {
    expect(firstMissingDetail({ ...full, address: "   \t " })).toBe("Please enter the client's address.");
  });
});
