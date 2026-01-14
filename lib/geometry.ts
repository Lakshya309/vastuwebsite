// lib/geometry.ts
// Pure geometric computations.

export interface Point {
  x: number;
  y: number;
}

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
  
  // The area is signed, we need absolute value for robust handling
  area *= 0.5;

  // Handle cases where area is zero (e.g., collinear points)
  if (Math.abs(area) < 1e-10) {
    // For a line or point, the centroid is the average of the points
    let avgX = 0;
    let avgY = 0;
    for(const p of polygon) {
      avgX += p.x;
      avgY += p.y;
    }
    return {x: avgX / polygon.length, y: avgY / polygon.length};
  }

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
 * Check if a point is inside a polygon using ray casting
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