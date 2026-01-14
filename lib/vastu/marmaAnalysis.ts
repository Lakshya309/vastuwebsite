// lib/vastu/marmaAnalysis.ts
import { Point, calculateCentroid, scalePolygon, rayPolygonIntersection } from '../geometry';
import { INNER_BOUNDARY_SCALE, MIDDLE_BOUNDARY_SCALE } from './devtaAnalysis';

/**
 * A MarmaPoint represents a sensitive energy junction point in the Vastu grid.
 */
export interface MarmaPoint {
  id: string; // e.g., "primary-45-outer"
  angleDeg: number;
  point: Point;
  ring: "inner" | "middle" | "outer";
  strength: "high" | "medium" | "low";
}

// Define the angular divisions for each Marma category
const MARMA_ANGLES = {
  primary: Array.from({ length: 8 }, (_, i) => i * 45),    // 8 divisions (0, 45, 90, ...)
  secondary: Array.from({ length: 16 }, (_, i) => i * 22.5), // 16 divisions (0, 22.5, 45, ...)
  tertiary: Array.from({ length: 32 }, (_, i) => i * 11.25), // 32 divisions (0, 11.25, 22.5, ...)
};

type MarmaCategory = keyof typeof MARMA_ANGLES;

/**
 * Generates all Marma points by finding intersections of angular rays 
 * with concentric boundary rings.
 *
 * @param boundary The main floor plan boundary polygon.
 * @param northDirection The angle of North in degrees (0° = top, clockwise).
 * @returns An array of all calculated MarmaPoint objects.
 */
export function generateMarmaPoints(
  boundary: Point[],
  northDirection: number
): MarmaPoint[] {
  if (boundary.length < 3) {
    return [];
  }

  const brahmasthan = calculateCentroid(boundary);
  const marmaPoints: MarmaPoint[] = [];

  // Define the three concentric boundaries based on scaling factors
  const boundaries = {
    outer: boundary,
    middle: scalePolygon(boundary, brahmasthan, MIDDLE_BOUNDARY_SCALE),
    inner: scalePolygon(boundary, brahmasthan, INNER_BOUNDARY_SCALE),
  };

  const ringStrengths: Record<keyof typeof boundaries, MarmaPoint['strength']> = {
    inner: "high",
    middle: "medium",
    outer: "low",
  };

  // Iterate through each category of Marmas (primary, secondary, tertiary)
  for (const category in MARMA_ANGLES) {
    const angles = MARMA_ANGLES[category as MarmaCategory];

    // For each angle in the category, find intersections on all 3 rings
    for (const angle of angles) {
      // Correct the angle with the north direction offset
      const correctedAngle = (angle + northDirection) % 360;

      for (const ringName in boundaries) {
        const ring = ringName as keyof typeof boundaries;
        const ringPolygon = boundaries[ring];

        // Find the intersection point of the ray with the current ring's polygon
        const intersectionPoint = rayPolygonIntersection(
          correctedAngle,
          ringPolygon,
          brahmasthan
        );

        if (intersectionPoint) {
          // If an intersection is found, create a new MarmaPoint
          marmaPoints.push({
            id: `${category}-${angle}-${ring}`,
            angleDeg: angle, // Store the base angle, not the corrected one
            point: intersectionPoint,
            ring: ring,
            strength: ringStrengths[ring],
          });
        }
      }
    }
  }

  // Deduplicate points. Multiple categories can generate points at the same angle (e.g., 45° is in all 3).
  // We can decide on a precedence, e.g., primary > secondary > tertiary, but for now, we just filter them.
  // A simple way is to create a Set of unique identifiers, for example, angle+ring.
  const uniquePoints = new Map<string, MarmaPoint>();
  marmaPoints.forEach(p => {
    const key = `${p.angleDeg}-${p.ring}`;
    // This will implicitly keep the last one seen, which is fine for this purpose.
    // Or, we could add logic to keep the one with the highest "rank" (primary).
    uniquePoints.set(key, p);
  });

  return Array.from(uniquePoints.values());
}