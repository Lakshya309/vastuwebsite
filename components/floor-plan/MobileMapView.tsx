"use client";

import React, { useEffect, useRef } from "react";
import { Point } from "@/lib/floorPlanInterfaces";

interface MobileMapData {
  plot_boundary?: {
    normalizedPoints: Point[];
    scale: number;
    position: { dx: number; dy: number };
  };
  rooms?: {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    doors: { dx: number; dy: number }[];
  }[];
}

interface MobileMapViewProps {
  data: MobileMapData;
  className?: string;
}

export function MobileMapView({ data, className = "" }: MobileMapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // 1. Draw Grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    const gridSize = 30;
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // Scale helper (mobile canvas was 2000x2000, we map it to our canvas size)
    const MOBILE_CANVAS_SIZE = 2000;
    const scaleX = canvasWidth / MOBILE_CANVAS_SIZE;
    const scaleY = canvasHeight / MOBILE_CANVAS_SIZE;

    // 2. Draw Plot Boundary
    if (data.plot_boundary) {
      const { normalizedPoints, scale, position } = data.plot_boundary;
      const points = normalizedPoints.map((p) => ({
        x: (p.x * scale + position.dx) * scaleX,
        y: (p.y * scale + position.dy) * scaleY,
      }));

      if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = "#f97316"; // Orange
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "rgba(249, 115, 22, 0.05)";
        ctx.fill();
      }
    }

    // 3. Draw Rooms
    if (data.rooms) {
      data.rooms.forEach((room) => {
        const rx = room.x * scaleX;
        const ry = room.y * scaleY;
        const rw = room.width * scaleX;
        const rh = room.height * scaleY;

        // Draw Room Box
        ctx.strokeStyle = "#3b82f6"; // Blue
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.fillRect(rx, ry, rw, rh);

        // Draw Room Name
        ctx.fillStyle = "#1e40af";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(room.name, rx + rw / 2, ry + rh / 2);

        // Draw Doors
        if (room.doors) {
          room.doors.forEach((door) => {
            ctx.fillStyle = "#92400e"; // Brown
            ctx.beginPath();
            ctx.arc(rx + door.dx * scaleX, ry + door.dy * scaleY, 5, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });
    }

    // 4. Centered Label
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.font = "italic 10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Mobile Sync Reference", canvasWidth - 10, canvasHeight - 10);

  }, [data]);

  return (
    <div className={`flex flex-col h-full bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden ${className}`}>
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Mobile Map Reference</span>
            <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" title="Boundary" />
                <div className="w-2 h-2 rounded-full bg-blue-500" title="Rooms" />
            </div>
        </div>
        <div className="flex-1 relative bg-[#fafafa]">
            <canvas
                ref={canvasRef}
                width={1000}
                height={1000}
                className="w-full h-full object-contain"
            />
        </div>
    </div>
  );
}
