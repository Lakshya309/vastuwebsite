import { VastuZone } from "./geometry";

// Define the types of objects users can place on the floor plan.
export type ObjectType = "kitchen" | "toilet" | "main_entrance" | "bedroom" | "pooja_room";

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
  // == Kitchen Rules ==
  {
    objectType: "kitchen",
    zone: "SE",
    severity: "good",
    message: "The kitchen in the South-East is ideal, as this zone is associated with fire.",
  },
  {
    objectType: "kitchen",
    zone: "NW",
    severity: "neutral",
    message: "A kitchen in the North-West is an acceptable alternative.",
  },
  {
    objectType: "kitchen",
    zone: "NE",
    severity: "critical",
    message: "A kitchen in the North-East is a major Vastu defect. This can cause financial and health problems.",
  },

  // == Toilet Rules ==
  {
    objectType: "toilet",
    zone: "SW",
    severity: "good",
    message: "A toilet in the South-West is considered a good placement for waste disposal.",
  },
  {
    objectType: "toilet",
    zone: "NE",
    severity: "critical",
    message: "A toilet in the North-East is a severe Vastu defect, as this is the sacred water element zone.",
  },
  {
    objectType: "toilet",
    zone: "E",
    severity: "warning",
    message: "A toilet in the East is not recommended as it can affect social connections.",
  },
  
  // == Main Entrance Rules ==
  {
    objectType: "main_entrance",
    zone: "N",
    severity: "good",
    message: "An entrance in the North is highly auspicious and brings wealth and prosperity.",
  },
  {
    objectType: "main_entrance",
    zone: "E",
    severity: "good",
    message: "An entrance in the East is excellent for knowledge, peace, and health.",
  },
  {
    objectType: "main_entrance",
    zone: "S",
    severity: "warning",
    message: "An entrance in the South is generally considered inauspicious.",
  },
  // Add more rules for other object types and zones...
];

// This interface represents a single finding from the analysis.
export interface AnalysisFinding {
  objectType: ObjectType;
  zone: VastuZone;
  severity: FindingSeverity;
  message: string;
}

// The Analysis Engine function.
/**
 * Analyzes a list of placed objects against the master Vastu rule set.
 *
 * @param objects An array of objects placed on the floor plan.
 * @returns An array of analysis findings.
 */
export function analyzeVastu(objects: Array<{ type: ObjectType; zone: VastuZone }>): AnalysisFinding[] {
  const findings: AnalysisFinding[] = [];

  for (const object of objects) {
    const rule = VASTU_RULES.find(
      (r) => r.objectType === object.type && r.zone === object.zone
    );

    if (rule) {
      findings.push({
        objectType: object.type,
        zone: object.zone,
        severity: rule.severity,
        message: rule.message,
      });
    }
  }

  return findings;
}
