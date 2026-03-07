// components/floor-plan/ObjectPalette.tsx
"use client";

import React from "react";

interface ObjectPaletteItemProps {
  objectType: string;
  icon: string;
  onAddObject: (objectType: string) => void;
}

const ObjectPaletteItem: React.FC<ObjectPaletteItemProps> = ({
  objectType,
  icon,
  onAddObject,
}) => {
  return (
    <div
      onClick={() => onAddObject(objectType)}
      className={`flex flex-col items-center justify-center p-2 m-1 border rounded-lg cursor-pointer`}
    >
      <img src={icon} alt={objectType} className="w-8 h-8" />
      <span className="text-xs">{objectType}</span>
    </div>
  );
};

interface ObjectPaletteProps {
  onAddObject: (objectType: string) => void;
}

export const ObjectPalette: React.FC<ObjectPaletteProps> = ({
  onAddObject,
}) => {
  const allObjects = [
    "TOILET", "DINING ROOM", "SEPTIC TANK", "FAMILY LOUNGE", "STUDY TABLE",
    "STORE ROOM", "SERVENT ROOM", "GUEST ROOM", "BAR", "STAIRCASE", "POOJA",
    "KITCHEN", "MUSIC SYSTEM", "PARKING", "OVERHEAD TANK", "UNDERGROUND TANK",
    "MAIN GATE", "SWIMMING POOL", "WELL", "TV", "TUBES", "DUSTBIN", "SAFE",
    "HEATER", "WASHING MACHINE", "AC", "INVERTER", "POTS", "SICK PERSON BED",
    "AQUARIUM", "IRON ALMIRA", "GYM", "MEDITATION", "PETS", "SWING", "PLANTS",
    "SHOERACK", "MATERIAL", "FINISH"
  ];

  const objects = allObjects.map(obj => {
    // Check if there is an explicit icon for the object type
    // We already have some predefined ones and we can map them back
    const typeLabel = obj.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    // Explicit mappings for icons we know exist
    const explicitIcons: Record<string, string> = {
      "Stove": "/objects/stove.svg",
      "Toilet": "/objects/toilet.svg",
      "Bed": "/objects/bed.svg",
      "Wardrobe": "/objects/wardrobe.svg",
      "Sofa": "/objects/sofa.svg",
      "Pooja": "/objects/pooja.png",
      "Staircase": "/objects/stairs.svg",
      "Dining Room": "/objects/dining.svg",
      "Overhead Tank": "/objects/overheadtank.png",
      "Underground Tank": "/objects/undergroundtank.png",
      "Kitchen": "/objects/stove.svg", // Re-using stove for kitchen
    };

    return {
      type: obj,
      label: typeLabel,
      icon: explicitIcons[typeLabel] || "/objects/generic.svg"
    };
  });

  return (
    <div className="p-4 border-t">
      <h3 className="text-lg font-semibold mb-2">Objects</h3>
      <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
        {objects.map((obj) => (
          <ObjectPaletteItem
            key={obj.type}
            objectType={obj.type}
            icon={obj.icon}
            onAddObject={onAddObject}
          />
        ))}
      </div>
    </div>
  );
};
