"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  defaultLeftWidth?: number;
  className?: string;
}

export function ResizableLayout({
  leftPanel,
  rightPanel,
  minLeftWidth = 300,
  maxLeftWidth = 600,
  defaultLeftWidth = 400,
  className = "",
}: ResizableLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const clampedWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newWidth));
      setLeftWidth(clampedWidth);
    },
    [isDragging, minLeftWidth, maxLeftWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className={`flex h-full ${className}`}>
      <div
        className="flex-shrink-0 overflow-hidden transition-[width] duration-75"
        style={{ width: typeof window !== 'undefined' && window.innerWidth < 768 ? "100%" : leftWidth }}
      >
        {leftPanel}
      </div>
      <div
        className={`w-1 cursor-col-resize flex-shrink-0 group relative ${
          isDragging ? "bg-teal-500/50" : "bg-gray-300 hover:bg-teal-400/50"
        } transition-colors duration-200`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-10 rounded-full bg-gray-400 group-hover:bg-teal-500 transition-colors ${
            isDragging ? "bg-teal-500" : ""
          }`}
        />
      </div>
      <div className="flex-1 overflow-hidden">{rightPanel}</div>
    </div>
  );
}
