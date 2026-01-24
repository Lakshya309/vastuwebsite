"use client";

import { useEffect } from "react";
import { Point, getEventPixelPosition, toNormalized, toPixels } from "@/lib/coordinates";
import { pointInPolygon } from "@/lib/geometry";
import {
  PlacedObject,
  FloorPlanAnalysisData,
} from "@/lib/floorPlanInterfaces";
import {
  drawBoundary,
  drawIncompleteBoundary,
  drawMarmaTooltip,
  drawMarmas,
  drawNorthLine,
  drawObjectAnalysis,
  drawPlacedObjects,
} from "@/utils/floorPlanUtils";
import { MarmaPoint } from "@/lib/vastu/marmaAnalysis";
import { useProjectStore } from "@/lib/store/projectStore";

interface FloorPlanCanvasProps {
  floorPlanImage: string | null;
  boundary: Point[];
  placedObjects: PlacedObject[];
  drawingObjectBoundary: Point[];
  drawingMode: "boundary" | "objects" | "select";
  selectedObject: PlacedObject | null;
  hoveredMarma: MarmaPoint | null;
  imageRef: React.RefObject<HTMLImageElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  marmas: MarmaPoint[];
  objectAnalyses: FloorPlanAnalysisData["objectAnalyses"];
  setBoundary: (boundary: Point[]) => void;
  setDrawingObjectBoundary: (boundary: Point[]) => void;
  setPlacedObjects: (objects: PlacedObject[]) => void;
  setSelectedObject: (object: PlacedObject | null) => void;
  setHoveredMarma: (marma: MarmaPoint | null) => void;
}

export function FloorPlanCanvas({
  floorPlanImage,
  boundary,
  placedObjects,
  drawingObjectBoundary,
  drawingMode,
  selectedObject,
  hoveredMarma,
  imageRef,
  canvasRef,
  marmas,
  objectAnalyses,
  setBoundary,
  setDrawingObjectBoundary,
  setPlacedObjects,
  setSelectedObject,
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

    // --- STATIC GEOMETRY ---
    drawMarmas(ctx, marmas, dims);
    drawPlacedObjects(ctx, placedObjects, selectedObject, dims);
    drawBoundary(ctx, boundary, dims);

    // North line anchored to plot centroid ONLY for orientation (not logic)
    drawNorthLine(ctx, boundary, liveNorthDirection, dims);

    // --- INTERACTION LAYERS ---
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
      drawObjectAnalysis(
        ctx,
        selectedObject,
        objectAnalyses[selectedObject.id],
        dims,
      );
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
    marmas,
    hoveredMarma,
    selectedObject,
    objectAnalyses,
  ]);

  const handleCanvasClick = (
    event: React.MouseEvent<HTMLCanvasElement>,
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
      // Object selection
      for (let i = placedObjects.length - 1; i >= 0; i--) {
        const obj = placedObjects[i];
        if (pointInPolygon(normalizedPoint, obj.boundary_normalized)) {
          setSelectedObject(obj);
          return;
        }
      }

      setSelectedObject(null);
    }
  };

  const handleMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getEventPixelPosition(event, canvas);
    let marmaFound: MarmaPoint | null = null;

    for (const marma of marmas) {
      const pixel = toPixels(marma.point, {
        width: canvas.width,
        height: canvas.height,
      });
      if (Math.hypot(pos.x - pixel.x, pos.y - pixel.y) < 8) {
        marmaFound = marma;
        break;
      }
    }

    if (marmaFound?.id !== hoveredMarma?.id) {
      setHoveredMarma(marmaFound);
    }
  };

  return (
    <div className="relative w-full h-[600px] border-2 border-dashed border-gray-300 overflow-hidden">
      {floorPlanImage ? (
        <>
          <img
            ref={imageRef}
            src={floorPlanImage}
            alt="Floor Plan"
            className="absolute inset-0 w-full h-full object-contain"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
          />
        </>
      ) : (
        <p className="text-gray-500 flex items-center justify-center h-full">
          Upload a floor plan image
        </p>
      )}
    </div>
  );
}

