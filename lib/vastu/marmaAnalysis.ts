import { Point, rotatePoint } from '../coordinates';
import { DevtaAnalysisResult } from './devtaAnalysis';

// #region Types
export interface MarmaPoint {
  id: string; // e.g., "middle-22.5-deg"
  point: Point;
}

export interface ClosestMarmaResult {
  closestMarma: MarmaPoint;
  distance: number;
}
// #endregion

// #region Private Helper
/**
 * Generates the set of unique Marma points on the canonical Mandala grid.
 * Marma points are the vertices of the Devta polygons before transformation.
 * This function is kept private as consumers should use the transformed points.
 */
function getCanonicalMarmaPoints(): Point[] {
  const points = new Map<string, Point>();
  
  const MANDALA_SIZE = 100;
  const HALF_SIZE = MANDALA_SIZE / 2;
  const BRAHMA_BOUNDARY_HALF_SIZE = HALF_SIZE / 2; // 25
  const MIDDLE_BOUNDARY_HALF_SIZE = HALF_SIZE * 0.75; // 37.5
  
  const boundaries = [BRAHMA_BOUNDARY_HALF_SIZE, MIDDLE_BOUNDARY_HALF_SIZE, HALF_SIZE];
  
  // Angles for the 32 divisions of the outer ring
  const outerAngleStep = 11.25;
  
  for (let i = 0; i < 32; i++) {
    const angle = -outerAngleStep / 2 + i * outerAngleStep;
    for (const boundary of boundaries) {
      // We can reuse the intersection logic from mandala.ts in a generalized way
      const angleRad = (angle - 90) * Math.PI / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      const t_x = boundary / Math.abs(cos);
      const t_y = boundary / Math.abs(sin);
      const t = Math.min(t_x, t_y);
      const point = { x: t * cos, y: t * sin };
      
      // Use a key to ensure uniqueness and avoid floating point issues
      const key = `${point.x.toFixed(5)},${point.y.toFixed(5)}`;
      if (!points.has(key)) {
        points.set(key, point);
      }
    }
  }
  
  return Array.from(points.values());
}
// #endregion

/**
 * Generates and transforms the Marma points based on the plot analysis.
 *
 * @param analysisResult - The result from a `analyzePlot` call, containing the transformation.
 * @returns An array of MarmaPoint objects with their final positions on the plot.
 */
export function generateTransformedMarmaPoints(analysisResult: DevtaAnalysisResult): MarmaPoint[] {
  const canonicalPoints = getCanonicalMarmaPoints();
  const { scale, translation, northAngle } = analysisResult.transform;
  const center: Point = { x: 0, y: 0 };

  return canonicalPoints.map((p, index) => {
    // 1. Rotate
    const rotatedP = rotatePoint(p, center, -northAngle);
    // 2. Scale and Translate
    const transformedP = {
      x: rotatedP.x * scale + translation.x,
      y: rotatedP.y * scale + translation.y,
    };
    return {
      id: `marma-${index}`,
      point: transformedP,
    };
  });
}

/**
 * Finds the closest Marma point to a given object's location and the distance to it.
 * This helps evaluate the influence of sensitive Marma points on objects.
 *
 * @param objectPoint - The location of the object to evaluate.
 * @param transformedMarmaPoints - The array of Marma points from `generateTransformedMarmaPoints`.
 * @returns An object containing the closest Marma point and the distance, or null if no points are provided.
 */
export function findClosestMarma(
  objectPoint: Point,
  transformedMarmaPoints: MarmaPoint[]
): ClosestMarmaResult | null {
  if (transformedMarmaPoints.length === 0) {
    return null;
  }

  let closestMarma: MarmaPoint = transformedMarmaPoints[0];
  let minDistance = Infinity;

  for (const marmaPoint of transformedMarmaPoints) {
    const dx = objectPoint.x - marmaPoint.point.x;
    const dy = objectPoint.y - marmaPoint.point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      closestMarma = marmaPoint;
    }
  }

  return {
    closestMarma,
    distance: minDistance,
  };
}