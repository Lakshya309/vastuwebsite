// components/floor-plan/ObjectPalette.tsx
"use client";

import React from "react";
import { Crown } from "lucide-react";
import { OBJECT_ICONS } from "@/lib/objectIcons";
interface ObjectPaletteItemProps {
  objectType: string;
  icon: string;
  onAddObject: (objectType: string) => void;
  isLocked: boolean;
}

const ObjectPaletteItem: React.FC<ObjectPaletteItemProps> = ({
  objectType,
  icon,
  onAddObject,
  isLocked,
}) => {
  return (
    <div
      onClick={() => !isLocked && onAddObject(objectType)}
      className={`relative flex flex-col items-center justify-center p-3 m-1 border rounded-[1.5rem] bg-white transition-all shadow-sm ${
        isLocked ? 'opacity-70 grayscale cursor-not-allowed border-gray-100' : 'cursor-pointer hover:bg-gray-50 border-white hover:border-primary/20 hover:scale-[1.05] active:scale-95'
      }`}
    >
      {isLocked && (
        <div className="absolute top-1 right-1 z-10 scale-[0.6] origin-top-right">
          <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">
            <Crown size={10} />
            PRO
          </span>
        </div>
      )}
      <div className="w-10 h-10 mb-2 flex items-center justify-center">
        <img src={icon} alt={objectType} className="w-full h-full object-contain opacity-80" />
      </div>
      <span className="text-[9px] font-bold text-gray-500 text-center uppercase tracking-tighter leading-tight">{objectType}</span>
    </div>
  );
};

interface ObjectPaletteProps {
  onAddObject: (objectType: string) => void;
  isPremium: boolean;
}

export const ObjectPalette: React.FC<ObjectPaletteProps> = ({
  onAddObject,
  isPremium,
}) => {
  const allObjects = [
    "TOILET", "DINING ROOM", "SEPTIC TANK", "FAMILY LOUNGE", "STUDY TABLE",
    "STORE ROOM", "SERVENT ROOM", "GUEST ROOM", "BAR", "STAIRCASE", "POOJA",
    "KITCHEN", "MUSIC SYSTEM", "PARKING", "OVERHEAD TANK", "UNDERGROUND TANK",
    "MAIN GATE", "SWIMMING POOL", "WELL", "TV", "TUBES", "DUSTBIN", "SAFE",
    "HEATER", "WASHING MACHINE", "AC", "INVERTER", "POTS", "SICK PERSON BED",
    "AQUARIUM", "IRON ALMIRA", "GYM", "MEDITATION", "PETS", "SWING", "PLANTS",
    "SHOERACK", "MATERIAL", "FINISH",
    "MASTER BEDROOM", "CHILDREN BEDROOM", "LIFT", "CUPBAORD", "DRESSING TABLE",
    "FOOTWEAR RANK", "FRIDGE", "LOCKER", "GENERATOR", "BOREWELL", "WASTE MATERIAL",
    "WATER ELEMENT", "AIR ELEMENT", "FIRE ELEMENT", "EARTH ELEMENT", "SKY ELEMENT",
    "BOSS SITTING", "STAFF SITTING", "COMPUTER", "IMPORTANT PAPER", "SOFA SET",
    "MICROWAVE", "WATER TAP", "MIRROR", "RAW MATERIAL", "FINISH GOODS", "LIFT FOR GOODS",
    "MAIN ENTRY", "INVETER", "WATER HEATER", "AIR CONDITIONER"
  ];

  const allowedFreeObjects = ["TOILET", "KITCHEN", "MASTER BEDROOM"];

  const objects = allObjects
    .map(obj => {
      const typeLabel = obj.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      const isLocked = !isPremium && !allowedFreeObjects.includes(obj);

      return {
        type: obj,
        label: typeLabel,
        icon: OBJECT_ICONS[typeLabel] || "/objects/generic.svg",
        isLocked
      };
    });

  return (
    <div className="p-6 border-t border-white/50 bg-white/30 backdrop-blur-sm rounded-b-[2rem]">
      <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <Crown size={12} className="text-amber-500" />
        Items to Place
      </h3>
      <div id="tutorial-objects" className="grid grid-cols-3 gap-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {objects.map((obj) => (
          <ObjectPaletteItem
            key={obj.type}
            objectType={obj.label}
            icon={obj.icon}
            onAddObject={onAddObject}
            isLocked={obj.isLocked}
          />
        ))}
      </div>
    </div>
  );
};
