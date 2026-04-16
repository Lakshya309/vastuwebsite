"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Point } from "@/lib/floorPlanInterfaces";
import { ZoomIn, ZoomOut, Maximize, Move, Compass } from "lucide-react";
import { OBJECT_ICONS, getObjectIcon } from "@/lib/objectIcons";

interface MobileMapData {
  plot_boundary?: {
    position: { x: number; y: number };
    scale: number;
    normalizedPoints: Point[];
  };
  rooms?: {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    doors: { dx: number; dy: number }[];
    mappedObjects: { name: string; addedAt?: string; compassDegree?: number }[];
  }[];
  north_direction?: number; 
}

interface MobileMapViewProps {
  data: MobileMapData;
  className?: string;
  northDirection?: number | null; // From project root if available
}

export function MobileMapView({ data, className = "", northDirection }: MobileMapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  // Constants
  const MOBILE_CANVAS_SIZE = 2000;
  const INTERNAL_CANVAS_SIZE = 1500; // Resolution

  const currentNorth = northDirection ?? data.north_direction ?? 0;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply global transforms
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Dot Grid (Premium look)
    const gridSize = 50;
    const dotRadius = 1.5;
    ctx.fillStyle = "#e2e8f0";
    
    const startX = Math.floor(-offset.x / zoom / gridSize) * gridSize;
    const startY = Math.floor(-offset.y / zoom / gridSize) * gridSize;
    const endX = startX + (width / zoom) + gridSize * 2;
    const endY = startY + (height / zoom) + gridSize * 2;

    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Scale helper
    const scaleX = width / MOBILE_CANVAS_SIZE;
    const scaleY = height / MOBILE_CANVAS_SIZE;

    // 2. Draw Plot Boundary
    if (data.plot_boundary) {
      const { position, scale: bScale, normalizedPoints } = data.plot_boundary;
      const points = normalizedPoints.map((p) => ({
        x: (position.x + p.x * bScale) * scaleX,
        y: (position.y + p.y * bScale) * scaleY,
      }));

      if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        
        ctx.strokeStyle = "#f97316"; // Orange
        ctx.lineWidth = 4 / zoom;
        ctx.lineJoin = "round";
        ctx.stroke();
        
        const gradient = ctx.createRadialGradient(
          width/2, height/2, 0,
          width/2, height/2, width
        );
        gradient.addColorStop(0, "rgba(249, 115, 22, 0.08)");
        gradient.addColorStop(1, "rgba(249, 115, 22, 0.02)");
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    // 3. Draw Rooms & Objects
    if (data.rooms) {
      data.rooms.forEach((room) => {
        const rx = room.x * scaleX;
        const ry = room.y * scaleY;
        const rw = room.width * scaleX;
        const rh = room.height * scaleY;

        // Shadow effect
        ctx.shadowColor = "rgba(0,0,0,0.08)";
        ctx.shadowBlur = 12 / zoom;
        ctx.shadowOffsetY = 6 / zoom;

        // Draw Room Box
        ctx.strokeStyle = "#3b82f6"; // Blue
        ctx.lineWidth = 2.5 / zoom;
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(rx, ry, rw, rh, 10 / zoom);
            ctx.stroke();
            ctx.fill();
        } else {
            ctx.strokeRect(rx, ry, rw, rh);
            ctx.fillRect(rx, ry, rw, rh);
        }
        
        ctx.fillStyle = "rgba(59, 130, 246, 0.04)";
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Room Name
        ctx.fillStyle = "#1e3a8a";
        ctx.font = `600 ${Math.max(10, 16 / zoom)}px "Inter", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(room.name, rx + rw / 2, ry + rh / 2 - (room.mappedObjects.length > 0 ? 10 : 0));

        // Draw Mapped Objects (Icons)
        if (room.mappedObjects && room.mappedObjects.length > 0) {
          room.mappedObjects.forEach((obj, idx) => {
            const iconUrl = getObjectIcon(obj.name);
            const iconSize = 24 / zoom;
            const img = new Image();
            img.src = iconUrl;
            
            // Note: Canvas images are async. For a simple ref view, we'll try to draw if cached, 
            // but a better way is preloading. For now, we use a color dot + label.
            const iconX = rx + (idx + 1) * (rw / (room.mappedObjects.length + 1));
            const iconY = ry + rh - (20 / zoom);

            ctx.beginPath();
            ctx.arc(iconX, iconY, 4 / zoom, 0, Math.PI * 2);
            ctx.fillStyle = "#10b981"; // Green
            ctx.fill();

            ctx.fillStyle = "#064e3b";
            ctx.font = `500 ${Math.max(8, 10 / zoom)}px "Inter", sans-serif`;
            ctx.fillText(obj.name, iconX, iconY + (12 / zoom));
          });
        }

        // Draw Doors
        if (room.doors) {
          room.doors.forEach((door) => {
            ctx.fillStyle = "#92400e"; // Brown
            ctx.beginPath();
            ctx.arc(rx + door.dx * scaleX, ry + door.dy * scaleY, 7 / zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2.5 / zoom;
            ctx.stroke();
          });
        }
      });
    }

    ctx.restore();

    // 4. Labels (Static)
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.font = "italic 11px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Vastu Studio Mobile Sync", width - 20, height - 20);

  }, [data, zoom, offset]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Interaction Handlers
  const handleZoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    setZoom((prevZoom) => {
      const newZoom = Math.min(Math.max(prevZoom * (1 + delta), 0.5), 10);
      
      if (centerX !== undefined && centerY !== undefined) {
        const zoomRatio = newZoom / prevZoom;
        setOffset((prev) => ({
          x: centerX - (centerX - prev.x) * zoomRatio,
          y: centerY - (centerY - prev.y) * zoomRatio,
        }));
      }
      
      return newZoom;
    });
  }, []);

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.01;
        const rect = container.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        handleZoom(delta, offsetX, offsetY);
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [handleZoom]);

  const onPointerDown = (e: React.PointerEvent) => {
    setIsPanning(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = () => setIsPanning(false);

  return (
    <div className={`flex flex-col h-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative group ${className}`}>
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Reference Grid</span>
              <span className="text-base font-bold text-gray-900 font-cormorant italic">Mobile Sync View</span>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Boundary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Objects</span>
                </div>
            </div>
        </div>

        {/* Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative bg-[#f8fafc] overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
            <canvas
                ref={canvasRef}
                width={INTERNAL_CANVAS_SIZE}
                height={INTERNAL_CANVAS_SIZE}
                className="w-full h-full object-contain"
            />
            
            {/* North Compass Indicator */}
            <div className="absolute top-8 right-8 flex flex-col items-center gap-2 bg-white/90 backdrop-blur px-3 py-4 rounded-full border border-gray-100 shadow-xl">
                 <div 
                    className="transition-transform duration-1000 ease-out"
                    style={{ transform: `rotate(${currentNorth}deg)` }}
                 >
                    <Compass size={32} className="text-orange-500" />
                 </div>
                 <span className="text-[10px] font-bold text-gray-500">{Math.round(currentNorth)}° N</span>
            </div>

            {/* Floating Controls */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-3 transition-all duration-500 transform group-hover:translate-x-0 translate-x-4 opacity-0 group-hover:opacity-100">
                <button 
                  onClick={() => handleZoom(0.2, INTERNAL_CANVAS_SIZE/2, INTERNAL_CANVAS_SIZE/2)}
                  className="p-4 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white text-gray-800 hover:bg-primary hover:text-white transition-all transform hover:scale-105 active:scale-90"
                >
                  <ZoomIn size={22} />
                </button>
                <button 
                   onClick={() => handleZoom(-0.2, INTERNAL_CANVAS_SIZE/2, INTERNAL_CANVAS_SIZE/2)}
                  className="p-4 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white text-gray-800 hover:bg-primary hover:text-white transition-all transform hover:scale-105 active:scale-90"
                >
                  <ZoomOut size={22} />
                </button>
                <button 
                  onClick={resetView}
                  className="p-4 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white text-gray-800 hover:bg-primary hover:text-white transition-all transform hover:scale-105 active:scale-90"
                >
                  <Maximize size={22} />
                </button>
            </div>

            {/* Zoom Indicator */}
            <div className="absolute bottom-8 left-8 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 shadow-lg text-[11px] font-bold text-primary tracking-widest uppercase">
                Scale: {Math.round(zoom * 100)}%
            </div>
        </div>
    </div>
  );
}
