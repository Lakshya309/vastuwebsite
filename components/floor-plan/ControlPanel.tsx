// components/floor-plan/ControlPanel.tsx
"use client";

import React from "react";
import Link from "next/link";
import { AVAILABLE_OBJECTS } from "@/lib/floorPlanConstants";
import { PlacedObject } from "@/lib/floorPlanInterfaces";
import { ZoneDivision } from "@/lib/floorPlanInterfaces";

interface ControlPanelProps {
  projectId: string;
  projectName: string | undefined;
  error: string | null;
  loading: boolean;
  liveNorthDirection: number;
  setLiveNorthDirection: (direction: number) => void;
  selectedFile: File | null;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  drawingMode: "boundary" | "objects" | "select";
  setDrawingMode: (mode: "boundary" | "objects" | "select") => void;
  boundary: Point[];
  setBoundary: (boundary: Point[]) => void;
  selectedObjectType: string;
  setSelectedObjectType: (type: string) => void;
  handleAddObject: () => void;
  handleResetObjects: () => Promise<void>;
  handleSaveChanges: () => Promise<void>;
  selectedObject: PlacedObject | null;
  handleDeleteObject: (objectId: string) => void;
  analysisMode: "concentric" | "zones-8" | "zones-16" | "zones-32" | "none";
  setAnalysisMode: (mode: "concentric" | "zones-8" | "zones-16" | "zones-32" | "none") => void;
}

export function ControlPanel({
  projectId,
  projectName,
  error,
  loading,
  liveNorthDirection,
  setLiveNorthDirection,
  selectedFile,
  handleImageUpload,
  drawingMode,
  setDrawingMode,
  boundary,
  setBoundary,
  selectedObjectType,
  setSelectedObjectType,
  handleAddObject,
  handleResetObjects,
  handleSaveChanges,
  selectedObject,
  handleDeleteObject,
  analysisMode,
  setAnalysisMode,
}: ControlPanelProps) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Controls</h2>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Floor Plan
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        <hr />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            North Direction ({liveNorthDirection}°)
          </label>
          <input
            type="range"
            min="0"
            max="359"
            value={liveNorthDirection}
            onChange={(e) => setLiveNorthDirection(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode
          </label>
          <select
            onChange={(e) => {
              setDrawingMode(e.target.value as any);
              // setSelectedObject(null); // This state should be managed by parent
            }}
            value={drawingMode}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="boundary">Draw Boundary</option>
            <option value="objects">Place Objects</option>
            <option value="select">Select & Analyze</option>
          </select>
        </div>

        {drawingMode === "boundary" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Boundary Controls
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setBoundary([])}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Reset
              </button>
              <button
                onClick={() => setBoundary(boundary.slice(0, -1))}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Undo
              </button>
            </div>
          </div>
        )}

        {drawingMode === "objects" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Object Controls
            </label>
            <select
              onChange={(e) => setSelectedObjectType(e.target.value)}
              value={selectedObjectType}
              className="w-full p-2 border border-gray-300 rounded-lg mb-2"
            >
              {AVAILABLE_OBJECTS.map((obj) => (
                <option key={obj} value={obj}>{obj}</option>
              ))}
            </select>
            <div className="flex space-x-2 mb-2">
              <button
                onClick={handleAddObject}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Add Object
              </button>
              {/* <button
                onClick={() => setDrawingObjectBoundary([])} // This state should be managed by parent
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Current
              </button> */}
            </div>
            <button
              onClick={handleResetObjects}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              disabled={loading}
            >
              Reset All Objects
            </button>
          </div>
        )}
        {selectedObject && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Object
            </label>
            <div className="p-2 border border-gray-200 rounded-lg bg-gray-50">
              <p className="font-semibold">
                {selectedObject.object_type}
              </p>
              <button
                onClick={() => handleDeleteObject(selectedObject.id)}
                className="mt-2 px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 w-full"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Object"}
              </button>
            </div>
          </div>
        )}
        <hr />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Analysis Display
          </label>
          <select
            onChange={(e) => setAnalysisMode(e.target.value as any)}
            value={analysisMode}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="none">None</option>
            <option value="concentric">Concentric (45 Devtas)</option>
            <option value="zones-8">8 Directions</option>
            <option value="zones-16">16 Directions</option>
            <option value="zones-32">32 Directions</option>
          </select>
        </div>

        <button
          onClick={handleSaveChanges}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}