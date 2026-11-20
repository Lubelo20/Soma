// Geometry for the body map on the Massage step, ported from the approved mockup (layout C, figure version 2).
// Everything is drawn in a 200-wide box with the centre line at x = 100; the figures are shown through
// VIEW_BOX. Shapes are written for the viewer's right-hand half and mirrored for the other half.

export type Pt = readonly [number, number];
export type Zone = {
  id: string;
  /** The drawn area; cut to the silhouette when shown. */
  d: string;
  /** The invisible tap area: the same as the drawn area inside the body, larger outside it. Never overlaps another zone's. */
  hit: readonly Pt[];
};
export type View = "front" | "back" | "side";
export type ViewDef = {
  view: View;
  title: string;
  silhouette: readonly string[];
  details: readonly string[];
  zones: readonly Zone[];
  /** The side letters shown at the viewer's left and right, for the client's sides. */
  marks: readonly [string, string] | null;
};

export const VIEW_BOX = "22 -14 156 452";

/** Mirrors path data across x = 100 (every other number is an x). Only used on M, L, C and Z paths. */
const mirror = (d: string) => {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => (i++ % 2 === 0 ? String(200 - Number(n)) : n));
};
const both = (d: string) => [d, mirror(d)];
const flip = (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [200 - x, y] as const);
export const poly = (pts: readonly Pt[]) => "M" + pts.map((p) => p.join(" ")).join(" L") + " Z";

// --- Silhouettes (front and back share one outline) ---
const HEAD_HALF = "M100 -8 C113 -8 121 2 121 16 C121 30 117 40 111 46 C107 50 103 52 100 52 Z";
const BODY_HALF =
  "M100 44 L108 44 L108 62 C110 68 122 70 134 74 C144 77 150 85 151 96 C153 112 153 128 152 142 C154 158 157 176 158 196 L158 212 C160 220 162 232 160 244 C159 252 154 256 151 252 C148 248 148 240 147 234 L143 240 C141 238 142 230 145 224 L147 212 C146 192 143 172 141 156 C140 140 139 122 138 108 L136 104 C136 124 132 140 131 156 C130 170 134 184 136 200 C138 222 136 252 132 280 C131 290 131 296 130 304 C132 322 131 350 125 384 L122 404 C122 412 128 420 130 426 L130 431 L110 431 C110 422 112 412 113 404 C112 372 112 340 112 316 L111 300 C110 270 106 244 101 226 L100 226 Z";
const FB_SIL = [HEAD_HALF, mirror(HEAD_HALF), BODY_HALF, mirror(BODY_HALF)];
const SIDE_SIL = [
  "M100 -8 C114 -8 122 4 122 18 L126 27 L122 31 C122 40 119 48 111 51 L109 60 C112 66 124 78 126 96 C127 112 122 126 120 140 C119 154 122 170 121 186 C122 210 124 240 121 280 L121 298 C121 320 117 360 113 400 L115 410 C124 416 136 422 138 428 L138 431 L96 431 C93 426 94 414 98 402 C104 370 106 340 99 312 L98 300 C96 280 88 250 86 226 C84 210 84 196 90 184 C94 172 94 160 92 146 C88 120 84 96 88 78 C90 68 94 62 95 56 C86 50 80 36 80 20 C80 4 88 -8 100 -8 Z",
];

// --- Anatomy lines (decoration only) ---
const FRONT_DETAIL = [
  ...both("M103 73 C111 75 121 75 132 77"), // collarbones
  ...both("M103 108 C112 115 126 113 133 103"), // chest
  "M100 78 L100 176", // midline
  "M98.4 170 A1.6 1.6 0 1 0 101.6 170 A1.6 1.6 0 1 0 98.4 170", // navel
  ...both("M104 128 C112 130 120 129 127 126"),
  ...both("M104 148 C111 150 118 149 126 147"), // abdomen
  ...both("M131 190 C124 206 112 220 101 226"), // hip creases
  ...both("M115 296 C115 288 127 288 127 296 C127 306 115 306 115 296"), // kneecaps
  ...both("M150 150 C148 153 146 154 144 153"), // elbow crease
  ...both("M117 420 L124 420"), // ankle
];
const BACK_DETAIL = [
  "M100 58 L100 190", // spine
  ...both("M107 84 C118 81 129 89 127 104 C121 111 112 107 108 100"), // shoulder blades
  ...both("M104 150 C112 158 120 162 128 162"), // lower ribs
  "M100 196 L100 228",
  ...both("M101 228 C110 242 126 242 134 231"), // glutes
  ...both("M114 300 L128 300"), // back of knees
  ...both("M142 150 C146 152 149 152 152 149"), // elbows
  ...both("M114 408 C117 414 119 420 119 428"), // heel cord
];
const SIDE_DETAIL = [
  "M102 80 C96 84 96 100 98 120 C100 150 104 180 106 206 C107 220 106 236 110 246 C114 250 118 244 117 232 C116 210 116 180 114 150 C113 120 114 96 110 82 Z", // arm
  "M113 22 A1.5 1.5 0 1 0 116 22", // eye
  "M100 20 C96 18 95 26 100 28", // ear
  "M100 300 C106 296 114 296 120 300", // knee
];

// --- Zones. Drawn shapes are the mockup's; tap areas stretch to the edges of the view box (x 22-178,
// y -14-438) where the space around the body is empty. Shapes ending in L sit on the viewer's right. ---
const Z = {
  head: [[70, -12], [130, -12], [130, 40], [112, 48], [100, 53], [88, 48], [70, 40]],
  // The mockup's neck with its top cut along the head's lower edge: the mockup draws the head over it,
  // so this is what it shows, without depending on the drawing order.
  neck: [[84.58, 46.48], [88, 48], [100, 53], [112, 48], [115.42, 46.48], [122, 58], [122, 66], [78, 66], [78, 58]],
  shoulderL: [[122, 58], [170, 58], [170, 100], [137, 100], [122, 94]],
  chest: [[78, 66], [122, 66], [122, 94], [137, 100], [137, 104], [136, 142], [64, 142], [63, 104], [63, 100], [78, 94]],
  abdomen: [[64, 142], [136, 142], [136, 156], [139, 186], [61, 186], [64, 156]],
  hips: [[61, 186], [139, 186], [141, 200], [142, 229], [58, 229], [59, 200]],
  armL: [[137, 100], [170, 100], [170, 212], [143, 212], [141, 200], [136, 156], [137, 104]],
  handL: [[143, 212], [170, 212], [170, 262], [142, 262], [142, 229]],
  thighL: [[100, 229], [142, 229], [142, 286], [100, 286]],
  kneeL: [[100, 286], [142, 286], [142, 316], [100, 316]],
  shinL: [[100, 316], [142, 316], [142, 402], [100, 402]],
  footL: [[100, 402], [142, 402], [142, 440], [100, 440]],
  upperBack: [[78, 58], [170, 58], [170, 100], [137, 100], [137, 104], [136, 124], [64, 124], [63, 104], [63, 100], [30, 100], [30, 58]],
  midBack: [[64, 124], [136, 124], [136, 158], [64, 158]],
  lowerBack: [[64, 158], [136, 158], [139, 190], [61, 190]],
  glutes: [[61, 190], [139, 190], [141, 200], [142, 238], [58, 238], [59, 200]],
  hamL: [[100, 238], [142, 238], [142, 300], [100, 300]],
  calfL: [[100, 300], [142, 300], [142, 402], [100, 402]],
  sideNeck: [[70, 50], [130, 50], [130, 72], [70, 72]],
  sideHip: [[60, 180], [140, 180], [140, 240], [60, 240]],
  sideLeg: [[60, 240], [140, 240], [140, 402], [60, 402]],
} satisfies Record<string, Pt[]>;

const HIT = {
  head: [[22, -14], [178, -14], [178, 24], [130, 24], [130, 40], [112, 48], [100, 53], [88, 48], [70, 40], [70, 24], [22, 24]],
  // Beside the neck, from ear height down to the top of the shoulders.
  neck: [[22, 24], [70, 24], [70, 40], [88, 48], [100, 53], [112, 48], [130, 40], [130, 24], [178, 24], [178, 58], [122, 58], [122, 66], [78, 66], [78, 58], [22, 58]],
  shoulderL: [[122, 58], [178, 58], [178, 100], [137, 100], [122, 94]],
  chest: Z.chest,
  abdomen: Z.abdomen,
  hips: Z.hips,
  armL: [[137, 100], [178, 100], [178, 212], [143, 212], [141, 200], [136, 156], [137, 104]],
  handL: [[143, 212], [178, 212], [178, 262], [142, 262], [142, 229]],
  // Outside the legs the knee's band is taller than the knee, and the foot's starts above the ankle.
  thighL: [[100, 229], [142, 229], [142, 262], [178, 262], [178, 274], [142, 274], [142, 286], [100, 286]],
  kneeL: [[100, 286], [142, 286], [142, 274], [178, 274], [178, 328], [142, 328], [142, 316], [100, 316]],
  shinL: [[100, 316], [142, 316], [142, 328], [178, 328], [178, 390], [142, 390], [142, 402], [100, 402]],
  footL: [[100, 402], [142, 402], [142, 390], [178, 390], [178, 438], [100, 438]],
  upperBack: [[22, 58], [178, 58], [178, 100], [137, 100], [137, 104], [136, 124], [64, 124], [63, 104], [63, 100], [22, 100]],
  midBack: Z.midBack,
  lowerBack: Z.lowerBack,
  glutes: Z.glutes,
  hamL: [[100, 238], [142, 238], [142, 262], [178, 262], [178, 300], [100, 300]],
  calfL: [[100, 300], [178, 300], [178, 402], [100, 402]],
  // Beside the head as well as across the neck (the head itself is not marked from the side).
  sideNeck: [[22, 24], [78, 24], [78, 50], [128, 50], [128, 24], [178, 24], [178, 72], [22, 72]],
  sideHip: [[22, 180], [178, 180], [178, 240], [22, 240]],
  sideLeg: [[22, 240], [178, 240], [178, 402], [22, 402]],
} satisfies Record<keyof typeof Z, Pt[]>;

type Key = keyof typeof Z;
/** A zone as drawn, or mirrored onto the other side of the body. */
const zone = (id: string, key: Key, mirrored = false): Zone => ({
  id,
  d: poly(mirrored ? flip(Z[key]) : Z[key]),
  hit: mirrored ? flip(HIT[key]) : HIT[key],
});

export const VIEWS: readonly ViewDef[] = [
  {
    // Front: the client's right is on the viewer's left, so the client's left side is the viewer's right (the L shapes).
    view: "front",
    title: "Front",
    silhouette: FB_SIL,
    details: FRONT_DETAIL,
    marks: ["R", "L"],
    zones: [
      zone("head", "head"),
      zone("neck", "neck"),
      zone("leftShoulder", "shoulderL"),
      zone("rightShoulder", "shoulderL", true),
      zone("chest", "chest"),
      zone("abdomen", "abdomen"),
      zone("leftArm", "armL"),
      zone("rightArm", "armL", true),
      zone("leftHand", "handL"),
      zone("rightHand", "handL", true),
      zone("hips", "hips"),
      zone("leftThigh", "thighL"),
      zone("rightThigh", "thighL", true),
      zone("leftKnee", "kneeL"),
      zone("rightKnee", "kneeL", true),
      zone("leftShin", "shinL"),
      zone("rightShin", "shinL", true),
      zone("leftFoot", "footL"),
      zone("rightFoot", "footL", true),
    ],
  },
  {
    // Back: the client's left is on the viewer's left, so the client's right side is the viewer's right (the L shapes).
    view: "back",
    title: "Back",
    silhouette: FB_SIL,
    details: BACK_DETAIL,
    marks: ["L", "R"],
    zones: [
      zone("upperBack", "upperBack"),
      zone("midBack", "midBack"),
      zone("lowerBack", "lowerBack"),
      zone("glutes", "glutes"),
      zone("leftHamstring", "hamL", true),
      zone("rightHamstring", "hamL"),
      zone("leftCalf", "calfL", true),
      zone("rightCalf", "calfL"),
    ],
  },
  {
    view: "side",
    title: "Side",
    silhouette: SIDE_SIL,
    details: SIDE_DETAIL,
    marks: null,
    zones: [zone("sideNeck", "sideNeck"), zone("sideHip", "sideHip"), zone("sideLeg", "sideLeg")],
  },
];
