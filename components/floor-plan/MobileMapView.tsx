"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Point } from "@/lib/floorPlanInterfaces";
import { ZoomIn, ZoomOut, Maximize, Compass, Video, X, RefreshCw } from "lucide-react";
import { getObjectIcon } from "@/lib/objectIcons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoundaryBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RoomData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  points?: { x: number; y: number }[];
  doors: { dx?: number; dy?: number; x?: number; y?: number }[];
  mappedObjects: {
    name: string;
    addedAt?: string;
    compassDegree?: number;
    screenDx?: number;
    screenDy?: number;
  }[];
  /** R2 key set after a per-room video is uploaded from the app */
  videoR2Key?: string;
}

interface MobileMapData {
  /** Legacy: boundary encoded as normalised polygon points */
  plot_boundary?: {
    position: { x: number; y: number };
    scale: number;
    normalizedPoints: Point[];
  };
  /** Flutter mobile app format: axis-aligned bounding box */
  boundary_box?: BoundaryBox;
  /** Shape type from the Flutter app (Rectangle / Square / L-Shape / U-Shape / Irregular) */
  boundary_type?: string;
  rooms?: RoomData[];
  north_direction?: number;
}

interface MobileMapViewProps {
  data: MobileMapData;
  className?: string;
  northDirection?: number | null;
  /** Pass projectId so we can fetch per-room presigned video URLs */
  projectId?: string;
  onRefresh?: () => void;
  onApplyToCanvas?: (mobileData: MobileMapData) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileMapView({
  data,
  className = "",
  northDirection,
  projectId,
  onRefresh,
  onApplyToCanvas,
}: MobileMapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Per-room video modal state
  const [activeRoomVideo, setActiveRoomVideo] = useState<{
    url: string;
    roomName: string;
  } | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // Canvas constants
  const CANVAS_SIZE = 1500;
  const MOBILE_COORD_SIZE = 3000; // coordinate space the Flutter app uses (3000 x 3000)

  const [fitScale, setFitScale] = useState<number>(1500 / 3000);

  // Dynamically compute fit scale & center offset so the mobile plot fills ~70% of canvas
  useEffect(() => {
    if (!data) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    if (data.boundary_box) {
      minX = data.boundary_box.x;
      minY = data.boundary_box.y;
      maxX = data.boundary_box.x + data.boundary_box.width;
      maxY = data.boundary_box.y + data.boundary_box.height;
    } else if (data.rooms && data.rooms.length > 0) {
      for (const r of data.rooms) {
        if (r.x < minX) minX = r.x;
        if (r.y < minY) minY = r.y;
        if (r.x + r.width > maxX) maxX = r.x + r.width;
        if (r.y + r.height > maxY) maxY = r.y + r.height;
      }
    }

    if (minX !== Infinity && maxX !== -Infinity) {
      const boxW = Math.max(100, maxX - minX);
      const boxH = Math.max(100, maxY - minY);
      const computedScale = (CANVAS_SIZE * 0.7) / Math.max(boxW, boxH);
      const scaledCenterX = ((minX + maxX) / 2) * computedScale;
      const scaledCenterY = ((minY + maxY) / 2) * computedScale;
      const targetX = CANVAS_SIZE / 2 - scaledCenterX;
      const targetY = CANVAS_SIZE / 2 - scaledCenterY;
      setOffset({ x: targetX, y: targetY });
      setFitScale(computedScale);
    }
  }, [data]);

  const currentNorth = northDirection ?? data.north_direction ?? 0;

  // ── Fetch presigned URL for a room video ──────────────────────────────────
  const handleRoomVideoClick = useCallback(
    async (room: RoomData) => {
      if (!room.videoR2Key || !projectId) return;
      setVideoLoading(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/video-stream-url`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ r2Key: room.videoR2Key }),
          }
        );
        if (!res.ok) throw new Error("Failed to get video URL");
        const { url } = await res.json();
        setActiveRoomVideo({ url, roomName: room.name });
      } catch (e) {
        console.error("Could not load room video:", e);
      } finally {
        setVideoLoading(false);
      }
    },
    [projectId]
  );

  // ── Canvas drawing ─────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // 1. Dot grid
    const gridSize = 50;
    const dotRadius = 1.5;
    ctx.fillStyle = "#e2e8f0";
    const startX = Math.floor(-offset.x / zoom / gridSize) * gridSize;
    const startY = Math.floor(-offset.y / zoom / gridSize) * gridSize;
    const endX = startX + width / zoom + gridSize * 2;
    const endY = startY + height / zoom + gridSize * 2;
    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Scale helpers — map Flutter coordinate space to canvas dynamically
    const scaleX = fitScale;
    const scaleY = fitScale;

    // 2. Draw boundary
    if (data.boundary_box) {
      // ── Flutter boundary_box format ──────────────────────────────────────
      const bb = data.boundary_box;
      const x = bb.x * scaleX;
      const y = bb.y * scaleY;
      const w = bb.width * scaleX;
      const h = bb.height * scaleY;

      const path = new Path2D();
      const type = (data.boundary_type || "Rectangle").toLowerCase();

      if (type === "l-shape") {
        const tx = w * 0.4;
        const ty = h * 0.4;
        path.moveTo(x, y);
        path.lineTo(x + tx, y);
        path.lineTo(x + tx, y + h - ty);
        path.lineTo(x + w, y + h - ty);
        path.lineTo(x + w, y + h);
        path.lineTo(x, y + h);
        path.closePath();
      } else if (type === "u-shape") {
        const tx = w * 0.3;
        const ty = h * 0.3;
        path.moveTo(x, y);
        path.lineTo(x + tx, y);
        path.lineTo(x + tx, y + h - ty);
        path.lineTo(x + w - tx, y + h - ty);
        path.lineTo(x + w - tx, y);
        path.lineTo(x + w, y);
        path.lineTo(x + w, y + h);
        path.lineTo(x, y + h);
        path.closePath();
      } else if (type === "irregular") {
        path.moveTo(x + w * 0.2, y);
        path.lineTo(x + w, y + h * 0.1);
        path.lineTo(x + w * 0.9, y + h);
        path.lineTo(x, y + h * 0.8);
        path.closePath();
      } else {
        // Rectangle / Square
        const side = type === "square" ? Math.min(w, h) : null;
        const rw = side ?? w;
        const rh = side ?? h;
        path.rect(x, y, rw, rh);
      }

      ctx.fillStyle = "rgba(249,115,22,0.07)";
      ctx.fill(path);
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 3 / zoom;
      ctx.lineJoin = "round";
      ctx.stroke(path);

      // Label
      ctx.fillStyle = "#f97316";
      ctx.font = `600 ${Math.max(10, 13 / zoom)}px Inter, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(data.boundary_type ?? "Boundary", x + 6 / zoom, y + 4 / zoom);
    } else if (data.plot_boundary) {
      // ── Legacy normalised-points format ─────────────────────────────────
      const { position, scale: bScale, normalizedPoints } = data.plot_boundary;
      const posX = (position as any).x ?? (position as any).dx ?? 0;
      const posY = (position as any).y ?? (position as any).dy ?? 0;

      const points = normalizedPoints.map((p: any) => ({
        x: (posX + (p.x ?? p.dx ?? 0) * bScale) * scaleX,
        y: (posY + (p.y ?? p.dy ?? 0) * bScale) * scaleY,
      }));

      if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath();
        ctx.fillStyle = "rgba(249,115,22,0.07)";
        ctx.fill();
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 3 / zoom;
        ctx.stroke();
      }
    }

    // 3. Draw rooms & objects
    if (data.rooms) {
      data.rooms.forEach((room) => {
        const rx = room.x * scaleX;
        const ry = room.y * scaleY;
        const rw = room.width * scaleX;
        const rh = room.height * scaleY;

        // Shadow
        ctx.shadowColor = "rgba(0,0,0,0.08)";
        ctx.shadowBlur = 12 / zoom;
        ctx.shadowOffsetY = 6 / zoom;

        // Room box or polygon
        ctx.strokeStyle = room.videoR2Key ? "#8b5cf6" : "#3b82f6";
        ctx.lineWidth = room.videoR2Key ? 3 / zoom : 2.5 / zoom;
        ctx.fillStyle = "rgba(255,255,255,0.95)";

        if (room.points && room.points.length >= 3) {
          ctx.beginPath();
          const p0 = room.points[0];
          ctx.moveTo(p0.x * scaleX, p0.y * scaleY);
          for (let i = 1; i < room.points.length; i++) {
            const p = room.points[i];
            ctx.lineTo(p.x * scaleX, p.y * scaleY);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if ((ctx as any).roundRect) {
          ctx.beginPath();
          (ctx as any).roundRect(rx, ry, rw, rh, 10 / zoom);
          ctx.stroke();
          ctx.fill();
        } else {
          ctx.strokeRect(rx, ry, rw, rh);
          ctx.fillRect(rx, ry, rw, rh);
        }
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Room name
        ctx.fillStyle = "#1e3a8a";
        ctx.font = `600 ${Math.max(10, 16 / zoom)}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          room.name,
          rx + rw / 2,
          ry + rh / 2 - (room.mappedObjects?.length > 0 ? 10 / zoom : 0)
        );

        // Video badge
        if (room.videoR2Key) {
          ctx.fillStyle = "#8b5cf6";
          ctx.font = `700 ${Math.max(8, 10 / zoom)}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText("▶ video", rx + rw / 2, ry + rh - 12 / zoom);
        }

        // Objects
        if (room.mappedObjects?.length > 0) {
          room.mappedObjects.forEach((obj, idx) => {
            let iconX, iconY;
            const cx = rx + rw / 2;
            const cy = ry + rh / 2;
            if (obj.screenDx !== undefined && obj.screenDx !== null && obj.screenDy !== undefined && obj.screenDy !== null) {
              iconX = rx + obj.screenDx * scaleX;
              iconY = ry + obj.screenDy * scaleY;
            } else if (obj.compassDegree !== undefined && obj.compassDegree !== null) {
              const rad = ((obj.compassDegree - currentNorth) * Math.PI) / 180;
              iconX = cx + Math.sin(rad) * (rw / 2) * 0.7;
              iconY = cy - Math.cos(rad) * (rh / 2) * 0.7;
            } else {
              iconX = rx + (idx + 1) * (rw / (room.mappedObjects.length + 1));
              iconY = ry + rh - 20 / zoom;
            }
            ctx.beginPath();
            ctx.arc(iconX, iconY, 5 / zoom, 0, Math.PI * 2);
            ctx.fillStyle = "#10b981";
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5 / zoom;
            ctx.stroke();
            ctx.fillStyle = "#064e3b";
            ctx.font = `600 ${Math.max(8, 10 / zoom)}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText(obj.name, iconX, iconY + 12 / zoom);
          });
        }

        // Doors
        if (room.doors) {
          room.doors.forEach((door: any) => {
            const doorX = door.x ?? door.dx ?? 0;
            const doorY = door.y ?? door.dy ?? 0;
            ctx.fillStyle = "#92400e";
            ctx.beginPath();
            ctx.arc(rx + doorX * scaleX, ry + doorY * scaleY, 7 / zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2.5 / zoom;
            ctx.stroke();
          });
        }
      });
    }

    ctx.restore();

    // Watermark
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.font = "italic 11px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Vastu Studio · Mobile Sync", width - 16, height - 16);
  }, [data, zoom, offset, currentNorth, fitScale]);

  useEffect(() => { draw(); }, [draw]);

  // ── Canvas click: detect room taps for video ───────────────────────────────
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!data.rooms || !containerRef.current) return;
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      // Account for canvas CSS scale (canvas is CANVAS_SIZE px wide but displayed at container width)
      const canvas = canvasRef.current!;
      const cssScaleX = canvas.getBoundingClientRect().width / CANVAS_SIZE;
      const cssScaleY = canvas.getBoundingClientRect().height / CANVAS_SIZE;

      const clickX = ((e.clientX - rect.left) / cssScaleX - offset.x) / zoom;
      const clickY = ((e.clientY - rect.top) / cssScaleY - offset.y) / zoom;

      const scaleX = fitScale;
      const scaleY = fitScale;

      for (const room of data.rooms) {
        const rx = room.x * scaleX;
        const ry = room.y * scaleY;
        const rw = room.width * scaleX;
        const rh = room.height * scaleY;
        if (clickX >= rx && clickX <= rx + rw && clickY >= ry && clickY <= ry + rh) {
          if (room.videoR2Key) handleRoomVideoClick(room);
          return;
        }
      }
    },
    [data.rooms, offset, zoom, fitScale, handleRoomVideoClick]
  );

  // ── Zoom / Pan ─────────────────────────────────────────────────────────────
  const handleZoom = useCallback((delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev * (1 + delta), 0.4), 12));
  }, []);

  const resetView = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) { e.preventDefault(); handleZoom(-e.deltaY * 0.01); }
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
    setOffset((prev) => ({ x: prev.x + e.clientX - lastPos.x, y: prev.y + e.clientY - lastPos.y }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };
  const onPointerUp = () => setIsPanning(false);

  const hasRoomVideos = data.rooms?.some((r) => r.videoR2Key);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col h-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative group ${className}`}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl px-5 py-3 border-b border-gray-100 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Reference Grid</span>
            <span className="text-base font-bold text-gray-900 font-cormorant italic">Mobile Sync View</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider border border-gray-200"
              title="Refresh Mobile Map Data"
            >
              <RefreshCw size={12} /> Sync Refresh
            </button>
          )}
          {onApplyToCanvas && data && (data.boundary_box || (data.rooms && data.rooms.length > 0)) && (
            <button
              onClick={() => onApplyToCanvas(data)}
              className="px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-sm"
              title="Apply mobile plot boundary & rooms onto main canvas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              Apply to Canvas
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Boundary</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rooms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Objects</span>
          </div>
          {hasRoomVideos && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Room Video</span>
            </div>
          )}
        </div>
      </div>

      {hasRoomVideos && (
        <div className="px-5 py-2 bg-purple-50 border-b border-purple-100 text-[10px] text-purple-700 font-semibold flex items-center gap-1.5">
          <Video size={11} />
          Click a room to play its walkthrough video
        </div>
      )}

      {/* Canvas */}
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
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="w-full h-full object-contain"
          onClick={handleCanvasClick}
        />

        {/* Empty State Banner */}
        {(!data || (!data.boundary_box && !data.plot_boundary && (!data.rooms || data.rooms.length === 0))) && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 mb-3 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            </div>
            <h3 className="text-white text-base font-bold font-cormorant italic mb-1">No Mobile Plot Synced Yet</h3>
            <p className="text-gray-300 text-xs max-w-xs leading-relaxed">
              Open the mobile app, set your rooms and boundary, then tap <span className="text-orange-400 font-bold">Sync Web</span> to project your layout here.
            </p>
          </div>
        )}

        {/* North compass */}
        <div className="absolute top-6 right-6 flex flex-col items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-3 rounded-full border border-gray-100 shadow-xl">
          <div className="transition-transform duration-1000 ease-out" style={{ transform: `rotate(${currentNorth}deg)` }}>
            <Compass size={28} className="text-orange-500" />
          </div>
          <span className="text-[10px] font-bold text-gray-500">{Math.round(currentNorth)}° N</span>
        </div>

        {/* Floating controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2.5 transition-all duration-500 opacity-0 group-hover:opacity-100">
          <button onClick={() => handleZoom(0.2)} className="p-3.5 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-white text-gray-800 hover:bg-primary hover:text-white transition-all">
            <ZoomIn size={20} />
          </button>
          <button onClick={() => handleZoom(-0.2)} className="p-3.5 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-white text-gray-800 hover:bg-primary hover:text-white transition-all">
            <ZoomOut size={20} />
          </button>
          <button onClick={resetView} className="p-3.5 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-white text-gray-800 hover:bg-primary hover:text-white transition-all">
            <Maximize size={20} />
          </button>
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-6 left-6 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 shadow-lg text-[11px] font-bold text-primary tracking-widest uppercase">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Per-room video modal */}
      {activeRoomVideo && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
          <div className="w-full max-h-full flex flex-col p-4 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm flex items-center gap-2">
                <Video size={16} className="text-purple-400" />
                {activeRoomVideo.roomName} — Walkthrough
              </span>
              <button onClick={() => setActiveRoomVideo(null)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>
            <video
              src={activeRoomVideo.url}
              controls
              autoPlay
              className="w-full rounded-xl object-contain max-h-[75%] bg-black"
            />
          </div>
        </div>
      )}

      {videoLoading && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading video…</span>
          </div>
        </div>
      )}
    </div>
  );
}
