"use client";

import React from "react";
import { Point } from "@/lib/floorPlanInterfaces";
import { Ruler, Check, ChevronRight } from "lucide-react";

export const SEGMENT_PALETTE = [
  "#2563EB", // 0: Blue (Front)
  "#10B981", // 1: Emerald (Right)
  "#F59E0B", // 2: Amber (Back)
  "#8B5CF6", // 3: Purple (Left)
  "#EC4899", // 4: Pink
  "#06B6D4", // 5: Cyan
  "#F97316", // 6: Orange
  "#14B8A6", // 7: Teal
];

export const WALL_NAMES_4 = ["Front", "Right", "Back", "Left"];

interface WallInfoBarProps {
  boundary: Point[];
  wallLengths: number[];
  unit?: string;
  selectedIndex: number | null;
  onSelectWall: (index: number | null) => void;
  onSetReferenceWall?: (index: number) => void;
}

export const WallInfoBar: React.FC<WallInfoBarProps> = ({
  boundary,
  wallLengths,
  unit = "ft",
  selectedIndex,
  onSelectWall,
  onSetReferenceWall,
}) => {
  if (!boundary || boundary.length < 2 || !wallLengths || wallLengths.length === 0) {
    return null;
  }

  const count = boundary.length;
  const totalPerimeter = wallLengths.reduce((acc, len) => acc + (len || 0), 0);
  const selectedLength = selectedIndex !== null ? wallLengths[selectedIndex] : null;
  const selectedName =
    selectedIndex !== null
      ? count === 4
        ? WALL_NAMES_4[selectedIndex]
        : `Wall ${selectedIndex + 1}`
      : null;

  return (
    <div id="tutorial-wall-infobar" className="w-full bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm z-10 transition-all">
      {/* Left: Interactive Wall Segment Chips */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-thin">
        <div className="flex items-center gap-1.5 text-gray-500 font-medium mr-1 whitespace-nowrap">
          <Ruler className="w-3.5 h-3.5 text-blue-600" />
          <span>Walls:</span>
        </div>

        {wallLengths.slice(0, count).map((length, i) => {
          const isSelected = selectedIndex === i;
          const color = SEGMENT_PALETTE[i % SEGMENT_PALETTE.length];
          const name = count === 4 ? WALL_NAMES_4[i] : `W${i + 1}`;

          return (
            <button
              key={i}
              onClick={() => onSelectWall(isSelected ? null : i)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all whitespace-nowrap font-medium ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-offset-1 ring-blue-500"
                  : "bg-gray-50/80 hover:bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
              title={`Click to highlight ${name} on canvas`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="font-semibold">{name}</span>
              <span
                className={`${
                  isSelected ? "text-blue-300" : "text-gray-500"
                } tabular-nums`}
              >
                {length ? length.toFixed(1) : "--"} {unit}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Selected Wall Details & Reference Action */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-shrink-0">
        {selectedIndex !== null && selectedLength != null ? (
          <div className="flex items-center gap-3 bg-blue-50/80 border border-blue-200/80 rounded-lg px-3 py-1 text-blue-900 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    SEGMENT_PALETTE[selectedIndex % SEGMENT_PALETTE.length],
                }}
              />
              <span className="font-bold">{selectedName}:</span>
              <span className="text-blue-700 font-semibold tabular-nums">
                {selectedLength.toFixed(2)} {unit}
              </span>
              {totalPerimeter > 0 && (
                <span className="text-[10px] text-blue-600/80 ml-1">
                  ({((selectedLength / totalPerimeter) * 100).toFixed(0)}% of plot)
                </span>
              )}
            </div>

            {onSetReferenceWall && (
              <button
                onClick={() => onSetReferenceWall(selectedIndex)}
                className="flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded shadow-sm transition-colors font-medium ml-1"
                title="Use this wall length to calibrate plot scale"
              >
                <Check className="w-3 h-3" />
                <span>Reference</span>
              </button>
            )}

            <button
              onClick={() => onSelectWall(null)}
              className="text-gray-400 hover:text-gray-600 text-xs px-1"
              title="Clear highlight"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-gray-500 flex items-center gap-1">
            <span>Perimeter:</span>
            <span className="font-semibold text-gray-800 tabular-nums">
              {totalPerimeter.toFixed(1)} {unit}
            </span>
            <span className="text-gray-400 ml-1">· Tap any wall to inspect</span>
          </div>
        )}
      </div>
    </div>
  );
};
