// components/floor-plan/FloorPlanCanvas.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { FloorPlanCanvasProps, Point, DevtaRegion, PlacedObject } from "@/lib/floorPlanInterfaces";
import { devtaColors } from "@/lib/colorPalette";
import { getCentroid } from "@/lib/gridUtils";

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  floorPlanImage,
  boundary,
  onDrawBoundary,
  placedObjects,
  devtaRegions = [],
  innerPolygon = [],
  middlePolygon = [],
  zone16Regions = [],
  zone8Regions = [],
  drawingObjectBoundary = [],
  setDrawingObjectBoundary,
  drawingMode,
  setDrawingMode,
  onDevtaClick,
  onPlaceObject,
  selectedObjectType,
  // ... destruct other props as needed
}) => {
  
  // CONSTANTS
  const WIDTH = 800;
  const HEIGHT = 600;

  // STATE
  const [hoveredDevta, setHoveredDevta] = useState<DevtaRegion | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // --- DRAWING ENGINE ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Clear Canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // 2. Draw Background Image
    if (floorPlanImage && imageRef.current) {
        // Simple stretch fit - in production, calculate aspect ratio
        ctx.drawImage(imageRef.current, 0, 0, WIDTH, HEIGHT);
        
        // Overlay a semi-transparent white layer if analyzing to make grids pop
        if (devtaRegions.length > 0 || zone16Regions.length > 0 || zone8Regions.length > 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }
    }

    // Helper: Scale Point to Pixels
    const toPx = (p: Point) => ({ x: p.x * WIDTH, y: p.y * HEIGHT });
    const toPoint = (p: { x: number, y: number }) => ({ x: p.x / WIDTH, y: p.y / HEIGHT });

    // 3. Draw Grids
    if (devtaRegions.length > 0) {
        devtaRegions.forEach(region => {
            if (!region.polygon || region.polygon.length < 3) {
                return;
            }
            const pts = region.polygon.map(toPx);

            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
            ctx.closePath();

            // Colors from the palette
            ctx.fillStyle = devtaColors[region.name] ? `${devtaColors[region.name]}80` : "rgba(200, 200, 200, 0.5)"; // 80 for alpha
            
            ctx.fill();
            ctx.strokeStyle = "rgba(0,0,0,0.3)"; // Made boundary more prominent
            ctx.stroke();

            // Text Label
            // Always draw names for all rings
            const center = getCentroid(region.polygon.map(toPx));
            ctx.fillStyle = "#333";
            ctx.font = "10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(region.name, center.x, center.y);
        });

        // Hover effect
        if (hoveredDevta) {
            const region = hoveredDevta;
            if (!region.polygon || region.polygon.length < 3) return;
            const pts = region.polygon.map(toPx);

            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
            ctx.closePath();

            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.fill();
            ctx.strokeStyle = "#000"; // Made hover boundary prominent
            ctx.stroke();
        }
    }

    // Draw Inner Polygon
    if (innerPolygon.length > 0) {
        const pxPolygon = innerPolygon.map(toPx);
        ctx.beginPath();
        ctx.moveTo(pxPolygon[0].x, pxPolygon[0].y);
        pxPolygon.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#32CD32"; // LimeGreen for inner ring
        ctx.stroke();
    }

    // Draw Middle Polygon
    if (middlePolygon.length > 0) {
        const pxPolygon = middlePolygon.map(toPx);
        ctx.beginPath();
        ctx.moveTo(pxPolygon[0].x, pxPolygon[0].y);
        pxPolygon.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#FF8C00"; // DarkOrange for middle ring
        ctx.stroke();
    }

    if (zone16Regions.length > 0) {
      zone16Regions.forEach(region => {
        if (!region.polygon || region.polygon.length < 3) return;
        const pts = region.polygon.map(toPx);

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();

        ctx.fillStyle = "rgba(173, 216, 230, 0.4)"; // Middle (Blue)
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.3)"; // Made boundary more prominent
        ctx.stroke();

        const center = getCentroid(region.polygon.map(toPx));
        ctx.fillStyle = "#333";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(region.name, center.x, center.y);
      });
    }

    if (zone8Regions.length > 0) {
      zone8Regions.forEach(region => {
        if (!region.polygon || region.polygon.length < 3) return;
        const pts = region.polygon.map(toPx);

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();

        ctx.fillStyle = "rgba(144, 238, 144, 0.3)"; // Outer (Green)
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.3)"; // Made boundary more prominent
        ctx.stroke();

        const center = getCentroid(region.polygon.map(toPx));
        ctx.fillStyle = "#333";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(region.name, center.x, center.y);
      });
    }

    // 4. Draw Main Plot Boundary    
    if (boundary.length > 0) {
        const pxBoundary = boundary.map(toPx);
        ctx.beginPath();
        ctx.moveTo(pxBoundary[0].x, pxBoundary[0].y);
        pxBoundary.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#2563EB"; // Blue
        ctx.stroke();
        
        // Draw Vertices
        ctx.fillStyle = "#fff";
        pxBoundary.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }

    // 5. Draw Placed Objects (Furniture)
    placedObjects.forEach(obj => {
        if(!obj.boundary_normalized) return;
        const pts = obj.boundary_normalized.map(toPx);

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();

        // Style based on object type
        ctx.fillStyle = obj.object_type === 'Toilet' ? "rgba(220, 38, 38, 0.6)" : "rgba(75, 85, 99, 0.6)";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        const c = getCentroid(obj.boundary_normalized.map(toPx));
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(obj.object_type, c.x, c.y);
    });

    // 6. Draw "In-Progress" Object (The one user is currently drawing)
    if (drawingMode === "objects" && drawingObjectBoundary && drawingObjectBoundary.length > 0) {
        const pts = drawingObjectBoundary.map(toPx);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.forEach(p => ctx.lineTo(p.x, p.y));
        
        ctx.strokeStyle = "#9333EA"; // Purple for active drawing
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]); // Reset
    }

  }, [floorPlanImage, boundary, placedObjects, devtaRegions, zone16Regions, zone8Regions, drawingObjectBoundary, drawingMode, hoveredDevta]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const toPx = (p: Point) => ({ x: p.x * WIDTH, y: p.y * HEIGHT });

    for (const region of devtaRegions) {
        if (!region.polygon || region.polygon.length < 3) continue;

        const pts = region.polygon.map(toPx);
        const polygon = new Path2D();
        polygon.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p => polygon.lineTo(p.x, p.y));
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
        onDrawBoundary({ x: x / WIDTH, y: y / HEIGHT });
      }
      return;
    }

    if (drawingMode === "objects") {
      setDrawingObjectBoundary([...drawingObjectBoundary, { x, y }]);
      return;
    }

    const toPx = (p: Point) => ({ x: p.x * WIDTH, y: p.y * HEIGHT });

    for (const region of devtaRegions) {
        if (!region.polygon || region.polygon.length < 3) continue;

        const pts = region.polygon.map(toPx);
        const polygon = new Path2D();
        polygon.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p => polygon.lineTo(p.x, p.y));
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key === "Enter" && drawingMode === "objects" && drawingObjectBoundary.length > 2) {
      const newObject: PlacedObject = {
        id: new Date().toISOString(),
        object_type: selectedObjectType,
        boundary_normalized: drawingObjectBoundary.map(p => ({ x: p.x / WIDTH, y: p.y / HEIGHT })),
        centroid: getCentroid(drawingObjectBoundary)
      };
      if (onPlaceObject) {
        onPlaceObject(newObject);
      }
      setDrawingObjectBoundary([]);
    }
  };

  return (
    <div className="relative w-full h-full flex justify-center items-center bg-gray-100">
        {/* Hidden Image Source for Canvas */}
        {floorPlanImage && (
            <img 
                ref={imageRef}
                src={floorPlanImage} 
                alt="Floor Plan Source" 
                className="hidden" 
                onLoad={() => { /* Trigger re-render if needed */ }}
            />
        )}
        
        <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="bg-white shadow-lg cursor-crosshair"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            // Add mouse event handlers here (onClick, onMouseMove) derived from props
        />
    </div>
  );
};
