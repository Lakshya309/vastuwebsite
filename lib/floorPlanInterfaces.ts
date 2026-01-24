// lib/floorPlanInterfaces.ts
import { Point } from "./coordinates";

export interface DevtaRegion {
  id: number;
  name: string;
  polygon: Point[];
  ring: "center" | "middle" | "outer";
}

export interface Project {
  id: string;
  name: string;
  floor_plan_url: string | null;
  boundary_normalized: Point[] | null;
  north_direction: number | null;
}

export interface PlacedObject {
  id: string; // Can be a temporary string for new objects or UUID for saved ones
  project_id: string;
  object_type: string;
  boundary_normalized: Point[];
  centroid: Point;
}

export type ZoneDivision = 8 | 16 | 32 | 0;

export interface FloorPlanAnalysisData {
  marmas: MarmaPoint[];
  objectAnalyses: Record<string, ObjectAnalysisResult>;
}