// components/floor-plan/DevtaInfoCard.tsx
"use client";

import React from "react";
import { DevtaRegion } from "@/lib/floorPlanInterfaces";
import { devtaObjectData } from "@/lib/devtaObjectData";

interface DevtaInfoCardProps {
  devta: DevtaRegion;
  onClose: () => void;
}

export const DevtaInfoCard: React.FC<DevtaInfoCardProps> = ({ devta, onClose }) => {
  const objectData = devtaObjectData[devta.name];

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">{devta.name}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          &times;
        </button>
      </div>
      <div>
        {objectData ? (
          <>
            <div className="mb-4">
              <h4 className="font-bold text-green-600">Ideal Placements:</h4>
              <ul className="list-disc list-inside">
                {objectData.ideal.map((item) => (
                  <li key={item} className="text-sm text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-red-600">Non-Ideal Placements:</h4>
              <ul className="list-disc list-inside">
                {objectData.nonIdeal.map((item) => (
                  <li key={item} className="text-sm text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            No object placement information available for this devta.
          </p>
        )}
      </div>
    </div>
  );
};
