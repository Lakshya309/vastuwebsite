"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Point,
  DevtaRegion,
  PlacedObject,
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
  plotWidth?: number | null;
  plotHeight?: number | null;
  isStatic?: boolean;
  highlightedZones?: string[];
  activeView?: "setup" | "grids" | "objects";
  onObjectClick?: (object: PlacedObject) => void;
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
  plotCentroid: Point | null,
  drawingObjectBoundary: Point[],
  drawingMode: "boundary" | "objects" | "select" | null | undefined,
  hoveredDevta: DevtaRegion | null,
  northDirection: number,
  wallLengths: number[],
  scale: number,
  referenceWallIndex: number | null,
  wallColors: (string | null)[],
  highlightedZones: string[] | undefined,
  activeView?: "setup" | "grids" | "objects",
  plotWidth?: number | null,
  plotHeight?: number | null,
) => {
  const toPx = (p: Point) => ({ x: p.x * width, y: p.y * height });

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

  if (shaktiChakra && plotCentroid) {
    const centroid = toPx(plotCentroid);
    const shaktiChakraImg = new Image();
    shaktiChakraImg.src = "/shaktichakra.png";
    shaktiChakraImg.onload = () => {
      ctx.save();
      ctx.translate(centroid.x, centroid.y);
      ctx.rotate((northDirection * Math.PI) / 180);
      const imageSize = Math.min(width, height) * (shaktiChakraSize || 0.8);
      ctx.drawImage(shaktiChakraImg, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
      ctx.restore();
    };
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

  zone16Regions.forEach((region) => {
    if (!region.polygon || region.polygon.length < 3) return;
    const pts = region.polygon.map(toPx);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();

    const isHighlighted = highlightedZones?.includes(region.name);
    const color = ZONE_COLORS_16[region.name] || "rgba(173, 216, 230, 0.4)";
    ctx.fillStyle = isHighlighted ? `${color}CC` : `${color}99`; // More opaque if highlighted
    ctx.fill();
    ctx.strokeStyle = isHighlighted ? "red" : "rgba(0,0,0,0.3)";
    ctx.lineWidth = isHighlighted ? 3 : 1;
    ctx.stroke();

    const center = getCentroid(pts);
    ctx.fillStyle = "#333";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(region.name, center.x, center.y);
  });
  
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
    ctx.fillText(region.name, center.x, center.y);
  });

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

  // Draw North Indicator in first two tabs
  if ((activeView === "setup" || activeView === "grids") && boundary.length > 0) {
    ctx.save();
    
    // Determine centroid: use plotCentroid if available, else calculate from boundary
    let targetCentroid = plotCentroid;
    if (!targetCentroid && boundary.length > 0) {
      targetCentroid = getCentroid(boundary);
    }

    if (targetCentroid) {
      const centroidPx = toPx(targetCentroid);
      ctx.translate(centroidPx.x, centroidPx.y);
      ctx.rotate((northDirection * Math.PI) / 180);
      
      // Draw arrow
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(-15, 15);
      ctx.lineTo(15, 15);
      ctx.closePath();
      ctx.fillStyle = "red";
      ctx.fill();

      // Draw 'N'
      ctx.fillStyle = "black";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("N", 0, -35);
    }
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
  wallLengths,
  setReferenceWallIndex,
  referenceWallIndex,
  wallColors,
  plotWidth,
  plotHeight,
  isStatic = false,
  highlightedZones,
  activeView,
  onObjectClick,
}) => {
  const [hoveredDevta, setHoveredDevta] = useState<DevtaRegion | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const { width, height } = dimensions;

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  const toPx = (p: Point) => ({ x: p.x * width, y: p.y * height });

  const getTransformedPoint = (x: number, y: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const invertedZoom = 1 / zoom;
    return {
      x: (x - rect.left - offset.x) * invertedZoom,
      y: (y - rect.top - offset.y) * invertedZoom,
    };
  };

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
      activeView,
      plotWidth,
      plotHeight,
    );
    ctx.restore();
  }, [
    width, height, floorPlanImage, boundary, placedObjects, devtaRegions,
    zone16Regions, zone8Regions, marmaData, shaktiChakra, shaktiChakraSize,
    plotCentroid, drawingObjectBoundary, drawingMode, hoveredDevta, innerPolygon,
    middlePolygon, northDirection, wallLengths, referenceWallIndex,
    wallColors, plotWidth, plotHeight, zoom, offset, isStatic, highlightedZones, activeView
  ]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (isStatic) return;
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.1;
    const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    const newZoomClamped = Math.max(1, Math.min(newZoom, 10));

    const mouseBeforeZoom = getTransformedPoint(e.clientX, e.clientY);
    
    const newOffsetX = mouseX - mouseBeforeZoom.x * newZoomClamped;
    const newOffsetY = mouseY - mouseBeforeZoom.y * newZoomClamped;

    setZoom(newZoomClamped);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isStatic) return;
    if (e.button === 1) { // Middle mouse button
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isStatic) return;

    if (isPanning) {
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    const point = getTransformedPoint(e.clientX, e.clientY);

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
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) return;

    const point = getTransformedPoint(e.clientX, e.clientY);
    const normalizedPoint = { x: point.x / width, y: point.y / height };
    
    if (!isStatic) {
      if (drawingMode === "boundary" && onDrawBoundary) {
        onDrawBoundary(normalizedPoint);
        return;
      }

      if (drawingMode === "objects" && onCanvasClick) {
        onCanvasClick(normalizedPoint);
        return;
      }
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
      {floorPlanImage && (
        <img
          ref={imageRef}
          src={floorPlanImage}
          alt="Floor Plan Source"
          className="hidden"
          crossOrigin="anonymous"
        />
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="bg-white shadow-lg"
        onWheel={!isStatic ? handleWheel : undefined}
        onMouseDown={!isStatic ? handleMouseDown : undefined}
        onMouseMove={!isStatic ? handleMouseMove : undefined}
        onMouseUp={!isStatic ? handleMouseUp : undefined}
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
          />
        ))}
      </div>
    </div>
  );
};
