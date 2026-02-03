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
  const objects = [
    { type: "Stove", icon: "/objects/stove.svg" },
    { type: "Toilet", icon: "/objects/toilet.svg" },
    { type: "Bed", icon: "/objects/bed.svg" },
    { type: "Wardrobe", icon: "/objects/wardrobe.svg" },
    { type: "Sofa", icon: "/objects/sofa.svg" },
    { type: "Pooja", icon: "/objects/pooja.svg" },
    { type: "Stairs", icon: "/objects/stairs.svg" },
    { type: "Dining", icon: "/objects/dining.svg" },
  ];

  return (
    <div className="p-4 border-t">
      <h3 className="text-lg font-semibold mb-2">Objects</h3>
      <div className="grid grid-cols-3 gap-2">
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
