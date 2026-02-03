"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  FloorPlanCanvasProps,
  Point,
  DevtaRegion,
  PlacedObject,
} from "@/lib/floorPlanInterfaces";
import { devtaColors } from "@/lib/colorPalette";
import { getCentroid } from "@/lib/gridUtils";
import { DraggableObject } from "./DraggableObject";

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
  drawingObjectBoundary: Point[],
  drawingMode: string | null,
  hoveredDevta: DevtaRegion | null,
  loadedSvgImages: React.RefObject<Map<string, HTMLImageElement>>,
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
      ctx.fillStyle = "rgba(173, 216, 230, 0.4)";
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
    ctx.beginPath();
    ctx.moveTo(pxBoundary[0].x, pxBoundary[0].y);
    pxBoundary.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#2563EB";
    ctx.stroke();

    ctx.fillStyle = "#fff";
    pxBoundary.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
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
  drawingObjectBoundary = [],
  drawingMode,
  onDevtaClick,
  onPlaceObject,
  onCanvasClick,
  setDrawingMode,
  setDrawingObjectBoundary,
  selectedObjectType,
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
      drawingObjectBoundary,
      drawingMode,
      hoveredDevta,
      loadedSvgImages,
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
    drawingObjectBoundary,
    drawingMode,
    hoveredDevta,
    innerPolygon,
    middlePolygon,
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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {};

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
          onLoad={() => {}}
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