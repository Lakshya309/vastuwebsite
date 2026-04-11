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
  highlight?: "CRITICAL" | "BAD" | "GOOD" | "EXCELLENT" | null;
  isStatic?: boolean;
  zoom: number;
  offset: { x: number; y: number };
  viewRotation?: number;
  computedLayout?: { drawX: number; drawY: number; drawWidth: number; drawHeight: number };
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
  viewRotation = 0,
  computedLayout,
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

  const [dimensions, setDimensions] = React.useState({ width: 1, height: 1 });

  React.useEffect(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, [canvasRef]);

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

    const canvasWidth = dimensions.width;
    const canvasHeight = dimensions.height;

    dragState.current.startMouseX = e.clientX;
    dragState.current.startMouseY = e.clientY;
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
    const canvasWidth = computedLayout ? computedLayout.drawWidth : dimensions.width;
    const canvasHeight = computedLayout ? computedLayout.drawHeight : dimensions.height;

    let dx = (e.clientX - dragState.current.startMouseX) / (canvasWidth * zoom);
    let dy = (e.clientY - dragState.current.startMouseY) / (canvasHeight * zoom);

    // Un-rotate the delta based on view rotation
    if (viewRotation !== 0) {
      const rad = (-viewRotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      dx = rx;
      dy = ry;
    }

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

  const drawX = computedLayout ? computedLayout.drawX : 0;
  const drawY = computedLayout ? computedLayout.drawY : 0;
  const drawWidth = computedLayout ? computedLayout.drawWidth : dimensions.width;
  const drawHeight = computedLayout ? computedLayout.drawHeight : dimensions.height;

  const screenX = drawX + (object.boundary_normalized[0].x * drawWidth * zoom) + offset.x;
  const screenY = drawY + (object.boundary_normalized[0].y * drawHeight * zoom) + offset.y;
  const screenWidth = (object.boundary_normalized[1].x - object.boundary_normalized[0].x) * drawWidth * zoom;
  const screenHeight = (object.boundary_normalized[3].y - object.boundary_normalized[0].y) * drawHeight * zoom;

  const getHighlightColor = () => {
    if (highlight === "CRITICAL") return "red";
    if (highlight === "BAD") return "orange";
    if (highlight === "GOOD") return "lightgreen";
    if (highlight === "EXCELLENT") return "green";
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
        src={objectSvgMap[object.object_type] || "/objects/generic.svg"}
        alt={object.object_type}
        draggable={false}
        onError={(e) => {
          console.error(`Failed to load icon for ${object.object_type}: ${e.currentTarget.src}`);
          e.currentTarget.src = "/objects/generic.svg";
        }}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />

      {object.grade && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: -12,
            backgroundColor: object.grade === "A" ? "green" : object.grade === "B" ? "orange" : "red",
            color: "white",
            fontWeight: "bold",
            fontSize: "12px",
            padding: "2px 6px",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            zIndex: 10,
          }}
        >
          {object.grade}
        </div>
      )}

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
