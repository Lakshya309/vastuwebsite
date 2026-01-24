import PolygonOffset from "polygon-offset";
import { Point } from "@/lib/coordinates";

/* =========================================================
   Types
========================================================= */

export interface Point {
  x: number;
  y: number;
}

/* =========================================================
   Basic Geometry
========================================================= */

export function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function polygonArea(polygon: Point[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area / 2);
}

export function polygonPerimeter(polygon: Point[]): number {
  let p = 0;
  for (let i = 0; i < polygon.length; i++) {
    p += dist(polygon[i], polygon[(i + 1) % polygon.length]);
  }
  return p;
}

export function getAABB(polygon: Point[]) {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const p of polygon) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}



/**
 * Offsets a polygon inward or outward.
 * Returns ALL resulting rings (important for concave shapes).
 */
export function offsetPolygon(
  polygon: Point[],
  distance: number,
): Point[][] {
  if (polygon.length < 3) return [];

  const offset = new PolygonOffset();

  // polygon-offset expects [x, y][]
  offset.data(polygon.map(p => [p.x, p.y]));

  // Use margin() — this is the stable API
  const result = offset.margin(distance);

  // Convert back to Point[][]
  return result.map(ring =>
    ring.map(([x, y]) => ({ x, y })),
  );
}


export function selectLargestPolygon(polygons: Point[][]): Point[] {
  if (!polygons.length) return [];
  return polygons.reduce((a, b) =>
    polygonArea(a) > polygonArea(b) ? a : b
  );
}

/* =========================================================
   Perimeter Walking
========================================================= */

export function getPointAtDistance(
  polygon: Point[],
  distance: number
): Point {
  const perimeter = polygonPerimeter(polygon);
  let d = distance % perimeter;
  let acc = 0;

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const segLen = dist(a, b);

    if (acc + segLen >= d) {
      const t = (d - acc) / segLen;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t
      };
    }
    acc += segLen;
  }

  return polygon[0];
}

export function getPolygonSegment(
  polygon: Point[],
  startDist: number,
  endDist: number
): Point[] {
  const perimeter = polygonPerimeter(polygon);
  if (perimeter === 0) return [];

  let s = startDist % perimeter;
  let e = endDist % perimeter;

  if (e < s) {
    const a = getPolygonSegment(polygon, s, perimeter);
    const b = getPolygonSegment(polygon, 0, e);
    return [...a.slice(0, -1), ...b];
  }

  const segment: Point[] = [];
  segment.push(getPointAtDistance(polygon, s));

  let acc = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const segLen = dist(a, b);

    if (acc > s && acc < e) {
      segment.push(a);
    }
    acc += segLen;
  }

  segment.push(getPointAtDistance(polygon, e));
  return segment;
}

/* =========================================================
   Strip / Ring Construction
========================================================= */

export function buildStripPolygon(
  outerSegment: Point[],
  innerSegment: Point[]
): Point[] {
  const strip: Point[] = [];

  for (const p of outerSegment) strip.push(p);
  for (let i = innerSegment.length - 1; i >= 0; i--) {
    strip.push(innerSegment[i]);
  }

  return strip;
}

/* =========================================================
   Brahmasthan
========================================================= */

export function generateBrahmasthan(innerBoundary: Point[]): Point[] {
  return innerBoundary;
}

/* =========================================================
   Helpers
========================================================= */

export function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number
): Point[] {
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height }
  ];
}
