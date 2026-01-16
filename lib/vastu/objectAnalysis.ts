// lib/vastu/objectAnalysis.ts
import { Point, calculateCentroid } from '../geometry'; // Import calculateCentroid from geometry
import { DevtaAnalysisResult, getDevtaForObject } from './devtaAnalysis';
import { MarmaPoint, generateTransformedMarmaPoints, findClosestMarma } from './marmaAnalysis';
import { vastuRules } from './vastuRules';

export interface IncorrectPoint {
  point: Point;
  devtaName: string;
}

export interface ObjectAnalysisResult {
  devtaName: string | null; // Can be null if outside any devta
  marmaDistance: number | null;
  closestMarma: MarmaPoint | null;
  incorrectPoints: IncorrectPoint[];
}

/**
 * A reasonable threshold for considering a Marma point influential.
 * This is set to 7.5% of the larger dimension (width or height) of the plot's bounding box.
 * This is an assumption to prevent distant marmas from affecting an object.
 */
function getMarmaThreshold(devtaAnalysisResult: DevtaAnalysisResult): number {
  // The mandala is initially 100x100, and 'scale' tells us how much it was scaled up.
  // So, scaled width/height of the original mandala is 100 * scale.
  const scaledMandalaDim = 100 * devtaAnalysisResult.transform.scale;
  return scaledMandalaDim * 0.075;
}

/**
 * Analyzes the placement of an object within the Vastu grid.
 *
 * @param objectPolygon The polygon of the object to analyze.
 * @param objectType The type of the object (e.g., "Bedroom").
 * @param devtaAnalysisResult The result from a `analyzePlot` call, containing clipped devtas and transformation.
 * @returns An analysis result object containing the Devta name and closest Marma info.
 */
export function analyzeObjectPlacement(
  objectPolygon: Point[],
  objectType: string,
  devtaAnalysisResult: DevtaAnalysisResult,
): ObjectAnalysisResult {
  // 1. Find which Devta the object's centroid falls into
  const objectCentroid = calculateCentroid(objectPolygon);
  const devtaName = getDevtaForObject(objectCentroid, devtaAnalysisResult);

  // 2. Find the closest Marma point to the object's centroid
  const transformedMarmaPoints = generateTransformedMarmaPoints(devtaAnalysisResult);
  const closestMarmaResult = findClosestMarma(objectCentroid, transformedMarmaPoints);

  // 3. Analyze each point of the object's polygon for correctness based on vastuRules
  const incorrectPoints: IncorrectPoint[] = [];
  const rule = Object.values(vastuRules).find(r => r.optimal.includes(objectType) || r.avoid.includes(objectType));

  if (rule) {
    for (const point of objectPolygon) {
      const pointDevtaName = getDevtaForObject(point, devtaAnalysisResult);
      if (pointDevtaName && rule.avoid.includes(pointDevtaName)) {
        incorrectPoints.push({ point, devtaName: pointDevtaName });
      }
    }
  }

  // 4. Check if the closest Marma is within the influence threshold
  const marmaThreshold = getMarmaThreshold(devtaAnalysisResult);
  let marmaDistance: number | null = null;
  let closestMarma: MarmaPoint | null = null;

  if (closestMarmaResult && closestMarmaResult.distance <= marmaThreshold) {
    marmaDistance = closestMarmaResult.distance;
    closestMarma = closestMarmaResult.closestMarma;
  }

  return {
    devtaName: devtaName,
    marmaDistance: marmaDistance,
    closestMarma: closestMarma,
    incorrectPoints: incorrectPoints,
  };
}