// components/floor-plan/ObjectPalette.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Crown, ChevronDown, ChevronUp, Layers, Zap } from "lucide-react";
import { getObjectIcon } from "@/lib/objectIcons";
import { isObjectAccessible, getRequiredTier, type PlanTier } from "@/lib/planConfig";
import { useAuth } from "@/contexts/AuthContext";

interface ObjectPaletteItemProps {
  objectType: string;
  icon: string;
  onAddObject: (objectType: string) => void;
  isLocked: boolean;
  requiredTier?: PlanTier;
}

const ObjectPaletteItem: React.FC<ObjectPaletteItemProps> = ({
  objectType,
  icon,
  onAddObject,
  isLocked,
  requiredTier,
}) => {
  const isBasicLocked = isLocked && requiredTier === "basic";
  const isAdvancedLocked = isLocked && requiredTier === "advanced";

  return (
    <div
      onClick={() => !isLocked && onAddObject(objectType)}
      className={`relative flex flex-col items-center justify-center p-3 m-1 border rounded-[1.5rem] bg-white transition-all shadow-sm ${
        isLocked
          ? 'opacity-70 grayscale cursor-not-allowed border-gray-100'
          : 'cursor-pointer hover:bg-gray-50 border-white hover:border-primary/20 hover:scale-[1.05] active:scale-95'
      }`}
    >
      {isLocked && (
        <div className="absolute top-1 right-1 z-10 scale-[0.6] origin-top-right">
          {isBasicLocked ? (
            <span className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">
              <Zap size={9} />
              BASIC
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">
              <Crown size={9} />
              PRO
            </span>
          )}
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
  userPlan: PlanTier;
  /** @deprecated use userPlan instead */
  isPremium?: boolean;
  propertyType?: string; // "residential" | "commercial"
  commercialType?: string; // "commercial_kitchen", "factory", etc.
  onPropertyTypeChange?: (propertyType: string, commercialType?: string) => void;
}

// Residential Categories
const RESIDENTIAL_CATEGORIES = [
  {
    title: "Living & Bedroom",
    items: [
      "Master Bedroom", "Children Bedroom", "Family Lounge", "Guest Room", "Servent Room",
      "Sofa Set", "Bed", "Tv", "Music System", "Aquarium", "Swing"
    ]
  },
  {
    title: "Kitchen & Dining",
    items: [
      "Kitchen", "Dining Room", "Fridge", "Microwave", "Water Tap", "Stove"
    ]
  },
  {
    title: "Services & Utility",
    items: [
      "Toilet", "Washing Machine", "Dustbin", "Waste Material", "Shoerack", "Footwear Rank",
      "Safe", "Locker", "Iron Almira", "Dressing Table", "Cupbaord", "Wardrobe"
    ]
  },
  {
    title: "Water & Energy",
    items: [
      "Pooja", "Well", "Borewell", "Overhead Tank", "Underground Tank", "Heater", "Water Heater",
      "Inverter", "Generator", "Ac", "Air Conditioner"
    ]
  },
  {
    title: "Outdoor & Entry",
    items: [
      "Main Gate", "Main Entry", "Parking", "Staircase", "Lift", "Swimming Pool", "Pots", "Plants", "Septic Tank"
    ]
  },
  {
    title: "Vastu Elements",
    items: [
      "Water Element", "Air Element", "Fire Element", "Earth Element", "Sky Element"
    ]
  }
];

// Commercial Subtype Categories
const COMMERCIAL_KITCHEN_CATEGORIES = [
  {
    title: "Cooking",
    items: ["Dosa Bhatti", "Indian Range", "Stock Pot", "Idli Steamer", "Hot Bain Marie"]
  },
  {
    title: "Preparation",
    items: ["Wet Grinder", "Tilted Grinder", "Pulveriser", "Coconut Scraper", "Work Table", "Batter Table"]
  },
  {
    title: "Storage",
    items: ["Storage Rack", "Deep Freezer", "U/C Chiller", "Chiller", "Pot Rack"]
  },
  {
    title: "Wash",
    items: ["Sink Unit", "Pot Wash", "Dish Rack"]
  },
  {
    title: "Service",
    items: ["Pickup Counter", "Serving Counter", "Coffee Station", "Masala Trolley"]
  }
];

const FACTORY_CATEGORIES = [
  {
    title: "Machinery",
    items: ["Heavy Machinery", "Small Machinery", "Production Line", "Generator", "Transformer", "Air Compressor", "Boiler", "Furnace"]
  },
  {
    title: "Storage & Warehouse",
    items: ["Raw Material Storage", "Finished Goods Storage", "Warehouse Rack", "Loading Dock", "Dispatch Area", "Receiving Area"]
  }
];

const SHOP_CATEGORIES = [
  {
    title: "Shop Elements",
    items: ["Cash Counter", "Billing Desk", "Display Shelf", "Product Display", "Trial Room", "Store Room"]
  }
];

const OFFICE_CATEGORIES = [
  {
    title: "Office Layout",
    items: ["Reception", "Manager Cabin", "Meeting Room", "Workstations", "Server Room", "HR Cabin"]
  }
];

const FOOD_BUSINESS_CATEGORIES = [
  {
    title: "Food Business",
    items: ["Cold Storage", "Refrigerator", "Deep Freezer", "Prep Area", "Wash Area", "Cooking Area"]
  }
];

const HEALTHCARE_CATEGORIES = [
  {
    title: "Healthcare",
    items: ["Pharmacy", "Consultation Room", "Waiting Area", "Lab"]
  }
];

const UNIVERSAL_COMMERCIAL_CATEGORY = {
  title: "Universal Commercial Objects",
  items: ["Entrance", "Exit", "Staircase", "Lift", "Toilet", "Water Tank", "Borewell", "Electrical Panel", "DG Set", "Security Cabin", "Parking"]
};

// Complete list of all commercial items to find leftovers for the "Advanced" section
const ALL_COMMERCIAL_ITEMS = [
  "Dosa Bhatti", "Idli Steamer", "Wet Grinder", "Tilted Grinder", "Hot Bain Marie", "Indian Range", "Deep Freezer", "Storage Rack", "Sink Unit", "Coffee Station", "Dish Rack", "Pulveriser", "Coconut Scraper", "Stock Pot", "Work Table", "U/C Chiller", "Chiller", "Pot Wash", "Pickup Counter", "Serving Counter", "Masala Trolley", "Batter Table", "Pot Rack",
  "Heavy Machinery", "Small Machinery", "Production Line", "Transformer", "Air Compressor", "Boiler", "Furnace", "Raw Material Storage", "Finished Goods Storage", "Warehouse Rack", "Loading Dock", "Dispatch Area", "Receiving Area",
  "Cash Counter", "Billing Desk", "Display Shelf", "Product Display", "Trial Room", "Store Room",
  "Reception", "Manager Cabin", "Meeting Room", "Workstations", "Server Room", "HR Cabin",
  "Cold Storage", "Refrigerator", "Prep Area", "Wash Area", "Cooking Area",
  "Pharmacy", "Consultation Room", "Waiting Area", "Lab",
  "Entrance", "Exit", "Staircase", "Lift", "Toilet", "Water Tank", "Borewell", "Electrical Panel", "DG Set", "Security Cabin", "Parking"
];

// Legacy list kept for reference; actual gating uses planConfig.ts isObjectAccessible()

export const ObjectPalette: React.FC<ObjectPaletteProps> = ({
  onAddObject,
  userPlan,
  isPremium,
  propertyType = "residential",
  commercialType = "general",
  onPropertyTypeChange,
}) => {
  const { isObjectAllowed, access } = useAuth();
  // Resolve effective plan: if legacy isPremium is passed and no userPlan, treat as basic
  const effectivePlan: PlanTier = userPlan ?? (isPremium ? "basic" : "free");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Auto-set the first category as expanded when propertyType or commercialType changes
  useEffect(() => {
    const categories = getCategories();
    if (categories.length > 0) {
      setExpandedCategory(categories[0].title);
    }
  }, [propertyType, commercialType]);

  const getCategories = () => {
    if (propertyType === "residential") {
      return RESIDENTIAL_CATEGORIES;
    }

    // Get specific categories for Commercial Subtype
    let primaryCategories: { title: string; items: string[] }[] = [];
    switch (commercialType) {
      case "commercial_kitchen":
        primaryCategories = COMMERCIAL_KITCHEN_CATEGORIES;
        break;
      case "factory":
        primaryCategories = FACTORY_CATEGORIES;
        break;
      case "shop":
        primaryCategories = SHOP_CATEGORIES;
        break;
      case "office":
        primaryCategories = OFFICE_CATEGORIES;
        break;
      case "food":
        primaryCategories = FOOD_BUSINESS_CATEGORIES;
        break;
      case "healthcare":
        primaryCategories = HEALTHCARE_CATEGORIES;
        break;
      default:
        primaryCategories = [];
        break;
    }

    // Combine primary + universal
    const combined = [...primaryCategories, UNIVERSAL_COMMERCIAL_CATEGORY];

    // Find items that are not in the primary or universal lists, to put in the "Advanced Commercial" section
    const shownItems = new Set<string>();
    combined.forEach(cat => cat.items.forEach(item => shownItems.add(item.toLowerCase())));

    const advancedItems = ALL_COMMERCIAL_ITEMS.filter(
      item => !shownItems.has(item.toLowerCase())
    );

    if (advancedItems.length > 0) {
      combined.push({
        title: "Advanced Industrial",
        items: advancedItems
      });
    }

    return combined;
  };

  const handleToggleProperty = (type: "residential" | "commercial") => {
    if (onPropertyTypeChange) {
      onPropertyTypeChange(type, type === "commercial" ? "general" : undefined);
    }
  };

  const handleSubtypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onPropertyTypeChange) {
      onPropertyTypeChange("commercial", e.target.value);
    }
  };

  const categories = getCategories();

  return (
    <div className="flex flex-col space-y-6">
      {/* Property Type Toggles */}
      <div className="flex flex-col gap-3">
        <label className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
          <Layers size={11} className="text-primary" />
          Environment Scope
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100/80 rounded-2xl border border-gray-200/50 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => handleToggleProperty("residential")}
            className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
              propertyType === "residential"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Residential
          </button>
          <button
            type="button"
            onClick={() => handleToggleProperty("commercial")}
            className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
              propertyType === "commercial"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Commercial
          </button>
        </div>
      </div>

      {/* Commercial Subtype Selector */}
      {propertyType === "commercial" && (
        <div className="flex flex-col gap-2">
          <select
            value={commercialType}
            onChange={handleSubtypeChange}
            className="w-full p-3 bg-white/70 hover:bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 shadow-sm transition-all cursor-pointer"
          >
            <option value="general">General Commercial</option>
            <option value="commercial_kitchen">Commercial Kitchen</option>
            <option value="factory">Factory / Manufacturing</option>
            <option value="shop">Retail Shop</option>
            <option value="office">Office / Corporate</option>
            <option value="healthcare">Healthcare</option>
            <option value="food">Food Business (Restaurant/Café)</option>
          </select>
        </div>
      )}

      {/* Categories Accordion */}
      <div className="space-y-3">
        {categories.map((category) => {
          const isExpanded = expandedCategory === category.title;
          return (
            <div
              key={category.title}
              className="border border-gray-200/50 rounded-2xl overflow-hidden bg-white/40 shadow-sm backdrop-blur-sm"
            >
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.title)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/50 transition-colors"
              >
                <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                  {category.title}
                </span>
                {isExpanded ? (
                  <ChevronUp size={14} className="text-gray-400" />
                ) : (
                  <ChevronDown size={14} className="text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="p-3 bg-white/10 border-t border-gray-100/50">
                  <div className="grid grid-cols-3 gap-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {category.items.map((item) => {
                      const accessible = access
                        ? isObjectAllowed(item)
                        : isObjectAccessible(item, effectivePlan);
                      const reqTier = getRequiredTier(item);
                      return (
                        <ObjectPaletteItem
                          key={item}
                          objectType={item}
                          icon={getObjectIcon(item)}
                          onAddObject={onAddObject}
                          isLocked={!accessible}
                          requiredTier={reqTier}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
