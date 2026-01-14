// lib/vastu/devtaAnalysis.ts
import {
    Point,
    calculateCentroid,
    scalePolygon,
    rayPolygonIntersection, // Ensure this is imported
    buildAngularSector,
    pointInPolygon // Ensure this is imported
} from '../geometry';

export interface DevtaRegion {
  id: number;
  ring: "center" | "middle" | "outer";
  name: string;
  polygon: Point[];
  startAngle?: number;
  endAngle?: number;
}

// Configurable scaling ratios for concentric boundaries
export const MIDDLE_BOUNDARY_SCALE = 0.66;
export const INNER_BOUNDARY_SCALE = 0.33;

// Devta names following traditional Vastu mapping
// Center: 1 Devta
const CENTER_DEVTA = "Brahma";

// Middle Ring: 16 Devtas, each occupying 22.5°
const MIDDLE_DEVTAS = [
  "Shikhi", "Parjanya", "Jayanta", "Indra", 
  "Surya", "Satya", "Bhrisha", "Akash", 
  "Vayu", "Pusha", "Vitatha", "Gruhakshat", 
  "Yama", "Gandharva", "Bhringraj", "Marut" // Corrected to 16 Devtas
];

// Outer Ring: 32 Devtas (each 11.25°)
const OUTER_DEVTAS = [
    "Dishah Shiva", "Soma", "Sthana", "Bhallat",
    "Mukhya", "Soma", "Bhujag", "Aaditi",
    "Diti", "Shura", "Apa", "Apavatsa",
    "Savitri", "Indrajit", "Vivashvana", "Mitra",
    "Prithvidhara", "Apah", "Aaryama", "Savitar",
    "Vivasvat", "Indra", "Jaya", "Rudra",
    "Rajayakshma", "Asura", "Shosha", "Papayakshma",
    "Roga", "Naga", "Mukhya", "Bhallat"
];

/**
 * Generate all 45 Devta regions using concentric + polar method
 */
export function generate45Devtas(
  boundary: Point[],
  northAngle: number = 0
): DevtaRegion[] | null {
  if (boundary.length < 3) return null;
  
  const centroid = calculateCentroid(boundary);
  const regions: DevtaRegion[] = [];
  let devtaId = 1;
  
  // Generate concentric boundaries
  const outerBoundary = boundary;
  const middleBoundary = scalePolygon(boundary, centroid, MIDDLE_BOUNDARY_SCALE);
  const innerBoundary = scalePolygon(boundary, centroid, INNER_BOUNDARY_SCALE);
  
  // 1. CENTER: Brahmasthan (1 Devta)
  regions.push({
    id: devtaId++,
    ring: "center",
    name: CENTER_DEVTA,
    polygon: innerBoundary
  });
  
  // 2. MIDDLE RING: 16 Devtas (each 22.5°)
  const middleDivisions = 16;
  const middleAngleStep = 360 / middleDivisions;
  
  for (let i = 0; i < middleDivisions; i++) {
    const startAngle = (northAngle + i * middleAngleStep) % 360;
    const endAngle = (northAngle + (i + 1) * middleAngleStep) % 360;
    
    const sector = buildAngularSector(
      innerBoundary,
      middleBoundary,
      startAngle,
      endAngle > startAngle ? endAngle : endAngle + 360,
      centroid
    );
    
    if (sector.length > 0) {
      regions.push({
        id: devtaId++,
        ring: "middle",
        name: MIDDLE_DEVTAS[i] || `Middle-${i + 1}`,
        polygon: sector,
        startAngle,
        endAngle: endAngle > startAngle ? endAngle : endAngle + 360
      });
    }
  }
  
  // 3. OUTER RING: 32 Devtas (each 11.25°)
  const outerDivisions = 32;
  const outerAngleStep = 360 / outerDivisions;
  
  for (let i = 0; i < outerDivisions; i++) {
    const startAngle = (northAngle + i * outerAngleStep) % 360;
    const endAngle = (northAngle + (i + 1) * outerAngleStep) % 360;
    
    const sector = buildAngularSector(
      middleBoundary,
      outerBoundary,
      startAngle,
      endAngle > startAngle ? endAngle : endAngle + 360,
      centroid
    );
    
    if (sector.length > 0) {
      regions.push({
        id: devtaId++,
        ring: "outer",
        name: OUTER_DEVTAS[i] || `Outer-${i + 1}`,
        polygon: sector,
        startAngle,
        endAngle: endAngle > startAngle ? endAngle : endAngle + 360
      });
    }
  }
  
  return regions;
}

/**
 * Determine which Devta zone a point belongs to
 */
export function getZoneForPoint(
  point: Point,
  boundary: Point[],
  northAngle: number
): string {
  // This function regenerates devtas on every call. For performance, consider memoization
  // or passing the generated devtas as an argument if this is called frequently.
  const devtas = generate45Devtas(boundary, northAngle);
  if (!devtas) return "Unknown";
  
  for (const devta of devtas) {
    if (pointInPolygon(point, devta.polygon)) {
      return devta.name;
    }
  }
  
  return "Outside";
}