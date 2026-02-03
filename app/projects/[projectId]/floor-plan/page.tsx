"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useFloorPlanData } from "@/hooks/useFloorPlanData";
import { useFloorPlanAnalysis } from "@/hooks/useFloorPlanAnalysis";
import { useMarmaAnalysis } from "@/hooks/useMarmaAnalysis";
import { FloorPlanCanvas } from "@/components/floor-plan/FloorPlanCanvas";
import { ControlPanel } from "@/components/floor-plan/ControlPanel";
import { DevtaInfoCard } from "@/components/floor-plan/DevtaInfoCard";
import { PlacedObject, DevtaRegion, Point } from "@/lib/floorPlanInterfaces";

export default function FloorPlanPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [refreshKey, setRefreshKey] = useState(0);

  // 1. Data Hooks
  const {
    project,
    loading,
    error,
    floorPlanImage,
    setFloorPlanImage,
    boundary,
    setBoundary,
    placedObjects,
    setPlacedObjects,
    liveNorthDirection,
    setLiveNorthDirection,
  } = useFloorPlanData(projectId, refreshKey);

  // 2. UI State
  const [activeView, setActiveView] = useState<
    "setup" | "grids" | "objects" | "report"
  >("setup");
  const [showGrid, setShowGrid] = useState({
    devta45: true,
    zone16: false,
    zone8: false,
    marma: false,
  });
  const [selectedObjectType, setSelectedObjectType] = useState("Toilet");
  const [drawingObjectBoundary, setDrawingObjectBoundary] = useState<Point[]>(
    [],
  ); // simplified for brevity
  const [selectedDevta, setSelectedDevta] = useState<DevtaRegion | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFloorPlanImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 3. Analysis Hooks
  const [drawingMode, setDrawingMode] = useState<
    "boundary" | "objects" | "select" | null
  >(null);
  const { devtaRegions, zones16, zones8 } = useFloorPlanAnalysis(
    boundary,
    placedObjects,
    liveNorthDirection,
  );
  const marmaData = useMarmaAnalysis(boundary);

  // 4. Handlers
  const handleAddObject = (objectType: string) => {
    setSelectedObjectType(objectType); // Set the selected object type
    setDrawingMode("objects"); // Enable object placement mode
  };

  const handleStartDrawingBoundary = () => {
    setDrawingMode("boundary");
  };

  const handleReupload = () => {
    setFloorPlanImage(null);
    setSelectedFile(null);
  };

  const handleFinishDrawingBoundary = () => {
    setDrawingMode(null);
  };

  const handleResetBoundary = () => {
    setBoundary([]);
  };

  const handleUndoLastPoint = () => {
    setBoundary((prev) => prev.slice(0, -1));
  };

  const handleDrawBoundary = (point: Point) => {
    setBoundary((prev) => [...prev, point]);
  };

  const handleCanvasClick = (point: Point) => {
    if (drawingMode === "objects" && selectedObjectType) {
      const newObject: PlacedObject = {
        id: new Date().toISOString(),
        object_type: selectedObjectType,
        boundary_normalized: [
          { x: point.x - 0.05, y: point.y - 0.05 },
          { x: point.x + 0.05, y: point.y - 0.05 },
          { x: point.x + 0.05, y: point.y + 0.05 },
          { x: point.x - 0.05, y: point.y + 0.05 },
        ],
        centroid: point,
        rotation: 0,
      };
      handlePlaceObject(newObject);
    }
  };

  const handlePlaceObject = (newObject: PlacedObject) => {
    setPlacedObjects((prev) => [...prev, newObject]);
    setDrawingMode(null); // Exit object placement mode after placing
  };

  const handleMoveObject = (id: string, x: number, y: number) => {
    console.log(`[FloorPlanPage] handleMoveObject called for id: ${id} with x: ${x.toFixed(4)}, y: ${y.toFixed(4)}`);
    setPlacedObjects((prev) =>
      prev.map((obj) => {
        if (obj.id === id) {
          console.log(`[FloorPlanPage] Found object to move:`, obj);
          const dx = x - obj.boundary_normalized[0].x;
          const dy = y - obj.boundary_normalized[0].y;
          console.log(`[FloorPlanPage] Calculated dx: ${dx.toFixed(4)}, dy: ${dy.toFixed(4)}`);

          const newCentroid = {
            x: obj.centroid.x + dx,
            y: obj.centroid.y + dy,
          };
          const newBoundary = obj.boundary_normalized.map((p) => ({
            x: p.x + dx,
            y: p.y + dy,
          }));
          
          const newObj = {
            ...obj,
            centroid: newCentroid,
            boundary_normalized: newBoundary,
          };

          console.log(`[FloorPlanPage] New object state:`, newObj);
          return newObj;
        }
        return obj;
      }),
    );
  };

  const handleResizeObject = (id: string, width: number, height: number) => {
    setPlacedObjects((prev) =>
      prev.map((obj) => {
        if (obj.id === id) {
          const newBoundary = [
            {
              x: obj.boundary_normalized[0].x,
              y: obj.boundary_normalized[0].y,
            },
            {
              x: obj.boundary_normalized[0].x + width,
              y: obj.boundary_normalized[0].y,
            },
            {
              x: obj.boundary_normalized[0].x + width,
              y: obj.boundary_normalized[0].y + height,
            },
            {
              x: obj.boundary_normalized[0].x,
              y: obj.boundary_normalized[0].y + height,
            },
          ];
          const newCentroid = {
            x: obj.boundary_normalized[0].x + width / 2,
            y: obj.boundary_normalized[0].y + height / 2,
          };
          return {
            ...obj,
            boundary_normalized: newBoundary,
            centroid: newCentroid,
          };
        }
        return obj;
      }),
    );
  };

  const handleRotateObject = (id: string, rotation: number) => {
    setPlacedObjects((prev) =>
      prev.map((obj) => {
        if (obj.id === id) {
          return { ...obj, rotation };
        }
        return obj;
      }),
    );
  };

  const handleDeleteObject = (id: string) => {
    setPlacedObjects((prev) => prev.filter((obj) => obj.id !== id));
  };

  const handleDevtaClick = (devta: DevtaRegion) => {
    setSelectedDevta(devta);
  };

  const handleCloseDevtaCard = () => {
    setSelectedDevta(null);
  };

  const handleSaveChanges = async () => {
    try {
      // Finish drawing if in progress
      if (drawingMode === "boundary") {
        handleFinishDrawingBoundary();
      }

      console.log("Saving data:", {
        boundary_normalized: boundary,
        north_direction: liveNorthDirection,
        floor_plan_path: floorPlanImage, // Assuming the image is already uploaded or handled
      });

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boundary_normalized: boundary,
          north_direction: liveNorthDirection,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save project data.");
      }

      console.log("Project data saved successfully!");
      setActiveView("grids"); // Move to the next phase
    } catch (error) {
      console.error(error);
      // You might want to show an error message to the user
    }
  };

  const handleSaveObjects = async () => {
    try {
      console.log("Saving objects:", placedObjects);

      const response = await fetch(`/api/projects/${projectId}/objects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objects: placedObjects }),
      });

      if (!response.ok) {
        throw new Error("Failed to save project objects.");
      }

      console.log("Project objects saved successfully!");
      setRefreshKey(prev => prev + 1); // Trigger refresh of data
      setActiveView("report"); // Move to the next phase
    } catch (error) {
      console.error(error);
      // You might want to show an error message to the user
    }
  };

  const objectSvgMap: { [key: string]: string } = {
    Stove: "/objects/stove.svg",
    Toilet: "/objects/toilet.svg",
    Bed: "/objects/bed.svg",
    Wardrobe: "/objects/wardrobe.svg",
    Sofa: "/objects/sofa.svg",
    Pooja: "/objects/pooja.svg",
    Stairs: "/objects/stairs.svg",
    Dining: "/objects/dining.svg",
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectId}`}
            className="text-gray-500 hover:text-gray-800"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            {project?.name || "Untitled Project"}{" "}
            <span className="text-gray-400 font-normal">/ Vastu Studio</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded">
            Save Draft
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded shadow">
            Export Report
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area (Left) */}
        <div className="flex-1 bg-gray-50 relative overflow-hidden flex items-center justify-center p-8">
          <div className="bg-white shadow-2xl rounded-lg overflow-hidden relative">
            <FloorPlanCanvas
              floorPlanImage={floorPlanImage}
              boundary={boundary}
              onDrawBoundary={handleDrawBoundary}
              placedObjects={placedObjects}
              onMoveObject={handleMoveObject}
              onResizeObject={handleResizeObject}
              onRotateObject={handleRotateObject}
              onDeleteObject={handleDeleteObject}
              objectSvgMap={objectSvgMap}
              devtaRegions={showGrid.devta45 ? devtaRegions : []}
              zone16Regions={showGrid.zone16 ? zones16 : []}
              zone8Regions={showGrid.zone8 ? zones8 : []}
              marmaData={showGrid.marma ? marmaData : null}
              onDevtaClick={handleDevtaClick}
              drawingMode={drawingMode}
              setDrawingMode={setDrawingMode}
              onPlaceObject={handlePlaceObject}
              onCanvasClick={handleCanvasClick}
              drawingObjectBoundary={drawingObjectBoundary}
              setDrawingObjectBoundary={setDrawingObjectBoundary}
              selectedObjectType={selectedObjectType}
            />

            {/* Overlay Status Indicators */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {showGrid.devta45 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">
                  45 Devtas ON
                </span>
              )}
              {showGrid.zone16 && (
                <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow">
                  16 Zones ON
                </span>
              )}
              {showGrid.zone8 && (
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded shadow">
                  8 Zones ON
                </span>
              )}
            </div>

            {selectedDevta && (
              <DevtaInfoCard
                devta={selectedDevta}
                onClose={handleCloseDevtaCard}
              />
            )}
          </div>
        </div>

        {/* Control Panel (Right) */}
        <ControlPanel
          projectId={projectId}
          error={error}
          loading={loading}
          activeView={activeView}
          setActiveView={setActiveView}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          liveNorthDirection={liveNorthDirection}
          setLiveNorthDirection={setLiveNorthDirection}
          selectedFile={selectedFile}
          handleImageUpload={handleImageUpload}
          handleStartDrawingBoundary={handleStartDrawingBoundary}
          handleFinishDrawingBoundary={handleFinishDrawingBoundary}
          handleReupload={handleReupload}
          handleResetBoundary={handleResetBoundary}
          handleUndoLastPoint={handleUndoLastPoint}
          selectedObjectType={selectedObjectType}
          setSelectedObjectType={setSelectedObjectType}
          handleAddObject={handleAddObject}
          placedObjects={placedObjects}
          devtaRegions={devtaRegions}
          zone16Regions={zones16}
          zone8Regions={zones8}
          drawingMode={drawingMode}
          boundary={boundary}
          handleSaveChanges={handleSaveChanges}
          handleSaveObjects={handleSaveObjects}
        />
      </div>
    </div>
  );
}


  

  
