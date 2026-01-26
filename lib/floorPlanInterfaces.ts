// lib/floorPlanInterfaces.ts

export interface Point {
    x: number;
    y: number;
}
  
export interface PlacedObject {
    id: string;
    object_type: string;
    boundary_normalized: Point[];
    centroid: Point;
}
  
export interface DevtaRegion {
    id: string;
    name: string;
    ring: 'center' | 'middle' | 'outer';
    polygon: Point[];
    startAngle?: number;
    endAngle?: number;
}
  
export interface MarmaPoint {
    id: string;
    name: string;
    position: Point;
    type: 'sensitive' | 'critical';
}
  
export interface ProjectData {
    id: string;
    name: string;
    floor_plan_path: string | null;
    boundary_normalized: Point[] | null;
    north_direction: number | null;
    placed_objects: PlacedObject[];
}
  
export interface FloorPlanCanvasProps {
    floorPlanImage: string | null;
    boundary: Point[];
    onDrawBoundary?: (point: Point) => void;
    placedObjects: PlacedObject[];
    devtaRegions?: DevtaRegion[];
    innerPolygon?: Point[]; // Add this
    middlePolygon?: Point[]; // Add this
    zone16Regions?: any[];
    zone8Regions?: any[];
    drawingObjectBoundary?: Point[];
    setDrawingObjectBoundary?: any;
    drawingMode: 'boundary' | 'objects' | 'select' | null;
    setDrawingMode?: (mode: 'boundary' | 'objects' | 'select' | null) => void;
    onDevtaClick?: (devta: DevtaRegion) => void;
    onPlaceObject?: (object: PlacedObject) => void;
    selectedObjectType?: string;
}

export interface DevtaAnalysisResponse {
    devtaRegions: DevtaRegion[];
    innerPolygon?: Point[];
    middlePolygon?: Point[];
}