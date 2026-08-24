// lib/planConfig.ts
// Central configuration for the 3-tier pricing system

export type PlanTier = "free" | "basic" | "advanced";

// ─── Pricing ─────────────────────────────────────────────────────────────────
export const GST_RATE = 0.18; // 18% GST

export const PLAN_PRICES: Record<PlanTier, { base: number; gst: number; total: number; label: string }> = {
  free: { base: 0, gst: 0, total: 0, label: "Free" },
  basic: {
    base: 999,
    gst: Math.round(999 * GST_RATE),
    total: Math.round(999 * (1 + GST_RATE)),
    label: "Basic",
  },
  advanced: {
    base: 2500,
    gst: Math.round(2500 * GST_RATE),
    total: Math.round(2500 * (1 + GST_RATE)),
    label: "Advanced",
  },
};

// ─── Usage Limits ─────────────────────────────────────────────────────────────
export const PLAN_LIMITS: Record<PlanTier, { maxUploads: number; maxRelocationsPerObject: number }> = {
  free:     { maxUploads: 1, maxRelocationsPerObject: 0 }, // 1 upload, no relocation
  basic:    { maxUploads: 2, maxRelocationsPerObject: 5 }, // 2 uploads (1 retry), 5 relocations per object
  advanced: { maxUploads: 2, maxRelocationsPerObject: 5 }, // same limits, but all objects
};

// ─── Object Tiers ─────────────────────────────────────────────────────────────
// Objects available on the FREE plan (core essentials only)
export const FREE_TIER_OBJECTS = new Set([
  // Residential — basic necessities
  "Toilet",
  "Kitchen",
  "Master Bedroom",
  "Main Gate",
  "Main Entry",
  "Pooja",
  // Commercial — entry-level
  "Entrance",
  "Exit",
  "Dosa Bhatti",
  "Heavy Machinery",
  "Reception",
]);

// Objects available on the BASIC plan (in addition to Free)
export const BASIC_TIER_OBJECTS = new Set([
  // Living & Bedroom
  "Children Bedroom",
  "Family Lounge",
  "Guest Room",
  "Servent Room",
  "Sofa Set",
  "Bed",
  "Tv",
  // Kitchen & Dining
  "Dining Room",
  "Fridge",
  "Microwave",
  "Water Tap",
  "Stove",
  // Services & Utility
  "Washing Machine",
  "Dustbin",
  "Waste Material",
  "Shoerack",
  "Footwear Rank",
  "Iron Almira",
  "Dressing Table",
  "Cupbaord",
  "Wardrobe",
  // Water & Energy
  "Heater",
  "Water Heater",
  "Ac",
  "Air Conditioner",
  // Outdoor & Entry
  "Parking",
  "Staircase",
  "Lift",
  "Septic Tank",
  "Pots",
  "Plants",
  // Commercial — basic
  "Toilet",
  "Water Tank",
  "Security Cabin",
  "Staircase",
  "Parking",
  // Commercial Kitchen
  "Work Table",
  "Sink Unit",
  "Dish Rack",
  "Pickup Counter",
  "Serving Counter",
  // Shop
  "Cash Counter",
  "Billing Desk",
  "Display Shelf",
  "Product Display",
  "Store Room",
  // Office
  "Manager Cabin",
  "Meeting Room",
  "Workstations",
  "HR Cabin",
  // Factory basic
  "Small Machinery",
  "Raw Material Storage",
  "Finished Goods Storage",
  "Warehouse Rack",
  // Healthcare
  "Pharmacy",
  "Consultation Room",
  "Waiting Area",
  "Lab",
  // Food business
  "Cold Storage",
  "Refrigerator",
  "Prep Area",
  "Wash Area",
  "Cooking Area",
]);

// ADVANCED tier — all objects are accessible (no explicit list needed;
// everything not in Free or Basic is Advanced-only)
// Includes: Aquarium, Bar, Music System, Swing, Generator, Inverter, Borewell,
// Overhead/Underground Tank, Water/Air/Fire/Earth/Sky Elements,
// all commercial industrial items, etc.

/**
 * Returns whether an object is accessible on the given plan tier.
 */
export function isObjectAccessible(objectType: string, plan: PlanTier): boolean {
  if (plan === "advanced") return true;
  if (FREE_TIER_OBJECTS.has(objectType)) return true;
  if (plan === "basic" && BASIC_TIER_OBJECTS.has(objectType)) return true;
  return false;
}

/**
 * Returns the minimum plan tier required to access this object.
 */
export function getRequiredTier(objectType: string): PlanTier {
  if (FREE_TIER_OBJECTS.has(objectType)) return "free";
  if (BASIC_TIER_OBJECTS.has(objectType)) return "basic";
  return "advanced";
}
