// components/floor-plan/FloorPlanCanvas.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { Point, getEventPixelPosition, toNormalized, toPixels } from "@/lib/coordinates";
import { calculateCentroid, pointInPolygon, rayPolygonIntersection } from "@/lib/geometry";
import { PlacedObject, ZoneDivision, FloorPlanAnalysisData } from "@/lib/floorPlanInterfaces";
import { VastuRule, vastuRules } from "@/lib/vastu/vastuRules"; // Assuming vastuRules is imported
import {
  drawBrahmasthan,
  drawBoundary,
  drawDevtaInfoBox,
  drawDevtaRegions,
  drawIncompleteBoundary,
  drawMarmaTooltip,
  drawMarmas,
  drawNorthLine,
  drawObjectAnalysis,
  drawPlacedObjects,
  drawZoneLines,
} from "@/utils/floorPlanUtils";
import { MarmaPoint } from "@/lib/vastu/marmaAnalysis";
import { DevtaRegion } from "@/lib/floorPlanInterfaces"; // Corrected import path
import { useProjectStore } from "@/lib/store/projectStore";


interface FloorPlanCanvasProps {
  floorPlanImage: string | null;
  boundary: Point[];
  placedObjects: PlacedObject[];
  drawingObjectBoundary: Point[];
  drawingMode: "boundary" | "objects" | "select";
  selectedObject: PlacedObject | null;
  selectedDevta: DevtaRegion | null;
  hoveredMarma: MarmaPoint | null;
  analysisMode: "concentric" | "zones-8" | "zones-16" | "zones-32" | "none";
  imageRef: React.RefObject<HTMLImageElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  devtaRegions: DevtaRegion[] | null;
  marmas: MarmaPoint[];
  objectAnalyses: FloorPlanAnalysisData["objectAnalyses"];
  setBoundary: (boundary: Point[]) => void;
  setDrawingObjectBoundary: (boundary: Point[]) => void;
  setPlacedObjects: (objects: PlacedObject[]) => void;
  setSelectedObject: (object: PlacedObject | null) => void;
  setSelectedDevta: (devta: DevtaRegion | null) => void;
  setHoveredMarma: (marma: MarmaPoint | null) => void;
}

export function FloorPlanCanvas({
  floorPlanImage,
  boundary,
  placedObjects,
  drawingObjectBoundary,
  drawingMode,
  selectedObject,
  selectedDevta,
  hoveredMarma,
  analysisMode,
  imageRef,
  canvasRef,
  devtaRegions,
  marmas,
  objectAnalyses,
  setBoundary,
  setDrawingObjectBoundary,
  setPlacedObjects,
  setSelectedObject,
  setSelectedDevta,
  setHoveredMarma,
}: FloorPlanCanvasProps) {
  const { liveNorthDirection } = useProjectStore();

  const draw = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !image.complete) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = image.clientWidth;
    canvas.height = image.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const dims = { width: canvas.width, height: canvas.height };

    if (boundary.length < 3) {
      drawIncompleteBoundary(ctx, boundary, dims);
      return;
    }

    const centroid = calculateCentroid(boundary);

    // --- RENDER LAYERS ---
    if (analysisMode === "concentric" && devtaRegions) {
      drawDevtaRegions(ctx, devtaRegions, dims, selectedDevta);
    } else if (analysisMode.startsWith("zones-")) {
      const divisions = parseInt(
        analysisMode.split("-")[1] || "0",
      ) as ZoneDivision;
      drawZoneLines(ctx, divisions, centroid, boundary, liveNorthDirection, dims);
    }

    drawMarmas(ctx, marmas, dims);
    drawPlacedObjects(ctx, placedObjects, selectedObject, dims);
    drawBoundary(ctx, boundary, dims);
    drawBrahmasthan(ctx, centroid, dims);
    drawNorthLine(ctx, centroid, liveNorthDirection, dims);

    // --- RENDER UI/UX LAYERS ---
    if (drawingMode === "objects" && drawingObjectBoundary.length > 0) {
      drawIncompleteBoundary(
        ctx,
        drawingObjectBoundary,
        dims,
        "rgba(25, 118, 210, 0.9)",
      );
    }

    if (hoveredMarma) {
      drawMarmaTooltip(ctx, hoveredMarma, dims);
    }

    if (selectedObject && objectAnalyses[selectedObject.id]) {
      drawObjectAnalysis(ctx, selectedObject, objectAnalyses[selectedObject.id], dims);
    }

    if (selectedDevta) {
      const rule = vastuRules[selectedDevta.name];
      if (rule) {
        drawDevtaInfoBox(ctx, rule, dims);
      }
    }
  };

  useEffect(() => {
    draw();
  }, [
    boundary,
    placedObjects,
    floorPlanImage,
    liveNorthDirection,
    drawingObjectBoundary,
    devtaRegions,
    marmas,
    analysisMode,
    hoveredMarma,
    selectedObject,
    objectAnalyses,
    selectedDevta,
    // Add canvasRef.current and imageRef.current to dependencies if they can change
    // but typically they are stable after initial render
  ]);

  const handleCanvasClick = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getEventPixelPosition(event, canvas);
    const normalizedPoint = toNormalized(point, {
      width: canvas.width,
      height: canvas.height,
    });

    if (drawingMode === "boundary") {
      setBoundary([...boundary, normalizedPoint]);
      return;
    }

    if (drawingMode === "objects") {
      setDrawingObjectBoundary([...drawingObjectBoundary, normalizedPoint]);
      return;
    }

    if (drawingMode === "select") {
      // First, check for object selection
      let clickedObject = null;
      for (let i = placedObjects.length - 1; i >= 0; i--) {
        const obj = placedObjects[i];
        if (pointInPolygon(normalizedPoint, obj.boundary_normalized)) {
          clickedObject = obj;
          break;
        }
      }

      if (clickedObject) {
        setSelectedObject(clickedObject);
        setSelectedDevta(null); // Deselect Devta
        return;
      }

      // If no object clicked, check for Devta selection
      let clickedDevta = null;
      if (devtaRegions) {
        for (const devta of devtaRegions) {
          if (pointInPolygon(normalizedPoint, devta.polygon)) {
            clickedDevta = devta;
            break;
          }
        }
      }

      if (clickedDevta) {
        setSelectedDevta(clickedDevta);
        setSelectedObject(null); // Deselect object
        return;
      }

      // If clicking outside anything, deselect all
      setSelectedObject(null);
      setSelectedDevta(null);
    }
  };

  const handleMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getEventPixelPosition(event, canvas);

    let marmaFound = null;
    const hoverRadius = 8; // 8px hover radius
    for (const marma of marmas) {
      const marmaPixelPos = toPixels(marma.point, {
        width: canvas.width,
        height: canvas.height,
      });
      const distance = Math.hypot(
        pos.x - marmaPixelPos.x,
        pos.y - marmaPixelPos.y,
      );
      if (distance < hoverRadius) {
        marmaFound = marma;
        break;
      }
    }

    // Only update state if the hovered marma changes to prevent excessive re-renders
    if (marmaFound?.id !== hoveredMarma?.id) {
      setHoveredMarma(marmaFound);
    }
  };

  return (
    <div className="relative w-full h-[600px] border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
      {floorPlanImage
        ? (
          <>
            <img
              ref={imageRef}
              src={floorPlanImage}
              alt="Floor Plan"
              className="absolute top-0 left-0 w-full h-full object-contain"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full cursor-crosshair"
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
            />
          </>
        )
        : <p className="text-gray-500">Upload a floor plan image</p>}
    </div>
  );
}