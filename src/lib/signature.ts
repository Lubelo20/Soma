export const SIGNATURE_VIEWBOX = { width: 600, height: 200 } as const;

export type Point = [number, number];

const MAX_PATH_LENGTH = 60_000;
const MIN_POINTS = 10;

function clamp(n: number, max: number): number {
  return Math.min(max, Math.max(0, n));
}

// Rounds to 1 decimal; Number() drops trailing zeros ("3", "4.1").
function fmt(n: number, max: number): string {
  return String(Math.round(clamp(n, max) * 10) / 10);
}

export function strokesToPath(strokes: Point[][]): string {
  const parts: string[] = [];
  for (const stroke of strokes) {
    stroke.forEach(([x, y], i) => {
      parts.push(`${i === 0 ? "M" : "L"}${fmt(x, SIGNATURE_VIEWBOX.width)} ${fmt(y, SIGNATURE_VIEWBOX.height)}`);
    });
  }
  return parts.join(" ");
}

const NUM = "\\d+(?:\\.\\d)?";
const COMMAND = `[ML]${NUM} ${NUM}`;
const PATH_RE = new RegExp(`^M${NUM} ${NUM}(?: ${COMMAND})*$`);
const COMMAND_RE = new RegExp(`([ML])(${NUM}) (${NUM})`, "g");

export function isValidSignaturePath(path: string): boolean {
  if (path.length === 0 || path.length > MAX_PATH_LENGTH) return false;
  if (!PATH_RE.test(path)) return false;
  let points = 0;
  for (const m of path.matchAll(COMMAND_RE)) {
    if (Number(m[2]) > SIGNATURE_VIEWBOX.width || Number(m[3]) > SIGNATURE_VIEWBOX.height) return false;
    points++;
  }
  return points >= MIN_POINTS;
}
