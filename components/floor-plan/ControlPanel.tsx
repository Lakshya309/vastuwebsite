"use client";

import React from "react";
import { PlacedObject, DevtaRegion } from "@/lib/floorPlanInterfaces";
import { isPointInPolygon } from "@/lib/gridUtils";

interface ControlPanelProps {
  projectId: string;
  projectName?: string;
  error: string | null;
  loading: boolean;
  
  // Navigation & View State
  activeView: "setup" | "grids" | "objects" | "report";
  setActiveView: (view: "setup" | "grids" | "objects" | "report") => void;
  
  // Grid State
  showGrid: { devta45: boolean; zone16: boolean; zone8: boolean };
  setShowGrid: React.Dispatch<React.SetStateAction<{ devta45: boolean; zone16: boolean; zone8: boolean }>>;
  
  // North Direction
  liveNorthDirection: number;
  setLiveNorthDirection: (deg: number) => void;

  // File Upload
  selectedFile: File | null;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleReupload: () => void;

  // Boundary
  handleStartDrawingBoundary: () => void;

  handleFinishDrawingBoundary: () => void;
  handleResetBoundary: () => void;
  handleUndoLastPoint: () => void;

  // Object State
  selectedObjectType: string;
  setSelectedObjectType: (type: string) => void;
  handleAddObject: () => void;
  handleResetObjects?: () => void;
  handleSaveChanges?: () => void;
  handleSaveObjects?: () => void;
  selectedObject?: PlacedObject | null;
  handleDeleteObject?: (id: string) => void;

  // Analysis Data
  placedObjects: PlacedObject[];
  devtaRegions: DevtaRegion[];
  zone16Regions: any[]; // Add this
  zone8Regions: any[];  // Add this
  
  // Modes
  drawingMode?: any;
  setDrawingMode?: any;
  boundary?: any;
  setBoundary?: any;
  analysisMode?: any;
  setAnalysisMode?: any;
  onRunAnalysis?: any;
}


export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  
  const getObjectAnalysis = (obj: PlacedObject) => {
    const { devtaRegions, zone16Regions, zone8Regions } = props;
    const centroid = obj.centroid;

    // Prioritize the most specific grid available
    if (devtaRegions.length > 0) {
      for (const region of devtaRegions) {
        if (isPointInPolygon(centroid, region.polygon)) {
          return analyzeObject(obj.object_type, region.name);
        }
      }
    }
    
    if (zone16Regions.length > 0) {
        for (const region of zone16Regions) {
          if (isPointInPolygon(centroid, region.polygon)) {
            return analyzeObject(obj.object_type, region.name);
          }
        }
    }

    if (zone8Regions.length > 0) {
        for (const region of zone8Regions) {
            if (isPointInPolygon(centroid, region.polygon)) {
                return analyzeObject(obj.object_type, region.name);
            }
        }
    }

    // Default if no zone is found (should be rare)
    return analyzeObject(obj.object_type, "Unknown");
  };

  return (
    <div className="bg-white h-full border-l border-gray-200 flex flex-col w-96 shadow-xl">
      
      {/* 1. TAB NAVIGATION */}
      <div className="flex border-b text-xs font-semibold uppercase tracking-wide text-gray-500">
        <button 
          onClick={() => props.setActiveView("setup")}
          className={`flex-1 py-4 hover:bg-gray-50 ${props.activeView === 'setup' ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}
        >
          Setup
        </button>
        <button 
          onClick={() => props.setActiveView("grids")}
          className={`flex-1 py-4 hover:bg-gray-50 ${props.activeView === 'grids' ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}
        >
          Grids
        </button>
        <button 
          onClick={() => props.setActiveView("objects")}
          className={`flex-1 py-4 hover:bg-gray-50 ${props.activeView === 'objects' ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}
        >
          Objects
        </button>
        <button 
          onClick={() => props.setActiveView("report")}
          className={`flex-1 py-4 hover:bg-gray-50 ${props.activeView === 'report' ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}
        >
          Report
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        
        {/* --- VIEW: SETUP --- */}
        {props.activeView === "setup" && (
          <div className="space-y-6">
            <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">1. Upload Floor Plan</h3>
            <input 
                type="file" 
                accept="image/*" // Restrict to images
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
               <h3 className="text-lg font-bold text-gray-800 mb-2">2. Define Boundary</h3>
               <p className="text-sm text-gray-500 mb-3">Click corners of the plot clockwise.</p>
              <button
                onClick={props.handleStartDrawingBoundary}
                disabled={props.drawingMode === 'boundary'}
                className="w-full mb-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:bg-gray-400"
              >
                {props.drawingMode === 'boundary' ? "Drawing..." : "Start Drawing"}
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
               <h3 className="text-lg font-bold text-gray-800 mb-2">3. Set True North</h3>
               <p className="text-sm text-gray-500 mb-2">Rotate until aligned.</p>
               <input 
                 type="range" 
                 min="0" 
                 max="360" 
                 value={props.liveNorthDirection}
                 onChange={(e) => props.setLiveNorthDirection(parseInt(e.target.value))}
                 className="w-full accent-blue-600" 
               />
               <div className="text-center text-sm text-gray-600 mt-1">{props.liveNorthDirection}°</div>
            </div>
            
            <div className="border-t pt-6 mt-4">
              <button
                onClick={() => props.handleSaveChanges && props.handleSaveChanges()}
                disabled={props.boundary.length < 3}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save & Next →
              </button>
            </div>
          </div>
        )}

        {/* --- VIEW: GRIDS --- */}
        {props.activeView === "grids" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800">Energy Grids</h3>
            
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={props.showGrid.devta45}
                  onChange={(e) => props.setShowGrid(p => ({...p, devta45: e.target.checked}))}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" 
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">45 Devtas (Vedic)</span>
                  <span className="block text-xs text-gray-500">Precise energy field analysis</span>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={props.showGrid.zone16}
                  onChange={(e) => props.setShowGrid(p => ({...p, zone16: e.target.checked}))}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" 
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">16 Zones (MahaVastu)</span>
                  <span className="block text-xs text-gray-500">Elemental distribution</span>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={props.showGrid.zone8}
                  onChange={(e) => props.setShowGrid(p => ({...p, zone8: e.target.checked}))}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" 
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">8 Directions</span>
                  <span className="block text-xs text-gray-500">Basic cardinal analysis</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* --- VIEW: OBJECTS --- */}
        {props.activeView === "objects" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800">Place Objects</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {['Stove', 'Toilet', 'Bed', 'Wardrobe', 'Sofa', 'Pooja', 'Stairs', 'Dining'].map((obj) => (
                <button
                  key={obj}
                  onClick={() => props.setSelectedObjectType(obj)}
                  className={`p-3 rounded-lg border text-sm font-medium text-left flex items-center gap-2 transition-all
                    ${props.selectedObjectType === obj 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                >
                  {/* Icon Placeholder */}
                  <div className="w-6 h-6 rounded bg-gray-200"></div> 
                  {obj}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">Selected: <span className="font-bold">{props.selectedObjectType}</span></p>
              <button 
                onClick={props.handleAddObject}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md"
              >
                + Add {props.selectedObjectType} to Map
              </button>
            </div>
             <div className="border-t pt-6 mt-4">
              <button
                onClick={() => props.handleSaveObjects && props.handleSaveObjects()}
                disabled={props.placedObjects.length < 1}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save & Next →
              </button>
            </div>
          </div>
        )}

        {/* --- VIEW: REPORT --- */}
        {props.activeView === "report" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800">Live Analysis</h3>
            
            {props.placedObjects.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Place objects to see analysis.</p>
            ) : (
              <div className="space-y-3">
                {props.placedObjects.map((obj, i) => {
                  const analysis = getObjectAnalysis(obj);
                  const isBad = analysis.status === "CRITICAL" || analysis.status === "BAD";
                  
                  return (
                    <div key={i} className={`p-3 rounded-lg border-l-4 shadow-sm ${
                      analysis.status === "CRITICAL" ? "border-red-500 bg-red-50" :
                      analysis.status === "BAD" ? "border-orange-500 bg-orange-50" :
                      analysis.status === "EXCELLENT" ? "border-green-500 bg-green-50" :
                      "border-gray-300 bg-white"
                    }`}>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-gray-800">{obj.object_type}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          isBad ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"
                        }`}>{analysis.status}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{analysis.message}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};