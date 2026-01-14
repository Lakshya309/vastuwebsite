// lib/vastu/objectAnalysis.ts
import { Point, pointInPolygon } from '../geometry';
import { DevtaRegion } from './devtaAnalysis';
import { MarmaPoint } from './marmaAnalysis';

export interface ObjectAnalysisResult {
  devtaName: string;
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
 * @param objectCentroid The center point of the object to analyze.
 * @param devtas An array of all Devta regions.
 * @param marmas An array of all Marma points.
 * @param boundary The main boundary of the plot, for threshold calculation.
 * @returns An analysis result object containing the Devta name and closest Marma info.
 */
export function analyzeObjectPlacement(
  objectCentroid: Point,
  devtas: DevtaRegion[],
  marmas: MarmaPoint[],
  boundary: Point[]
): ObjectAnalysisResult {
  // 1. Find which Devta the object's centroid falls into
  let devtaName = 'Outside Plot';
  for (const devta of devtas) {
    if (pointInPolygon(objectCentroid, devta.polygon)) {
      devtaName = devta.name;
      break;
    }
  }

  // 2. Find the closest Marma point to the object's centroid
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

  // 3. Check if the closest Marma is within the influence threshold
  const threshold = getMarmaThreshold(boundary);
  if (closestMarma && minDistance <= threshold) {
    return {
      devtaName: devtaName,
      marmaDistance: minDistance,
      marmaStrength: closestMarma.strength,
      closestMarma: closestMarma,
    };
  }

  // If no Marma is close enough, return null for Marma-related fields
  return {
    devtaName: devtaName,
    marmaDistance: null,
    marmaStrength: null,
    closestMarma: null,
  };
}