import { Point } from '../coordinates';
import { calculateCentroid, pointInPolygon } from '../geometry';
import { clip } from '../geometry/clip';
import { generateMandala, Polygon } from '../geometry/mandala';

// #region Types
export interface ClippedDevta {
  name: string;
  // The clipped polygon can be fragmented into multiple disjoint polygons.
  clippedPolygons: Polygon[];
}

export interface DevtaAnalysisResult {
  clippedDevtas: ClippedDevta[];
  // Store the transformation for use with other elements, like Marma points.
  transform: {
    scale: number;
    translation: Point; // The centroid of the plot
    northAngle: number;
  };
}

interface BoundingBox {
  min: Point;
  max: Point;
  width: number;
  height: number;
}
// #endregion

// #region Helper Functions
/**
 * Calculates the bounding box of a polygon.
 */
function getBoundingBox(polygon: Polygon): BoundingBox {
  if (polygon.length === 0) {
    return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 }, width: 0, height: 0 };
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const p of polygon) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return {
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Applies scale and translation to a polygon.
 */
function transformPolygon(polygon: Polygon, scale: number, translation: Point): Polygon {
  return polygon.map(p => ({
    x: p.x * scale + translation.x,
    y: p.y * scale + translation.y,
  }));
}
// #endregion

/**
 * Performs the Vastu analysis by generating, transforming, and clipping the Mandala.
 *
 * @param plotPolygon - The polygon representing the plot boundary.
 * @param northAngle - The clockwise rotation of the plot from true North.
 * @returns A `DevtaAnalysisResult` containing the clipped Devta polygons and transformation info.
 */
export function analyzePlot(plotPolygon: Polygon, northAngle: number): DevtaAnalysisResult {
  console.log("--- Starting Vastu Analysis ---");

  // 1. Generate the canonical, rotated Mandala
  const canonicalMandala = generateMandala(northAngle);
  console.log("Generated canonical mandala:", canonicalMandala);

  // 2. Calculate transformation parameters
  const plotCentroid = calculateCentroid(plotPolygon);
  const plotBbox = getBoundingBox(plotPolygon);
  console.log("Plot Centroid:", plotCentroid);
  console.log("Plot BBox:", plotBbox);

  // The canonical mandala is 100x100.
  // We need to scale it to fit the plot's bounding box.
  // We use the larger of the width/height ratios to ensure the mandala covers the entire plot.
  const scaleX = plotBbox.width / 100;
  const scaleY = plotBbox.height / 100;
  const scale = Math.max(scaleX, scaleY);
  console.log("Calculated Scale:", scale);

  // 3. Transform and Clip all devtas
  const clippedDevtas: ClippedDevta[] = [];
  for (const devta of canonicalMandala.allDevtas) {
    // Apply the same scale and translation to each devta polygon
    const transformedDevtaPolygon = transformPolygon(devta.polygon, scale, plotCentroid);

    // Clip the transformed devta against the plot boundary
    const intersectedPolygons = clip(transformedDevtaPolygon, plotPolygon);

    if (intersectedPolygons.length > 0) {
      clippedDevtas.push({
        name: devta.name,
        clippedPolygons: intersectedPolygons,
      });
    }
  }

  console.log("Clipped Devtas Count:", clippedDevtas.length);
  if (clippedDevtas.length === 0) {
    console.warn("Warning: No devtas were clipped. This might indicate an issue with scaling, translation, or the clipping process.");
  }

  const analysisResult = {
    clippedDevtas,
    transform: {
      scale,
      translation: plotCentroid,
      northAngle,
    },
  };

  console.log("--- Vastu Analysis Complete ---", analysisResult);
  return analysisResult;
}

/**
 * Finds which Devta an object (represented by a point) belongs to.
 *
 * @param point - The location of the object.
 * @param analysisResult - The result from a `analyzePlot` call.
 * @returns The name of the containing Devta, or null if not found.
 */
export function getDevtaForObject(point: Point, analysisResult: DevtaAnalysisResult): string | null {
  for (const devta of analysisResult.clippedDevtas) {
    // A devta can be fragmented, so we check each fragment.
    for (const polygon of devta.clippedPolygons) {
      if (pointInPolygon(point, polygon)) {
        return devta.name;
      }
    }
  }
  return null;
}
