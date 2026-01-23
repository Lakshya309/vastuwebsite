import * as martinez from "martinez-polygon-clipping";
import {
  createRectangle,
  getAABB,
  calculateCentroid,
  calculateAngularMass,
  redistributeZones,
  buildAngularSector,
  pointInPolygon,
} from "../geometry";
import type { Point } from "../geometry";
import type { DevtaRegion } from "../floorPlanInterfaces";
import {
  BRAHMA_DEVTA_NAME,
  MIDDLE_RING_DEVTA_NAMES,
  OUTER_RING_DEVTA_NAMES,
} from "../vastu";

// Helper to convert Point[] to Martinez GeoJSON format
function toGeoJSON(polygon: Point[]): martinez.Polygon {
  return [polygon.map((p) => [p.x, p.y])];
}

// Helper to convert Martinez GeoJSON format to Point[][]
function fromGeoJSON(geoJson: martinez.MultiPolygon | null): Point[][] {
  const polygons: Point[][] = [];
  if (geoJson) {
    for (const polygon of geoJson) {
      const points: Point[] = [];
      const exteriorRing = polygon[0];
      if (exteriorRing) {
        for (const pos of exteriorRing) {
          points.push({ x: pos[0], y: pos[1] });
        }
        polygons.push(points);
      }
    }
  }
  return polygons;
}

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
  if (!boundary || boundary.length === 0) {
    return [];
  }

  const aabb = getAABB(boundary);
  const width = aabb.max.x - aabb.min.x;
  const height = aabb.max.y - aabb.min.y;

  const devtas: DevtaRegion[] = [];
  let devtaId = 1;

  // Define the bands as clipping boxes
  const innerBox = createRectangle(
    aabb.min.x + width / 3,
    aabb.min.y + height / 3,
    width / 3,
    height / 3
  );
  const middleBox = createRectangle(
    aabb.min.x + width / 6,
    aabb.min.y + height / 6,
    width * (2 / 3),
    height * (2 / 3)
  );

  const boundaryGeoJSON = toGeoJSON(boundary);
  const innerBoxGeoJSON = toGeoJSON(innerBox);
  const middleBoxGeoJSON = toGeoJSON(middleBox);

  const innerBandPolygons = fromGeoJSON(
    martinez.intersection(boundaryGeoJSON, innerBoxGeoJSON)
  );
  const innerBand = innerBandPolygons[0] || [];

  const middleAreaGeoJSON = martinez.intersection(
    boundaryGeoJSON,
    middleBoxGeoJSON
  );

  const middleBandPolygons = fromGeoJSON(
    martinez.diff(middleAreaGeoJSON, innerBoxGeoJSON)
  );
  const middleBand = middleBandPolygons[0] || [];

  const outerBandPolygons = fromGeoJSON(
    martinez.diff(boundaryGeoJSON, middleBoxGeoJSON)
  );
  const outerBand = outerBandPolygons[0] || [];
  // Brahma (center band)
  if (innerBand && innerBand.length > 0) {
    devtas.push({
      id: devtaId++,
      name: BRAHMA_DEVTA_NAME,
      polygon: innerBand,
      ring: "center",
    });
  }

  // Middle ring
  if (middleBand && middleBand.length > 0) {
    const middleBandCentroid = calculateCentroid(middleBand);
    const middleBandAngularMass = calculateAngularMass(
      middleBand,
      middleBandCentroid
    );
    const middleRingZones = redistributeZones(
      middleBandAngularMass,
      12,
      northAngle
    );
    for (let i = 0; i < 12; i++) {
      const zone = middleRingZones[i];
      if (zone) {
        const sector = buildAngularSector(
          innerBand,
          middleBand,
          zone.startAngle,
          zone.endAngle,
          middleBandCentroid
        );
        devtas.push({
          id: devtaId++,
          name: MIDDLE_RING_DEVTA_NAMES[i] || `Middle ${i + 1}`,
          polygon: sector,
          ring: "middle",
        });
      }
    }
  }

  // Outer ring
  if (outerBand && outerBand.length > 0) {
    const outerBandCentroid = calculateCentroid(outerBand);
    const outerBandAngularMass = calculateAngularMass(
      outerBand,
      outerBandCentroid
    );
    const outerRingZones = redistributeZones(
      outerBandAngularMass,
      32,
      northAngle
    );
    for (let i = 0; i < 32; i++) {
      const zone = outerRingZones[i];
      if (zone) {
        const sector = buildAngularSector(
          middleBand,
          outerBand,
          zone.startAngle,
          zone.endAngle,
          outerBandCentroid
        );
        devtas.push({
          id: devtaId++,
          name: OUTER_RING_DEVTA_NAMES[i] || `Outer ${i + 1}`,
          polygon: sector,
          ring: "outer",
        });
      }
    }
  }

  return devtas;
}

export type { Point };