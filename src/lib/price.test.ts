import { describe, expect, it } from "vitest";
import { parsePriceCents } from "./price";

describe("parsePriceCents", () => {
  it.each([
    ["450", 45000],
    ["1462,5", 146250],
    ["1462,50", 146250],
    ["1462.50", 146250],
    ["R1 462,50", 146250],
    ["r 450", 45000],
    ["1,462.50", 146250],
    ["1 462", 146200],
    ["1,462", 146200],
    ["1 462,50", 146250],
    ["0", 0],
  ])("parses %s", (raw, cents) => {
    expect(parsePriceCents(raw)).toEqual({ ok: true, cents });
  });

  it.each(["", "  ", "R"])("treats %j as no price", (raw) => {
    expect(parsePriceCents(raw)).toEqual({ ok: true, cents: null });
  });

  it.each(["abc", "1,2,3", "1.2.3", "1.462", "1462,505", "-5", "12x", "4,50,00"])("rejects %s", (raw) => {
    expect(parsePriceCents(raw)).toEqual({ ok: false });
  });
});
