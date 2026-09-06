"use client";

import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import {
  Point,
  DevtaRegion,
  PlacedObject,
  Wall,
} from "@/lib/floorPlanInterfaces";
import { DraggableObject } from "./DraggableObject";
import { devtaColors } from "@/lib/colorPalette";
import { getCentroid } from "@/lib/gridUtils";
import { useProjectStore } from "@/lib/store/projectStore";

interface FloorPlanCanvasProps {
  floorPlanImage: string | null;
  boundary: Point[];
  onDrawBoundary?: (point: Point) => void;
  placedObjects: PlacedObject[];
  onMoveObject: (id: string, x: number, y: number) => void;
  onResizeObject: (id: string, width: number, height: number) => void;
  onRotateObject: (id: string, rotation: number) => void;
  onDeleteObject: (id: string) => void;
  objectSvgMap: { [key: string]: string };
  devtaRegions?: DevtaRegion[];
  innerPolygon?: Point[];
  middlePolygon?: Point[];
  zone16Regions?: DevtaRegion[];
  zone8Regions?: DevtaRegion[];
  marmaData?: { marmaPoints: Point[]; vanshaLines: Point[][] } | null;
  shaktiChakra?: boolean;
  shaktiChakraSize?: number;
  shaktiChakraType?: "complete" | "zones";
  plotCentroid?: Point | null;
  drawingObjectBoundary?: Point[];
  drawingMode?: "boundary" | "objects" | "select" | "wall" | "measure" | null;
  onDevtaClick?: (devta: DevtaRegion) => void;
  onZoneClick?: (zone: DevtaRegion) => void;
  onPlaceObject?: (newObject: PlacedObject) => void;
  onCanvasClick?: (point: Point) => void;
  setDrawingMode?: (mode: "boundary" | "objects" | "select" | "wall" | "measure" | null) => void;
  setDrawingObjectBoundary?: (boundary: Point[]) => void;
  selectedObjectType?: string;
  northDirection: number;
  scale: number | null;
  wallLengths: number[];
  setReferenceWallIndex: (index: number | null) => void;
  referenceWallIndex: number | null;
  wallColors: (string | null)[];
  plotWidth?: number | null;
  plotHeight?: number | null;
  isStatic?: boolean;
  highlightedZones?: string[];
  onObjectClick?: (object: PlacedObject) => void;
  walls?: Wall[];
  onAddWall?: (wall: Wall) => void;
  onSelectWall?: (wall: Wall | null) => void;
  selectedWall?: Wall | null;
  onMoveBoundaryVertex?: (index: number, newPoint: Point) => void;
  canvasRotation?: number;
  isPremium?: boolean;
  isUnlimited?: boolean;
  onDragEnd?: (id: string) => void;
}

const ZONE_NAMES_16 = [
  "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S",
  "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW", "N"
];
const ZONE_NAMES_8 = ["NE", "E", "SE", "S", "SW", "W", "NW", "N"];

const VASTU_BOUNDARY_COLORS: { [key: string]: string } = {
  "N": "#C5D9F1", "NNE": "#C5D9F1", "NE": "#C5D9F1", "ENE": "#FFFFFF",
  "E": "#92D050", "ESE": "#92D050", "SE": "#FF0000", "SSE": "#FF0000",
  "S": "#FF0000", "SSW": "#FFFF00", "SW": "#FFFF00", "WSW": "#FFFFFF",
  "W": "#FFFFFF", "WNW": "#FFFFFF", "NW": "#FFFFFF", "NNW": "#C5D9F1",
};

const ZONE_COLORS_16: { [key: string]: string } = {
  "NE": "#C5D9F1",
  "NNE": "#FFFFFF",
  "E": "#92D050",
  "ESE": "#92D050",
  "SE": "#FF0000",
  "SSE": "#FF0000",
  "S": "#FF0000",
  "SSW": "#FFFF00",
  "SW": "#FFFF00",
  "WSW": "#FFFFFF",
  "W": "#FFFFFF",
  "WNW": "#FFFFFF",
  "NW": "#FFFFFF",
  "NNW": "#C5D9F1",
  "N": "#C5D9F1",
  "ENE": "#FFFFFF",
};

// Helper function to calculate angle from point (client-side)
const getAngleFromPoint = (center: Point, p: Point) => {
  const dx = p.x - center.x;
  const dy = center.y - p.y; // Invert dy as canvas +Y is down

  const angleRad = Math.atan2(dy, dx);
  let angleDegFromPosX = angleRad * 180 / Math.PI;
  if (angleDegFromPosX < 0) {
    angleDegFromPosX += 360;
  }
  // Convert from (0=East, counter-clockwise) to (0=North, clockwise)
  const vastuAngle = (90 - angleDegFromPosX + 360) % 360;
  return vastuAngle;
};

// Client-side get_zone_from_angle, adapted from microservice logic
const getZoneFromAngleClient = (angle: number, north_base_rotation: number, zones_names: string[]) => {
  const num_zones = zones_names.length;
  if (num_zones === 0) {
    return null;
  }

  let absolute_start_angle_for_first_zone_in_list = 0.0;
  if (zones_names === ZONE_NAMES_16) {
    absolute_start_angle_for_first_zone_in_list = 11.25;
  } else if (zones_names === ZONE_NAMES_8) {
    absolute_start_angle_for_first_zone_in_list = 22.5;
  }

  const step = 360 / num_zones;

  const angle_in_unrotated_mandala = (angle - north_base_rotation + 360) % 360;

  for (let i = 0; i < num_zones; i++) {
    const base_start_angle = absolute_start_angle_for_first_zone_in_list + i * step;
    const base_end_angle = absolute_start_angle_for_first_zone_in_list + (i + 1) * step;

    if (base_end_angle >= 360 && base_start_angle < 360) {
      if ((base_start_angle <= angle_in_unrotated_mandala && angle_in_unrotated_mandala < 360) ||
        (0 <= angle_in_unrotated_mandala && angle_in_unrotated_mandala < (base_end_angle % 360))) {
        return zones_names[i];
      }
    } else if (base_start_angle <= angle_in_unrotated_mandala && angle_in_unrotated_mandala < base_end_angle) {
      return zones_names[i];
    }
  }
  return null;
};

// Helper function to check if a point is near a line segment
const isPointNearLineSegment = (
  px: number, py: number, // Point coordinates
  x1: number, y1: number, // Line segment point 1
  x2: number, y2: number, // Line segment point 2
  tolerance: number = 10 // Pixels of tolerance
): boolean => {
  const L2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (L2 === 0) return Math.sqrt(Math.pow(px - x1, 2) + Math.pow(py - y1, 2)) <= tolerance;

  const t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / L2;
  const projectionT = Math.max(0, Math.min(1, t));
  const projectionX = x1 + projectionT * (x2 - x1);
  const projectionY = y1 + projectionT * (y2 - y1);

  const distance = Math.sqrt(
    Math.pow(px - projectionX, 2) + Math.pow(py - projectionY, 2)
  );

  return distance <= tolerance;
};


/**
 * Polyfill for ctx.roundRect (Chrome 99+ only)
 */
function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * For a zone polygon, finds the true outer boundary arc.
 *
 * Strategy: identify which vertex is the "apex" (plot centroid) by finding
 * the polygon vertex closest to the known centroid pixel position. Then walk
 * the polygon to find the contiguous arc of vertices that does NOT include
 * the apex — that is the outer boundary arc.
 */
function computeZoneOuterArc(
  pts: { x: number; y: number }[],
  realScale: number | null,
  centroidPx: { x: number; y: number } | null
) {
  if (pts.length < 3) return null;

  // 1. Find the apex vertex (the plot centroid vertex in the polygon).
  //    If no centroid provided, fall back to the point closest to the
  //    polygon's own centroid (innermost point).
  let apexIdx = 0;
  if (centroidPx) {
    let minDist = Infinity;
    pts.forEach((p, i) => {
      const d = Math.hypot(p.x - centroidPx.x, p.y - centroidPx.y);
      if (d < minDist) { minDist = d; apexIdx = i; }
    });
  } else {
    // Fallback: vertex closest to polygon centroid = innermost
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    let minDist = Infinity;
    pts.forEach((p, i) => {
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d < minDist) { minDist = d; apexIdx = i; }
    });
  }

  const n = pts.length;

  // 2. Extract the outer arc: consecutive vertices going from apexIdx+1
  //    all the way around back to apexIdx (wrapping), i.e., every vertex
  //    except the apex itself.
  const arcPts: { x: number; y: number }[] = [];
  for (let i = 1; i < n; i++) {
    arcPts.push(pts[(apexIdx + i) % n]);
  }
  // arcPts now has n-1 vertices forming the outer arc

  // 3. Compute total arc length
  let totalLen = 0;
  const cumulative = [0];
  for (let i = 0; i < arcPts.length - 1; i++) {
    const dx = arcPts[i + 1].x - arcPts[i].x;
    const dy = arcPts[i + 1].y - arcPts[i].y;
    totalLen += Math.sqrt(dx * dx + dy * dy);
    cumulative.push(totalLen);
  }
  if (totalLen < 1) return null;

  // 4. Interpolate midpoint along the arc
  const halfLen = totalLen / 2;
  let midPt = arcPts[0];
  for (let i = 0; i < arcPts.length - 1; i++) {
    if (cumulative[i + 1] >= halfLen) {
      const t = (halfLen - cumulative[i]) / (cumulative[i + 1] - cumulative[i]);
      midPt = {
        x: arcPts[i].x + t * (arcPts[i + 1].x - arcPts[i].x),
        y: arcPts[i].y + t * (arcPts[i + 1].y - arcPts[i].y),
      };
      break;
    }
  }

  // 5. Outward unit normal: from apex → midPt, then inverted for
  //    slight inward offset (so label sits INSIDE the boundary wall)
  const apex = pts[apexIdx];
  const dx = midPt.x - apex.x;
  const dy = midPt.y - apex.y;
  const mag = Math.sqrt(dx * dx + dy * dy) || 1;

  return {
    midPt,                                     // ON the boundary wall
    nx: -(dx / mag),                           // inward direction
    ny: -(dy / mag),
    outX: dx / mag,                            // outward direction
    outY: dy / mag,
    apex,
    totalLen,
    realArcLength: realScale ? totalLen * realScale : null,
    edgeStart: arcPts[0],
    edgeEnd: arcPts[arcPts.length - 1],
  };
}

/**
 * For a point on the boundary wall, determines which wall segment it belongs to
 * and calculates its linear running distance from the starting corner of that wall.
 */
function getWallCornerReference(
  pt: { x: number; y: number },
  pxBoundary: { x: number; y: number }[],
  wallLengths: number[] | undefined,
  realScale: number | null
) {
  if (pxBoundary.length < 2) return null;
  let bestWallIdx = 0;
  let minDistToWall = Infinity;
  let bestT = 0;
  let bestDistPx = 0;

  for (let i = 0; i < pxBoundary.length; i++) {
    const p1 = pxBoundary[i];
    const p2 = pxBoundary[(i + 1) % pxBoundary.length];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-4) continue;

    const t = Math.max(0, Math.min(1, ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / lenSq));
    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    const distToLine = Math.hypot(pt.x - projX, pt.y - projY);

    if (distToLine < minDistToWall) {
      minDistToWall = distToLine;
      bestWallIdx = i;
      bestT = t;
      bestDistPx = Math.hypot(projX - p1.x, projY - p1.y);
    }
  }

  let realDist: number | null = null;
  if (wallLengths && wallLengths[bestWallIdx] != null && wallLengths[bestWallIdx] > 0) {
    realDist = bestT * wallLengths[bestWallIdx];
  } else if (realScale) {
    realDist = bestDistPx * realScale;
  }

  return {
    cornerLabel: `C${bestWallIdx + 1}`,
    wallIdx: bestWallIdx,
    t: bestT,
    distPx: bestDistPx,
    realDist,
  };
}

const drawCanvasContent = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  floorPlanImage: string | null,
  imageRef: React.RefObject<HTMLImageElement | null>,
  boundary: Point[],
  devtaRegions: DevtaRegion[],
  innerPolygon: Point[],
  middlePolygon: Point[],
  zone16Regions: DevtaRegion[],
  zone8Regions: DevtaRegion[],
  marmaData: { marmaPoints: Point[]; vanshaLines: Point[][] } | null,
  shaktiChakra: boolean | undefined,
  shaktiChakraSize: number | undefined,
  shaktiChakraType: "complete" | "zones" | undefined,
  plotCentroid: Point | null,
  drawingObjectBoundary: Point[],
  drawingMode: "boundary" | "objects" | "select" | "wall" | "measure" | null | undefined,
  hoveredDevta: DevtaRegion | null,
  northDirection: number,
  wallLengths: number[],
  zoom: number,
  referenceWallIndex: number | null,
  wallColors: (string | null)[],
  highlightedZones: string[] | undefined,
  plotWidth?: number | null,
  plotHeight?: number | null,
  walls?: Wall[],
  currentDrawingWall?: { start: Point; end: Point } | null,
  selectedWall?: Wall | null,
  realScale?: number | null,
  measureStart?: Point | null,
  measureEnd?: Point | null,
  measureCurrent?: Point | null,
  hoverPoint?: Point | null,
  isStatic?: boolean,
  preloadedShaktiChakraImg?: HTMLImageElement | null,
  computedLayout?: { drawX: number; drawY: number; drawWidth: number; drawHeight: number }
) => {
  const toPx = (p: Point) => {
    if (computedLayout) {
      return { 
        x: computedLayout.drawX + p.x * computedLayout.drawWidth, 
        y: computedLayout.drawY + p.y * computedLayout.drawHeight 
      };
    }
    return { x: p.x * width, y: p.y * height };
  };

  if (floorPlanImage && imageRef.current && computedLayout) {
    ctx.drawImage(
      imageRef.current, 
      computedLayout.drawX, 
      computedLayout.drawY, 
      computedLayout.drawWidth, 
      computedLayout.drawHeight
    );
    if (
      devtaRegions.length > 0 ||
      zone16Regions.length > 0 ||
      zone8Regions.length > 0
    ) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Draw Walls
  if (walls) {
    walls.forEach(wall => {
      const p1 = toPx(wall.start);
      const p2 = toPx(wall.end);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineWidth = wall.thickness || 5;
      ctx.strokeStyle = wall.color || "#000";

      // Highlight selected wall
      if (selectedWall && selectedWall.id === wall.id) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(0, 0, 255, 0.5)";
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw length label
      if (wall.length) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.fillStyle = "#000";
        ctx.font = "12px Arial";
        ctx.fillText(`${wall.length.toFixed(2)}`, midX, midY - 5);
      }
    });
  }

  // Draw current drawing wall
  if (currentDrawingWall) {
    const p1 = toPx(currentDrawingWall.start);
    const p2 = toPx(currentDrawingWall.end);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw length preview
    const canvasWidth = 800;
    const canvasHeight = 600;
    const pixelLength = Math.sqrt(
      Math.pow((currentDrawingWall.end.x - currentDrawingWall.start.x) * canvasWidth, 2) +
      Math.pow((currentDrawingWall.end.y - currentDrawingWall.start.y) * canvasHeight, 2)
    );
    if (realScale) {
      const realLength = pixelLength * realScale;
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.fillStyle = "blue";
      ctx.font = "bold 12px Arial";
      ctx.fillText(`${realLength.toFixed(2)}`, midX, midY - 10);
    }
  }

  // Draw ruler/grid and distance guides when in wall drawing mode
  if (drawingMode === "wall" && !isStatic && boundary.length > 0) {
    const activePoint = currentDrawingWall ? currentDrawingWall.end : hoverPoint;
    
    // 1. Draw Grid
    const minX = Math.min(...boundary.map(p => p.x));
    const maxX = Math.max(...boundary.map(p => p.x));
    const minY = Math.min(...boundary.map(p => p.y));
    const maxY = Math.max(...boundary.map(p => p.y));
    
    // Default 10 physical units, or relative if no scale
    const gridSpacingReal = 10; 
    const fallbackGridSpacingNorm = 0.05; // 5% of plot roughly
    const gridSpacingNorm = realScale ? gridSpacingReal / (realScale * Math.hypot(width, height)) : fallbackGridSpacingNorm;

    ctx.save();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1 / zoom; 
    ctx.beginPath();
    
    const startX = Math.floor(minX / gridSpacingNorm) * gridSpacingNorm;
    for (let x = startX; x <= maxX; x += gridSpacingNorm) {
      ctx.moveTo(x * width, minY * height);
      ctx.lineTo(x * width, maxY * height);
    }
    const startY = Math.floor(minY / gridSpacingNorm) * gridSpacingNorm;
    for (let y = startY; y <= maxY; y += gridSpacingNorm) {
      ctx.moveTo(minX * width, y * height);
      ctx.lineTo(maxX * width, y * height);
    }
    ctx.stroke();
    ctx.restore();

    // 2. Draw Distance Guides to vertices and center
    if (activePoint) {
      const activePx = toPx(activePoint);
      const pointsToMeasure = [...boundary];
      if (plotCentroid) pointsToMeasure.push(plotCentroid);
      
      // Sort to find 3 closest points
      const closestPoints = pointsToMeasure
        .map(p => ({
            pt: p,
            dist: Math.hypot(p.x - activePoint.x, p.y - activePoint.y),
            px: toPx(p)
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3);
        
      closestPoints.forEach(({ pt, dist, px }) => {
        ctx.beginPath();
        ctx.moveTo(activePx.x, activePx.y);
        ctx.lineTo(px.x, px.y);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(255, 165, 0, 0.8)"; // Orange dashed
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw real distance text
        if (realScale) {
          const pixelLength = Math.hypot(px.x - activePx.x, px.y - activePx.y);
          const realLength = pixelLength * realScale;
          const midX = (activePx.x + px.x) / 2;
          const midY = (activePx.y + px.y) / 2;
          
          ctx.save();
          const text = realLength.toFixed(2);
          const metrics = ctx.measureText(text);
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.fillRect(midX - metrics.width / 2 - 2, midY - 10, metrics.width + 4, 16);
          ctx.fillStyle = "orange";
          ctx.font = "bold 11px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, midX, midY - 2);
          ctx.restore();
        }
      });
    }
  }

  if (boundary.length > 0) {
    const pxBoundary = boundary.map(toPx);
    ctx.beginPath();
    ctx.moveTo(pxBoundary[0].x, pxBoundary[0].y);
    pxBoundary.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#2563EB";
    ctx.stroke();

    // Draw Wall Lengths on Boundary
    if (wallLengths && wallLengths.length === boundary.length) {
      ctx.fillStyle = "black";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < boundary.length; i++) {
        const p1 = pxBoundary[i];
        const p2 = pxBoundary[(i + 1) % boundary.length];

        // Midpoint
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        // Angle for text align
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        let angle = Math.atan2(dy, dx);

        // Calculate the normal vector pointing outwards
        // Perpendicular vector: (-dy, dx) or (dy, -dx)
        // To point "outside" usually depends on polygon winding order.
        // Try (dy, -dx) which points "up/left" in clockwise coords
        const segmentLength = Math.sqrt(dx * dx + dy * dy);
        let nx = dy / segmentLength;
        let ny = -dx / segmentLength;

        // Offset distance
        const offset = 20;
        const offsetX = nx * offset;
        const offsetY = ny * offset;

        if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
          angle += Math.PI; // Keep text upright
          // When we flip the text, we might also want to flip the normal so it stays on the same side
          nx = -nx;
          ny = -ny;
        }

        const length = wallLengths[i];
        if (length) {
          ctx.save();
          // Translate to the offset midpoint
          ctx.translate(midX + offsetX, midY + offsetY);
          ctx.rotate(angle);

          // Background for text
          const text = length.toFixed(2);
          const metrics = ctx.measureText(text);
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.fillRect(-metrics.width / 2 - 4, -10, metrics.width + 8, 20);

          ctx.fillStyle = "black";
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }
    }


  }

  // Draw measurement line
  if (drawingMode === "measure" && measureStart) {
    const endPt = measureEnd || measureCurrent;
    if (endPt) {
      const p1 = toPx(measureStart);
      const p2 = toPx(endPt);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(128, 0, 128, 0.8)"; // Purple
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw end points
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(128, 0, 128, 0.8)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw real measurement text if scale available
      if (realScale) {
        const canvasWidth = 800;
        const canvasHeight = 600;
        const pixelLength = Math.sqrt(
          Math.pow((endPt.x - measureStart.x) * canvasWidth, 2) +
          Math.pow((endPt.y - measureStart.y) * canvasHeight, 2)
        );
        const realLength = pixelLength * realScale;
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        ctx.save();
        ctx.fillStyle = "white";
        ctx.fillRect(midX - 25, midY - 20, 50, 16);
        ctx.strokeStyle = "rgba(128, 0, 128, 0.8)";
        ctx.strokeRect(midX - 25, midY - 20, 50, 16);

        ctx.fillStyle = "purple";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${realLength.toFixed(2)}`, midX, midY - 8);
        ctx.restore();
      }
    }
  }

  // Draw Marma Data
  if (marmaData) {
    // Draw Vansha Lines
    ctx.strokeStyle = "rgba(128, 0, 128, 0.4)"; // Purple for vansha lines
    ctx.lineWidth = 1;
    marmaData.vanshaLines.forEach(line => {
      if (line.length < 2) return;
      ctx.beginPath();
      const start = toPx(line[0]);
      ctx.moveTo(start.x, start.y);
      line.slice(1).forEach(p => {
        const pt = toPx(p);
        ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    });

    // Draw Marma Points
    marmaData.marmaPoints.forEach(p => {
      const pt = toPx(p);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  if (shaktiChakra && plotCentroid && preloadedShaktiChakraImg) {
    const centroid = toPx(plotCentroid);
    ctx.save();
    ctx.translate(centroid.x, centroid.y);
    ctx.rotate((-northDirection * Math.PI) / 180);
    const imageSize = Math.min(width, height) * (shaktiChakraSize || 0.8);
    ctx.drawImage(preloadedShaktiChakraImg, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.restore();
  }

  devtaRegions.forEach((region) => {
    if (!region.polygon || region.polygon.length < 3) return;
    const pts = region.polygon.map(toPx);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = devtaColors[region.name] ? `${devtaColors[region.name]}` : "rgba(200, 200, 200, 0.4)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();
    const center = getCentroid(pts);
    ctx.fillStyle = "#333";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(region.name, center.x, center.y);
  });

  // Collect zone16 arc data for final-pass label rendering (drawn on boundary wall)
  const zone16Arcs: Array<{
    text: string; lx: number; ly: number;
    nx: number; ny: number; outX: number; outY: number;
    apex: { x: number; y: number };
    edgeStart: { x: number; y: number }; edgeEnd: { x: number; y: number };
  }> = [];

  zone16Regions.forEach((region) => {
    if (!region.polygon || region.polygon.length < 3) return;
    const pts = region.polygon.map(toPx);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();

    const isHighlighted = highlightedZones?.includes(region.name);
    const color = ZONE_COLORS_16[region.name] || "rgba(173, 216, 230, 0.4)";
    ctx.fillStyle = isHighlighted ? `${color}CC` : `${color}99`;
    ctx.fill();
    ctx.strokeStyle = isHighlighted ? "red" : "rgba(0,0,0,0.3)";
    ctx.lineWidth = isHighlighted ? 3 : 1;
    ctx.stroke();

    const center = getCentroid(pts);
    ctx.fillStyle = "#333";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(region.name, center.x, center.y);

    // Collect for final-pass rendering directly ON the wall boundary
    const plotCpx = plotCentroid ? toPx(plotCentroid) : null;
    const arcInfo = computeZoneOuterArc(pts, realScale ?? null, plotCpx);
    if (arcInfo && arcInfo.totalLen > 2) {
      const text = arcInfo.realArcLength !== null
        ? `${arcInfo.realArcLength.toFixed(1)}\u2032`
        : `${Math.round(arcInfo.totalLen)}px`;
      zone16Arcs.push({
        text,
        lx: arcInfo.midPt.x, // Directly ON the wall boundary
        ly: arcInfo.midPt.y,
        nx: arcInfo.nx,
        ny: arcInfo.ny,
        outX: arcInfo.outX,
        outY: arcInfo.outY,
        apex: arcInfo.apex,
        edgeStart: arcInfo.edgeStart,
        edgeEnd: arcInfo.edgeEnd,
      });
    }
  });

  // Collect zone8 arc data for final-pass label rendering
  const zone8Arcs: Array<{
    text: string; lx: number; ly: number;
    nx: number; ny: number; outX: number; outY: number;
    apex: { x: number; y: number };
    edgeStart: { x: number; y: number }; edgeEnd: { x: number; y: number };
  }> = [];

  zone8Regions.forEach((region) => {
    if (!region.polygon || region.polygon.length < 3) return;
    const pts = region.polygon.map(toPx);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = "rgba(144, 238, 144, 0.3)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();

    const center = getCentroid(pts);
    ctx.fillStyle = "#333";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(region.name, center.x, center.y);

    const plotCpx8 = plotCentroid ? toPx(plotCentroid) : null;
    const arcInfo = computeZoneOuterArc(pts, realScale ?? null, plotCpx8);
    if (arcInfo && arcInfo.totalLen > 2) {
      const text = arcInfo.realArcLength !== null
        ? `${arcInfo.realArcLength.toFixed(1)}\u2032`
        : `${Math.round(arcInfo.totalLen)}px`;
      zone8Arcs.push({
        text,
        lx: arcInfo.midPt.x, // Directly ON the wall boundary
        ly: arcInfo.midPt.y,
        nx: arcInfo.nx,
        ny: arcInfo.ny,
        outX: arcInfo.outX,
        outY: arcInfo.outY,
        apex: arcInfo.apex,
        edgeStart: arcInfo.edgeStart,
        edgeEnd: arcInfo.edgeEnd,
      });
    }
  });

  // Collect outer devta arc data for 32 outer devtas (when devtas are displayed)
  const devtaArcs: Array<{
    text: string; lx: number; ly: number;
    nx: number; ny: number; outX: number; outY: number;
    apex: { x: number; y: number };
    edgeStart: { x: number; y: number }; edgeEnd: { x: number; y: number };
  }> = [];

  if (zone16Regions.length === 0 && zone8Regions.length === 0 && devtaRegions.length > 0) {
    const plotCpxD = plotCentroid ? toPx(plotCentroid) : null;
    devtaRegions.forEach((region) => {
      if (region.ring !== "outer" || !region.polygon || region.polygon.length < 3) return;
      const pts = region.polygon.map(toPx);
      const arcInfo = computeZoneOuterArc(pts, realScale ?? null, plotCpxD);
      if (arcInfo && arcInfo.totalLen > 2) {
        const text = arcInfo.realArcLength !== null
          ? `${arcInfo.realArcLength.toFixed(1)}\u2032`
          : `${Math.round(arcInfo.totalLen)}px`;
        devtaArcs.push({
          text,
          lx: arcInfo.midPt.x,
          ly: arcInfo.midPt.y,
          nx: arcInfo.nx,
          ny: arcInfo.ny,
          outX: arcInfo.outX,
          outY: arcInfo.outY,
          apex: arcInfo.apex,
          edgeStart: arcInfo.edgeStart,
          edgeEnd: arcInfo.edgeEnd,
        });
      }
    });
  }

  if (hoveredDevta) {
    const region = hoveredDevta;
    if (!region.polygon || region.polygon.length < 3) return;
    const pts = region.polygon.map(toPx);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.stroke();
  }

  if (boundary.length > 0) {
    const pxBoundary = boundary.map(toPx);
    ctx.beginPath();
    ctx.moveTo(pxBoundary[0].x, pxBoundary[0].y);
    pxBoundary.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#2563EB";
    ctx.stroke();
  }
  // Draw North Indicator
  if (boundary.length > 0) {
    ctx.save();

    let anchorPoint = plotCentroid;

    if (!anchorPoint && boundary.length > 0) {
      anchorPoint = getCentroid(boundary);
    }
    
    const pxCentroid = anchorPoint ? toPx(anchorPoint) : { x: width / 2, y: height / 2 };
    const xCenter = pxCentroid.x;
    const yCenter = pxCentroid.y;

    ctx.translate(xCenter, yCenter);
    ctx.rotate(-(northDirection * Math.PI) / 180);

    const compassSize = 40;
    const compassWidth = 10;

      // Draw arrow
      ctx.beginPath();
      ctx.moveTo(0, -compassSize);
      ctx.lineTo(compassWidth, 0);
      ctx.lineTo(0, compassSize);
      ctx.lineTo(-compassWidth, 0);
      ctx.closePath();
      ctx.fillStyle = "white"; // Hidden by layers above, just for shadow
      ctx.fill();

      // North pointer left side (Light Red)
      ctx.beginPath();
      ctx.moveTo(0, -compassSize);
      ctx.lineTo(0, 0);
      ctx.lineTo(-compassWidth, 0);
      ctx.closePath();
      ctx.fillStyle = "#FF5252";
      ctx.fill();

      // North pointer right side (Dark Red)
      ctx.beginPath();
      ctx.moveTo(0, -compassSize);
      ctx.lineTo(compassWidth, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = "#D32F2F";
      ctx.fill();

      // South pointer left side (Light Gray)
      ctx.beginPath();
      ctx.moveTo(0, compassSize);
      ctx.lineTo(0, 0);
      ctx.lineTo(-compassWidth, 0);
      ctx.closePath();
      ctx.fillStyle = "#F5F5F5";
      ctx.fill();

      // South pointer right side (Dark Gray)
      ctx.beginPath();
      ctx.moveTo(0, compassSize);
      ctx.lineTo(compassWidth, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = "#BDBDBD";
      ctx.fill();

      // Center rivet
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#212121";
      ctx.fill();

      // Draw 'N' above the needle, keeping it upright relative to canvas to make it always readable
      ctx.save();
      ctx.translate(0, -compassSize - 18);
      // Un-rotate the text so it's always 'upright' for readability
      ctx.rotate((northDirection * Math.PI) / 180); 
      
      // Draw a subtle white backdrop circle for the N letter to ensure high contrast against any background
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 1;
      ctx.fill();

      ctx.fillStyle = "#D32F2F"; // Red 'N'
      ctx.font = "bold 14px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "transparent"; // remove text shadow
      ctx.fillText("N", 0, 1);
      ctx.restore();
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════════════════
  // FINAL PASS: Zone outer span labels — drawn LAST so they sit above all
  // other content (boundary stroke, compass needle, etc.)
  // ════════════════════════════════════════════════════════════════════════
  const allZoneArcs = [...zone16Arcs, ...zone8Arcs, ...devtaArcs];
  if (allZoneArcs.length > 0) {
    ctx.save();

    // 1. Draw Tick Marks along the boundary at zone division points
    const drawnTicks = new Set<string>();
    ctx.strokeStyle = "#1D4ED8";
    ctx.lineWidth = 2.5;

    allZoneArcs.forEach(({ apex, edgeStart, edgeEnd }) => {
      [edgeStart, edgeEnd].forEach((tp) => {
        const key = `${Math.round(tp.x)},${Math.round(tp.y)}`;
        if (drawnTicks.has(key)) return;
        drawnTicks.add(key);

        const rdx = tp.x - apex.x;
        const rdy = tp.y - apex.y;
        const rmag = Math.hypot(rdx, rdy) || 1;
        const rnx = rdx / rmag;
        const rny = rdy / rmag;

        ctx.beginPath();
        // Cut 8px inside and 8px outside across the 5px boundary wall
        ctx.moveTo(tp.x - rnx * 8, tp.y - rny * 8);
        ctx.lineTo(tp.x + rnx * 8, tp.y + rny * 8);
        ctx.stroke();

        // Display corner reference distance tag at the tick mark
        if (boundary.length >= 3) {
          const pxB = boundary.map(toPx);
          const ref = getWallCornerReference(tp, pxB, wallLengths, realScale ?? null);
          if (ref && ref.realDist !== null && ref.t > 0.04 && ref.t < 0.96) {
            const tagText = `${ref.cornerLabel}+${ref.realDist.toFixed(1)}′`;
            const tagX = tp.x + rnx * 14;
            const tagY = tp.y + rny * 14;

            ctx.save();
            ctx.font = "bold 7.5px 'Inter', Arial, sans-serif";
            const tMetrics = ctx.measureText(tagText);
            const tw = tMetrics.width + 6;
            const th = 12;

            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            fillRoundRect(ctx, tagX - tw / 2, tagY - th / 2, tw, th, 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(37, 99, 235, 0.4)";
            ctx.lineWidth = 0.8;
            fillRoundRect(ctx, tagX - tw / 2, tagY - th / 2, tw, th, 2);
            ctx.stroke();

            ctx.fillStyle = "#1E40AF";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(tagText, tagX, tagY);
            ctx.restore();
          }
        }
      });
    });

    // 2. Draw Corner Reference Handles (C1, C2, C3, C4...) on top of the boundary line
    if (boundary.length > 0 && !isStatic && (drawingMode === "boundary" || drawingMode === "objects" || drawingMode === "select" || !drawingMode)) {
      const pxB = boundary.map(toPx);
      pxB.forEach((p, idx) => {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1;

        // Solid white circular backdrop to completely mask the 5px blue boundary wall under it
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = "#1D4ED8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.stroke();

        // High-contrast bold corner text
        ctx.fillStyle = "#1E3A8A";
        ctx.font = "bold 9.5px 'Inter', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`C${idx + 1}`, p.x, p.y);
      });
    }

    // 3. Draw Pill Labels directly on the wall boundary (and offset at corners)
    ctx.font = "bold 9.5px 'Inter', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    allZoneArcs.forEach(({ text, lx, ly, apex }) => {
      let drawX = lx;
      let drawY = ly;

      // If this label is at a corner vertex (e.g. C1, C2, C3, C4),
      // offset it outward/upward so it never collides with the corner badge!
      if (boundary.length > 0) {
        const pxB = boundary.map(toPx);
        for (const cp of pxB) {
          if (Math.hypot(lx - cp.x, ly - cp.y) < 22) {
            const dx = cp.x - (apex ? apex.x : lx);
            const dy = cp.y - (apex ? apex.y : ly);
            const mag = Math.hypot(dx, dy) || 1;
            // 32px offset gives clean separation: 10px corner + 14px space + 8px half-pill
            drawX = cp.x + (dx / mag) * 32;
            drawY = cp.y + (dy / mag) * 32;
            break;
          }
        }
      }

      const metrics = ctx.measureText(text);
      const pw = metrics.width + 10;
      const ph = 16;

      // Subtle elevation shadow so badge pops cleanly off the canvas
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 1;

      // Solid white background pill
      ctx.fillStyle = "#FFFFFF";
      fillRoundRect(ctx, drawX - pw / 2, drawY - ph / 2, pw, ph, 4);
      ctx.fill();
      ctx.restore();

      // Border matching boundary wall
      ctx.strokeStyle = "#2563EB";
      ctx.lineWidth = 1.2;
      fillRoundRect(ctx, drawX - pw / 2, drawY - ph / 2, pw, ph, 4);
      ctx.stroke();

      // Bold, high-contrast label text
      ctx.fillStyle = "#1E3A8A";
      ctx.fillText(text, drawX, drawY);
    });

    ctx.restore();
  }
};

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  floorPlanImage,
  boundary,
  onDrawBoundary,
  placedObjects,
  onMoveObject,
  onResizeObject,
  onRotateObject,
  onDeleteObject,
  objectSvgMap,
  devtaRegions = [],
  innerPolygon = [],
  middlePolygon = [],
  zone16Regions = [],
  zone8Regions = [],
  marmaData = null,
  shaktiChakra = false,
  shaktiChakraSize = 0.8,
  shaktiChakraType = "complete",
  plotCentroid = null,
  drawingObjectBoundary = [],
  drawingMode,
  onDevtaClick,
  onZoneClick,
  onPlaceObject,
  onCanvasClick,
  setDrawingMode,
  setDrawingObjectBoundary,
  selectedObjectType,
  northDirection,
  scale,
  wallLengths,
  setReferenceWallIndex,
  referenceWallIndex,
  wallColors,
  plotWidth,
  plotHeight,
  isStatic = false,
  highlightedZones,
  onObjectClick,
  walls = [],
  onAddWall,
  onSelectWall,
  selectedWall,
  onMoveBoundaryVertex,
  canvasRotation = 0,
  isPremium = false,
  isUnlimited = false,
  onDragEnd,
}) => {
  const [hoveredDevta, setHoveredDevta] = useState<DevtaRegion | null>(null);
  const [currentDrawingWall, setCurrentDrawingWall] = useState<{ start: Point; end: Point } | null>(null);
  const [measureStart, setMeasureStart] = useState<Point | null>(null);
  const [measureEnd, setMeasureEnd] = useState<Point | null>(null);
  const [measureCurrent, setMeasureCurrent] = useState<Point | null>(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [draggingVertexIndex, setDraggingVertexIndex] = useState<number | null>(null);
  const [imageLoadedTrigger, setImageLoadedTrigger] = useState(0); // Add this state
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [shaktiChakraZonesImg, setShaktiChakraZonesImg] = useState<HTMLImageElement | null>(null);
  const [shaktiChakraBaseImg, setShaktiChakraBaseImg] = useState<HTMLImageElement | null>(null);

  const { width, height } = dimensions;

  useEffect(() => {
    const img1 = new window.Image();
    img1.src = "/chakrazones.png";
    img1.onload = () => setShaktiChakraZonesImg(img1);

    const img2 = new window.Image();
    img2.src = "/shaktichakra.png";
    img2.onload = () => setShaktiChakraBaseImg(img2);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  // Compute Layout Logic
  const computedLayout = React.useMemo(() => {
    if (!imageRef.current || !floorPlanImage) {
      return { drawX: 0, drawY: 0, drawWidth: width, drawHeight: height };
    }
    const imgAspect = imageRef.current.naturalWidth / imageRef.current.naturalHeight;
    const canvasAspect = width / height;
    let drawWidth, drawHeight, drawX, drawY;

    if (imgAspect > canvasAspect) {
      drawWidth = width;
      drawHeight = width / imgAspect;
      drawX = 0;
      drawY = (height - drawHeight) / 2;
    } else {
      drawHeight = height;
      drawWidth = height * imgAspect;
      drawX = (width - drawWidth) / 2;
      drawY = 0;
    }
    return { drawX, drawY, drawWidth, drawHeight };
  }, [width, height, floorPlanImage, imageLoadedTrigger]);

  const toPx = (p: Point) => ({ 
    x: computedLayout.drawX + p.x * computedLayout.drawWidth, 
    y: computedLayout.drawY + p.y * computedLayout.drawHeight 
  });

  const getTransformedPoint = (x: number, y: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let localX = x - rect.left;
    let localY = y - rect.top;

    // Handle View Rotation for Mouse Events
    if (canvasRotation !== 0) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rad = (-canvasRotation * Math.PI) / 180;
      
      const relX = localX - centerX;
      const relY = localY - centerY;
      
      const rotatedX = relX * Math.cos(rad) - relY * Math.sin(rad);
      const rotatedY = relX * Math.sin(rad) + relY * Math.cos(rad);
      
      localX = rotatedX + centerX;
      localY = rotatedY + centerY;
    }

    const invertedZoom = 1 / zoom;
    const transformedX = (localX - offset.x) * invertedZoom;
    const transformedY = (localY - offset.y) * invertedZoom;

    return {
      x: transformedX,
      y: transformedY,
    };
  };

  const toNormalized = (p: Point) => ({
    x: (p.x - computedLayout.drawX) / computedLayout.drawWidth,
    y: (p.y - computedLayout.drawY) / computedLayout.drawHeight,
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    if (!isStatic) {
      ctx.translate(offset.x, offset.y);
      ctx.scale(zoom, zoom);
    }

    drawCanvasContent(
      ctx,
      width,
      height,
      floorPlanImage,
      imageRef,
      boundary,
      devtaRegions,
      innerPolygon,
      middlePolygon,
      zone16Regions,
      zone8Regions,
      marmaData,
      shaktiChakra,
      shaktiChakraSize,
      shaktiChakraType,
      plotCentroid,
      drawingObjectBoundary || [],
      drawingMode,
      hoveredDevta,
      northDirection,
      wallLengths,
      zoom,
      referenceWallIndex,
      wallColors,
      highlightedZones,
      plotWidth,
      plotHeight,
      walls,
      currentDrawingWall,
      selectedWall,
      scale,
      measureStart,
      measureEnd,
      measureCurrent,
      hoverPoint,
      isStatic,
      shaktiChakraType === "zones" ? shaktiChakraZonesImg : shaktiChakraBaseImg,
      computedLayout
    );
    ctx.restore();
  }, [
    width, height, floorPlanImage, boundary, placedObjects, devtaRegions,
    zone16Regions, zone8Regions, marmaData, shaktiChakra, shaktiChakraSize, shaktiChakraType,
    plotCentroid, drawingObjectBoundary, drawingMode, hoveredDevta, innerPolygon,
    middlePolygon, northDirection, wallLengths, referenceWallIndex,
    walls, currentDrawingWall, selectedWall, scale, measureStart, measureEnd, measureCurrent, hoverPoint,
    imageLoadedTrigger, shaktiChakraZonesImg, shaktiChakraBaseImg
  ]);

  useLayoutEffect(() => {
    if (drawingMode !== "measure") {
      setMeasureStart(null);
      setMeasureEnd(null);
      setMeasureCurrent(null);
    }
  }, [drawingMode]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // Handled via non-passive native listener in useEffect
  };

  const handleZoom = useCallback((delta: number, centerX: number, centerY: number) => {
    setZoom((prevZoom) => {
      const newZoom = Math.min(Math.max(prevZoom * (1 + delta), 0.2), 20);
      const zoomRatio = newZoom / prevZoom;
      
      setOffset((prev) => ({
        x: centerX - (centerX - prev.x) * zoomRatio,
        y: centerY - (centerY - prev.y) * zoomRatio,
      }));
      
      return newZoom;
    });
  }, []);

  // Native non-passive listener for Ctrl+Wheel (Laptop Zoom)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onNativeWheel = (e: WheelEvent) => {
      if (isStatic) return;
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.01;
        
        const rect = canvas.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        
        handleZoom(delta, offsetX, offsetY);
      } else {
        // Trackpad panning
        e.preventDefault();
        setOffset(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    canvas.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onNativeWheel);
  }, [handleZoom, isStatic]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isStatic) return;

    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Space pan style
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setLastPos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.button === 0 && (!drawingMode || drawingMode === "boundary" || drawingMode === "objects" || drawingMode === "select" || drawingMode === "wall")) {
      // Check if clicking on a vertex hook
      const point = getTransformedPoint(e.clientX, e.clientY);
      const normalizedPoint = { x: point.x / width, y: point.y / height };

      const tolerance = 12 / (Math.min(width, height) * zoom); 

      let foundVertex = -1;
      for (let i = 0; i < boundary.length; i++) {
        const p = boundary[i];
        const dist = Math.sqrt(Math.pow(p.x - normalizedPoint.x, 2) + Math.pow(p.y - normalizedPoint.y, 2));
        if (dist <= tolerance) {
          foundVertex = i;
          break;
        }
      }

      if (foundVertex !== -1) {
        setDraggingVertexIndex(foundVertex);
        return; 
      }
      
      // If we are just in "select" or no mode, allow panning with left click if not clicking anything?
      // For now, let's stick to standard behavior.
    }
  };

  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isStatic) return;
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setLastPos({ x: t.clientX, y: t.clientY });
      // We don't necessarily want to start "panning" with 1 finger if we are in drawing mode
      // But we need lastPos for potential pan.
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      setLastTouchDistance(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isStatic) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      
      if (lastTouchDistance !== null) {
        const delta = (dist - lastTouchDistance) * 0.01;
        const centerX = (t1.clientX + t2.clientX) / 2;
        const centerY = (t1.clientY + t2.clientY) / 2;
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          handleZoom(delta, centerX - rect.left, centerY - rect.top);
        }
      }
      setLastTouchDistance(dist);
      
      // Also pan with 2 fingers
      const currentCenterX = (t1.clientX + t2.clientX) / 2;
      const currentCenterY = (t1.clientY + t2.clientY) / 2;
      const dx = currentCenterX - lastPos.x;
      const dy = currentCenterY - lastPos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPos({ x: currentCenterX, y: currentCenterY });

    } else if (e.touches.length === 1 && !draggingVertexIndex && !currentDrawingWall && drawingMode !== "boundary") {
        // Option to pan with 1 finger if NOT in an active drawing/dragging state
        // But this can clash with "click to place object".
        // For now, let's only allow 2-finger pan/zoom to be safe on main canvas.
    }
  };

  const handleTouchEnd = () => {
    setLastTouchDistance(null);
  };

  const getSnappedPoint = (point: Point): Point => {
    let snappedPoint = { ...point };
    const tolerance = 15 / zoom; // Snapping tolerance in pixels

    // Snap to boundary
    if (boundary.length > 0) {
      for (let i = 0; i < boundary.length; i++) {
        const p1 = boundary[i];
        const p2 = boundary[(i + 1) % boundary.length];

        // Find nearest point on segment p1-p2
        const L2 = (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
        if (L2 === 0) continue;
        const t = ((point.x - p1.x) * (p2.x - p1.x) + (point.y - p1.y) * (p2.y - p1.y)) / L2;
        const projectionT = Math.max(0, Math.min(1, t));
        const projectionX = p1.x + projectionT * (p2.x - p1.x);
        const projectionY = p1.y + projectionT * (p2.y - p1.y);

        const dist = Math.sqrt(Math.pow(point.x - projectionX, 2) + Math.pow(point.y - projectionY, 2));
        if (dist * Math.min(width, height) < tolerance) {
          snappedPoint = { x: projectionX, y: projectionY };
          break;
        }
      }
    }

    // Orthogonality (if drawing a wall)
    if (currentDrawingWall) {
      const dx = Math.abs(snappedPoint.x - currentDrawingWall.start.x);
      const dy = Math.abs(snappedPoint.y - currentDrawingWall.start.y);
      if (dx > dy) {
        snappedPoint.y = currentDrawingWall.start.y;
      } else {
        snappedPoint.x = currentDrawingWall.start.x;
      }
    }

    return snappedPoint;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isStatic) return;

    if (isPanning) {
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPos({ x: e.clientX, y: e.clientY });
      return;
    }

    const point = getTransformedPoint(e.clientX, e.clientY);
    const normalizedPoint = toNormalized(point);
    setHoverPoint(normalizedPoint);

    if (draggingVertexIndex !== null && onMoveBoundaryVertex) {
      // Allow dragging out of bounds safely with Math.max/min if desired, but here we just pass pure normalized
      onMoveBoundaryVertex(draggingVertexIndex, normalizedPoint);
      return;
    }

    if (drawingMode === "measure" && measureStart && !measureEnd) {
      setMeasureCurrent(toNormalized(point));
    }

    if (drawingMode === "wall" && currentDrawingWall) {
      const snappedPoint = getSnappedPoint(toNormalized(point));
      setCurrentDrawingWall({
        start: currentDrawingWall.start,
        end: snappedPoint,
      });
      return;
    }

    let foundRegion = null;
    const allRegions = [...devtaRegions, ...zone16Regions, ...zone8Regions];

    for (const region of allRegions) {
      if (!region.polygon || region.polygon.length < 3) continue;

      const pts = region.polygon.map(toPx);
      const polygon = new Path2D();
      polygon.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => polygon.lineTo(p.x, p.y));
      polygon.closePath();

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && ctx.isPointInPath(polygon, point.x, point.y)) {
        foundRegion = region;
        break;
      }
    }
    setHoveredDevta(foundRegion);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isStatic) return;
    setIsPanning(false);
    setDraggingVertexIndex(null);
  };

  const handleMouseLeave = () => {
    setHoverPoint(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) return;

    const point = getTransformedPoint(e.clientX, e.clientY);
    const normalizedPoint = toNormalized(point);

    if (!isStatic) {
      if (drawingMode === "measure") {
        if (!measureStart || (measureStart && measureEnd)) {
          // start new measurement
          setMeasureStart(normalizedPoint);
          setMeasureEnd(null);
          setMeasureCurrent(normalizedPoint);
        } else if (measureStart && !measureEnd) {
          // finish measurement
          setMeasureEnd(normalizedPoint);
          setMeasureCurrent(null);
        }
        return;
      }

      if (drawingMode === "boundary" && onDrawBoundary) {
        onDrawBoundary(normalizedPoint);
        return;
      }

      if (drawingMode === "wall") {
        if (!currentDrawingWall) {
          const snappedStart = getSnappedPoint(normalizedPoint);
          setCurrentDrawingWall({ start: snappedStart, end: snappedStart });
        } else {
          const snappedEnd = getSnappedPoint(normalizedPoint);
          const newWall: Wall = {
            id: new Date().toISOString(),
            start: currentDrawingWall.start,
            end: snappedEnd,
            color: "#000",
            thickness: 5,
          };
          if (onAddWall) onAddWall(newWall);
          setCurrentDrawingWall(null);
        }
        return;
      }

      if (drawingMode === "objects" && onCanvasClick) {
        onCanvasClick(normalizedPoint);
        return;
      }
    }

    // Check if wall clicked
    if (!isStatic && walls.length > 0) {
      let wallClicked = false;
      for (const wall of walls) {
        const p1 = toPx(wall.start);
        const p2 = toPx(wall.end);
        if (isPointNearLineSegment(point.x, point.y, p1.x, p1.y, p2.x, p2.y)) {
          if (onSelectWall) onSelectWall(wall);
          wallClicked = true;
          break;
        }
      }
      if (wallClicked) return;
    }

    if (onObjectClick) {
      for (const obj of placedObjects) {
        const centroid = toPx(obj.centroid);
        // A simple circular click area for now
        if (Math.hypot(point.x - centroid.x, point.y - centroid.y) < 20) {
          onObjectClick(obj);
          return;
        }
      }
    }

    let regionClicked = false;
    const allRegions = [...devtaRegions, ...zone16Regions, ...zone8Regions];
    for (const region of allRegions) {
      if (!region.polygon || region.polygon.length < 3) continue;

      const pts = region.polygon.map(toPx);
      const polygon = new Path2D();
      polygon.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => polygon.lineTo(p.x, p.y));
      polygon.closePath();

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && ctx.isPointInPath(polygon, point.x, point.y)) {
        if (onDevtaClick && devtaRegions.includes(region)) {
          onDevtaClick(region);
          regionClicked = true;
          break;
        }
        if (onZoneClick && (zone16Regions.includes(region) || zone8Regions.includes(region))) {
          onZoneClick(region);
          regionClicked = true;
          break;
        }
      }
    }

    if (regionClicked) return;

    if (!isStatic && (drawingMode === null || drawingMode === "select") && setReferenceWallIndex) {
      if (!isPremium) {
        setReferenceWallIndex(null);
        return;
      }
      const pxBoundary = boundary.map(toPx);
      let wallClicked = false;
      for (let i = 0; i < pxBoundary.length; i++) {
        const p1 = pxBoundary[i];
        const p2 = pxBoundary[(i + 1) % pxBoundary.length];
        if (isPointNearLineSegment(point.x, point.y, p1.x, p1.y, p2.x, p2.y)) {
          setReferenceWallIndex(i);
          wallClicked = true;
          break;
        }

      }
      if (!wallClicked) {
        setReferenceWallIndex(null);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={'relative w-full h-full flex justify-center items-center bg-gray-100 overflow-hidden'}
    >
      <div 
        style={{ 
          transform: `rotate(${canvasRotation}deg)`,
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        {floorPlanImage && (
          <img
            ref={imageRef}
            src={floorPlanImage}
            alt="Floor Plan Source"
            className="hidden"
            crossOrigin="anonymous"
            onLoad={() => setImageLoadedTrigger(prev => prev + 1)}
          />
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="bg-white shadow-lg touch-none"
          onWheel={!isStatic ? handleWheel : undefined}
          onMouseDown={!isStatic ? handleMouseDown : undefined}
          onMouseMove={!isStatic ? handleMouseMove : undefined}
          onMouseUp={!isStatic ? handleMouseUp : undefined}
          onTouchStart={!isStatic ? handleTouchStart : undefined}
          onTouchMove={!isStatic ? handleTouchMove : undefined}
          onTouchEnd={!isStatic ? handleTouchEnd : undefined}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          tabIndex={0}
        />
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        >
          {placedObjects.map((obj) => (
            <DraggableObject
              key={obj.id}
              object={obj}
              onMove={onMoveObject}
              onResize={onResizeObject}
              onRotate={onRotateObject}
              onDelete={onDeleteObject}
              objectSvgMap={objectSvgMap}
              canvasRef={containerRef}
              highlight={obj.highlight}
              isStatic={isStatic}
              zoom={zoom}
              offset={offset}
              viewRotation={canvasRotation}
              computedLayout={computedLayout}
              isUnlimited={isUnlimited}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
