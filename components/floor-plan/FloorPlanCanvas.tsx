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
  showCornerBadges?: boolean;
  showTickLabels?: boolean;
  showArcLengths?: boolean;
  darkOverlay?: boolean;
  showDevta45?: boolean;
  showZone16?: boolean;
  showZone8?: boolean;
  selectedDistanceEntryName?: string | null;
  isPremium?: boolean;
  isUnlimited?: boolean;
  measurementMode?: "simple" | "focus" | "all";
  onSelectDistanceEntry?: (name: string | null) => void;
  onDragEnd?: (id: string) => void;
  onDistanceDataReady?: (data: DevtaDistanceEntry[]) => void;
}

export interface DevtaDistanceEntry {
  index: number;
  name: string;
  ring: "outer" | "middle" | "center" | "inner";
  distanceFt: number | null;
  distancePx: number;
  color: string;
}

/** Click/hover target for a zone arc pill or marker dot (screen px, untransformed canvas coords). */
export interface ArcHitTarget {
  tagX: number; tagY: number; w: number; h: number;
  midX: number; midY: number;
  name: string;
}

const ZONE_NAMES_16 = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
];
const ZONE_NAMES_8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const VASTU_BOUNDARY_COLORS: { [key: string]: string } = {
  "N": "#38BDF8", "NNE": "#0EA5E9", "NE": "#6366F1", "ENE": "#10B981",
  "E": "#22C55E", "ESE": "#84CC16", "SE": "#F97316", "SSE": "#EF4444",
  "S": "#DC2626", "SSW": "#EAB308", "SW": "#D97706", "WSW": "#A855F7",
  "W": "#8B5CF6", "WNW": "#94A3B8", "NW": "#64748B", "NNW": "#06B6D4",
};

const ZONE_COLORS_16: { [key: string]: string } = {
  "N": "#38BDF8",   // Sky Blue (Water / Jal)
  "NNE": "#0EA5E9", // Deep Ocean Aqua (Healing)
  "NE": "#6366F1",  // Indigo (Clarity - Ishanya)
  "ENE": "#10B981", // Emerald Mint (Refreshment)
  "E": "#22C55E",   // Growth Green (Sun & Social)
  "ESE": "#84CC16", // Lime Green (Thought & Analysis)
  "SE": "#F97316",  // Flame Orange (Cash & Energy - Agni)
  "SSE": "#EF4444", // Fire Red (Strength & Power)
  "S": "#DC2626",   // Deep Crimson (Fame - Yama)
  "SSW": "#EAB308", // Amber Ochre (Expenditure)
  "SW": "#D97706",  // Earthy Amber (Stability & Skills - Niruthi)
  "WSW": "#A855F7", // Lavender Purple (Knowledge)
  "W": "#8B5CF6",   // Royal Violet (Gains & Profits - Varuna)
  "WNW": "#94A3B8", // Slate Silver (Detox)
  "NW": "#64748B",  // Cool Steel (Support & Banking - Vayu)
  "NNW": "#06B6D4", // Radiant Cyan (Attraction)
};

const ZONE_COLORS_8: { [key: string]: string } = {
  "N": "#0284C7",   // Sky Blue (Kubera / Water)
  "NE": "#6366F1",  // Indigo (Ishanya / Water & Spirit)
  "E": "#16A34A",   // Emerald Green (Indra / Air & Sun)
  "SE": "#EA580C",  // Radiant Orange (Agni / Fire)
  "S": "#DC2626",   // Crimson Red (Yama / Fire & Earth)
  "SW": "#D97706",  // Ochre Amber (Niruthi / Earth)
  "W": "#7C3AED",   // Royal Purple (Varuna / Space)
  "NW": "#475569",  // Cool Steel (Vayu / Air & Space)
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

// Client-side fallback generator for 16 and 8 Vastu directional zones
export const generateClientZones = (
  boundary: Point[],
  plotCentroid: Point | null,
  northDirection: number,
  zoneNames: string[],
  label: "zone16" | "zone8"
): DevtaRegion[] => {
  if (!boundary || boundary.length < 3) return [];
  const center = plotCentroid || getCentroid(boundary);
  const n = zoneNames.length;
  const step = 360 / n;
  const absoluteStart = -(step / 2);

  const vastuAngleOfPoint = (p: Point): number => {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    // Screen angle (0=North/Up, clockwise)
    const screenDeg = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    // Vastu angle relative to True North
    return (screenDeg - northDirection + 360) % 360;
  };

  const isAngleBetween = (a: number, start: number, end: number): boolean => {
    const na = (a % 360 + 360) % 360;
    const ns = (start % 360 + 360) % 360;
    const ne = (end % 360 + 360) % 360;
    if (ns < ne) return na >= ns && na <= ne;
    return na >= ns || na <= ne;
  };

  const rayIntersection = (angleDeg: number): Point | null => {
    const screenRad = ((angleDeg + northDirection) % 360) * (Math.PI / 180);
    const dx = Math.sin(screenRad);
    const dy = -Math.cos(screenRad);

    let closestT = Infinity;
    let hit: Point | null = null;
    const bLen = boundary.length;

    for (let i = 0; i < bLen; i++) {
      const p1 = boundary[i];
      const p2 = boundary[(i + 1) % bLen];

      const v1x = center.x - p1.x;
      const v1y = center.y - p1.y;
      const v2x = p2.x - p1.x;
      const v2y = p2.y - p1.y;

      const cross = dx * v2y - dy * v2x;
      if (Math.abs(cross) < 1e-7) continue;

      const t2 = (dx * v1y - dy * v1x) / cross;
      const t1 = (v2x * v1y - v2y * v1x) / cross;

      if (t1 > 0.0001 && t2 >= 0 && t2 <= 1) {
        if (t1 < closestT) {
          closestT = t1;
          hit = { x: center.x + t1 * dx, y: center.y + t1 * dy };
        }
      }
    }
    return hit;
  };

  const regions: DevtaRegion[] = [];

  for (let i = 0; i < n; i++) {
    const name = zoneNames[i];
    const baseStart = absoluteStart + i * step;
    const baseCenter = baseStart + step / 2;
    const baseEnd = absoluteStart + (i + 1) * step;

    const startAngle = (baseStart + 360) % 360;
    const centerAngle = (baseCenter + 360) % 360;
    const endAngle = (baseEnd + 360) % 360;

    const pStart = rayIntersection(startAngle);
    const pCenter = rayIntersection(centerAngle);
    const pEnd = rayIntersection(endAngle);

    if (!pStart || !pEnd) continue;

    const intermediateCorners: Point[] = [];
    for (let k = 0; k < boundary.length; k++) {
      const pt = boundary[k];
      const ang = vastuAngleOfPoint(pt);
      if (isAngleBetween(ang, startAngle, endAngle)) {
        intermediateCorners.push(pt);
      }
    }

    intermediateCorners.sort((a, b) => {
      const angA = (vastuAngleOfPoint(a) - startAngle + 360) % 360;
      const angB = (vastuAngleOfPoint(b) - startAngle + 360) % 360;
      return angA - angB;
    });

    const polygon: Point[] = [
      center,
      pStart,
      ...intermediateCorners,
      pEnd,
    ];

    regions.push({
      id: `${label}-${i + 1}`,
      name,
      polygon,
      ring: label,
      startAngle,
      centerAngle,
      endAngle,
      source: "directional",
      center_intersection: pCenter || undefined,
    });
  }

  return regions;
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

  let apexIdx = 0;
  if (centroidPx) {
    let minDist = Infinity;
    pts.forEach((p, i) => {
      const d = Math.hypot(p.x - centroidPx.x, p.y - centroidPx.y);
      if (d < minDist) { minDist = d; apexIdx = i; }
    });
  } else {
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    let minDist = Infinity;
    pts.forEach((p, i) => {
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d < minDist) { minDist = d; apexIdx = i; }
    });
  }

  const n = pts.length;
  const arcPts: { x: number; y: number }[] = [];
  for (let i = 1; i < n; i++) {
    arcPts.push(pts[(apexIdx + i) % n]);
  }
  if (arcPts.length < 2) return null;

  const apex = pts[apexIdx];
  const subSegments: Array<{
    edgeStart: { x: number; y: number };
    edgeEnd: { x: number; y: number };
    midPt: { x: number; y: number };
    nx: number;
    ny: number;
    outX: number;
    outY: number;
    lenPx: number;
    realArcLength: number | null;
    text: string;
  }> = [];

  let totalLen = 0;
  for (let i = 0; i < arcPts.length - 1; i++) {
    const pStart = arcPts[i];
    const pEnd = arcPts[i + 1];
    const dx = pEnd.x - pStart.x;
    const dy = pEnd.y - pStart.y;
    const segLen = Math.hypot(dx, dy);
    if (segLen < 1) continue;

    totalLen += segLen;
    const midPt = { x: (pStart.x + pEnd.x) / 2, y: (pStart.y + pEnd.y) / 2 };
    const odx = midPt.x - apex.x;
    const ody = midPt.y - apex.y;
    const mag = Math.hypot(odx, ody) || 1;
    const realSegLen = realScale ? segLen * realScale : null;

    subSegments.push({
      edgeStart: pStart,
      edgeEnd: pEnd,
      midPt,
      nx: -(odx / mag),
      ny: -(ody / mag),
      outX: odx / mag,
      outY: ody / mag,
      lenPx: segLen,
      realArcLength: realSegLen,
      text: realSegLen !== null ? `${realSegLen.toFixed(1)} ft` : `${Math.round(segLen)} px`,
    });
  }

  if (subSegments.length === 0) return null;

  const midPt = subSegments.length === 1
    ? subSegments[0].midPt
    : {
        x: (subSegments[0].edgeStart.x + subSegments[subSegments.length - 1].edgeEnd.x) / 2,
        y: (subSegments[0].edgeStart.y + subSegments[subSegments.length - 1].edgeEnd.y) / 2,
      };

  const dx = midPt.x - apex.x;
  const dy = midPt.y - apex.y;
  const mag = Math.hypot(dx, dy) || 1;
  const totalRealLen = realScale ? totalLen * realScale : null;

  return {
    midPt,
    nx: -(dx / mag),
    ny: -(dy / mag),
    outX: dx / mag,
    outY: dy / mag,
    apex,
    totalLen,
    realArcLength: totalRealLen,
    edgeStart: subSegments[0].edgeStart,
    edgeEnd: subSegments[subSegments.length - 1].edgeEnd,
    subSegments,
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
  computedLayout?: { drawX: number; drawY: number; drawWidth: number; drawHeight: number },
  showCornerBadges: boolean = true,
  showTickLabels: boolean = true,
  showArcLengths: boolean = true,
  darkOverlay: boolean = true,
  showDevta45: boolean = true,
  showZone16: boolean = false,
  showZone8: boolean = false,
  selectedDistanceEntryName?: string | null,
  measurementMode?: "simple" | "focus" | "all",
  entryIndexByName?: Map<string, number>,
  hitCollector?: ArcHitTarget[],
  selectedPieceHint?: { name: string; x: number; y: number } | null
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

  // Selection isolates the outer sides: when a zone is selected, the base
  // boundary drops to neutral gray so ONLY the selected outer pieces (final
  // pass) read as highlighted. Matches cleanSelected used in the final pass.
  const cleanSelected = (selectedDistanceEntryName ?? "").split(" (")[0].trim().toLowerCase();
  const selectionActive = cleanSelected.length > 0 &&
    [...devtaRegions, ...zone16Regions, ...zone8Regions].some((r) => {
      const n = (r.name || "").toLowerCase();
      return n === cleanSelected || cleanSelected.includes(n) || n.includes(cleanSelected);
    });

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
    const pixelLength = Math.sqrt(
      Math.pow((currentDrawingWall.end.x - currentDrawingWall.start.x) * width, 2) +
      Math.pow((currentDrawingWall.end.y - currentDrawingWall.start.y) * height, 2)
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
    const SEGMENT_PALETTE = [
      "#2563EB", // 0: Blue (Front)
      "#10B981", // 1: Emerald (Right)
      "#F59E0B", // 2: Amber (Back)
      "#8B5CF6", // 3: Purple (Left)
      "#EC4899", // 4: Pink
      "#06B6D4", // 5: Cyan
      "#F97316", // 6: Orange
      "#14B8A6", // 7: Teal
    ];

    // 1. Draw each wall segment with distinct colors and highlighting
    for (let i = 0; i < pxBoundary.length; i++) {
      const p1 = pxBoundary[i];
      const p2 = pxBoundary[(i + 1) % pxBoundary.length];
      const isSelected = i === referenceWallIndex;
      const segColor = wallColors?.[i] || SEGMENT_PALETTE[i % SEGMENT_PALETTE.length];

      ctx.save();
      ctx.lineCap = "round";

      if (isSelected) {
        // Outer glowing halo for the selected wall segment
        ctx.shadowColor = segColor;
        ctx.shadowBlur = 18;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.strokeStyle = segColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Distinct corner end caps for selected wall
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 6, 0, Math.PI * 2);
        ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = segColor;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
        ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Unselected wall segment with distinct color
        ctx.strokeStyle = selectionActive ? "#94A3B8" : segColor;
        ctx.lineWidth = selectionActive ? 3 : 4;
        ctx.globalAlpha = selectionActive ? 0.55 : 0.85;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw Wall Length Badges on Boundary
    if (wallLengths && wallLengths.length === boundary.length) {
      const WALL_NAMES_4 = ["Front", "Right", "Back", "Left"];

      for (let i = 0; i < boundary.length; i++) {
        const p1 = pxBoundary[i];
        const p2 = pxBoundary[(i + 1) % boundary.length];
        const length = wallLengths[i];
        if (!length) continue;

        const isSelected = i === referenceWallIndex;
        const segColor = wallColors?.[i] || SEGMENT_PALETTE[i % SEGMENT_PALETTE.length];

        // Midpoint
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        // Angle for text align
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        let angle = Math.atan2(dy, dx);
        const segmentLength = Math.sqrt(dx * dx + dy * dy);
        if (segmentLength < 1) continue;
        let nx = dy / segmentLength;
        let ny = -dx / segmentLength;

        // Offset distance — selected badge is pushed out slightly with leader line
        const offset = isSelected ? 32 : 24;
        const offsetX = nx * offset;
        const offsetY = ny * offset;

        if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
          angle += Math.PI; // Keep text upright
          nx = -nx;
          ny = -ny;
        }

        ctx.save();
        ctx.translate(midX + offsetX, midY + offsetY);
        ctx.rotate(angle);

        // Text formulation
        const wallName = boundary.length === 4 ? WALL_NAMES_4[i] : `W${i + 1}`;
        const text = `${wallName}: ${length.toFixed(1)}`;
        ctx.font = isSelected ? "bold 13px 'Inter', Arial, sans-serif" : "600 11.5px 'Inter', Arial, sans-serif";
        const metrics = ctx.measureText(text);
        const bw = metrics.width + (isSelected ? 20 : 14);
        const bh = isSelected ? 24 : 20;

        if (isSelected) {
          ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
          ctx.shadowBlur = 8;
          ctx.fillStyle = segColor;
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = darkOverlay ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.92)";
          ctx.strokeStyle = segColor;
          ctx.lineWidth = 1.2;
        }

        fillRoundRect(ctx, -bw / 2, -bh / 2, bw, bh, isSelected ? 8 : 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isSelected ? "#FFFFFF" : (darkOverlay ? "#F8FAFC" : "#0F172A");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 0, 0.5);
        ctx.restore();

        // Selected wall: draw leader line and anchor dot
        if (isSelected) {
          ctx.save();
          ctx.strokeStyle = segColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(midX + offsetX, midY + offsetY);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(midX, midY, 5, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(midX, midY, 3, 0, Math.PI * 2);
          ctx.fillStyle = segColor;
          ctx.fill();
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

  if (showDevta45) {
    devtaRegions.forEach((region) => {
      if (!region.polygon || region.polygon.length < 3) return;
      const pts = region.polygon.map(toPx);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = devtaColors[region.name] ? `${devtaColors[region.name]}` : "rgba(200, 200, 200, 0.4)";
      ctx.fill();
      ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const center = getCentroid(pts);
      ctx.save();
      ctx.font = "bold 10.5px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (darkOverlay) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.lineWidth = 3;
        ctx.strokeText(region.name, center.x, center.y);
        ctx.fillStyle = "#0F172A";
        ctx.fillText(region.name, center.x, center.y);
      } else {
        ctx.fillStyle = "#1E293B";
        ctx.fillText(region.name, center.x, center.y);
      }
      ctx.restore();
    });
  }

  // Resolve effective 16 & 8 zones (with client fallback so zones always show immediately)
  const effectiveZone16 = (zone16Regions && zone16Regions.length > 0)
    ? zone16Regions
    : (boundary.length >= 3 ? generateClientZones(boundary, plotCentroid, northDirection, ZONE_NAMES_16, "zone16") : []);

  const effectiveZone8 = (zone8Regions && zone8Regions.length > 0)
    ? zone8Regions
    : (boundary.length >= 3 ? generateClientZones(boundary, plotCentroid, northDirection, ZONE_NAMES_8, "zone8") : []);

  // Collect zone16 arc data for final-pass label rendering (drawn on boundary wall)
  const zone16Arcs: Array<{
    text: string; lx: number; ly: number;
    nx: number; ny: number; outX: number; outY: number;
    apex: { x: number; y: number };
    edgeStart: { x: number; y: number }; edgeEnd: { x: number; y: number };
    name?: string;
  }> = [];

  if (showZone16) {
    effectiveZone16.forEach((region) => {
      if (!region.polygon || region.polygon.length < 3) return;
      const pts = region.polygon.map(toPx);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();

      const isHighlighted = highlightedZones?.includes(region.name);
      const color = ZONE_COLORS_16[region.name] || "#38BDF8";
      ctx.fillStyle = isHighlighted ? `${color}DD` : `${color}55`;
      ctx.fill();

      // Sharp, distinct dividing boundary line
      ctx.strokeStyle = isHighlighted ? "#EF4444" : (darkOverlay ? "rgba(15, 23, 42, 0.75)" : "rgba(30, 41, 59, 0.65)");
      ctx.lineWidth = isHighlighted ? 3.5 : 2;
      ctx.lineJoin = "round";
      ctx.stroke();

      const center = getCentroid(pts);

      // Draw center ray line from centroid to center_intersection
      if (region.center_intersection) {
        const cent = plotCentroid ? toPx(plotCentroid) : getCentroid(boundary.map(toPx));
        const cInt = toPx(region.center_intersection);
        ctx.beginPath();
        ctx.moveTo(cent.x, cent.y);
        ctx.lineTo(cInt.x, cInt.y);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Zone name badge with high contrast background and color stroke
      ctx.font = "bold 11px 'Inter', sans-serif";
      const metrics = ctx.measureText(region.name);
      const bw = metrics.width + 12;
      const bh = 18;

      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = 4;
      ctx.fillStyle = darkOverlay ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.95)";
      fillRoundRect(ctx, center.x - bw / 2, center.y - bh / 2, bw, bh, 6);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = darkOverlay ? "#FFFFFF" : "#0F172A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(region.name, center.x, center.y);

      ctx.restore();

      // Collect for final-pass rendering directly ON the wall boundary
      const plotCpx = plotCentroid ? toPx(plotCentroid) : null;
      const arcInfo = computeZoneOuterArc(pts, realScale ?? null, plotCpx);
      if (arcInfo && arcInfo.totalLen > 2) {
        arcInfo.subSegments.forEach((subSeg) => {
          zone16Arcs.push({
            text: subSeg.text,
            lx: subSeg.midPt.x,
            ly: subSeg.midPt.y,
            nx: subSeg.nx,
            ny: subSeg.ny,
            outX: subSeg.outX,
            outY: subSeg.outY,
            apex: arcInfo.apex,
            edgeStart: subSeg.edgeStart,
            edgeEnd: subSeg.edgeEnd,
            name: region.name,
          });
        });
      }
    });
  }

  // Collect zone8 arc data for final-pass label rendering
  const zone8Arcs: Array<{
    text: string; lx: number; ly: number;
    nx: number; ny: number; outX: number; outY: number;
    apex: { x: number; y: number };
    edgeStart: { x: number; y: number }; edgeEnd: { x: number; y: number };
    name?: string;
  }> = [];

  if (showZone8) {
    effectiveZone8.forEach((region) => {
      if (!region.polygon || region.polygon.length < 3) return;
      const pts = region.polygon.map(toPx);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();

      const isHighlighted = highlightedZones?.includes(region.name);
      const color = ZONE_COLORS_8[region.name] || "#10B981";
      ctx.fillStyle = isHighlighted ? `${color}DD` : `${color}55`;
      ctx.fill();

      // Sharp, distinct dividing boundary line
      ctx.strokeStyle = isHighlighted ? "#EF4444" : (darkOverlay ? "rgba(15, 23, 42, 0.75)" : "rgba(30, 41, 59, 0.65)");
      ctx.lineWidth = isHighlighted ? 3.5 : 2;
      ctx.lineJoin = "round";
      ctx.stroke();

      const center = getCentroid(pts);

      // Draw center ray line from centroid to center_intersection
      if (region.center_intersection) {
        const cent = plotCentroid ? toPx(plotCentroid) : getCentroid(boundary.map(toPx));
        const cInt = toPx(region.center_intersection);
        ctx.beginPath();
        ctx.moveTo(cent.x, cent.y);
        ctx.lineTo(cInt.x, cInt.y);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Zone name badge
      ctx.font = "bold 11.5px 'Inter', sans-serif";
      const metrics = ctx.measureText(region.name);
      const bw = metrics.width + 14;
      const bh = 19;

      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = 4;
      ctx.fillStyle = darkOverlay ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.95)";
      fillRoundRect(ctx, center.x - bw / 2, center.y - bh / 2, bw, bh, 6);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = darkOverlay ? "#FFFFFF" : "#0F172A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(region.name, center.x, center.y);

      ctx.restore();

      const plotCpx8 = plotCentroid ? toPx(plotCentroid) : null;
      const arcInfo = computeZoneOuterArc(pts, realScale ?? null, plotCpx8);
      if (arcInfo && arcInfo.totalLen > 2) {
        arcInfo.subSegments.forEach((subSeg) => {
          zone8Arcs.push({
            text: subSeg.text,
            lx: subSeg.midPt.x,
            ly: subSeg.midPt.y,
            nx: subSeg.nx,
            ny: subSeg.ny,
            outX: subSeg.outX,
            outY: subSeg.outY,
            apex: arcInfo.apex,
            edgeStart: subSeg.edgeStart,
            edgeEnd: subSeg.edgeEnd,
            name: region.name,
          });
        });
      }
    });
  }

  // Collect devta arc & dimension data for Outer, Middle, and Center ring devtas
  const devtaArcs: Array<{
    text: string; lx: number; ly: number;
    nx: number; ny: number; outX: number; outY: number;
    apex: { x: number; y: number };
    edgeStart: { x: number; y: number }; edgeEnd: { x: number; y: number };
    ring: string; name: string;
  }> = [];

  if (showDevta45 && devtaRegions.length > 0) {
    const plotCpxD = plotCentroid ? toPx(plotCentroid) : null;
    devtaRegions.forEach((region) => {
      if (!region.polygon || region.polygon.length < 3) return;
      const pts = region.polygon.map(toPx);
      const ringType = region.ring || "outer";

      if (ringType === "center" || region.name === "Brahma") {
        // Center / Brahma zone: compute bounding box dimensions
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        const minX = Math.min(...xs); const maxX = Math.max(...xs);
        const minY = Math.min(...ys); const maxY = Math.max(...ys);
        const wPx = maxX - minX;
        const hPx = maxY - minY;
        const cX = (minX + maxX) / 2;
        const cY = (minY + maxY) / 2;
        
        const wFt = realScale ? wPx * realScale : null;
        const hFt = realScale ? hPx * realScale : null;
        const text = wFt !== null && hFt !== null
          ? `Brahma: ${wFt.toFixed(1)} ft × ${hFt.toFixed(1)} ft`
          : `Brahma: ${Math.round(wPx)}px × ${Math.round(hPx)}px`;

        devtaArcs.push({
          text,
          lx: cX,
          ly: cY,
          nx: 0, ny: -1,
          outX: 0, outY: 1,
          apex: { x: cX, y: cY },
          edgeStart: { x: minX, y: minY },
          edgeEnd: { x: maxX, y: maxY },
          ring: "center",
          name: region.name,
        });
      } else if (ringType === "outer") {
        // Outer ring devtas ONLY: compute outer boundary segment length
        const arcInfo = computeZoneOuterArc(pts, realScale ?? null, plotCpxD);
        if (arcInfo && arcInfo.totalLen > 2) {
          arcInfo.subSegments.forEach((subSeg) => {
            devtaArcs.push({
              text: subSeg.text,
              lx: subSeg.midPt.x,
              ly: subSeg.midPt.y,
              nx: subSeg.nx,
              ny: subSeg.ny,
              outX: subSeg.outX,
              outY: subSeg.outY,
              apex: arcInfo.apex,
              edgeStart: subSeg.edgeStart,
              edgeEnd: subSeg.edgeEnd,
              ring: ringType,
              name: region.name,
            });
          });
        }
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

  // NOTE: selection highlight is drawn ONLY on the outer boundary sides
  // (final pass below). The region-interior fill + center badge were removed
  // per client request — no wedge fills, no duplicate labels inside the plot.

  if (boundary.length > 0) {
    const pxBoundary = boundary.map(toPx);
    ctx.beginPath();
    ctx.moveTo(pxBoundary[0].x, pxBoundary[0].y);
    pxBoundary.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.lineWidth = selectionActive ? 3 : 5;
    ctx.strokeStyle = selectionActive ? "#94A3B8" : "#2563EB";
    ctx.stroke();
  }
  // Draw North Indicator
  if (boundary.length > 0) {
    let anchorPoint = plotCentroid;

    if (!anchorPoint && boundary.length > 0) {
      anchorPoint = getCentroid(boundary);
    }
    
    const pxCentroid = anchorPoint ? toPx(anchorPoint) : { x: width / 2, y: height / 2 };
    const xCenter = pxCentroid.x;
    const yCenter = pxCentroid.y;

    ctx.save();
    if (boundary.length >= 3) {
      ctx.beginPath();
      const pxB = boundary.map(toPx);
      ctx.moveTo(pxB[0].x, pxB[0].y);
      pxB.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.clip();
    }

    ctx.translate(xCenter, yCenter);
    ctx.rotate((-northDirection * Math.PI) / 180);

    // True North-South Axis Line (perfect long-distance centerline)
    ctx.beginPath();
    ctx.moveTo(0, -20000);
    ctx.lineTo(0, 20000);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(211, 47, 47, 0.75)";
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

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
  // FINAL PASS: progressive-disclosure measurement overlay.
  // simple → no zone pills (wall badges above are enough, list is source of truth)
  // focus  → dots for all zones + ONE full pill for the selected list entry
  // all    → every pill, with collision-culling so short walls stay readable
  // One pill per zone: sub-segments of the same zone (e.g. Jayant split across
  // a corner) are merged so the outer length shows once, as a total.
  // ════════════════════════════════════════════════════════════════════════
  const allZoneArcs = [
    ...(showZone16 ? zone16Arcs.map(a => ({ ...a, ring: "outer" as const, name: (a as any).name || "Zone" })) : []),
    ...(showZone8 ? zone8Arcs.map(a => ({ ...a, ring: "outer" as const, name: (a as any).name || "Zone" })) : []),
    ...(showDevta45 ? devtaArcs : []),
  ];

  interface MergedArc {
    name: string; ring: string; text: string; origText?: string;
    outX: number; outY: number;
    apex: { x: number; y: number };
    edgeStart: { x: number; y: number }; edgeEnd: { x: number; y: number };
    segments: Array<{
      edgeStart: { x: number; y: number }; edgeEnd: { x: number; y: number };
      midX: number; midY: number; outX: number; outY: number; lenPx: number;
    }>;
    totalPx: number;
    /** Display piece (pill + highlight). Longest by default, or the clicked piece. */
    repIdx: number;
  }
  const mergedArcs: MergedArc[] = [];
  {
    const byKey = new Map<string, MergedArc & { origText: string }>();
    allZoneArcs.forEach((a: any) => {
      const ring = a.ring || "outer";
      const name = a.name || "Zone";
      // Center/Brahma pseudo-arcs are not boundary pieces — never merge them.
      const key = ring === "center"
        ? `center:${name.toLowerCase()}:${mergedArcs.length}`
        : `${ring}:${name.toLowerCase()}`;
      const lenPx = a.edgeStart && a.edgeEnd
        ? Math.hypot(a.edgeEnd.x - a.edgeStart.x, a.edgeEnd.y - a.edgeStart.y) : 0;
      const midX = a.edgeStart && a.edgeEnd ? (a.edgeStart.x + a.edgeEnd.x) / 2 : a.lx;
      const midY = a.edgeStart && a.edgeEnd ? (a.edgeStart.y + a.edgeEnd.y) / 2 : a.ly;
      let m = byKey.get(key);
      if (!m) {
        m = {
          name, ring, text: "", origText: a.text,
          outX: a.outX, outY: a.outY, apex: a.apex,
          edgeStart: a.edgeStart, edgeEnd: a.edgeEnd,
          segments: [], totalPx: 0, repIdx: 0,
        };
        byKey.set(key, m);
        mergedArcs.push(m);
      }
      m.segments.push({ edgeStart: a.edgeStart, edgeEnd: a.edgeEnd, midX, midY, outX: a.outX, outY: a.outY, lenPx });
      m.totalPx += lenPx;
    });
    // Finalize: pill + highlight sit on the display piece — the longest piece
    // by default, or the exact piece the user clicked (selectedPieceHint).
    // Text is the OUTER total for multi-piece zones, exact label otherwise.
    mergedArcs.forEach((m) => {
      let rep = 0;
      for (let i = 1; i < m.segments.length; i++) {
        if (m.segments[i] && m.segments[rep] && m.segments[i].lenPx > m.segments[rep].lenPx) rep = i;
      }
      if (
        selectedPieceHint && m.segments.length > 1 &&
        (m.name || "").toLowerCase() === (selectedPieceHint.name || "").toLowerCase()
      ) {
        let best = rep;
        let bestD = Infinity;
        m.segments.forEach((s, i) => {
          if (!s) return;
          const d = Math.hypot(s.midX - selectedPieceHint.x, s.midY - selectedPieceHint.y);
          if (d < bestD) { bestD = d; best = i; }
        });
        rep = best;
      }
      m.repIdx = rep;
      const repSeg = m.segments[rep];
      if (repSeg) {
        m.edgeStart = repSeg.edgeStart; m.edgeEnd = repSeg.edgeEnd;
        m.outX = repSeg.outX; m.outY = repSeg.outY;
      }
      if (m.segments.length <= 1) {
        m.text = m.origText ?? m.text;
      } else {
        const totalReal = realScale ? m.totalPx * realScale : null;
        m.text = totalReal != null ? `${totalReal.toFixed(1)} ft` : `${Math.round(m.totalPx)} px`;
      }
    });
  }

  // Ring colors
  const RING_COLORS: Record<string, string> = {
    outer:  "#3B82F6", // Blue
    middle: "#F59E0B", // Amber
    inner:  "#A855F7", // Purple
    center: "#10B981", // Emerald
  };

  const mode: "simple" | "focus" | "all" =
    measurementMode ?? (showArcLengths ? "all" : "simple");
  const isArcSelected = (name: string) => {
    if (!cleanSelected) return false;
    const n = (name || "").toLowerCase();
    return n === cleanSelected || cleanSelected.includes(n) || n.includes(cleanSelected);
  };

  const drawPillBadge = (
    item: { text: string; name?: string },
    tagX: number, tagY: number, col: string, idxLabel: string
  ) => {
    ctx.save();
    ctx.font = "bold 9.5px 'Inter', system-ui, sans-serif";
    const zoneName = (item as any).name || "";
    const labelText = zoneName ? `${zoneName}: ${item.text}` : item.text;
    const metrics = ctx.measureText(labelText);
    const textWidth = metrics.width;

    const circleRadius = 7;
    const badgeHeight = 17;
    const badgeWidth = textWidth + 24;

    // Pill shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1;

    // Pill background fill
    ctx.fillStyle = darkOverlay ? "#0F172A" : "#FFFFFF";
    fillRoundRect(ctx, tagX - badgeWidth / 2, tagY - badgeHeight / 2, badgeWidth, badgeHeight, 8.5);
    ctx.fill();

    // Pill border (matching zone ring color)
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Number circle inside pill (left side of pill)
    const dotX = tagX - badgeWidth / 2 + 10;
    const dotY = tagY;
    ctx.beginPath();
    ctx.arc(dotX, dotY, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();

    // Index number text inside circle
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${idxLabel.length > 2 ? 7 : 8}px 'Inter', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(idxLabel, dotX, dotY + 0.5);

    // Devta / Zone Name + Length text inside pill (right side of circle)
    ctx.font = "bold 9.5px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = darkOverlay ? "#F8FAFC" : "#0F172A";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, dotX + circleRadius + 4, tagY + 0.5);

    ctx.restore();
    return { badgeWidth, badgeHeight };
  };

  const FOCUS_CLEAR_PX = 78;
  let focusTag: { x: number; y: number } | null = null;

  // Stale click targets must never survive a frame that draws no pills.
  if (hitCollector) hitCollector.length = 0;

  if (allZoneArcs.length > 0 && showArcLengths && mode !== "simple") {
    ctx.save();

    // Pre-compute tag boxes for culling in "all" mode
    const boxes: { x: number; y: number; w: number; h: number }[] = [];
    const overlaps = (x: number, y: number, w: number, h: number) =>
      boxes.some((b) => Math.abs(b.x - x) < (b.w + w) / 2 + 12 && Math.abs(b.y - y) < (b.h + h) / 2 + 10);

    // Longest zones first so important labels win the space (one pill per zone)
    const ordered = mergedArcs
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.edgeStart && item.edgeEnd && item.totalPx >= 4)
      .sort((a, b) => b.item.totalPx - a.item.totalPx);

    // In "all" mode cap full pills so the canvas never fills up; rest become clean dots
    const MAX_PILLS_ALL = 8;
    let pillsDrawn = 0;

    // Focus mode: locate the selected tag first so neighbours can be cleared
    // out of an exclusion zone around it (fixes the stacked-pill clutter).
    // Hoisted assignment — focusTag is reused by the tick-label pass below.
    focusTag = null;
    if (mode === "focus" && cleanSelected) {
      for (const { item } of ordered) {
        if (!isArcSelected(item.name || "")) continue;
        const { edgeStart, edgeEnd, outX, outY } = item;
        if (!edgeStart || !edgeEnd) continue;
        const midX = (edgeStart.x + edgeEnd.x) / 2;
        const midY = (edgeStart.y + edgeEnd.y) / 2;
        focusTag = { x: midX + (outX || 0) * 44, y: midY + (outY || 0) * 44 };
        break;
      }
    }

    const pillNumberFor = (name: string, fallbackIdx: number): string => {
      const n = entryIndexByName?.get((name || "").toLowerCase());
      return `${n ?? fallbackIdx + 1}`;
    };

    // Extra click targets for the non-display pieces of a multi-piece zone,
    // so clicking any side of the zone selects it AND moves the highlight there.
    const pushExtraPieceTargets = (item: MergedArc) => {
      if (!hitCollector || item.segments.length <= 1) return;
      item.segments.forEach((s, i) => {
        if (i === item.repIdx || !s.edgeStart || !s.edgeEnd) return;
        hitCollector.push({ tagX: s.midX, tagY: s.midY, w: 18, h: 18, midX: s.midX, midY: s.midY, name: item.name });
      });
    };

    ordered.forEach(({ item, idx }) => {
      const { edgeStart, edgeEnd, outX, outY } = item;
      const ring = item.ring || "outer";
      const col = RING_COLORS[ring] || "#3B82F6";

      if (!edgeStart || !edgeEnd) return;
      if (item.totalPx < 4) return;

      const selected = isArcSelected(item.name || "");
      const midX = (edgeStart.x + edgeEnd.x) / 2;
      const midY = (edgeStart.y + edgeEnd.y) / 2;

      // focus mode: only the selected entry gets a full pill + highlight.
      // Everything inside the exclusion zone around the selected pill is
      // hidden so the data can't pile up on the highlight.
      if (mode === "focus" && !selected) {
        if (focusTag) {
          const nearTag =
            Math.hypot(midX - focusTag.x, midY - focusTag.y) < FOCUS_CLEAR_PX ||
            Math.hypot(
              midX + (outX || 0) * 18 - focusTag.x,
              midY + (outY || 0) * 18 - focusTag.y
            ) < FOCUS_CLEAR_PX;
          if (nearTag) return; // cleared — discoverable via the list
        }
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(midX, midY, 3, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        hitCollector?.push({ tagX: midX, tagY: midY, w: 14, h: 14, midX, midY, name: item.name });
        pushExtraPieceTargets(item);
        return;
      }

      // 1. Highlight lines ALONG the boundary pieces.
      // Selected zone → ONLY the single longest outer side (the piece the
      // pill sits on). Other pieces of the same zone stay unlit so a
      // corner-spanning zone never lights up two walls at once.
      // Unselected zones (all-mode) keep faint extent lines on all pieces.
      const drawPiece = (s: { edgeStart: { x: number; y: number }; edgeEnd: { x: number; y: number } }) => {
        if (!s.edgeStart || !s.edgeEnd) return;
        if (selected) {
          ctx.save();
          ctx.lineCap = "round";
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 12;
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 10;
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.moveTo(s.edgeStart.x, s.edgeStart.y);
          ctx.lineTo(s.edgeEnd.x, s.edgeEnd.y);
          ctx.stroke();
          ctx.restore();
        }
        ctx.save();
        ctx.lineCap = "round";
        ctx.strokeStyle = col;
        ctx.lineWidth = selected ? 6 : ring === "outer" ? 4 : 2.5;
        ctx.globalAlpha = selected ? 1 : 0.55;
        if (selected) {
          ctx.shadowColor = col;
          ctx.shadowBlur = 16;
        }
        ctx.beginPath();
        ctx.moveTo(s.edgeStart.x, s.edgeStart.y);
        ctx.lineTo(s.edgeEnd.x, s.edgeEnd.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
      };
      if (selected) {
        drawPiece({ edgeStart: item.edgeStart, edgeEnd: item.edgeEnd });
      } else {
        item.segments.forEach(drawPiece);
      }

      // 2. Pill badge (culled in "all" mode)
      // Selected pill sits further out with a leader line so it never
      // sits on top of neighbour dots.
      const offsetDist = selected ? 44 : 18;
      const tagX = midX + (outX || 0) * offsetDist;
      const tagY = midY + (outY || 0) * offsetDist;

      if (selected && (outX || outY)) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.95)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(tagX, tagY);
        ctx.stroke();
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(tagX, tagY);
        ctx.stroke();
        // Anchor dot on the wall
        ctx.beginPath();
        ctx.arc(midX, midY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(midX, midY, 3, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.restore();
      }

      if (mode === "all" && !selected) {
        // Estimate box then cull overlaps / cap
        ctx.save();
        ctx.font = "bold 9.5px 'Inter', system-ui, sans-serif";
        const zoneName = item.name || "";
        const labelText = zoneName ? `${zoneName}: ${item.text}` : item.text;
        const estW = ctx.measureText(labelText).width + 24;
        ctx.restore();
        if (pillsDrawn >= MAX_PILLS_ALL || overlaps(tagX, tagY, estW, 17)) {
          // Fallback: quiet dot so the zone is still discoverable via the list
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(midX, midY, 3, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
          hitCollector?.push({ tagX: midX, tagY: midY, w: 14, h: 14, midX, midY, name: item.name });
          pushExtraPieceTargets(item);
          return;
        }
        boxes.push({ x: tagX, y: tagY, w: estW, h: 17 });
        pillsDrawn += 1;
        hitCollector?.push({ tagX, tagY, w: estW, h: 17, midX, midY, name: item.name });
        pushExtraPieceTargets(item);
      } else {
        // Pill (or selected dot fallback target) is clickable
        ctx.save();
        ctx.font = "bold 9.5px 'Inter', system-ui, sans-serif";
        const zoneName = item.name || "";
        const labelText = zoneName ? `${zoneName}: ${item.text}` : item.text;
        const haloW = ctx.measureText(labelText).width + 24;
        ctx.restore();
        hitCollector?.push({ tagX, tagY, w: haloW, h: 17, midX, midY, name: item.name });
        pushExtraPieceTargets(item);
      }

      if (selected) {
        // White halo behind the selected pill so it pops off the plot
        ctx.save();
        ctx.font = "bold 9.5px 'Inter', system-ui, sans-serif";
        const zoneName = item.name || "";
        const labelText = zoneName ? `${zoneName}: ${item.text}` : item.text;
        const haloW = ctx.measureText(labelText).width + 24;
        ctx.strokeStyle = "rgba(255,255,255,0.95)";
        ctx.lineWidth = 5;
        fillRoundRect(ctx, tagX - haloW / 2, tagY - 17 / 2, haloW, 17, 8.5);
        ctx.stroke();
        ctx.restore();
      }
      drawPillBadge(item, tagX, tagY, col, pillNumberFor(item.name, idx));
    });

    ctx.restore();
  }

  // Draw Corner Wall Offset Tags (e.g., C1+16.0 ft) — kept as-is, only in focus/all so Simple stays clean
  if (showTickLabels && mode !== "simple" && allZoneArcs.length > 0 && boundary.length > 0) {
    const pxB = boundary.map(toPx);
    ctx.save();

    allZoneArcs.forEach((item) => {
      if (!item.edgeStart) return;
      const ref = getWallCornerReference(item.edgeStart, pxB, wallLengths, realScale ?? null);
      if (!ref || ref.realDist === null) return;

      const tagText = `${ref.cornerLabel}+${ref.realDist.toFixed(1)}ft`;
      const pt = item.edgeStart;
      const ox = (item.outX || 0) * 26;
      const oy = (item.outY || 0) * 26;
      const tx = pt.x + ox;
      const ty = pt.y + oy;

      // In focus mode, hide tick tags crowding the selected pill's exclusion zone
      if (mode === "focus" && focusTag && Math.hypot(tx - focusTag.x, ty - focusTag.y) < FOCUS_CLEAR_PX) {
        return;
      }

      ctx.save();
      ctx.font = "bold 8.5px 'Inter', Arial, sans-serif";
      const metrics = ctx.measureText(tagText);
      const tw = metrics.width;
      const th = 11;

      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 4;
      ctx.fillStyle = darkOverlay ? "rgba(15, 23, 42, 0.95)" : "rgba(241, 245, 249, 0.95)";
      fillRoundRect(ctx, tx - tw / 2 - 3, ty - th / 2, tw + 6, th + 2, 3);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = darkOverlay ? "#3B82F6" : "#2563EB";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = darkOverlay ? "#FFFFFF" : "#0F172A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tagText, tx, ty + 0.5);
      ctx.restore();
    });

    ctx.restore();
  }

  // Draw Corner Reference Handles (C1, C2...) — kept separate, always clean
  if (showCornerBadges && boundary.length > 0 && !isStatic && (drawingMode === "boundary" || drawingMode === "objects" || drawingMode === "select" || !drawingMode)) {
    const pxB = boundary.map(toPx);
    pxB.forEach((p, idx) => {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = darkOverlay ? "#0F172A" : "#FFFFFF";
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = darkOverlay ? "#3B82F6" : "#1D4ED8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = darkOverlay ? "#FFFFFF" : "#1E3A8A";
      ctx.font = "bold 10px 'Inter', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`C${idx + 1}`, p.x, p.y);
    });
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
  showCornerBadges = true,
  showTickLabels = true,
  showArcLengths = true,
  darkOverlay = true,
  showDevta45 = true,
  showZone16 = false,
  showZone8 = false,
  selectedDistanceEntryName,
  isPremium = false,
  isUnlimited = false,
  measurementMode,
  onSelectDistanceEntry,
  onDragEnd,
  onDistanceDataReady,
}) => {
  const [hoveredDevta, setHoveredDevta] = useState<DevtaRegion | null>(null);
  const [currentDrawingWall, setCurrentDrawingWall] = useState<{ start: Point; end: Point } | null>(null);
  const [measureStart, setMeasureStart] = useState<Point | null>(null);
  const [measureEnd, setMeasureEnd] = useState<Point | null>(null);
  const [measureCurrent, setMeasureCurrent] = useState<Point | null>(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [draggingVertexIndex, setDraggingVertexIndex] = useState<number | null>(null);
  const [imageLoadedTrigger, setImageLoadedTrigger] = useState(0); // Add this state
  // Which exact wall piece of a multi-piece zone the user clicked — the pill
  // and highlight both move to that piece instead of the longest one.
  const [selectedPieceHint, setSelectedPieceHint] = useState<{ name: string; x: number; y: number } | null>(null);
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
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(container);

    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Compute Layout Logic
  const computedLayout = React.useMemo(() => {
    let targetAspect = 4 / 3;
    if (floorPlanImage && imageRef.current && imageRef.current.naturalWidth && imageRef.current.naturalHeight) {
      targetAspect = imageRef.current.naturalWidth / imageRef.current.naturalHeight;
    }
    const canvasAspect = width / height;
    let drawWidth, drawHeight, drawX, drawY;

    if (targetAspect > canvasAspect) {
      drawWidth = width;
      drawHeight = width / targetAspect;
      drawX = 0;
      drawY = (height - drawHeight) / 2;
    } else {
      drawHeight = height;
      drawWidth = height * targetAspect;
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

  const effectiveZone16 = React.useMemo(() => {
    return (zone16Regions && zone16Regions.length > 0)
      ? zone16Regions
      : (boundary.length >= 3 ? generateClientZones(boundary, plotCentroid, northDirection, ZONE_NAMES_16, "zone16") : []);
  }, [zone16Regions, boundary, plotCentroid, northDirection]);

  const effectiveZone8 = React.useMemo(() => {
    return (zone8Regions && zone8Regions.length > 0)
      ? zone8Regions
      : (boundary.length >= 3 ? generateClientZones(boundary, plotCentroid, northDirection, ZONE_NAMES_8, "zone8") : []);
  }, [zone8Regions, boundary, plotCentroid, northDirection]);

  // Compute distance data entries for the HTML legend panel
  const distanceData = React.useMemo((): DevtaDistanceEntry[] => {
    const RING_COLORS: Record<string, string> = {
      outer: "#3B82F6", middle: "#F59E0B", inner: "#A855F7", center: "#10B981",
    };
    const entries: DevtaDistanceEntry[] = [];
    let idx = 0;

    const toPxMemo = (p: Point) => ({
      x: computedLayout.drawX + p.x * computedLayout.drawWidth,
      y: computedLayout.drawY + p.y * computedLayout.drawHeight,
    });
    const plotCpx = plotCentroid ? toPxMemo(plotCentroid) : null;

    if (showZone16 && effectiveZone16.length > 0) {
      effectiveZone16.forEach((region) => {
        if (!region.polygon || region.polygon.length < 3) return;
        const pts = region.polygon.map(toPxMemo);
        const arcInfo = computeZoneOuterArc(pts, scale ?? null, plotCpx);
        if (!arcInfo || arcInfo.totalLen < 2) return;

        const name = arcInfo.subSegments.length > 1 && scale
          ? `${region.name} (${arcInfo.subSegments.map(s => `${s.realArcLength?.toFixed(1)}ft`).join(" + ")})`
          : region.name;

        entries.push({
          index: ++idx,
          name,
          ring: "outer",
          distanceFt: arcInfo.realArcLength,
          distancePx: arcInfo.totalLen,
          color: ZONE_COLORS_16[region.name] || RING_COLORS.outer,
        });
      });
    } else if (showZone8 && effectiveZone8.length > 0) {
      effectiveZone8.forEach((region) => {
        if (!region.polygon || region.polygon.length < 3) return;
        const pts = region.polygon.map(toPxMemo);
        const arcInfo = computeZoneOuterArc(pts, scale ?? null, plotCpx);
        if (!arcInfo || arcInfo.totalLen < 2) return;

        const name = arcInfo.subSegments.length > 1 && scale
          ? `${region.name} (${arcInfo.subSegments.map(s => `${s.realArcLength?.toFixed(1)}ft`).join(" + ")})`
          : region.name;

        entries.push({
          index: ++idx,
          name,
          ring: "outer",
          distanceFt: arcInfo.realArcLength,
          distancePx: arcInfo.totalLen,
          color: ZONE_COLORS_8[region.name] || RING_COLORS.outer,
        });
      });
    } else if (showDevta45 && devtaRegions.length > 0) {
      devtaRegions.forEach((region) => {
        if (!region.polygon || region.polygon.length < 3) return;
        const pts = region.polygon.map(toPxMemo);
        const ringType = (region.ring || "outer") as DevtaDistanceEntry["ring"];

        if (ringType === "center" || region.name === "Brahma") {
          const xs = pts.map(p => p.x); const ys = pts.map(p => p.y);
          const wPx = Math.max(...xs) - Math.min(...xs);
          const hPx = Math.max(...ys) - Math.min(...ys);
          const avgPx = (wPx + hPx) / 2;
          entries.push({
            index: ++idx,
            name: region.name,
            ring: "center",
            distanceFt: scale ? avgPx * scale : null,
            distancePx: avgPx,
            color: RING_COLORS.center,
          });
        } else {
          const arcInfo = computeZoneOuterArc(pts, scale ?? null, plotCpx);
          if (!arcInfo || arcInfo.totalLen < 2) return;

          const name = arcInfo.subSegments.length > 1 && scale
            ? `${region.name} (${arcInfo.subSegments.map(s => `${s.realArcLength?.toFixed(1)}ft`).join(" + ")})`
            : region.name;

          entries.push({
            index: ++idx,
            name,
            ring: ringType,
            distanceFt: arcInfo.realArcLength,
            distancePx: arcInfo.totalLen,
            color: RING_COLORS[ringType] || RING_COLORS.outer,
          });
        }
      });
    }

    return entries;
  }, [devtaRegions, effectiveZone16, effectiveZone8, plotCentroid, scale, computedLayout, showZone16, showZone8, showDevta45]);

  const prevDistanceDataRef = useRef<string>("");
  // Screen-space click targets for zone pills/dots (rebuilt every draw).
  const arcHitRef = useRef<ArcHitTarget[]>([]);
  // Pill numbers must match the side-list numbers, keyed by clean zone name.
  const entryIndexByName = React.useMemo(() => {
    const m = new Map<string, number>();
    distanceData.forEach((e) => {
      m.set(e.name.split(" (")[0].trim().toLowerCase(), e.index);
    });
    return m;
  }, [distanceData]);
  useEffect(() => {
    if (onDistanceDataReady) {
      const serialized = JSON.stringify(distanceData);
      if (prevDistanceDataRef.current !== serialized) {
        prevDistanceDataRef.current = serialized;
        onDistanceDataReady(distanceData);
      }
    }
  }, [distanceData, onDistanceDataReady]);

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
      effectiveZone16,
      effectiveZone8,
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
      computedLayout,
      showCornerBadges,
      showTickLabels,
      showArcLengths,
      darkOverlay,
      showDevta45,
      showZone16,
      showZone8,
      selectedDistanceEntryName,
      measurementMode,
      entryIndexByName,
      arcHitRef.current,
      selectedPieceHint
    );
    ctx.restore();
  }, [
    width, height, floorPlanImage, boundary, placedObjects, devtaRegions,
    effectiveZone16, effectiveZone8, marmaData, shaktiChakra, shaktiChakraSize, shaktiChakraType,
    plotCentroid, drawingObjectBoundary, drawingMode, hoveredDevta, innerPolygon,
    middlePolygon, northDirection, wallLengths, referenceWallIndex,
    walls, currentDrawingWall, selectedWall, scale, measureStart, measureEnd, measureCurrent, hoverPoint,
    imageLoadedTrigger, shaktiChakraZonesImg, shaktiChakraBaseImg, showCornerBadges, showTickLabels, showArcLengths, darkOverlay, showDevta45, showZone16, showZone8, selectedDistanceEntryName, measurementMode, entryIndexByName, selectedPieceHint
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

    // Pointer cursor over clickable zone pills/dots
    if (!drawingMode && canvasRef.current && arcHitRef.current.length > 0) {
      const overPill = arcHitRef.current.some(
        (t) =>
          Math.abs(point.x - t.tagX) <= t.w / 2 + 6 &&
          Math.abs(point.y - t.tagY) <= t.h / 2 + 6
      );
      canvasRef.current.style.cursor = overPill ? "pointer" : "";
    }

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
    const allRegions = [
      ...(showDevta45 ? devtaRegions : []),
      ...(showZone16 ? effectiveZone16 : []),
      ...(showZone8 ? effectiveZone8 : []),
    ];

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

    // Click on a zone pill / marker dot / boundary piece → select that zone's
    // outer length (highlights the wall pieces + pill, syncs the side list).
    // Works in any non-drawing mode so the mouse always highlights something.
    if (!isStatic && !drawingMode && arcHitRef.current.length > 0) {
      const nearestBoundaryWall = (x: number, y: number): number | null => {
        if (boundary.length < 2) return null;
        const pxB = boundary.map(toPx);
        let best = -1;
        let bestD = Infinity;
        for (let i = 0; i < pxB.length; i++) {
          const p1 = pxB[i];
          const p2 = pxB[(i + 1) % pxB.length];
          if (isPointNearLineSegment(x, y, p1.x, p1.y, p2.x, p2.y, 22)) {
            const d = Math.hypot((p1.x + p2.x) / 2 - x, (p1.y + p2.y) / 2 - y);
            if (d < bestD) { bestD = d; best = i; }
          }
        }
        return best >= 0 ? best : null;
      };

      // 1. Direct hit on a pill badge (topmost = last drawn)
      for (let i = arcHitRef.current.length - 1; i >= 0; i--) {
        const t = arcHitRef.current[i];
        if (
          Math.abs(point.x - t.tagX) <= t.w / 2 + 6 &&
          Math.abs(point.y - t.tagY) <= t.h / 2 + 6
        ) {
          setSelectedPieceHint({ name: t.name, x: t.midX, y: t.midY });
          if (onSelectDistanceEntry) onSelectDistanceEntry(t.name);
          if (setReferenceWallIndex) {
            const w = nearestBoundaryWall(t.midX, t.midY);
            if (w !== null) setReferenceWallIndex(w);
          }
          return;
        }
      }
      // 2. Click near a zone's boundary piece → select nearest zone AND move
      // the pill/highlight onto that exact piece.
      let bestName: string | null = null;
      let bestMid = { x: 0, y: 0 };
      let bestD = 20;
      for (const t of arcHitRef.current) {
        const d = Math.hypot(point.x - t.midX, point.y - t.midY);
        if (d < bestD) { bestD = d; bestName = t.name; bestMid = { x: t.midX, y: t.midY }; }
      }
      if (bestName) {
        setSelectedPieceHint({ name: bestName, x: bestMid.x, y: bestMid.y });
        if (onSelectDistanceEntry) onSelectDistanceEntry(bestName);
        if (setReferenceWallIndex) {
          const w = nearestBoundaryWall(bestMid.x, bestMid.y);
          if (w !== null) setReferenceWallIndex(w);
        }
        return;
      }
    }

    let regionClicked = false;
    const allRegions = [
      ...(showDevta45 ? devtaRegions : []),
      ...(showZone16 ? effectiveZone16 : []),
      ...(showZone8 ? effectiveZone8 : []),
    ];
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
        if (onZoneClick && (effectiveZone16.includes(region) || effectiveZone8.includes(region))) {
          onZoneClick(region);
          regionClicked = true;
          break;
        }
      }
    }

    if (regionClicked) return;

    if (!isStatic && (drawingMode === null || drawingMode === "select") && setReferenceWallIndex) {
      const pxBoundary = boundary.map(toPx);
      let wallClicked = false;
      for (let i = 0; i < pxBoundary.length; i++) {
        const p1 = pxBoundary[i];
        const p2 = pxBoundary[(i + 1) % pxBoundary.length];
        if (isPointNearLineSegment(point.x, point.y, p1.x, p1.y, p2.x, p2.y, 16)) {
          setReferenceWallIndex(i);
          wallClicked = true;
          break;
        }

      }
      if (!wallClicked) {
        setReferenceWallIndex(null);
        // Clicked empty space → clear zone selection so only the base plot shows.
        setSelectedPieceHint(null);
        if (onSelectDistanceEntry) onSelectDistanceEntry(null);
      } else if (onSelectDistanceEntry) {
        // Explicit wall click takes over → drop any zone selection for a clean view.
        setSelectedPieceHint(null);
        onSelectDistanceEntry(null);
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
