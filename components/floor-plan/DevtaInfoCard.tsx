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
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">{devta.name}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          &times;
        </button>
      </div>
      <div>
        {description && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded text-blue-800 font-medium italic">
            "{description}"
          </div>
        )}
        {objectData ? (
          <>
            <div className="mb-4">
              <h4 className="font-bold text-green-600">Ideal Bhojans:</h4>
              <ul className="list-disc list-inside">
                {objectData.ideal.map((item) => (
                  <li key={item} className="text-sm text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
          </>
        ) : !description ? (
          <p className="text-sm text-gray-600">
            No detailed information available for this region.
          </p>
        ) : null}
      </div>
    </div>
  );
};
