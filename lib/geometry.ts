// geometry.ts
// Vastu Purusha Mandala (45 Devtas) Geometric Computation
// Uses polar + concentric boundary evolution (NOT grid-based)

export interface Point {
  x: number;
  y: number;
}

export interface DevtaRegion {
  id: number;
  ring: "center" | "middle" | "outer";
  name: string;
  polygon: Point[];
  startAngle?: number;
  endAngle?: number;
}

// Configurable scaling ratios for concentric boundaries
const MIDDLE_BOUNDARY_SCALE = 0.66;
const INNER_BOUNDARY_SCALE = 0.33;

// Devta names following traditional Vastu mapping
// Center: 1 Devta
const CENTER_DEVTA = "Brahma";

// Middle Ring: 12 Devtas (4 occupy 45°, 8 occupy 22.5°)
const MIDDLE_DEVTAS = [
  "Shikhi", "Parjanya", // 45° (2 divisions)
  "Jayanta", // 22.5° (1 division)
  "Indra", "Surya", // 45° (2 divisions)
  "Satya", // 22.5° (1 division)
  "Bhrisha", "Akash", // 45° (2 divisions)
  "Vayu", // 22.5° (1 division)
  "Pusha", "Vitatha", // 45° (2 divisions)
  "Gruhakshat", "Yama", "Gandharva", "Bhringraj", // 22.5° each
];

// Outer Ring: 32 Devtas (each 11.25°)
const OUTER_DEVTAS = [
  "Dishah Shiva", "Soma", "Sthana", "Bhallat",
  "Mukhya", "Soma", "Bhujag", "Aaditi",
  "Diti", "Shura", "Apa", "Apavatsa",
  "Savitri", "Indrajit", "Vivashvana", "Mitra",
  "Prithvidhara", "Apah", "Aaryama", "Savitar",
  "Vivasvat", "Indra", "Jaya", "Rudra",
  "Rajayakshma", "Asura", "Shosha", "Papayakshma",
  "Roga", "Naga", "Mukhya", "Bhallat"
];

/**
 * Calculate the centroid (geometric center) of a polygon
 */
export function calculateCentroid(polygon: Point[]): Point {
  if (polygon.length === 0) return { x: 0, y: 0 };
  
  let area = 0;
  let cx = 0;
  let cy = 0;
  
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const cross = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
    area += cross;
    cx += (polygon[i].x + polygon[j].x) * cross;
    cy += (polygon[i].y + polygon[j].y) * cross;
  }
  
  area *= 0.5;
  const factor = 1 / (6 * area);
  
  return {
    x: cx * factor,
    y: cy * factor
  };
}

/**
 * Scale a polygon toward/away from centroid
 * scale < 1: shrinks toward centroid (inward)
 * scale > 1: expands away from centroid (outward)
 */
export function scalePolygon(polygon: Point[], centroid: Point, scale: number): Point[] {
  return polygon.map(p => ({
    x: centroid.x + (p.x - centroid.x) * scale,
    y: centroid.y + (p.y - centroid.y) * scale
  }));
}

/**
 * Find intersection point of a ray from centroid at given angle with polygon
 * angle: in degrees, 0° = North (up), clockwise
 */
export function rayPolygonIntersection(
  angle: number,
  polygon: Point[],
  centroid: Point
): Point | null {
  // Convert angle to radians (0° = North = -90° in standard coords)
  const angleRad = ((angle - 90) * Math.PI) / 180;
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);
  
  let closestIntersection: Point | null = null;
  let minDistance = Infinity;
  
  // Check intersection with each edge
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const p1 = polygon[i];
    const p2 = polygon[j];
    
    const intersection = lineRayIntersection(centroid, dx, dy, p1, p2);
    if (intersection) {
      const dist = Math.hypot(intersection.x - centroid.x, intersection.y - centroid.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestIntersection = intersection;
      }
    }
  }
  
  return closestIntersection;
}

/**
 * Find intersection between a ray and a line segment
 */
function lineRayIntersection(
  rayOrigin: Point,
  rayDx: number,
  rayDy: number,
  segP1: Point,
  segP2: Point
): Point | null {
  const x1 = segP1.x;
  const y1 = segP1.y;
  const x2 = segP2.x;
  const y2 = segP2.y;
  const x3 = rayOrigin.x;
  const y3 = rayOrigin.y;
  const x4 = rayOrigin.x + rayDx;
  const y4 = rayOrigin.y + rayDy;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null;
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  if (t >= 0 && t <= 1 && u >= 0) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }
  
  return null;
}

/**
 * Build a wedge-shaped polygon sector between two concentric boundaries
 * startAngle, endAngle: in degrees
 */
export function buildAngularSector(
  innerPoly: Point[],
  outerPoly: Point[],
  startAngle: number,
  endAngle: number,
  centroid: Point
): Point[] {
  const sector: Point[] = [];
  const angleStep = 1; // Sample every 1 degree for smooth curves
  
  // Generate points along outer boundary (clockwise)
  for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
    const intersection = rayPolygonIntersection(angle, outerPoly, centroid);
    if (intersection) sector.push(intersection);
  }
  
  // Ensure we have the exact end angle point
  const endOuter = rayPolygonIntersection(endAngle, outerPoly, centroid);
  if (endOuter) sector.push(endOuter);
  
  // Generate points along inner boundary (counter-clockwise)
  const innerPoints: Point[] = [];
  for (let angle = endAngle; angle >= startAngle; angle -= angleStep) {
    const intersection = rayPolygonIntersection(angle, innerPoly, centroid);
    if (intersection) innerPoints.push(intersection);
  }
  
  // Ensure we have the exact start angle point
  const startInner = rayPolygonIntersection(startAngle, innerPoly, centroid);
  if (startInner) innerPoints.push(startInner);
  
  return [...sector, ...innerPoints];
}

/**
 * Generate all 45 Devta regions using concentric + polar method
 */
export function generate45Devtas(
  boundary: Point[],
  northAngle: number = 0
): DevtaRegion[] | null {
  if (boundary.length < 3) return null;
  
  const centroid = calculateCentroid(boundary);
  const regions: DevtaRegion[] = [];
  let devtaId = 1;
  
  // Generate concentric boundaries
  const outerBoundary = boundary;
  const middleBoundary = scalePolygon(boundary, centroid, MIDDLE_BOUNDARY_SCALE);
  const innerBoundary = scalePolygon(boundary, centroid, INNER_BOUNDARY_SCALE);
  
  // 1. CENTER: Brahmasthan (1 Devta)
  regions.push({
    id: devtaId++,
    ring: "center",
    name: CENTER_DEVTA,
    polygon: innerBoundary
  });
  
  // 2. MIDDLE RING: 12 Devtas
  // Angular divisions: 16 total (4 Devtas × 2 divisions + 8 Devtas × 1 division)
  const middleDivisions = 16;
  const middleAngleStep = 360 / middleDivisions;
  
  // Define which Devtas occupy 2 divisions (45°) vs 1 division (22.5°)
  // Pattern: [2, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1]
  const middlePattern = [2, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1]; // 12 Devtas
  
  let currentMiddleAngle = northAngle;
  let middleDevtaIndex = 0;
  
  for (const divisions of middlePattern) {
    const angleSpan = divisions * middleAngleStep;
    const startAngle = currentMiddleAngle % 360;
    const endAngle = (currentMiddleAngle + angleSpan) % 360;
    
    const sector = buildAngularSector(
      innerBoundary,
      middleBoundary,
      startAngle,
      endAngle > startAngle ? endAngle : endAngle + 360,
      centroid
    );
    
    if (sector.length > 0) {
      regions.push({
        id: devtaId++,
        ring: "middle",
        name: MIDDLE_DEVTAS[middleDevtaIndex] || `Middle-${middleDevtaIndex + 1}`,
        polygon: sector,
        startAngle,
        endAngle: endAngle > startAngle ? endAngle : endAngle + 360
      });
    }
    
    currentMiddleAngle += angleSpan;
    middleDevtaIndex++;
  }
  
  // 3. OUTER RING: 32 Devtas (each 11.25°)
  const outerDivisions = 32;
  const outerAngleStep = 360 / outerDivisions;
  
  for (let i = 0; i < outerDivisions; i++) {
    const startAngle = (northAngle + i * outerAngleStep) % 360;
    const endAngle = (northAngle + (i + 1) * outerAngleStep) % 360;
    
    const sector = buildAngularSector(
      middleBoundary,
      outerBoundary,
      startAngle,
      endAngle > startAngle ? endAngle : endAngle + 360,
      centroid
    );
    
    if (sector.length > 0) {
      regions.push({
        id: devtaId++,
        ring: "outer",
        name: OUTER_DEVTAS[i] || `Outer-${i + 1}`,
        polygon: sector,
        startAngle,
        endAngle: endAngle > startAngle ? endAngle : endAngle + 360
      });
    }
  }
  
  return regions;
}

/**
 * Determine which Devta zone a point belongs to
 */
export function getZoneForPoint(
  point: Point,
  boundary: Point[],
  northAngle: number
): string {
  const devtas = generate45Devtas(boundary, northAngle);
  if (!devtas) return "Unknown";
  
  for (const devta of devtas) {
    if (pointInPolygon(point, devta.polygon)) {
      return devta.name;
    }
  }
  
  return "Outside";
}

/**
 * Check if a point is inside a polygon using ray casting
 */
function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}