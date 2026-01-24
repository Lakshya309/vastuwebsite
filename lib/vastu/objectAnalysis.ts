// lib/vastu/objectAnalysis.ts
import { Point, pointInPolygon, calculateCentroid } from '../geometry';
import { MarmaPoint } from './marmaAnalysis';

export interface ObjectAnalysisResult {
  marmaDistance: number | null;
  marmaStrength: MarmaPoint['strength'] | null;
  closestMarma: MarmaPoint | null;
}

/**
 * A reasonable threshold for considering a Marma point influential.
 * This is set to 7.5% of the larger dimension (width or height) of the plot.
 * This is an assumption to prevent distant marmas from affecting an object.
 * (e.g., for a 100-unit wide plot, the threshold is 7.5 units).
 */
function getMarmaThreshold(boundary: Point[]): number {
    if (boundary.length === 0) return 5; // Default fallback
    const xs = boundary.map(p => p.x);
    const ys = boundary.map(p => p.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    return Math.max(width, height) * 0.075;
}

/**
 * Analyzes the placement of an object within the Vastu grid.
 *
 * @param objectPolygon The polygon of the object to analyze.
 * @param objectType The type of the object (e.g., "Bedroom").
 * @param marmas An array of all Marma points.
 * @param boundary The main boundary of the plot, for threshold calculation.
 * @returns An analysis result object containing the closest Marma info.
 */
export function analyzeObjectPlacement(
  objectPolygon: Point[],
  objectType: string,
  marmas: MarmaPoint[],
  boundary: Point[],
  northAngle: number
): ObjectAnalysisResult {
  // 1. Find the closest Marma point to the object's centroid
  const objectCentroid = objectPolygon.reduce((acc, p) => ({ x: acc.x + p.x / objectPolygon.length, y: acc.y + p.y / objectPolygon.length }), { x: 0, y: 0 });
  let closestMarma: MarmaPoint | null = null;
  let minDistance = Infinity;

  for (const marma of marmas) {
    const distance = Math.hypot(
      objectCentroid.x - marma.point.x,
      objectCentroid.y - marma.point.y
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestMarma = marma;
    }
  }

  // 2. Check if the closest Marma is within the influence threshold
  const threshold = getMarmaThreshold(boundary);
  if (closestMarma && minDistance <= threshold) {
    return {
      marmaDistance: minDistance,
      marmaStrength: closestMarma.strength,
      closestMarma: closestMarma,
    };
  }

  // If no Marma is close enough, return null for Marma-related fields
  return {
    marmaDistance: null,
    marmaStrength: null,
    closestMarma: null,
  };
}