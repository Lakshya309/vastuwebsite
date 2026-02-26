import { Point } from "./floorPlanInterfaces";

/** ---------- Geometry helpers ---------- */

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

function getBoundingBox(boundary: Point[]) {
  return {
    minX: Math.min(...boundary.map(p => p.x)),
    minY: Math.min(...boundary.map(p => p.y)),
    maxX: Math.max(...boundary.map(p => p.x)),
    maxY: Math.max(...boundary.map(p => p.y)),
  };
}

function getIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const den = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (den === 0) return null;
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / den;
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / den;
  if (t > 0 && t < 1 && u > 0 && u < 1) {
    return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
  }
  return null;
}

function clipLineWithPolygon(line: [Point, Point], polygon: Point[]): [Point, Point][] {
    const [start, end] = line;
    const intersections: Point[] = [];
  
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      const intersection = getIntersection(start, end, p1, p2);
      if (intersection) {
        intersections.push(intersection);
      }
    }
  
    if (intersections.length < 2) return [];

    // sort intersections by distance from start
    intersections.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.x - start.x, 2) + Math.pow(a.y - start.y, 2));
        const distB = Math.sqrt(Math.pow(b.x - start.x, 2) + Math.pow(b.y - start.y, 2));
        return distA - distB;
    });
  
    const clippedLines: [Point, Point][] = [];
    for(let i = 0; i < intersections.length - 1; i+=2) {
        clippedLines.push([intersections[i], intersections[i+1]]);
    }

    return clippedLines;
}

/** ---------- Main marma generator ---------- */

export const getMarmaPoints = (boundary: Point[]) => {
  if (boundary.length < 3) {
    return { marmaPoints: [], vanshaLines: [] };
  }

  const { minX, minY, maxX, maxY } = getBoundingBox(boundary);

  const gridSize = 9;
  const cellWidth = (maxX - minX) / gridSize;
  const cellHeight = (maxY - minY) / gridSize;

  const marmaPoints: Point[] = [];
  const vanshaLines: [Point, Point][] = [];

  /** ---------- 1️⃣ Generate 9×9 grid marmas ---------- */
  for (let i = 1; i < gridSize; i++) {
    for (let j = 1; j < gridSize; j++) {
      const p = {
        x: minX + i * cellWidth,
        y: minY + j * cellHeight,
      };

      if (pointInPolygon(p, boundary)) {
        marmaPoints.push(p);
      }
    }
  }

  /** ---------- 2️⃣ Core vansha lines (clipped conceptually) ---------- */

  const centerX = minX + 4.5 * cellWidth;
  const centerY = minY + 4.5 * cellHeight;

  const lines: [Point, Point][] = [
    // Vertical axis
    [{ x: centerX, y: minY-1000 }, { x: centerX, y: maxY+1000 }],
    // Horizontal axis
    [{ x: minX-1000, y: centerY }, { x: maxX+1000, y: centerY }],
    // Main diagonals
    [{ x: minX-1000, y: minY-1000 }, { x: maxX+1000, y: maxY+1000 }],
    [{ x: maxX+1000, y: minY-1000 }, { x: minX-1000, y: maxY+1000 }],
    // Secondary vastu diagonals
    [{ x: minX + 2.5 * cellWidth, y: minY-1000 }, { x: minX-1000, y: minY + 2.5 * cellHeight }],
    [{ x: maxX - 2.5 * cellWidth, y: minY-1000 }, { x: maxX+1000, y: minY + 2.5 * cellHeight }],
  ]

  for(const line of lines) {
    vanshaLines.push(...clipLineWithPolygon(line, boundary));
  }
  
  return { marmaPoints, vanshaLines };
};
