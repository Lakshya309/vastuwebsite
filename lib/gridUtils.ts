// lib/gridUtils.ts
// Assuming basic geometry utility functions are needed here.
// Placeholder implementations to satisfy type checks.

import { Point } from "./floorPlanInterfaces"; // Assuming Point is defined here

export function getCentroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

// Placeholder for rayIntersect. Actual implementation would be complex.
// Corrected signature based on usage in lib/gridGenerators.ts: rayIntersect(center, angle, polygon)
export function rayIntersect(center: Point, angle: number, polygon: Point[]): Point | null {
  // This is a minimal placeholder. Actual geometry logic would go here.
  // Returns the intersection point of a ray from 'center' at 'angle' with 'polygon'.
  // Returns null if no intersection.
  return null;
}

export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

// Placeholder for isPointInPolygon
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  // This is a minimal placeholder. Actual geometry logic would go here.
  // Returns true if the point is inside the polygon
  return false;
}

// Add other utility functions previously in this file if known