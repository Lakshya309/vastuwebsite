// components/floor-plan/DevtaInfoCard.tsx
"use client";

import React from "react";
import { DevtaRegion } from "@/lib/floorPlanInterfaces";
import { devtaObjectData } from "@/lib/devtaObjectData";
import { zoneDescriptions } from "@/lib/zoneDescriptions";

interface DevtaInfoCardProps {
  devta: DevtaRegion;
  onClose: () => void;
}

export const DevtaInfoCard: React.FC<DevtaInfoCardProps> = ({ devta, onClose }) => {
  const objectData = devtaObjectData[devta.name];
  const description = zoneDescriptions[devta.name];

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">{devta.name}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          &times;
        </button>
      </div>
      <div>
        {/* Spatial Metrics & Angular vs Boundary Breakdown */}
        {devta.startAngle !== undefined && devta.endAngle !== undefined && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
            <div className="flex justify-between items-center font-bold text-slate-800 border-b border-slate-200 pb-1">
              <span>Angular Span</span>
              <span className="text-primary font-mono">22.5° Total</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
              <div>Left Half: <span className="font-semibold text-slate-800">11.25°</span></div>
              <div>Right Half: <span className="font-semibold text-slate-800">11.25°</span></div>
            </div>
            {devta.boundary_length !== undefined && devta.boundary_length !== null && (
              <div className="pt-1 border-t border-slate-200 flex justify-between items-center text-slate-700 font-medium">
                <span>Boundary Path Length:</span>
                <span className="font-bold text-blue-700 font-mono">
                  {devta.boundary_length.toFixed(2)} ft
                </span>
              </div>
            )}
          </div>
        )}
        {description && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded text-blue-800 font-medium">
            <span className="text-xs font-semibold text-blue-600 block mb-1">Meaning:</span>
            {description}
          </div>
        )}
        {objectData ? (
          <>
            <div className="mb-4">
              <h4 className="font-bold text-green-600 text-sm mb-2">Ideal Bhog:</h4>
              <ul className="list-disc list-inside">
                {objectData.ideal.map((item) => (
                  <li key={item} className="text-sm text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
          </>
        ) : !description ? (
          <p className="text-sm text-gray-600">
            No detailed information available for this zone.
          </p>
        ) : null}
      </div>
    </div>
  );
};
