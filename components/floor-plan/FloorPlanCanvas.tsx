"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Point,
  DevtaRegion,
  PlacedObject,
} from "@/lib/floorPlanInterfaces";
import { DraggableObject } from "./DraggableObject";
import { devtaColors } from "@/lib/colorPalette"; // Assuming this is still needed
import { getCentroid } from "@/lib/gridUtils"; // Assuming this is still needed

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
  plotCentroid?: Point | null;
  drawingObjectBoundary?: Point[];
  drawingMode?: "boundary" | "objects" | "select" | null;
  onDevtaClick?: (devta: DevtaRegion) => void;
  onZoneClick?: (zone: DevtaRegion) => void;
  onPlaceObject?: (newObject: PlacedObject) => void;
  onCanvasClick?: (point: Point) => void;
  setDrawingMode?: (mode: "boundary" | "objects" | "select" | null) => void;
  setDrawingObjectBoundary?: (boundary: Point[]) => void;
  selectedObjectType?: string;
  northDirection: number;
  scale: number | null;
  wallLengths: number[];
  setReferenceWallIndex: (index: number | null) => void;
  referenceWallIndex: number | null;
  wallColors: (string | null)[];
}

// Define the 16-zone names for client-side use
const ZONE_NAMES_16 = [
  "NNE","NE","ENE","E","ESE","SE","SSE","S",
  "SSW","SW","WSW","W","WNW","NW","NNW","N"
];
const ZONE_NAMES_8 = [
  "NE","E","SE","S","SW","W","NW","N"
];

// Define Vastu boundary colors based on direction
const VASTU_BOUNDARY_COLORS: { [key: string]: string } = {
  "N": "#C5D9F1",
  "NNE": "#C5D9F1",
  "NE": "#C5D9F1",
  "ENE": "#FFFFFF",
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
};

const VASTU_COLOR_NAMES: { [key: string]: string } = {
  "N": "Blue",
  "NNE": "Blue",
  "NE": "Blue",
  "ENE": "White",
  "E": "Green",
  "ESE": "Green",
  "SE": "Red",
  "SSE": "Red",
  "S": "Red",
  "SSW": "Yellow",
  "SW": "Yellow",
  "WSW": "White",
  "W": "White",
  "WNW": "White",
  "NW": "White",
  "NNW": "Blue",
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
  "ENE": "#FFFFFF", // Default for missing value
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

const drawCanvasContent = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  floorPlanImage: string | null,
  imageRef: React.RefObject<HTMLImageElement | null>,
  boundary: Point[],
  placedObjects: PlacedObject[],
  devtaRegions: DevtaRegion[],
  innerPolygon: Point[],
  middlePolygon: Point[],
  zone16Regions: DevtaRegion[],
  zone8Regions: DevtaRegion[],
  marmaData: { marmaPoints: Point[]; vanshaLines: Point[][] } | null,
  shaktiChakra: boolean | undefined,
  shaktiChakraSize: number | undefined,
  plotCentroid: Point | null,
  drawingObjectBoundary: Point[],
  drawingMode: "boundary" | "objects" | "select" | null | undefined,
  hoveredDevta: DevtaRegion | null,
  loadedSvgImages: React.RefObject<Map<string, HTMLImageElement>>,
  northDirection: number,
  wallLengths: number[],
  scale: number | null,
  referenceWallIndex: number | null,
  wallColors: (string | null)[],
) => {
  ctx.clearRect(0, 0, width, height);
  const toPx = (p: Point) => ({ x: p.x * width, y: p.y * height });

  // 2. Draw Background Image
  if (floorPlanImage && imageRef.current) {
    ctx.drawImage(imageRef.current, 0, 0, width, height);
    if (
      devtaRegions.length > 0 ||
      zone16Regions.length > 0 ||
      zone8Regions.length > 0
    ) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Draw Shakti Chakra
  if (shaktiChakra && plotCentroid) {
    const centroid = toPx(plotCentroid);
    const shaktiChakraImg = new Image();
    shaktiChakraImg.src = "/shaktichakra.png";
    shaktiChakraImg.onload = () => {
      ctx.save();
      ctx.translate(centroid.x, centroid.y);
      ctx.rotate((northDirection * Math.PI) / 180);
      const imageSize = Math.min(width, height) * (shaktiChakraSize || 0.8);
      ctx.drawImage(
        shaktiChakraImg,
        -imageSize / 2,
        -imageSize / 2,
        imageSize,
        imageSize
      );
      ctx.restore();
    };
  }

  // 3. Draw Grids (Existing logic)
  if (devtaRegions.length > 0) {
    devtaRegions.forEach((region) => {
      if (!region.polygon || region.polygon.length < 3) {
        return;
      }
      const pts = region.polygon.map(toPx);

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = devtaColors[region.name]
        ? `${devtaColors[region.name]}`
        : "rgba(200, 200, 200, 0.4)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.stroke();

      const center = getCentroid(region.polygon.map(toPx));
      ctx.fillStyle = "#333";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(region.name, center.x, center.y);
    });

    if (hoveredDevta) {
      const region = hoveredDevta;
      if (!region.polygon || region.polygon.length < 3) return;
      const pts = region.polygon.map(toPx);
      // It seems there's a small typo here. 'polygon' was used before definition.
      // Assuming it should be ctx.beginPath() again and drawing the path.
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.stroke();
    }
  }

  if (innerPolygon.length > 0) {
    const pxPolygon = innerPolygon.map(toPx);
    ctx.beginPath();
    ctx.moveTo(pxPolygon[0].x, pxPolygon[0].y);
    pxPolygon.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#32CD32";
    ctx.stroke();
  }

  if (middlePolygon.length > 0) {
    const pxPolygon = middlePolygon.map(toPx);
    ctx.beginPath();
    ctx.moveTo(pxPolygon[0].x, pxPolygon[0].y);
    pxPolygon.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FF8C00";
    ctx.stroke();
  }

  if (zone16Regions.length > 0) {
    zone16Regions.forEach((region) => {
      if (!region.polygon || region.polygon.length < 3) return;
      const pts = region.polygon.map(toPx);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();

      const color = ZONE_COLORS_16[region.name] || "rgba(173, 216, 230, 0.4)";
      ctx.fillStyle = `${color}99`; // Add 99 for ~60% opacity in hex

      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.stroke();
      const center = getCentroid(region.polygon.map(toPx));
      ctx.fillStyle = "#333";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(region.name, center.x, center.y);
    });
  }

  if (zone8Regions.length > 0) {
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
      const center = getCentroid(region.polygon.map(toPx));
      ctx.fillStyle = "#333";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(region.name, center.x, center.y);
    });
  }

  // 4. Draw Main Plot Boundary (Existing logic)
  if (boundary.length > 0) {
    const pxBoundary = boundary.map(toPx);
    const numSegments = drawingMode === "boundary" ? pxBoundary.length - 1 : pxBoundary.length;

    // Draw Vastu-colored segments of the boundary
    for (let i = 0; i < numSegments; i++) {
      const p1 = pxBoundary[i];
      const p2 = pxBoundary[(i + 1) % pxBoundary.length]; // Next point, wrapping around for the last segment

      const midPoint = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };

      // Ensure plotCentroid exists before calculating angle and zone
      let segmentVastuZone: string | null = null;
      if (plotCentroid) {
        const centroidPx = toPx(plotCentroid); // Centroid in pixel coordinates
        const angleToMidPoint = getAngleFromPoint(centroidPx, midPoint);
        segmentVastuZone = getZoneFromAngleClient(
          angleToMidPoint,
          northDirection,
          ZONE_NAMES_16
        );
      }
      
      const segmentColor = segmentVastuZone && VASTU_BOUNDARY_COLORS[segmentVastuZone]
        ? VASTU_BOUNDARY_COLORS[segmentVastuZone]
        : "#2563EB";

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineWidth = 5; // Make the colored line thicker
      ctx.strokeStyle = segmentColor;
      ctx.stroke();

      // Highlight the selected reference wall
      if (referenceWallIndex === i) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = 7; // Even thicker for highlight
        ctx.strokeStyle = "#FFFF00"; // Bright yellow highlight
        ctx.stroke();
      }

      // Display user-provided color name
      const userColorName = wallColors[i];
      if (userColorName) {
        ctx.fillStyle = "black";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(userColorName, midPoint.x, midPoint.y + 12);
      }
    }

    ctx.fillStyle = "#fff";
    pxBoundary.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    // Draw wall lengths
    if (scale && wallLengths.length > 0) {
      pxBoundary.forEach((p1, index) => {
        if (drawingMode === "boundary" && index === pxBoundary.length - 1) return;
        const p2 = pxBoundary[(index + 1) % pxBoundary.length];
        const midPoint = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
        ctx.fillStyle = "black";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `${wallLengths[index].toFixed(2)}m`,
          midPoint.x,
          midPoint.y - 12
        );
      });
    }
  }

  if (marmaData) {
    const { marmaPoints, vanshaLines } = marmaData;

    vanshaLines.forEach((line) => {
      const p1 = toPx(line[0]);
      const p2 = toPx(line[1]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
      ctx.stroke();
    });

    marmaPoints.forEach((point) => {
      const p = toPx(point);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();
    });
  }

  // 6. Draw "In-Progress" Object (The one user is currently drawing)
  if (
    drawingMode === "objects" &&
    drawingObjectBoundary &&
    drawingObjectBoundary.length > 0
  ) {
    const pts = drawingObjectBoundary.map(toPx);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));

    ctx.strokeStyle = "#9333EA"; // Purple for active drawing
    ctx.setLineDash([5, 5]); // Dashed line
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]); // Reset
  }

  // Draw North Direction Line
  if (plotCentroid) {
    const centroid = toPx(plotCentroid);
    const arrowLength = Math.min(width, height) * 0.1;
    const headLength = 10;
    const angleInRadians = (northDirection - 90) * (Math.PI / 180);

    ctx.save();
    ctx.translate(centroid.x, centroid.y);
    ctx.rotate(angleInRadians + Math.PI / 2);

    // Draw the arrow line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -arrowLength);
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the arrow head
    ctx.beginPath();
    ctx.moveTo(0, -arrowLength);
    ctx.lineTo(-headLength / 2, -arrowLength + headLength);
    ctx.lineTo(headLength / 2, -arrowLength + headLength);
    ctx.closePath();
    ctx.fillStyle = "#FF0000";
    ctx.fill();

    // Draw "N" for North
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#FF0000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", 0, -arrowLength - 10);

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
}) => {
  const [hoveredDevta, setHoveredDevta] = useState<DevtaRegion | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const loadedSvgImages = useRef<Map<string, HTMLImageElement>>(new Map());

  const containerRect = containerRef.current?.getBoundingClientRect();
  const width = containerRect?.width || 800;
  const height = containerRect?.height || 600;

  const toPx = (p: Point) => ({ x: p.x * width, y: p.y * height });

  // --- DRAWING ENGINE ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawCanvasContent(
      ctx,
      width,
      height,
      floorPlanImage,
      imageRef,
      boundary,
      placedObjects,
      devtaRegions,
      innerPolygon,
      middlePolygon,
      zone16Regions,
      zone8Regions,
      marmaData,
      shaktiChakra,
      shaktiChakraSize,
      plotCentroid,
      drawingObjectBoundary,
      drawingMode,
      hoveredDevta,
      loadedSvgImages,
      northDirection,
      wallLengths,
      scale,
      referenceWallIndex,
      wallColors,
    );
  }, [
    width,
    height,
    floorPlanImage,
    boundary,
    placedObjects,
    devtaRegions,
    zone16Regions,
    zone8Regions,
    marmaData,
    shaktiChakra,
    shaktiChakraSize,
    plotCentroid,
    drawingObjectBoundary,
    drawingMode,
    hoveredDevta,
    innerPolygon,
    middlePolygon,
    northDirection,
    wallLengths,
    scale,
    referenceWallIndex,
    wallColors,
  ]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const region of devtaRegions) {
      if (!region.polygon || region.polygon.length < 3) continue;

      const pts = region.polygon.map(toPx);
      const polygon = new Path2D();
      polygon.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => polygon.lineTo(p.x, p.y));
      polygon.closePath();

      const ctx = canvas.getContext("2d");
      if (ctx && ctx.isPointInPath(polygon, x, y)) {
        setHoveredDevta(region);
        return;
      }
    }

    for (const region of zone16Regions) {
      if (!region.polygon || region.polygon.length < 3) continue;

      const pts = region.polygon.map(toPx);
      const polygon = new Path2D();
      polygon.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => polygon.lineTo(p.x, p.y));
      polygon.closePath();

      const ctx = canvas.getContext("2d");
      if (ctx && ctx.isPointInPath(polygon, x, y)) {
        setHoveredDevta(region);
        return;
      }
    }

    for (const region of zone8Regions) {
      if (!region.polygon || region.polygon.length < 3) continue;

      const pts = region.polygon.map(toPx);
      const polygon = new Path2D();
      polygon.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => polygon.lineTo(p.x, p.y));
      polygon.closePath();

      const ctx = canvas.getContext("2d");
      if (ctx && ctx.isPointInPath(polygon, x, y)) {
        setHoveredDevta(region);
        return;
      }
    }

    setHoveredDevta(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawingMode === "boundary") {
      if (onDrawBoundary) {
        onDrawBoundary({ x: x / width, y: y / height });
      }
      return;
    }

    if (drawingMode === "objects") {
      if (onCanvasClick) {
        onCanvasClick({ x: x / width, y: y / height });
      }
      return;
    }

    // If not in a drawing mode, allow selecting a wall for reference
    if (drawingMode === null || drawingMode === "select") {
      const pxBoundary = boundary.map(toPx);
      for (let i = 0; i < pxBoundary.length; i++) {
        const p1 = pxBoundary[i];
        const p2 = pxBoundary[(i + 1) % pxBoundary.length];
        if (isPointNearLineSegment(x, y, p1.x, p1.y, p2.x, p2.y)) {
          setReferenceWallIndex(i); // Use the prop directly
          return;
        }
      }
      // If no wall was clicked, deselect the reference wall
      setReferenceWallIndex(null); // Use the prop directly
    }

    for (const region of devtaRegions) {
      if (!region.polygon || region.polygon.length < 3) continue;

      const pts = region.polygon.map(toPx);
      const polygon = new Path2D();
      polygon.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => polygon.lineTo(p.x, p.y));
      polygon.closePath();

      const ctx = canvas.getContext("2d");
      if (ctx && ctx.isPointInPath(polygon, x, y)) {
        if (onDevtaClick) {
          onDevtaClick(region);
        }
        return;
      }
    }

    for (const region of zone16Regions) {
      if (!region.polygon || region.polygon.length < 3) continue;

      const pts = region.polygon.map(toPx);
      const polygon = new Path2D();
      polygon.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => polygon.lineTo(p.x, p.y));
      polygon.closePath();

      const ctx = canvas.getContext("2d");
      if (ctx && ctx.isPointInPath(polygon, x, y)) {
        if (onZoneClick) {
          onZoneClick(region);
        }
        return;
      }
    }

    for (const region of zone8Regions) {
      if (!region.polygon || region.polygon.length < 3) continue;

      const pts = region.polygon.map(toPx);
      const polygon = new Path2D();
      polygon.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach((p) => polygon.lineTo(p.x, p.y));
      polygon.closePath();

      const ctx = canvas.getContext("2d");
      if (ctx && ctx.isPointInPath(polygon, x, y)) {
        if (onZoneClick) {
          onZoneClick(region);
        }
        return;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => { };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex justify-center items-center bg-gray-100`}
    >
      {floorPlanImage && (
        <img
          ref={imageRef}
          src={floorPlanImage}
          alt="Floor Plan Source"
          className="hidden"
          onLoad={() => { }}
        />
      )}

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="bg-white shadow-lg cursor-crosshair"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      />
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
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
          />
        ))}
      </div>
    </div>
  );
};