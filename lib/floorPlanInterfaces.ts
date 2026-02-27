// lib/floorPlanInterfaces.ts
// Centralized interface definitions for the floor plan and analysis modules.

export interface Point {
  x: number;
  y: number;
}

export interface PlacedObject {
  id: string;
  project_id?: string; // Optional if not always present when creating new
  object_type: string;
  boundary_normalized: Point[];
  centroid: Point;
  rotation?: number; // Optional rotation property
  highlight?: "CRITICAL" | "BAD" | "GOOD" | "EXCELLENT" | null;
}

export interface DevtaRegion {
  name: string;
  polygon: Point[]; // Renamed from boundary to polygon to match usage in FloorPlanCanvas.tsx
  center: Point;
  color?: string; // Optional for visualization
  description?: string; // Optional additional info
}

// Based on the usage in hooks/useFloorPlanData.ts and app/admin/AdminProjectTable.tsx
export interface ProjectData {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
  floor_plan_path: string | null;
  boundary_normalized: Point[] | null;
  north_direction: number | null;
  placed_objects: PlacedObject[] | null;
  plot_width?: number | null;
  plot_height?: number | null;
  profiles?: {
    email: string | null;
  } | null;
}

// MarmaPoint - previously problematic
export interface MarmaPoint {
  x: number;
  y: number;
  // Add specific properties for a Marma point if known, e.g.,
  // vitalityScore?: number;
  // relatedDevta?: string;
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  color: string;
  thickness: number;
  length?: number; // length in real-world units (feet/meters)
}

// Add other common interfaces if they were previously in this file and are needed elsewhere.