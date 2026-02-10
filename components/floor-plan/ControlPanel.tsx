// components/floor-plan/ControlPanel.tsx
"use client";
import React from "react";
import { DevtaRegion, PlacedObject } from "@/lib/floorPlanInterfaces";
import { isPointInPolygon } from "@/lib/gridUtils";
import { ObjectPalette } from "./ObjectPalette";
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
  };
  setShowGrid: React.Dispatch<
    React.SetStateAction<{
      devta45: boolean;
      zone16: boolean;
      zone8: boolean;
      marma: boolean;
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

  drawingMode?: any;
  setDrawingMode?: any;
  boundary?: any;
  setBoundary?: any;
  analysisMode?: any;
  setAnalysisMode?: any;
  isAnalyzing: boolean;
  analysisStale: boolean;
  handleAddObject: (objectType: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  // getObjectAnalysis function removed as analyzeObject is no longer available.
  // Client-side analysis feedback will not be available from this component.

  return (
    <div className="bg-white h-full border-l border-gray-200 flex flex-col w-96 shadow-xl">      <div className="flex border-b text-xs font-semibold uppercase tracking-wide text-gray-500">
        <button
          onClick={() => props.setActiveView("setup")}
          className={`flex-1 py-4 hover:bg-gray-50 ${
            props.activeView === "setup"
              ? "border-b-2 border-blue-600 text-blue-600"
              : ""
          }`}
        >
          Setup
        </button>
        <button
          onClick={() => props.setActiveView("grids")}
          className={`flex-1 py-4 hover:bg-gray-50 ${
            props.activeView === "grids"
              ? "border-b-2 border-blue-600 text-blue-600"
              : ""
          }`}
        >
          Grids
        </button>
        <button
          onClick={() => props.setActiveView("objects")}
          className={`flex-1 py-4 hover:bg-gray-50 ${
            props.activeView === "objects"
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
              <div className="flex gap-2">
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
              <div className="text-center text-sm text-gray-600 mt-1">
                {props.liveNorthDirection}°
              </div>
            </div>

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
                        </div>          </div>
        )}

        {props.activeView === "objects" && (
          <div className="space-y-6">
            <ObjectPalette onAddObject={props.handleAddObject} />
            <div className="border-t pt-6 mt-4">
              <button
                onClick={() =>
                  props.handleSaveObjects && props.handleSaveObjects()
                }
                disabled={props.placedObjects.length < 1}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
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