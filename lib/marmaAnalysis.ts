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
  for (let i = 0; i < intersections.length - 1; i += 2) {
    clippedLines.push([intersections[i], intersections[i + 1]]);
  }

  return clippedLines;
}

/** ---------- Main marma generator ---------- */

export const getMarmaPoints = (boundary: Point[], centroid?: Point | null) => {
  if (boundary.length < 3) {
    return { marmaPoints: [], vanshaLines: [] };
  }

  const { minX, minY, maxX, maxY } = getBoundingBox(boundary);

  // Traditional Manduka 64-pada grid (8x8 squares => 9x9 intersections)
  const gridSize = 8;
  const cellWidth = (maxX - minX) / gridSize;
  const cellHeight = (maxY - minY) / gridSize;

  // Center (4,4) corresponds exacty to the mathematical plot centroid
  const cx = centroid ? centroid.x : minX + 4 * cellWidth;
  const cy = centroid ? centroid.y : minY + 4 * cellHeight;

  // The 8x8 mathematical bounding grid's origin (Top-Left / NW in grid-space)
  const effMinX = cx - 4 * cellWidth;
  const effMinY = cy - 4 * cellHeight;

  const marmaPoints: Point[] = [];
  const vanshaLines: [Point, Point][] = [];

  const EXT = 10000;
  const rawSutras: [Point, Point][] = [];

  const toExtPoint = (i: number, j: number): Point => ({
    x: effMinX + i * cellWidth,
    y: effMinY + j * cellHeight
  });

  // 1. Orthogonal Grid Lines (9 Vertical, 9 Horizontal)
  for (let idx = 0; idx <= gridSize; idx++) {
    // Vertical
    rawSutras.push([
      { x: effMinX + idx * cellWidth, y: effMinY - EXT },
      { x: effMinX + idx * cellWidth, y: effMinY + gridSize * cellHeight + EXT }
    ]);
    // Horizontal
    rawSutras.push([
      { x: effMinX - EXT, y: effMinY + idx * cellHeight },
      { x: effMinX + gridSize * cellWidth + EXT, y: effMinY + idx * cellHeight }
    ]);
  }

  // 2. Forward Diagonals (slope = 1 => j = i + c)
  const fwdIntercepts = [-6, -4, -2, 0, 2, 4, 6];
  fwdIntercepts.forEach(c => {
    const startI = Math.max(0, -c);
    const endI = Math.min(gridSize, gridSize - c);
    if (endI > startI) {
      rawSutras.push([toExtPoint(startI, startI + c), toExtPoint(endI, endI + c)]);
    }
  });

  // 3. Reverse Diagonals (slope = -1 => j = -i + c)
  const revIntercepts = [2, 4, 6, 8, 10, 12, 14];
  revIntercepts.forEach(c => {
    const startI = Math.max(0, c - gridSize);
    const endI = Math.min(gridSize, c);
    if (endI > startI) {
      rawSutras.push([toExtPoint(startI, c - startI), toExtPoint(endI, c - endI)]);
    }
  });

  // Function to extend finite geometric diagonals infinitely for clipping
  const extendLine = (p1: Point, p2: Point): [Point, Point] => {
    // If it's already perfectly extended orthogonally, skip extending
    if (Math.abs(p1.x - p2.x) < 1 || Math.abs(p1.y - p2.y) < 1) return [p1, p2];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return [
      { x: p1.x - EXT * dx, y: p1.y - EXT * dy },
      { x: p2.x + EXT * dx, y: p2.y + EXT * dy }
    ];
  };

  const extendedSutras = rawSutras.map(line => extendLine(line[0], line[1]));

  for (const line of extendedSutras) {
    const clipped = clipLineWithPolygon(line, boundary);
    if (clipped.length > 0) {
      vanshaLines.push(...clipped);
    }
  }

  // Specific Traditional Intersections (Maha and Sub Marmas) based on geometry
  const marmaIndices = [
    // Red Maha Marmas (Spine)
    { i: 7, j: 1 }, // Shirsha
    { i: 6, j: 2 }, // Mukha
    { i: 5, j: 3 }, // Hridhaya
    { i: 4, j: 4 }, // Nabhi (Brahma Center)
    
    // Left/Right Breasts (Maha Marmas)
    { i: 2, j: 2 }, // L Sthana
    { i: 6, j: 6 }, // R Sthana
    
    // Green Sub-Marmas (Inner square layer of Brahma)
    { i: 3, j: 3 }, // NW corner of Brahma
    { i: 5, j: 5 }, // SE corner of Brahma
    { i: 3, j: 5 }, // SW corner of Brahma
    // Note: (5,3) serves as Hridhaya, so the 4th corner is merged in the spine
    
    // Green Sub-Marmas (Midpoint diamonds around Brahma)
    { i: 4, j: 2 }, // North edge
    { i: 6, j: 4 }, // East edge
    { i: 4, j: 6 }, // South edge
    { i: 2, j: 4 }, // West edge
  ];

  marmaIndices.forEach(idx => {
    const p = toExtPoint(idx.i, idx.j);
    if (pointInPolygon(p, boundary)) {
      marmaPoints.push(p);
    }
  });

  return { marmaPoints, vanshaLines };
};
