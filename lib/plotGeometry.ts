/**
 * 2D helpers for irregular quadrilateral plot construction (FL–FR–BR–BL).
 * Front = FL–FR, Right = FR–BR, Back = BR–BL, Left = BL–FL; diagonal = FL–BR.
 */

export type Point2 = { x: number; y: number };

const EPS = 1e-9;
const TOL = 1e-6;

/** Intersection of circle (c1, r1) and (c2, r2). Empty if none; one point if tangent. */
export function intersectCircles2D(
  c1: Point2,
  r1: number,
  c2: Point2,
  r2: number
): Point2[] {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.hypot(dx, dy);

  if (d < EPS) {
    return Math.abs(r1 - r2) < EPS ? [] : [];
  }

  if (d > r1 + r2 + EPS) return [];
  if (d < Math.abs(r1 - r2) - EPS) return [];

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const hSq = r1 * r1 - a * a;
  if (hSq < -EPS) return [];
  const h = Math.sqrt(Math.max(0, hSq));

  const mx = c1.x + (dx * a) / d;
  const my = c1.y + (dy * a) / d;

  const rx = (-dy * h) / d;
  const ry = (dx * h) / d;

  const p: Point2 = { x: mx + rx, y: my + ry };
  const q: Point2 = { x: mx - rx, y: my - ry };

  if (h < EPS) return [p];
  return [p, q];
}

export function dist2D(p1: Point2, p2: Point2): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/** Signed area; sign depends on winding (y-axis orientation). */
export function polygonSignedArea(vertices: Point2[]): number {
  if (vertices.length < 3) return 0;
  let sum = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sum += vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
  }
  return sum / 2;
}

/** Open interval for diagonal e (FL–BR) so both triangles (FL,FR,BR) and (FL,BL,BR) are non-degenerate. */
export function feasibleDiagonalInterval(
  a: number,
  b: number,
  c: number,
  d: number
): { min: number; max: number } | null {
  const minDiag = Math.max(Math.abs(a - d), Math.abs(b - c));
  const maxDiag = Math.min(a + d, b + c);
  if (minDiag >= maxDiag) return null;
  return { min: minDiag, max: maxDiag };
}

/** Strictly inside (min, max); uses midpoint. */
export function autoDiagonalFromSides(
  a: number,
  b: number,
  c: number,
  d: number
): number | null {
  const interval = feasibleDiagonalInterval(a, b, c, d);
  if (!interval) return null;
  return (interval.min + interval.max) / 2;
}

export type IrregularPlotCorners = {
  fl: Point2;
  fr: Point2;
  br: Point2;
  bl: Point2;
  diagonal: number;
};

/**
 * FL at origin, FR at (a,0). Finds BR via (FL,e)∩(FR,d), BL via (FL,c)∩(BR,b).
 * Returns vertices in perimeter order FL → FR → BR → BL, or null if no valid construction.
 */
export function buildIrregularQuadrilateral(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number
): IrregularPlotCorners | null {
  if (a <= 0 || b <= 0 || c <= 0 || d <= 0 || e <= 0) return null;

  const minD = Math.max(Math.abs(a - d), Math.abs(b - c));
  const maxD = Math.min(a + d, b + c);
  if (e <= minD || e >= maxD) return null;

  const fl: Point2 = { x: 0, y: 0 };
  const fr: Point2 = { x: a, y: 0 };

  const brOpts = intersectCircles2D(fl, e, fr, d);
  if (brOpts.length === 0) return null;

  const tryOrder = [brOpts[0], brOpts[1]].filter(Boolean);
  const uniqueBr: Point2[] = [];
  for (const br of tryOrder) {
    if (!uniqueBr.some((p) => dist2D(p, br) < TOL)) uniqueBr.push(br);
  }

  let best: IrregularPlotCorners | null = null;
  let bestKey = -Infinity;

  for (const br of uniqueBr) {
    const blOpts = intersectCircles2D(fl, c, br, b);
    if (blOpts.length === 0) continue;

    const blCandidates = blOpts.length === 2 ? blOpts : [blOpts[0]];

    for (const bl of blCandidates) {
      const poly: Point2[] = [fl, fr, br, bl];
      const area = Math.abs(polygonSignedArea(poly));
      if (area < TOL) continue;

      const convex = isConvexQuad(fl, fr, br, bl);
      const simple = !segmentsIntersect(fl, fr, br, bl);
      if (!simple) continue;

      const rankConvex = convex ? 1 : 0;
      const key = rankConvex * 1e12 + area;
      if (key > bestKey) {
        bestKey = key;
        best = { fl, fr, br, bl, diagonal: e };
      }
    }
  }

  return best;
}

/** True if closed polygon FL–FR–BR–BL has no crossing edges (diagonal check only needed for quad). */
function segmentsIntersect(fl: Point2, fr: Point2, br: Point2, bl: Point2): boolean {
  return (
    segCross(fl, fr, br, bl) ||
    segCross(fr, br, bl, fl)
  );
}

function segCross(a: Point2, b: Point2, c: Point2, d: Point2): boolean {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if (o1 === 0 || o2 === 0 || o3 === 0 || o4 === 0) return false;
  return o1 !== o2 && o3 !== o4;
}

function orient(a: Point2, b: Point2, c: Point2): number {
  const v = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  if (Math.abs(v) < TOL) return 0;
  return v > 0 ? 1 : -1;
}

function cross(o: Point2, a: Point2, b: Point2): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function isConvexQuad(fl: Point2, fr: Point2, br: Point2, bl: Point2): boolean {
  const pts = [fl, fr, br, bl];
  const n = 4;
  let sign = 0;
  for (let i = 0; i < n; i++) {
    const o = pts[i];
    const p = pts[(i + 1) % n];
    const q = pts[(i + 2) % n];
    const cr = cross(o, p, q);
    if (Math.abs(cr) < TOL) continue;
    if (sign === 0) sign = cr > 0 ? 1 : -1;
    else if ((cr > 0 ? 1 : -1) !== sign) return false;
  }
  return true;
}
