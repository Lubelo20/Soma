export const SIGNATURE_VIEWBOX = { width: 600, height: 360 } as const;

export type Point = [number, number];

const MAX_PATH_LENGTH = 60_000;
/** Points needed, counting only strokes of 2 or more points: taps (a lone M) draw nothing and don't count. */
export const MIN_SIGNATURE_POINTS = 10;
/** The drawn strokes must span at least this many viewbox units across or down, so a tiny scribble doesn't count. */
export const MIN_SIGNATURE_EXTENT = 30;

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

/** The strokes of a well-formed path inside the viewbox (each M starts one), or [] for anything else. */
export function pathToStrokes(path: string): Point[][] {
  if (path.length === 0 || path.length > MAX_PATH_LENGTH) return [];
  if (!PATH_RE.test(path)) return [];
  const strokes: Point[][] = [];
  for (const m of path.matchAll(COMMAND_RE)) {
    const x = Number(m[2]);
    const y = Number(m[3]);
    if (x > SIGNATURE_VIEWBOX.width || y > SIGNATURE_VIEWBOX.height) return [];
    if (m[1] === "M") strokes.push([]);
    strokes[strokes.length - 1].push([x, y]);
  }
  return strokes;
}

export function isValidSignaturePath(path: string): boolean {
  const strokes = pathToStrokes(path);
  if (strokes.length === 0) return false;
  const drawn = strokes.filter((s) => s.length >= 2).flat();
  if (drawn.length < MIN_SIGNATURE_POINTS) return false;
  const xs = drawn.map(([x]) => x);
  const ys = drawn.map(([, y]) => y);
  return (
    Math.max(...xs) - Math.min(...xs) >= MIN_SIGNATURE_EXTENT || Math.max(...ys) - Math.min(...ys) >= MIN_SIGNATURE_EXTENT
  );
}
