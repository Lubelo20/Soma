export type ParsedPrice = { ok: true; cents: number | null } | { ok: false };

// Whole rands, optionally grouped in thousands with commas when written like "1,462.50".
const PLAIN = /^(\d+)(?:[.,](\d{1,2}))?$/;
const GROUPED = /^(\d{1,3}(?:,\d{3})+)(?:\.(\d{1,2}))?$/;

/**
 * Reads a price as staff type it. South African prices often use a decimal comma ("1462,50"), so a
 * comma or dot before 1-2 final digits is the decimal mark, and a comma before exactly 3 digits
 * separates thousands. Anything else is rejected rather than guessed. Empty means no price.
 */
export function parsePriceCents(raw: string): ParsedPrice {
  const text = raw.replace(/\s/g, "").replace(/^r/i, "");
  if (text === "") return { ok: true, cents: null };
  const match = PLAIN.exec(text) ?? GROUPED.exec(text);
  if (!match) return { ok: false };
  const rands = Number(match[1].replaceAll(",", ""));
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  const total = rands * 100 + cents;
  return Number.isSafeInteger(total) && total <= 2_147_483_647 ? { ok: true, cents: total } : { ok: false };
}
