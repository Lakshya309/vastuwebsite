// components/floor-plan/ControlPanel.tsx
"use client";
import React from "react";
import { DevtaRegion, PlacedObject, Point, Wall } from "@/lib/floorPlanInterfaces";
import { isPointInPolygon } from "@/lib/gridUtils";
import { ObjectPalette } from "./ObjectPalette";
import { problemZoneMapping } from "@/lib/problemZoneMapping";

interface ControlPanelProps {
  projectId: string;
  projectName?: string;
  error: string | null;
  loading: boolean;

  activeView: "setup" | "grids" | "objects";
  setActiveView: (view: "setup" | "grids" | "objects") => void;

  showGrid: {
    devta45: boolean;
    zone16: boolean;
    zone8: boolean;
    marma: boolean;
    shaktiChakra: boolean;
  };
  setShowGrid: React.Dispatch<
    React.SetStateAction<{
      devta45: boolean;
      zone16: boolean;
      zone8: boolean;
      marma: boolean;
      shaktiChakra: boolean;
    }>
  >;

  liveNorthDirection: number;
  setLiveNorthDirection: (deg: number) => void;

  selectedFile: File | null;
  handleImageUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
  handleReupload: () => void;

  handleStartDrawingBoundary: () => void;
  handleFinishDrawingBoundary: () => void;
  handleResetBoundary: () => void;
  handleUndoLastPoint: () => void;

  selectedObjectType: string;
  setSelectedObjectType: (type: string) => void;

  handleResetObjects?: () => void;
  handleSaveChanges?: () => void;
  handleSaveObjects?: () => void;
  selectedObject?: PlacedObject | null;
  handleDeleteObject?: (id: string) => void;

  placedObjects: PlacedObject[];
  devtaRegions: DevtaRegion[];
  zone16Regions: any[];
  zone8Regions: any[];

  drawingMode?: "boundary" | "objects" | "select" | "wall" | null;
  setDrawingMode: (mode: "boundary" | "objects" | "select" | "wall" | null) => void;
  boundary?: any;
  setBoundary?: any;
  analysisMode?: any;
  setAnalysisMode?: any;
  isAnalyzing: boolean;
  analysisStale: boolean;
  handleAddObject: (objectType: string) => void;
  shaktiChakraSize: number;
  setShaktiChakraSize: (size: number) => void;

  // New props for scaling
  scale: number | null;
  setScale: (scale: number | null) => void;
  wallLengths: number[];
  setWallLengths: (lengths: number[]) => void;
  referenceWallIndex: number | null;
  setReferenceWallIndex: (index: number | null) => void;
  referenceWallLength: number | null;
  setReferenceWallLength: (length: number | null) => void;
  referenceWallUnit: "feet" | "meters" | "inches";
  setReferenceWallUnit: (unit: "feet" | "meters" | "inches") => void;
  wallColors: (string | null)[];
  setWallColors: React.Dispatch<React.SetStateAction<(string | null)[]>>;
  selectedProblem: string | null;
  setSelectedProblem: (problem: string | null) => void;
  setHighlightedZones: (zones: string[]) => void;

  // Wall props
  walls?: Wall[];
  onAddWall?: (wall: Wall) => void;
  onUpdateWall?: (wall: Wall) => void;
  onDeleteWall?: (id: string) => void;
  selectedWall?: Wall | null;
  onSelectWall?: (wall: Wall | null) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  // Define unit conversions (e.g., to meters as base)
  const UNIT_CONVERSIONS = {
    feet: 0.3048,   // 1 foot = 0.3048 meters
    meters: 1,      // 1 meter = 1 meter
    inches: 0.0254, // 1 inch = 0.0254 meters
  };

  const handleCalculateScale = () => {
    if (
      props.referenceWallIndex === null ||
      !props.boundary ||
      props.boundary.length < 2 ||
      props.referenceWallLength === null ||
      props.referenceWallLength <= 0
    ) {
      props.setScale(null);
      props.setWallLengths([]);
      return;
    }

    const canvasWidth = 800; // Assuming a fixed canvas width for calculation
    const canvasHeight = 600; // Assuming a fixed canvas height for calculation

    const p1 = props.boundary[props.referenceWallIndex];
    const p2 = props.boundary[(props.referenceWallIndex + 1) % props.boundary.length];

    const pixelLength = Math.sqrt(
      Math.pow((p2.x - p1.x) * canvasWidth, 2) +
      Math.pow((p2.y - p1.y) * canvasHeight, 2)
    );

    if (pixelLength > 0 && props.referenceWallLength > 0) {
      const realLengthInMeters =
        props.referenceWallLength * UNIT_CONVERSIONS[props.referenceWallUnit];
      const newScale = realLengthInMeters / pixelLength;
      props.setScale(newScale);

      const newWallLengths = props.boundary.map((_: any, i: number) => {
        const point1 = props.boundary[i];
        const point2 = props.boundary[(i + 1) % props.boundary.length];
        const lengthInPixels = Math.sqrt(
          Math.pow((point2.x - point1.x) * canvasWidth, 2) +
          Math.pow((point2.y - point1.y) * canvasHeight, 2)
        );
        return lengthInPixels * newScale;
      });
      props.setWallLengths(newWallLengths);
    } else {
      props.setScale(null);
      props.setWallLengths([]);
    }
  };

  // Recalculate scale whenever relevant props change
  React.useEffect(() => {
    handleCalculateScale();
  }, [
    props.referenceWallIndex,
    props.referenceWallLength,
    props.referenceWallUnit,
    props.boundary,
  ]);

  return (
    <div className="bg-white h-full border-l border-gray-200 flex flex-col w-96 shadow-xl">      <div className="flex border-b text-xs font-semibold uppercase tracking-wide text-gray-500">
      <button
        onClick={() => props.setActiveView("setup")}
        className={`flex-1 py-4 hover:bg-gray-50 ${props.activeView === "setup"
          ? "border-b-2 border-blue-600 text-blue-600"
          : ""
          }`}
      >
        Setup
      </button>
      <button
        onClick={() => props.setActiveView("grids")}
        className={`flex-1 py-4 hover:bg-gray-50 ${props.activeView === "grids"
          ? "border-b-2 border-blue-600 text-blue-600"
          : ""
          }`}
      >
        Grids
      </button>
      <button
        onClick={() => props.setActiveView("objects")}
        className={`flex-1 py-4 hover:bg-gray-50 ${props.activeView === "objects"
          ? "border-b-2 border-blue-600 text-blue-600"
          : ""
          }`}
      >
        Objects
      </button>

    </div>

      <div className="p-6 overflow-y-auto flex-1">
        {props.activeView === "setup" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                1. Upload Floor Plan
              </h3>
              <input
                type="file"
                accept="image/*"
                onChange={props.handleImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {props.selectedFile && (
                <button
                  onClick={props.handleReupload}
                  className="w-full mt-2 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium border border-gray-300"
                >
                  Re-upload
                </button>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                2. Define Boundary
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Click corners of the plot clockwise.
              </p>
              <button
                onClick={props.handleStartDrawingBoundary}
                disabled={props.drawingMode === "boundary"}
                className="w-full mb-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:bg-gray-400"
              >
                {props.drawingMode === "boundary"
                  ? "Drawing..."
                  : "Start Drawing"}
              </button>
              {props.drawingMode === "boundary" && (
                <button
                  onClick={props.handleFinishDrawingBoundary}
                  disabled={(props.boundary?.length || 0) < 3}
                  className="w-full mb-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium disabled:bg-gray-400"
                >
                  Finish Drawing
                </button>
              )}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={props.handleUndoLastPoint}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium border border-gray-300"
                >
                  Undo Last Point
                </button>
                <button
                  onClick={props.handleResetBoundary}
                  className="w-full py-2 bg-red-100 hover:bg-red-200 rounded text-red-700 font-medium border border-red-300"
                >
                  Reset Boundary
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                2b. Internal Walls
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Draw internal walls. They snap to boundaries and stay at right angles.
              </p>
              <button
                onClick={() => props.setDrawingMode(props.drawingMode === "wall" ? null : "wall")}
                className={`w-full mb-2 py-2 rounded font-medium ${props.drawingMode === "wall"
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                  }`}
              >
                {props.drawingMode === "wall"
                  ? "Stop Drawing Wall"
                  : "Start Drawing Wall"}
              </button>

              {props.selectedWall && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-orange-800">Edit Wall</h4>
                    <button
                      onClick={() => props.onDeleteWall && props.onDeleteWall(props.selectedWall!.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="color"
                      value={props.selectedWall.color}
                      onChange={(e) => props.onUpdateWall && props.onUpdateWall({ ...props.selectedWall!, color: e.target.value })}
                      className="w-full h-8 cursor-pointer rounded"
                    />
                  </div>
                  {props.selectedWall.length && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Length:</span> {props.selectedWall.length.toFixed(2)} {props.referenceWallUnit}
                    </div>
                  )}
                  <button
                    onClick={() => props.onSelectWall && props.onSelectWall(null)}
                    className="w-full py-1 text-xs text-orange-700 hover:underline"
                  >
                    Deselect
                  </button>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                3. Set True North
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Rotate until aligned.
              </p>
              <input
                type="range"
                min="0"
                max="360"
                value={props.liveNorthDirection}
                onChange={(e) =>
                  props.setLiveNorthDirection(parseInt(e.target.value))
                }
                className="w-full accent-blue-600"
              />
              <div className="text-center text-xl font-bold text-gray-800 mt-1">
                {props.liveNorthDirection}°
              </div>
            </div>
            {props.boundary && props.boundary.length > 2 && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  4. Set Scale
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  First, click on one wall segment in the floor plan to select it as the reference.
                </p>
                {props.referenceWallIndex !== null && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">
                      Reference Wall Selected:{" "}
                      <span className="font-semibold text-blue-600">
                        Wall {props.referenceWallIndex + 1}
                      </span>
                    </p>
                    <div>
                      <label
                        htmlFor="reference-length"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Real-world Length
                      </label>
                      <input
                        id="reference-length"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={props.referenceWallLength ?? ""}
                        onChange={(e) =>
                          props.setReferenceWallLength(parseFloat(e.target.value) || null)
                        }
                        className="p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 5.2"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="length-unit"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Unit
                      </label>
                      <select
                        id="length-unit"
                        value={props.referenceWallUnit}
                        onChange={(e) =>
                          props.setReferenceWallUnit(
                            e.target.value as "feet" | "meters" | "inches"
                          )
                        }
                        className="p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="meters">Meters</option>
                        <option value="feet">Feet</option>
                        <option value="inches">Inches</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="wall-color-name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Wall Color Name (Optional)
                      </label>
                      <input
                        id="wall-color-name"
                        type="text"
                        value={props.wallColors[props.referenceWallIndex] || ""}
                        onChange={(e) => {
                          const newColors = [...props.wallColors];
                          while (newColors.length < (props.boundary?.length || 0)) {
                            newColors.push(null);
                          }
                          newColors[props.referenceWallIndex!] = e.target.value || null;
                          props.setWallColors(newColors);
                        }}
                        className="p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Red, Blue, White"
                      />
                    </div>
                    {props.scale && (
                      <p className="text-sm text-gray-600 mt-2">
                        Calculated Scale: 1px ={" "}
                        {(1 / props.scale).toFixed(2)} {props.referenceWallUnit}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-6 mt-4">
              <button
                onClick={() =>
                  props.handleSaveChanges && props.handleSaveChanges()
                }
                disabled={props.boundary.length < 3}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save & Next →
              </button>
            </div>
          </div>
        )}

        {props.activeView === "grids" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800">Energy Grids</h3>

            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={props.showGrid.devta45}
                  onChange={(e) =>
                    props.setShowGrid((p) => ({
                      ...p,
                      devta45: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    45 Devtas (Vedic)
                  </span>
                  <span className="block text-xs text-gray-500">
                    Precise energy field analysis
                  </span>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={props.showGrid.zone16}
                  onChange={(e) =>
                    props.setShowGrid((p) => ({
                      ...p,
                      zone16: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    16 Zones (MahaVastu)
                  </span>
                  <span className="block text-xs text-gray-500">
                    Elemental distribution
                  </span>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={props.showGrid.zone8}
                  onChange={(e) =>
                    props.setShowGrid((p) => ({
                      ...p,
                      zone8: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    8 Directions
                  </span>
                  <span className="block text-xs text-gray-500">
                    Basic cardinal analysis
                  </span>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={props.showGrid.marma}
                  onChange={(e) =>
                    props.setShowGrid((p) => ({
                      ...p,
                      marma: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    Marma Points
                  </span>
                  <span className="block text-xs text-gray-500">
                    Sensitive energy points
                  </span>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={props.showGrid.shaktiChakra}
                  onChange={(e) =>
                    props.setShowGrid((p) => ({
                      ...p,
                      shaktiChakra: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    Shakti Chakra
                  </span>
                  <span className="block text-xs text-gray-500">
                    Cosmic energy grid
                  </span>
                </div>
              </label>
              {props.showGrid.shaktiChakra && (
                <div className="pl-8 pt-2">
                  <label className="block text-sm font-medium text-gray-700">Size</label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={props.shaktiChakraSize}
                    onChange={(e) => props.setShaktiChakraSize(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-lg font-bold text-gray-800">Analysis Status</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Status: {props.analysisStale ?
                    <span className="font-bold text-orange-500">Stale</span> :
                    <span className="font-bold text-green-500">Live</span>
                  }
                </span>
              </div>
            </div>
            <div className="border-t pt-6 mt-4">
              <button
                onClick={() =>
                  props.handleSaveObjects && props.handleSaveObjects()
                }
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md"
              >
                View Detailed Report →
              </button>
            </div>
          </div>
        )}

        {props.activeView === "grids" && (
          <div className="space-y-6">
            <div className="border-t pt-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Highlight Problem Zones
              </h3>
              <select
                value={props.selectedProblem || ""}
                onChange={(e) => {
                  const problem = e.target.value;
                  props.setSelectedProblem(problem);
                  if (problem && problemZoneMapping[problem]) {
                    props.setHighlightedZones(problemZoneMapping[problem]);
                  } else {
                    props.setHighlightedZones([]);
                  }
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a problem...</option>
                {Object.keys(problemZoneMapping).map((problem) => (
                  <option key={problem} value={problem}>
                    {problem}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {props.activeView === "objects" && (
          <div className="space-y-6">
            <ObjectPalette onAddObject={props.handleAddObject} />
            <div className="border-t pt-6 mt-4">
              <button
                onClick={() =>
                  props.handleSaveObjects && props.handleSaveObjects()
                }
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md"
              >
                Save & Next →
              </button>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};