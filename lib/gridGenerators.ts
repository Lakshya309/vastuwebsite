// lib/gridGenerators.ts
import { Point } from "./floorPlanInterfaces";
import { getCentroid, rayIntersect, normalizeAngle } from "./gridUtils";

interface ZoneRegion {
  name: string;
  polygon: Point[];
}

const ZONE_NAMES_16 = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
];

const ZONE_NAMES_8 = [
  "N", "NE", "E", "SE", "S", "SW", "W", "NW"
];

/**
 * Creates an angular wedge (a sector of the polygon).
 * @param polygon The outer boundary.
 * @param center The center point for the wedges.
 * @param angle1 The starting angle in degrees.
 * @param angle2 The ending angle in degrees.
 * @returns A polygon representing the wedge.
 */
function angularWedge(polygon: Point[], center: Point, angle1: number, angle2: number): Point[] {
  const points: Point[] = [center];
  const steps = 20; // Number of rays to cast for a smooth curve
  const angleStep = (angle2 - angle1) / steps;

  for (let i = 0; i <= steps; i++) {
    const angle = angle1 + i * angleStep;
    const intersection = rayIntersect(center, angle, polygon);
    if (intersection) {
      points.push(intersection);
    }
  }

  return points;
}

function generateZones(
  boundary: Point[],
  northDirection: number,
  zoneNames: string[]
): ZoneRegion[] {
  if (boundary.length < 3) return [];

  const center = getCentroid(boundary);
  const zones: ZoneRegion[] = [];
  const step = 360 / zoneNames.length;

  // North zone is centered at northDirection (-step/2 to +step/2)
  const initialAngle = northDirection - step / 2;

  for (let i = 0; i < zoneNames.length; i++) {
    const startAngle = normalizeAngle(initialAngle + i * step);
    const endAngle = normalizeAngle(startAngle + step);
    
    // Handle the wrap-around case for angles
    let wedge;
    if (endAngle < startAngle) {
       const wedge1 = angularWedge(boundary, center, startAngle, 360);
       const wedge2 = angularWedge(boundary, center, 0, endAngle);
       wedge = [...wedge1, ...wedge2.slice(1)];
    } else {
       wedge = angularWedge(boundary, center, startAngle, endAngle);
    }

    if (wedge.length > 2) {
      zones.push({
        name: zoneNames[i],
        polygon: wedge,
      });
    }
  }

  return zones;
}

export function generate16Zones(
  boundary: Point[],
  northDirection: number
): ZoneRegion[] {
    return generateZones(boundary, northDirection, ZONE_NAMES_16);
}

export function generate8Directions(
  boundary: Point[],
  northDirection: number
): ZoneRegion[] {
    return generateZones(boundary, northDirection, ZONE_NAMES_8);
}
