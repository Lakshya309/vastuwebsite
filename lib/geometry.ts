import * as martinez from 'martinez-polygon-clipping';

// lib/geometry.ts
// Pure geometric computations.

export interface Point {
  x: number;
  y: number;
}
// ... (rest of the file is the same)


/**
 * Calculate the centroid (geometric center) of a polygon
 */
export function calculateCentroid(polygon: Point[]): Point {
  if (!polygon || polygon.length === 0) return { x: 0, y: 0 };
  
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

/**
 * Measures the "mass" of a polygon at different angles from its centroid.
 * @param polygon The polygon to measure.
 * @param centroid The centroid of the polygon.
 * @param samples The number of angles to sample (e.g., 360 for 1-degree increments).
 * @returns An array of distances (mass) for each angle.
 */
export function calculateAngularMass(
  polygon: Point[],
  centroid: Point,
  samples: number = 360
): number[] {
  const angularMass: number[] = [];
  const angleStep = 360 / samples;

  for (let i = 0; i < samples; i++) {
    const angle = i * angleStep;
    const intersection = rayPolygonIntersection(angle, polygon, centroid);
    if (intersection) {
      const distance = Math.hypot(intersection.x - centroid.x, intersection.y - centroid.y);
      angularMass.push(distance);
    } else {
      angularMass.push(0);
    }
  }

  return angularMass;
}

/**
 * Redistributes zones based on the angular mass of a polygon.
 * @param angularMass An array of distances (mass) for each angle.
 * @param numZones The number of zones to create.
 * @param northAngle The angle of North in degrees.
 * @returns An array of start and end angles for each zone.
 */
export function redistributeZones(
  angularMass: number[],
  numZones: number,
  northAngle: number = 0
): { startAngle: number; endAngle: number }[] {
  const totalMass = angularMass.reduce((sum, mass) => sum + mass, 0);
  if (totalMass === 0) {
    // If there's no mass, return equal zones (fallback)
    const angleStep = 360 / numZones;
    return Array.from({ length: numZones }, (_, i) => ({
      startAngle: (northAngle + i * angleStep) % 360,
      endAngle: (northAngle + (i + 1) * angleStep) % 360,
    }));
  }

  const massPerZone = totalMass / numZones;
  const zones: { startAngle: number; endAngle: number }[] = [];
  let currentMass = 0;
  let zoneStartAngle = northAngle;

  const samples = angularMass.length;
  const angleStep = 360 / samples;
  
  // Rotate the mass array to align with the north direction
  const northIndex = Math.round(northAngle / angleStep) % samples;
  const rotatedMass = [...angularMass.slice(northIndex), ...angularMass.slice(0, northIndex)];

  for (let i = 0; i < samples; i++) {
    currentMass += rotatedMass[i];
    while (currentMass >= massPerZone && zones.length < numZones - 1) {
      const overshoot = currentMass - massPerZone;
      const angleCorrection = (overshoot / rotatedMass[i]) * angleStep;
      const zoneEndAngle = (northAngle + (i + 1) * angleStep - angleCorrection) % 360;
      
      zones.push({ startAngle: zoneStartAngle, endAngle: zoneEndAngle });
      zoneStartAngle = zoneEndAngle;
      currentMass -= massPerZone;
    }
  }

  // Add the last zone, which ends at the north angle
  zones.push({ startAngle: zoneStartAngle, endAngle: northAngle });

  return zones;
}

/**
 * Calculates the axis-aligned bounding box of a polygon.
 * @param polygon The polygon to measure.
 * @returns An object with the min and max points of the bounding box.
 */

export function getAABB(polygon: Point[]): { min: Point; max: Point } {
    if (!polygon || polygon.length === 0) {
        return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of polygon) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }

    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}


import { Polygon } from 'martinez-polygon-clipping';

type Position = [number, number];
type Ring = Position[];

export function slicePolygon(polygon: Point[], axis: 'x' | 'y', value: number): Point[][] {
    if (!polygon || polygon.length === 0) {
        return [];
    }
    const aabb = getAABB(polygon);
    
    const geoJsonPolygon: Polygon = [polygon.map(p => [p.x, p.y])];
    
    const line: Polygon =
        axis === 'x'
            ? [[[value, aabb.min.y - 1], [value, aabb.max.y + 1]]]
            : [[[aabb.min.x - 1, value], [aabb.max.x + 1, value]]];

    const clipped = martinez.intersection(geoJsonPolygon, line);

    if (!clipped || clipped.length === 0) {
        return [];
    }

    const result: Point[][] = [];
    for (const multiPolygon of clipped) {
        const poly: Point[] = [];
        for (const ring of multiPolygon) {
            for (const pos of ring) {
                poly.push({ x: pos[0], y: pos[1] });
            }
        }
        result.push(poly);
    }

    return result;
}

/**
 * Creates a rectangle polygon.
 * @param x The x-coordinate of the top-left corner.
 * @param y The y-coordinate of the top-left corner.
 * @param width The width of the rectangle.
 * @param height The height of the rectangle.
 * @returns A polygon representing the rectangle.
 */
export function createRectangle(x: number, y: number, width: number, height: number): Point[] {
    return [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
    ];
}
