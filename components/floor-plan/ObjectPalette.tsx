// components/floor-plan/ObjectPalette.tsx
"use client";

import { OBJECT_ICONS } from "@/lib/objectIcons";

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
      className={`flex flex-col items-center justify-center p-2 m-1 border rounded-lg cursor-pointer hover:bg-gray-100`}
    >
      <img src={icon} alt={objectType} className="w-8 h-8" />
      <span className="text-xs text-center">{objectType}</span>
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
    const typeLabel = obj.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    return {
      type: obj,
      label: typeLabel,
      icon: OBJECT_ICONS[typeLabel] || "/objects/generic.svg"
    };
  });

  return (
    <div className="p-4 border-t">
      <h3 className="text-lg font-semibold mb-2">Objects</h3>
      <div id="tutorial-objects" className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
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
