import {
  calculateCentroid,
  scalePolygon,
  buildAngularSector,
  pointInPolygon,
  calculateAngularMass,
  redistributeZones,
} from "../geometry";
import type { Point } from "../geometry";
import {
  BRAHMA_DEVTA_NAME,
  MIDDLE_RING_DEVTA_NAMES,
  OUTER_RING_DEVTA_NAMES,
} from "../vastu";
import { MIDDLE_BOUNDARY_SCALE, INNER_BOUNDARY_SCALE } from '../floorPlanConstants';

export function getZoneForPoint(
  point: Point,
  boundary: Point[],
  northAngle: number
): string {
  const devtas = generate45Devtas(boundary, northAngle);
  if (!devtas) return "Unknown";
  
  for (const devta of devtas) {
    if (pointInPolygon(point, devta.polygon)) {
      return devta.name;
    }
  }
  
  return "Outside";
}


export function generate45Devtas(
  boundary: Point[],
  northAngle: number = 0
): DevtaRegion[] {
  const centroid = calculateCentroid(boundary);

  const middleRingBoundary = scalePolygon(boundary, centroid, MIDDLE_BOUNDARY_SCALE);
  const innerRingBoundary = scalePolygon(boundary, centroid, INNER_BOUNDARY_SCALE);

  const devtas: DevtaRegion[] = [];
  let devtaId = 1;

  // Brahma
  devtas.push({
    id: devtaId++,
    name: BRAHMA_DEVTA_NAME,
    polygon: innerRingBoundary,
    ring: "center",
  });

  const angularMass = calculateAngularMass(boundary, centroid);
  
  const middleRingZones = redistributeZones(angularMass, 12, northAngle);
  for (let i = 0; i < 12; i++) {
    const zone = middleRingZones[i];
    const sector = buildAngularSector(
      innerRingBoundary,
      middleRingBoundary,
      zone.startAngle,
      zone.endAngle,
      centroid
    );
    devtas.push({
      id: devtaId++,
      name: MIDDLE_RING_DEVTA_NAMES[i] || `Middle ${i + 1}`,
      polygon: sector,
      ring: "middle",
    });
  }

  const outerRingZones = redistributeZones(angularMass, 32, northAngle);
  for (let i = 0; i < 32; i++) {
    const zone = outerRingZones[i];
    const sector = buildAngularSector(
      middleRingBoundary,
      boundary,
      zone.startAngle,
      zone.endAngle,
      centroid
    );
    devtas.push({
      id: devtaId++,
      name: OUTER_RING_DEVTA_NAMES[i] || `Outer ${i + 1}`,
      polygon: sector,
      ring: "outer",
    });
  }

  return devtas;
}

export type { Point, DevtaRegion };