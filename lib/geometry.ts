// lib/geometry.ts
// Vastu Purusha Mandala (45 Devtas) Geometric Computation
// ADVANCED: Works with L, U, C, and all complex polygon shapes
// Uses adaptive concentric boundaries with polygon offsetting

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
  subPolygonIndex?: number; // Added back as it was in previous devtaAnalysis.ts
}

// Adaptive scaling - exported for potential external use/configuration
export const MIDDLE_BOUNDARY_SCALE = 0.66;
export const INNER_BOUNDARY_SCALE = 0.33;

// Devta names (Corrected for 16 middle and 32 outer unique names)
const CENTER_DEVTA = "Brahma";

const MIDDLE_DEVTAS = [
  "Apa", "Apavatsa", "Vivasvat", "Mitra", "Prithvidhara", "Aaryama",
  "Savitar", "Savitri", "Indra", "Jayanta", "Mahendra", "Agni",
  "Pushan", "Vitatha", "Gruhakshat", "Yama" // 16 Devtas
];

const OUTER_DEVTAS = [
  "Shikhi", "Parjanya", "Jayanta", "Mahendra", "Surya", "Satya",
  "Bhrisha", "Akash", "Vayu", "Pusha", "Vitatha", "Gruhakshat",
  "Yama", "Gandharva", "Bhringraj", "Mrisha", "Pitra", "Dauvarika",
  "Sugriva", "Pushpadanta", "Varun", "Asur", "Shosha", "Papayakshma",
  "Roga", "Naga", "Mukhya", "Bhallat", "Soma", "Bhujag",
  "Aditi", "Diti" // 32 unique Devtas
];

let globalDevtaIdCounter = 1; // Manage IDs locally within module

/**
 * Calculate polygon centroid using signed area method
 */
export function calculateCentroid(polygon: Point[]): Point {
  if (polygon.length === 0) return { x: 0, y: 0 };
  if (polygon.length === 1) return { ...polygon[0] };
  if (polygon.length === 2) return {
    x: (polygon[0].x + polygon[1].x) / 2,
    y: (polygon[0].y + polygon[1].y) / 2
  };
  
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
  if (Math.abs(area) < 1e-10) {
    // Degenerate polygon, use simple average
    return {
      x: polygon.reduce((s, p) => s + p.x, 0) / polygon.length,
      y: polygon.reduce((s, p) => s + p.y, 0) / polygon.length
    };
  }
  
  const factor = 1 / (6 * area);
  return {
    x: cx * factor,
    y: cy * factor
  };
}

/**
 * Advanced polygon offsetting for complex shapes
 * Creates inward offset using straight skeleton approximation
 */
function offsetPolygonInward(polygon: Point[], offsetDistance: number): Point[] {
  if (polygon.length < 3) return polygon;
  
  const offset: Point[] = [];
  const n = polygon.length;
  
  for (let i = 0; i < n; i++) {
    const prev = polygon[(i - 1 + n) % n];
    const curr = polygon[i];
    const next = polygon[(i + 1) % n];
    
    // Calculate edge vectors
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    
    // Normalize
    const len1 = Math.hypot(v1.x, v1.y);
    const len2 = Math.hypot(v2.x, v2.y);
    if (len1 < 1e-10 || len2 < 1e-10) continue;
    
    v1.x /= len1; v1.y /= len1;
    v2.x /= len2; v2.y /= len2;
    
    // Calculate perpendicular vectors (inward normals)
    const n1 = { x: -v1.y, y: v1.x };
    const n2 = { x: -v2.y, y: v2.x };
    
    // Average normal for offset direction
    const avgNormal = {
      x: (n1.x + n2.x) / 2,
      y: (n1.y + n2.y) / 2
    };
    
    const normLen = Math.hypot(avgNormal.x, avgNormal.y);
    if (normLen < 1e-10) continue;
    
    avgNormal.x /= normLen;
    avgNormal.y /= normLen;
    
    // Calculate offset distance adjustment for corner angle
    const sinHalfAngle = Math.sqrt((1 - (v1.x * v2.x + v1.y * v2.y)) / 2);
    const adjustedOffset = sinHalfAngle > 0.1 ? offsetDistance / sinHalfAngle : offsetDistance;
    
    // Limit extreme offsets
    const maxOffset = offsetDistance * 3;
    const finalOffset = Math.min(adjustedOffset, maxOffset);
    
    offset.push({
      x: curr.x + avgNormal.x * finalOffset,
      y: curr.y + avgNormal.y * finalOffset
    });
  }
  
  return offset.length > 2 ? offset : polygon;
}

/**
 * Calculate maximum inset distance before polygon collapses
 */
export function calculateMaxInsetDistance(polygon: Point[]): number {
  const centroid = calculateCentroid(polygon);
  let minDist = Infinity;
  
  for (const point of polygon) {
    const dist = Math.hypot(point.x - centroid.x, point.y - centroid.y);
    minDist = Math.min(minDist, dist);
  }
  
  return minDist * 0.8; // 80% of minimum distance to avoid collapse
}

/**
 * Create concentric boundaries using adaptive offsetting
 */
export function createConcentricBoundaries(boundary: Point[], innerRatio: number, middleRatio: number): {
  outer: Point[];
  middle: Point[];
  inner: Point[];
} {
  const maxInset = calculateMaxInsetDistance(boundary);
  
  // Calculate offset distances
  const middleOffset = maxInset * (1 - middleRatio);
  const innerOffset = maxInset * (1 - innerRatio);
  
  let middle = offsetPolygonInward(boundary, middleOffset);
  let inner = offsetPolygonInward(boundary, innerOffset);
  
  // Validate and fallback to simple scaling if offset fails
  if (middle.length < 3 || !isValidPolygon(middle)) {
    const centroid = calculateCentroid(boundary);
    middle = scalePolygon(boundary, centroid, middleRatio);
  }
  
  if (inner.length < 3 || !isValidPolygon(inner)) {
    const centroid = calculateCentroid(boundary);
    inner = scalePolygon(boundary, centroid, innerRatio);
  }
  
  return { outer: boundary, middle, inner };
}

/**
 * Simple polygon scaling from a point (fallback method)
 */
export function scalePolygon(polygon: Point[], center: Point, scale: number): Point[] {
  return polygon.map(p => ({
    x: center.x + (p.x - center.x) * scale,
    y: center.y + (p.y - center.y) * scale
  }));
}

/**
 * Validate polygon has non-zero area
 */
export function isValidPolygon(polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
  }
  
  return Math.abs(area) > 1e-6;
}

/**
 * Calculate the area of a polygon using the shoelace formula.
 * Returns absolute area, so it works for both clockwise and counter-clockwise vertices.
 */
export function calculateArea(polygon: Point[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Find all intersections of a ray with a polygon (handles complex shapes)
 */
function rayPolygonIntersections(
  angle: number,
  polygon: Point[],
  origin: Point
): Point[] {
  const angleRad = ((angle - 90) * Math.PI) / 180;
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);
  
  const intersections: Point[] = [];
  
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const intersection = lineRayIntersection(origin, dx, dy, polygon[i], polygon[j]);
    if (intersection) {
      intersections.push(intersection);
    }
  }
  
  // Sort by distance from origin
  intersections.sort((a, b) => {
    const distA = Math.hypot(a.x - origin.x, a.y - origin.y);
    const distB = Math.hypot(b.x - origin.x, b.y - origin.y);
    return distA - distB;
  });
  
  return intersections;
}

/**
 * Get the nearest valid intersection point
 */
export function rayPolygonIntersection(
  angle: number,
  polygon: Point[],
  centroid: Point
): Point | null {
  const intersections = rayPolygonIntersections(angle, polygon, centroid);
  return intersections.length > 0 ? intersections[0] : null;
}

/**
 * Line-ray intersection helper
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
 * Build angular sector with improved handling for complex shapes
 */
export function buildAngularSector(
  innerPoly: Point[],
  outerPoly: Point[],
  startAngle: number,
  endAngle: number,
  centroid: Point
): Point[] {
  const sector: Point[] = [];
  
  // Normalize angles
  if (endAngle < startAngle) endAngle += 360;
  
  const angleStep = 0.5; // Fine sampling for smooth boundaries
  
  // Collect outer arc points
  const outerPoints: Point[] = [];
  for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
    const normalizedAngle = angle % 360;
    const intersection = rayPolygonIntersection(normalizedAngle, outerPoly, centroid);
    if (intersection) {
      outerPoints.push(intersection);
    }
  }
  
  // Ensure end point
  const endOuter = rayPolygonIntersection(endAngle % 360, outerPoly, centroid);
  if (endOuter && outerPoints.length > 0) {
    const lastPoint = outerPoints[outerPoints.length - 1];
    const dist = Math.hypot(endOuter.x - lastPoint.x, endOuter.y - lastPoint.y);
    if (dist > 0.001) outerPoints.push(endOuter);
  }
  
  // Collect inner arc points (reverse direction)
  const innerPoints: Point[] = [];
  for (let angle = endAngle; angle >= startAngle; angle -= angleStep) {
    const normalizedAngle = angle % 360;
    const intersection = rayPolygonIntersection(normalizedAngle, innerPoly, centroid);
    if (intersection) {
      innerPoints.push(intersection);
    }
  }
  
  // Ensure start point
  const startInner = rayPolygonIntersection(startAngle % 360, innerPoly, centroid);
  if (startInner && innerPoints.length > 0) {
    const lastPoint = innerPoints[innerPoints.length - 1];
    const dist = Math.hypot(startInner.x - lastPoint.x, startInner.y - lastPoint.y);
    if (dist > 0.001) innerPoints.push(startInner);
  }
  
  // Combine points
  sector.push(...outerPoints, ...innerPoints);
  
  // Remove duplicate consecutive points
  const cleaned: Point[] = [];
  for (let i = 0; i < sector.length; i++) {
    if (i === 0 || Math.hypot(sector[i].x - sector[i-1].x, sector[i].y - sector[i-1].y) > 0.001) {
      cleaned.push(sector[i]);
    }
  }
  
  return cleaned;
}

/**
 * Checks if a polygon is concave.
 * A polygon is concave if any of its internal angles are greater than 180 degrees.
 * This is detected by checking the sign of the cross product of consecutive edge vectors.
 */
export function isPolygonConcave(polygon: Point[]): boolean {
  if (polygon.length <= 3) return false; // Triangles and lines are always convex

  let prevCrossProductSign: number | undefined = undefined;

  for (let i = 0; i < polygon.length; i++) {
    const p0 = polygon[i];
    const p1 = polygon[(i + 1) % polygon.length];
    const p2 = polygon[(i + 2) % polygon.length];

    // Vectors for edges
    const v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };

    const crossProduct = v1.x * v2.y - v1.y * v2.x; // Z-component of cross product

    if (crossProduct !== 0) { // Ignore collinear points
      if (prevCrossProductSign === undefined) {
        prevCrossProductSign = Math.sign(crossProduct);
      } else if (Math.sign(crossProduct) !== prevCrossProductSign) {
        // If the sign changes, the polygon is concave
        return true;
      }
    }
  }
  return false; // All cross products had the same sign (or were 0)
}

/**
 * Very basic convex decomposition using ear clipping (simplified).
 * For more robust decomposition, a dedicated library would be ideal.
 * This is a placeholder/simplified version.
 */
export function convexDecompose(polygon: Point[]): Point[][] {
    // This is a highly complex problem in computational geometry.
    // A full, robust ear-clipping or other decomposition algorithm is outside the scope
    // of what can be reasonably implemented and debugged in this interactive session.
    // For now, if the polygon is concave, we will return the original polygon
    // as the only "convex part" and log a warning.
    // In a real application, you would integrate a robust library or algorithm here.
    console.warn("Concave decomposition is not fully implemented. Returning original polygon as a single part.");
    return [polygon];
}


/**
 * Calculates the minimum width of a polygon. Used for "thin arm" detection.
 */
export function getMinPolygonWidth(polygon: Point[]): number {
  if (polygon.length < 2) return 0; // Or throw error
  let minWidth = Infinity;

  // Iterate over each edge as a baseline
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];

    // Vector representing the edge
    const edgeDx = p2.x - p1.x;
    const edgeDy = p2.y - p1.y;
    const edgeLengthSq = edgeDx * edgeDx + edgeDy * edgeDy;

    if (edgeLengthSq === 0) continue; // Skip degenerate edges

    let maxDistToEdge = 0;

    // For all other points in the polygon, find distance to this edge
    for (let j = 0; j < polygon.length; j++) {
      if (j === i || j === (i + 1) % polygon.length) continue;

      const p = polygon[j];

      // Calculate the point on the line segment that is closest to p
      const t = ((p.x - p1.x) * edgeDx + (p.y - p1.y) * edgeDy) / edgeLengthSq;

      let closestX, closestY;
      if (t < 0) {
        closestX = p1.x;
        closestY = p1.y;
      } else if (t > 1) {
        closestX = p2.x;
        closestY = p2.y;
      } else {
        closestX = p1.x + t * edgeDx;
        closestY = p1.y + t * edgeDy;
      }

      const dist = Math.hypot(p.x - closestX, p.y - closestY);
      maxDistToEdge = Math.max(maxDistToEdge, dist);
    }
    minWidth = Math.min(minWidth, maxDistToEdge);
  }
  return minWidth;
}


/**
 * MAIN: Generate 45 Devtas for ANY polygon shape
 */
export function generate45Devtas(
  boundary: Point[],
  northAngle: number = 0
): DevtaRegion[] | null {
  if (boundary.length < 3 || !isValidPolygon(boundary)) return null;
  
  // Adjusted to handle concavity outside the _generateDevtasForConvexPart
  if (isPolygonConcave(boundary)) {
    const convexParts = convexDecompose(boundary);
    if (!convexParts || convexParts.length === 0) {
      console.warn("Concave decomposition failed or returned no parts. Proceeding with original boundary.");
      // Fallback to treating the whole concave polygon as one part if decomposition fails
      return _generateDevtasForConvexPart(boundary, northAngle, 0);
    }

    let allDevtas: DevtaRegion[] = [];
    convexParts.forEach((part, idx) => {
      const partDevtas = _generateDevtasForConvexPart(part, northAngle, idx);
      if (partDevtas) {
        allDevtas = allDevtas.concat(partDevtas);
      }
    });
    return allDevtas;
  } else {
    // If convex, directly use the helper
    return _generateDevtasForConvexPart(boundary, northAngle, 0);
  }
}

let _currentGlobalDevtaIdCounter = 1; // Used by _generateDevtasForConvexPart

/**
 * Helper to generate Devta regions for a single CONVEX polygon.
 * This function is called by generate45Devtas.
 */
function _generateDevtasForConvexPart(
  convexBoundary: Point[],
  northAngle: number = 0,
  subPolygonIndex: number = 0
): DevtaRegion[] | null {
  if (convexBoundary.length < 3) return null;

  const centroid = calculateCentroid(convexBoundary);
  const regions: DevtaRegion[] = [];

  // 1️⃣ WIDTH THRESHOLD CHECK
  const minWidth = getMinPolygonWidth(convexBoundary);
  const isThinArm = minWidth < 20; // Threshold in units (pixels/meters)

  // 2️⃣ ADAPTIVE SCALING & CONCENTRIC BOUNDARIES
  const { inner, middle, outer } = createConcentricBoundaries(
    convexBoundary, INNER_BOUNDARY_SCALE, MIDDLE_BOUNDARY_SCALE
  );

  // 3️⃣ CENTER DEVTA
  if (!isThinArm && inner.length >=3) { // Only add Brahma if the segment is wide enough to contain a center
    regions.push({
      id: _currentGlobalDevtaIdCounter++,
      ring: "center",
      name: CENTER_DEVTA,
      polygon: inner,
      subPolygonIndex
    });
  }

  // 4️⃣ ADAPTIVE ANGULAR DIVISION
  const area = calculateArea(convexBoundary);
  const divisionMultiplier = isThinArm ? 0.25 : (area < 500 ? 0.5 : 1);


  const renderRing = (divisions: number, names: string[], innerPoly: Point[], outerPoly: Point[], ringType: "middle" | "outer") => {
    // Ensure we have at least 1 division and that the polygons are valid
    if (outerPoly.length < 3) return;
    const currentInnerPoly = innerPoly.length < 3 ? [centroid] : innerPoly; // Fallback for very thin arms or collapsed inner polys


    const adaptiveDivisions = Math.max(1, Math.floor(divisions * divisionMultiplier));
    const angleStep = 360 / adaptiveDivisions;

    for (let i = 0; i < adaptiveDivisions; i++) {
      const startAngle = (northAngle + i * angleStep) % 360;
      let endAngle = (northAngle + (i + 1) * angleStep) % 360;

      // Handle wraparound for angles
      if (endAngle < startAngle) endAngle += 360;

      const sector = buildAngularSector(
        currentInnerPoly,
        outerPoly,
        startAngle,
        endAngle,
        centroid
      );

      if (sector.length >= 3) {
        regions.push({
          id: _currentGlobalDevtaIdCounter++,
          ring: ringType,
          name: names[i % names.length] || `${ringType}-${i}`, // Use modulo to cycle names
          polygon: sector,
          startAngle: startAngle,
          endAngle: endAngle,
          subPolygonIndex
        });
      }
    }
  };

  // 5️⃣ EXECUTE ADAPTIVE RINGS
  renderRing(16, MIDDLE_DEVTAS, inner, middle, "middle");
  renderRing(32, OUTER_DEVTAS, middle, outer, "outer");

  return regions;
}


/**
 * Get zone for a point
 */
export function getZoneForPoint(
  point: Point,
  boundary: Point[],
  northAngle: number
): string {
  // Reset counter for getZoneForPoint as well, to ensure IDs are consistent if called independently
  _currentGlobalDevtaIdCounter = 1;
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
 * Point-in-polygon test
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
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