// lib/vastu/devtaAnalysis.ts
// This file acts as a re-export and wrapper for Vastu-specific analysis functions,
// which are now primarily defined in lib/geometry.ts for consolidation as requested.

import {
  DevtaRegion,
  generate45Devtas as _generate45Devtas,
  getZoneForPoint as _getZoneForPoint,
  Point
} from "../geometry";

// Re-export the DevtaRegion interface and Point type
export type { DevtaRegion, Point };

// Re-export the main Devta generation function
export const generate45Devtas = _generate45Devtas;

// Re-export the function to get zone for a point
export const getZoneForPoint = _getZoneForPoint;

// Export other Vastu specific utilities or types if needed here
// For example, if you have specific object analysis functions or Marma points, they could remain here.
