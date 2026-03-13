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

  const cx = minX + 4.5 * cellWidth;
  const cy = minY + 4.5 * cellHeight;

  // 10 Sutras lines conceptually defined far outside the plot bounds to ensure intersection clipping works
  const EXT = 10000;

  // 1. Brahma Sutra (N-S axis)
  const l1: [Point, Point] = [{ x: cx, y: minY - EXT }, { x: cx, y: maxY + EXT }];
  // 2. Soma Sutra (E-W axis)
  const l2: [Point, Point] = [{ x: minX - EXT, y: cy }, { x: maxX + EXT, y: cy }];

  // 3. Konasutra (NW - SE)
  const l3: [Point, Point] = [{ x: minX - EXT, y: minY - EXT * (cellHeight / cellWidth) }, { x: maxX + EXT, y: maxY + EXT * (cellHeight / cellWidth) }];

  // 4. Konasutra (NE - SW)
  const l4: [Point, Point] = [{ x: maxX + EXT, y: minY - EXT * (cellHeight / cellWidth) }, { x: minX - EXT, y: maxY + EXT * (cellHeight / cellWidth) }];

  // The next 6 lines are shifted by +/- 1/2 grid cell from the main cross and diagonals
  // But strictly looking at the image: 
  // It's a 9x9 grid. The diagonal intersects at (1,1), (2,2), (3,3), (4,4), (4.5,4.5), (5,5), etc.
  // The secondary diagonals start at (0, 2.5) to (6.5, 9) and (2.5, 0) to (9, 6.5) etc.
  // We can just calculate the 9 exact intersections mathematically based on the grid index.

  const gridIntersections = [
    { i: 4.5, j: 4.5 }, // Brahma
    { i: 3, j: 3 },     // NW Marma
    { i: 6, j: 3 },     // NE Marma
    { i: 3, j: 6 },     // SW Marma
    { i: 6, j: 6 },     // SE Marma
    { i: 4.5, j: 2 },   // North Marma
    { i: 4.5, j: 7 },   // South Marma
    { i: 2, j: 4.5 },   // West Marma
    { i: 7, j: 4.5 }    // East Marma
  ];

  gridIntersections.forEach(gi => {
    const p = {
      x: minX + gi.i * cellWidth,
      y: minY + gi.j * cellHeight
    };
    if (pointInPolygon(p, boundary)) {
      marmaPoints.push(p);
    }
  });


  // Specifically rendering the 10 exact sutras framing these 9 points
  // 1. Center NS
  const sutras: [Point, Point][] = [
    l1, l2, l3, l4,
    // Shifted Diagonal 1: (0, 1.5) to (7.5, 9)
    [{ x: minX, y: minY + 1.5 * cellHeight }, { x: minX + 7.5 * cellWidth, y: maxY }],
    // Shifted Diagonal 2: (1.5, 0) to (9, 7.5)
    [{ x: minX + 1.5 * cellWidth, y: minY }, { x: maxX, y: minY + 7.5 * cellHeight }],
    // Shifted Diagonal 3: (9, 1.5) to (1.5, 9)
    [{ x: maxX, y: minY + 1.5 * cellHeight }, { x: minX + 1.5 * cellWidth, y: maxY }],
    // Shifted Diagonal 4: (7.5, 0) to (0, 7.5)
    [{ x: minX + 7.5 * cellWidth, y: minY }, { x: minX, y: minY + 7.5 * cellHeight }]
  ];

  // To make the sutras span perfectly outside, we extend them
  const extendLine = (p1: Point, p2: Point): [Point, Point] => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return [
      { x: p1.x - EXT * dx, y: p1.y - EXT * dy },
      { x: p2.x + EXT * dx, y: p2.y + EXT * dy }
    ];
  };

  const extendedSutras = sutras.map(line => extendLine(line[0], line[1]));

  for (const line of extendedSutras) {
    vanshaLines.push(...clipLineWithPolygon(line, boundary));
  }

  return { marmaPoints, vanshaLines };
};
