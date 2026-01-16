import { VastuZone } from "./geometry";

// Define the types of objects users can place on the floor plan.
export type ObjectType =
  | "kitchen"
  | "toilet"
  | "main_entrance"
  | "bedroom"
  | "pooja_room"
  | "staircase"
  | "living_room"
  | "study"
  | "store_room"
  | "water_tank"
  | "septic_tank"
  | "wardrobe"
  | "television";


// Define the severity of a Vastu finding.
export type FindingSeverity = "good" | "neutral" | "warning" | "critical";

// This interface defines the structure for a single Vastu rule.
export interface VastuRule {
  objectType: ObjectType;
  zone: VastuZone;
  severity: FindingSeverity;
  message: string;
}

// This is the master list of all Vastu rules for the application.
// It is a simple, rule-based engine.
export const VASTU_RULES: VastuRule[] = [

  /* =======================
     🔥 KITCHEN RULES
  ======================== */
  {
    objectType: "kitchen",
    zone: "SE",
    severity: "good",
    message: "Kitchen in South-East is ideal. Fire element is strongest here and supports health and prosperity.",
  },
  {
    objectType: "kitchen",
    zone: "NW",
    severity: "neutral",
    message: "Kitchen in North-West is acceptable but may cause instability if used excessively.",
  },
  {
    objectType: "kitchen",
    zone: "S",
    severity: "warning",
    message: "Kitchen in South can increase aggression and financial stress.",
  },
  {
    objectType: "kitchen",
    zone: "NE",
    severity: "critical",
    message: "Kitchen in North-East disturbs water–fire balance and can cause severe health and monetary issues.",
  },
  {
    objectType: "kitchen",
    zone: "SW",
    severity: "critical",
    message: "Kitchen in South-West weakens stability and affects family harmony.",
  },

  /* =======================
     🚽 TOILET RULES
  ======================== */
  {
    objectType: "toilet",
    zone: "NW",
    severity: "good",
    message: "Toilet in North-West is suitable for disposal and drainage.",
  },
  {
    objectType: "toilet",
    zone: "SE",
    severity: "neutral",
    message: "Toilet in South-East is manageable with remedies but not ideal.",
  },
  {
    objectType: "toilet",
    zone: "E",
    severity: "warning",
    message: "Toilet in East can negatively impact social reputation and growth.",
  },
  {
    objectType: "toilet",
    zone: "NE",
    severity: "critical",
    message: "Toilet in North-East is a severe Vastu dosha affecting health, clarity, and finances.",
  },
  {
    objectType: "toilet",
    zone: "SW",
    severity: "warning",
    message: "Toilet in South-West weakens authority and stability.",
  },

  /* =======================
     🚪 MAIN ENTRANCE RULES
  ======================== */
  {
    objectType: "main_entrance",
    zone: "N",
    severity: "good",
    message: "North entrance attracts wealth, opportunities, and career growth.",
  },
  {
    objectType: "main_entrance",
    zone: "E",
    severity: "good",
    message: "East entrance enhances health, knowledge, and social respect.",
  },
  {
    objectType: "main_entrance",
    zone: "NE",
    severity: "good",
    message: "North-East entrance is highly auspicious and spiritually uplifting.",
  },
  {
    objectType: "main_entrance",
    zone: "S",
    severity: "warning",
    message: "South entrance can bring instability and obstacles.",
  },
  {
    objectType: "main_entrance",
    zone: "SW",
    severity: "critical",
    message: "Main entrance in South-West leads to financial loss and relationship problems.",
  },

  /* =======================
     🛏️ BEDROOM RULES
  ======================== */
  {
    objectType: "bedroom",
    zone: "SW",
    severity: "good",
    message: "Master bedroom in South-West provides stability, authority, and good sleep.",
  },
  {
    objectType: "bedroom",
    zone: "NW",
    severity: "neutral",
    message: "Bedroom in North-West suits guests or short stays.",
  },
  {
    objectType: "bedroom",
    zone: "NE",
    severity: "critical",
    message: "Bedroom in North-East disrupts mental peace and spiritual energy.",
  },
  {
    objectType: "bedroom",
    zone: "SE",
    severity: "warning",
    message: "Bedroom in South-East can cause stress and arguments due to fire energy.",
  },

  /* =======================
     🛕 POOJA ROOM RULES
  ======================== */
  {
    objectType: "pooja_room",
    zone: "NE",
    severity: "good",
    message: "Pooja room in North-East is ideal for spiritual growth and clarity.",
  },
  {
    objectType: "pooja_room",
    zone: "E",
    severity: "neutral",
    message: "Pooja room in East is acceptable and promotes positivity.",
  },
  {
    objectType: "pooja_room",
    zone: "SW",
    severity: "critical",
    message: "Pooja room in South-West blocks positive energy and should be avoided.",
  },

  /* =======================
     🧠 STUDY / OFFICE
  ======================== */
  {
    objectType: "study",
    zone: "E",
    severity: "good",
    message: "Study in East enhances concentration, learning, and creativity.",
  },
  {
    objectType: "study",
    zone: "N",
    severity: "good",
    message: "Study in North supports career and intellectual growth.",
  },
  {
    objectType: "study",
    zone: "SW",
    severity: "warning",
    message: "Study in South-West can cause mental pressure and rigidity.",
  },

  /* =======================
     💧 WATER & WASTE
  ======================== */
  {
    objectType: "water_tank",
    zone: "NE",
    severity: "good",
    message: "Water storage in North-East enhances wealth and peace.",
  },
  {
    objectType: "water_tank",
    zone: "SW",
    severity: "critical",
    message: "Water tank in South-West causes financial instability.",
  },
  {
    objectType: "septic_tank",
    zone: "NW",
    severity: "good",
    message: "Septic tank in North-West supports proper waste disposal.",
  },
  {
    objectType: "septic_tank",
    zone: "NE",
    severity: "critical",
    message: "Septic tank in North-East severely contaminates positive energy.",
  },
];
