import { Polygon } from '../geometry/mandala';
import * as martinez from 'martinez-polygon-clipping';

// Martinez format for a single polygon is an array of rings.
// The first ring is the outer boundary, subsequent rings are holes.
// We are dealing with simple polygons, so we'll only have one ring.
type MartinezPolygon = Array<[number, number]>; 

// Martinez format for a subject or clipping polygon can be a MultiPolygon.
type MartinezSubject = Array<MartinezPolygon>;

// The result of an intersection can be a MultiPolygon, which is what martinez.intersection returns.
// The type from the library is `martinez.MultiPolygon`, which is `number[][][] | number[][][][]`.
// The intersection function returns `martinez.multiPolygon()`, which is `number[][][]`.
// This corresponds to `Array<MartinezPolygon>`.

/**
 * Converts our internal Polygon format to the format required by the Martinez library.
 * Our Polygon is an array of points {x, y}.
 * Martinez expects an array of rings, where each ring is an array of [x, y] pairs.
 * For a simple polygon, this will be [[ [x1, y1], [x2, y2], ... ]].
 * @param polygon - A polygon in our internal format.
 * @returns A polygon in Martinez format.
 */
function toMartinez(polygon: Polygon): MartinezSubject {
  const ring: MartinezPolygon = polygon.map(p => [p.x, p.y]);
  // Martinez requires the polygon to be closed (first and last points are the same).
  // Let's ensure that, but check first if it's already closed.
  if (ring.length > 0) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
          ring.push(first);
      }
  }
  return [ring];
}

/**
 * Converts a polygon from the Martinez library format back to our internal format.
 * @param martinezPolygon - A single polygon ring from Martinez.
 * @returns A polygon in our internal format.
 */
function fromMartinez(martinezPolygon: MartinezPolygon): Polygon {
    // We can remove the last point if it's a duplicate of the first, to keep our format clean.
    if(martinezPolygon.length > 1) {
        const first = martinezPolygon[0];
        const last = martinezPolygon[martinezPolygon.length - 1];
        if (first[0] === last[0] && first[1] === last[1]) {
            martinezPolygon.pop();
        }
    }
  return martinezPolygon.map(p => ({ x: p[0], y: p[1] }));
}

/**
 * Clips a subject polygon against a clipping polygon, returning the intersection.
 * This function can handle complex cases where the intersection results in multiple,
 * disjoint polygons.
 *
 * @param subject - The polygon to be clipped (e.g., a Devta polygon).
 * @param clipper - The polygon to clip against (e.g., the plot boundary).
 * @returns An array of polygons representing the intersected area. Returns an empty array if there is no intersection.
 */
export function clip(subject: Polygon, clipper: Polygon): Polygon[] {
  if (!subject || subject.length < 3 || !clipper || clipper.length < 3) {
    return [];
  }

  const subjectMartinez = toMartinez(subject);
  const clipperMartinez = toMartinez(clipper);

  try {
    const intersectionResult = martinez.intersection(subjectMartinez, clipperMartinez);
    
    if (!intersectionResult || intersectionResult.length === 0) {
      return [];
    }

    // The result is a MultiPolygon, where each sub-array is a polygon.
    return intersectionResult.map(fromMartinez);
  } catch (e) {
    console.error("Polygon clipping error:", e);
    // In case of a topology error in the clipping library, return an empty array.
    return [];
  }
}