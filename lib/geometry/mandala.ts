import { Point } from '../coordinates';
import { rotatePoint } from '../coordinates';

// #region Core Types
export type Polygon = Point[];

export interface Devta {
  name: string;
  polygon: Polygon;
}

export interface MandalaRing {
  devtas: Devta[];
}

export interface VastuMandala {
  brahma: Devta;
  middleRing: MandalaRing;
  outerRing: MandalaRing;
  allDevtas: Devta[];
}
// #endregion

// #region Devta Names
// As per user requirements and `vastuRules.ts`.

const BRAHMA_NAME = "Brahma";

const MIDDLE_RING_NAMES = [
  // Starting from NNE, going clockwise
  "Shikhi", "Parjanya", "Jayanta", "Indra", "Surya", "Satya", "Bhrisha", "Akash",
  "Vayu", "Pusha", "Vitatha", "Gruhakshat", "Yama", "Gandharva", "Bhringraj", "Marut"
];

const OUTER_RING_NAMES = [
  // Starting from NNE, going clockwise
  "Dishah Shiva", "Soma", "Sthana", "Bhallat", "Mukhya", "Bhujag", "Aaditi", "Diti",
  "Shura", "Apa", "Apavatsa", "Savitri", "Indrajit", "Vivashvana", "Mitra", "Prithvidhara",
  "Apah", "Aaryama", "Savitar", "Vivasvat", "Jaya", "Rudra", "Rajayakshma", "Asura",
  "Shosha", "Papayakshma", "Roga", "Naga",
  // TODO: The user requested 32 outer devtas, but `vastuRules.ts` only provides 28.
  // Using placeholders for the remaining 4.
  "OuterDevta29", "OuterDevta30", "OuterDevta31", "OuterDevta32"
];
// #endregion

// #region Geometric Constants and Helpers
const MANDALA_SIZE = 100;
const HALF_SIZE = MANDALA_SIZE / 2;

// Define concentric squares for the rings
const BRAHMA_BOUNDARY_HALF_SIZE = HALF_SIZE / 2; // e.g. 25
const MIDDLE_BOUNDARY_HALF_SIZE = HALF_SIZE * 0.75; // e.g. 37.5

/**
 * Calculates the intersection of a ray from the origin with a square centered at the origin.
 * @param angleDegrees - The angle of the ray in degrees (0 = North/Up, clockwise).
 * @param squareHalfSize - The half-size of the square (distance from center to edge).
 * @returns The intersection point.
 */
function getRaySquareIntersection(angleDegrees: number, squareHalfSize: number): Point {
  const angle = (angleDegrees - 90) * Math.PI / 180; // Convert to standard math angle in radians
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Check intersection with vertical edges (x = ±squareHalfSize)
  const t_x = squareHalfSize / Math.abs(cos);

  // Check intersection with horizontal edges (y = ±squareHalfSize)
  const t_y = squareHalfSize / Math.abs(sin);

  const t = Math.min(t_x, t_y);

  return {
    x: t * cos,
    y: t * sin
  };
}
// #endregion

/**
 * Generates the canonical Vastu Mandala with 49 zones (1 Brahma, 16 Middle, 32 Outer).
 * The Mandala is a 100x100 square centered at the origin (0,0).
 *
 * @param northAngle - The clockwise rotation to apply to the Mandala, in degrees.
 * @returns A `VastuMandala` object containing all the Devta polygons.
 */
export function generateMandala(northAngle: number): VastuMandala {
  const center: Point = { x: 0, y: 0 };
  const allDevtas: Devta[] = [];

  // 1. Brahma (Center)
  const brahmaPoly: Polygon = [
    { x: -BRAHMA_BOUNDARY_HALF_SIZE, y: -BRAHMA_BOUNDARY_HALF_SIZE },
    { x: BRAHMA_BOUNDARY_HALF_SIZE, y: -BRAHMA_BOUNDARY_HALF_SIZE },
    { x: BRAHMA_BOUNDARY_HALF_SIZE, y: BRAHMA_BOUNDARY_HALF_SIZE },
    { x: -BRAHMA_BOUNDARY_HALF_SIZE, y: BRAHMA_BOUNDARY_HALF_SIZE },
  ];
  const brahma: Devta = { name: BRAHMA_NAME, polygon: brahmaPoly };
  allDevtas.push(brahma);

  // 2. Middle Ring (16 Devtas)
  const middleRingDevtas: Devta[] = [];
  const middleAngleStep = 22.5; // 360 / 16
  let currentAngle = -middleAngleStep / 2; // Start from the middle of the first segment (North)

  for (const name of MIDDLE_RING_NAMES) {
    const startAngle = currentAngle;
    const endAngle = currentAngle + middleAngleStep;

    const p1 = getRaySquareIntersection(startAngle, BRAHMA_BOUNDARY_HALF_SIZE);
    const p2 = getRaySquareIntersection(startAngle, MIDDLE_BOUNDARY_HALF_SIZE);
    const p3 = getRaySquareIntersection(endAngle, MIDDLE_BOUNDARY_HALF_SIZE);
    const p4 = getRaySquareIntersection(endAngle, BRAHMA_BOUNDARY_HALF_SIZE);

    const devtaPoly: Polygon = [p1, p2, p3, p4];
    middleRingDevtas.push({ name, polygon: devtaPoly });
    allDevtas.push({ name, polygon: devtaPoly });

    currentAngle = endAngle;
  }

  // 3. Outer Ring (32 Devtas)
  const outerRingDevtas: Devta[] = [];
  const outerAngleStep = 11.25; // 360 / 32
  currentAngle = -outerAngleStep / 2; // Reset for the outer ring

  for (const name of OUTER_RING_NAMES) {
    const startAngle = currentAngle;
    const endAngle = currentAngle + outerAngleStep;

    const p1 = getRaySquareIntersection(startAngle, MIDDLE_BOUNDARY_HALF_SIZE);
    const p2 = getRaySquareIntersection(startAngle, HALF_SIZE);
    const p3 = getRaySquareIntersection(endAngle, HALF_SIZE);
    const p4 = getRaySquareIntersection(endAngle, MIDDLE_BOUNDARY_HALF_SIZE);

    const devtaPoly: Polygon = [p1, p2, p3, p4];
    outerRingDevtas.push({ name, polygon: devtaPoly });
    allDevtas.push({ name, polygon: devtaPoly });

    currentAngle = endAngle;
  }

  // 4. Rotate all polygons if northAngle is not 0
  if (northAngle !== 0) {
    for (const devta of allDevtas) {
      devta.polygon = devta.polygon.map(p => rotatePoint(p, center, -northAngle));
    }
  }

  return {
    brahma: allDevtas.find(d => d.name === BRAHMA_NAME)!,
    middleRing: { devtas: middleRingDevtas },
    outerRing: { devtas: outerRingDevtas },
    allDevtas: allDevtas,
  };
}