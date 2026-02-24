"use client";

import React, { useRef } from "react";
import { PlacedObject } from "@/lib/floorPlanInterfaces";

interface DraggableObjectProps {
  object: PlacedObject;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onRotate: (id: string, rotation: number) => void;
  onDelete: (id: string) => void;
  objectSvgMap: { [key: string]: string };
  canvasRef: React.RefObject<HTMLDivElement | null>;
  highlight?: "CRITICAL" | "BAD" | null;
  isStatic?: boolean;
  zoom: number;
  offset: { x: number; y: number };
}

export const DraggableObject: React.FC<DraggableObjectProps> = ({
  object,
  onMove,
  onResize,
  onRotate,
  onDelete,
  objectSvgMap,
  canvasRef,
  highlight,
  isStatic,
  zoom,
  offset,
}) => {
  const objectRef = useRef<HTMLDivElement>(null);

  const dragState = useRef({
    mode: "drag" as "drag" | "resize" | "rotate",
    startMouseX: 0,
    startMouseY: 0,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  const getCanvasDims = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return {
      width: rect?.width ?? 1,
      height: rect?.height ?? 1,
      left: rect?.left ?? 0,
      top: rect?.top ?? 0,
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (isStatic) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;

    dragState.current.mode = target.classList.contains("resize-handle")
      ? "resize"
      : target.classList.contains("rotate-handle")
      ? "rotate"
      : "drag";

    const canvas = getCanvasDims();

    dragState.current.startMouseX = e.clientX - canvas.left;
    dragState.current.startMouseY = e.clientY - canvas.top;
    dragState.current.startX = object.boundary_normalized[0].x;
    dragState.current.startY = object.boundary_normalized[0].y;
    dragState.current.startWidth =
      object.boundary_normalized[1].x -
      object.boundary_normalized[0].x;
    dragState.current.startHeight =
      object.boundary_normalized[3].y -
      object.boundary_normalized[0].y;

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    const canvas = getCanvasDims();

    const mx = e.clientX - canvas.left;
    const my = e.clientY - canvas.top;

    const dx = (mx - dragState.current.startMouseX) / canvas.width;
    const dy = (my - dragState.current.startMouseY) / canvas.height;

    if (dragState.current.mode === "drag") {
      onMove(
        object.id,
        dragState.current.startX + dx,
        dragState.current.startY + dy
      );
    }

    if (dragState.current.mode === "resize") {
      onResize(
        object.id,
        dragState.current.startWidth + dx,
        dragState.current.startHeight + dy
      );
    }

    if (dragState.current.mode === "rotate" && objectRef.current) {
      const rect = objectRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle =
        Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
      onRotate(object.id, angle);
    }
  };

  const onMouseUp = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const canvas = getCanvasDims();
  
  const worldX = object.boundary_normalized[0].x * canvas.width;
  const worldY = object.boundary_normalized[0].y * canvas.height;
  const worldWidth = (object.boundary_normalized[1].x - object.boundary_normalized[0].x) * canvas.width;
  const worldHeight = (object.boundary_normalized[3].y - object.boundary_normalized[0].y) * canvas.height;

  const screenX = worldX * zoom + offset.x;
  const screenY = worldY * zoom + offset.y;
  const screenWidth = worldWidth * zoom;
  const screenHeight = worldHeight * zoom;

  const getHighlightColor = () => {
    if (highlight === "CRITICAL") return "red";
    if (highlight === "BAD") return "orange";
    return isStatic ? "transparent" : "#2563eb";
  }

  return (
    <div
      ref={objectRef}
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        left: screenX,
        top: screenY,
        width: screenWidth,
        height: screenHeight,
        transform: `rotate(${object.rotation || 0}deg)`,
        cursor: isStatic ? "default" : "grab",
        pointerEvents: "auto",
        border: `2px solid ${getHighlightColor()}`,
      }}
    >
      <img
        src={objectSvgMap[object.object_type]}
        alt={object.object_type}
        draggable={false}
        style={{ width: "100%", height: "100%" }}
      />

      {!isStatic && (
        <>
          <button
            onClick={() => onDelete(object.id)}
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              background: "red",
              color: "white",
              borderRadius: "50%",
              width: 20,
              height: 20,
              border: "none",
              cursor: "pointer",
            }}
          >
            ×
          </button>

          <div
            className="resize-handle"
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              background: "#2563eb",
              cursor: "nwse-resize",
            }}
          />

          <div
            className="rotate-handle"
            style={{
              position: "absolute",
              top: -10,
              left: -10,
              width: 10,
              height: 10,
              background: "green",
              cursor: "grab",
            }}
          />
        </>
      )}
    </div>
  );
};
