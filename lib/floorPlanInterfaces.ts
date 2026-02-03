export interface Point {
  x: number;
  y: number;
}

export interface PlacedObject {
  id: string;
  object_type: string;
  boundary_normalized: Point[];
  centroid: Point;
  rotation?: number;
}

export interface DevtaRegion {
  name: string;
  polygon: Point[];
}

export interface FloorPlanCanvasProps {
  floorPlanImage: string | null;
  boundary: Point[];
  onDrawBoundary: (point: Point) => void;
  placedObjects: PlacedObject[];
  onMoveObject: (id: string, dx: number, dy: number) => void;
  onResizeObject: (id: string, width: number, height: number) => void;
  onRotateObject: (id: string, rotation: number) => void;
  onDeleteObject: (id: string) => void;
  objectSvgMap: { [key: string]: string };
  devtaRegions: DevtaRegion[];
  innerPolygon?: Point[];
  middlePolygon?: Point[];
  zone16Regions: DevtaRegion[];
  zone8Regions: DevtaRegion[];
  marmaData: { marmaPoints: Point[]; vanshaLines: Point[][] } | null;
  drawingObjectBoundary: Point[];
  drawingMode: string | null;
  onDevtaClick: (devta: DevtaRegion) => void;
  onPlaceObject: (newObject: PlacedObject) => void;
  onCanvasClick: (point: Point) => void; // New prop for canvas clicks
  setDrawingMode: (mode: "boundary" | "objects" | "select" | null) => void;
  setDrawingObjectBoundary: (points: Point[]) => void;
  selectedObjectType: string;
}