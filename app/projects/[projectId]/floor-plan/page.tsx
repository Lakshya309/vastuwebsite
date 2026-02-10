"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFloorPlanData } from "@/hooks/useFloorPlanData";
import { useDebounce } from "@/hooks/useDebounce";
import { useFloorPlanAnalysis } from "@/hooks/useFloorPlanAnalysis";
import { useMarmaAnalysis } from "@/hooks/useMarmaAnalysis";
import { FloorPlanCanvas } from "@/components/floor-plan/FloorPlanCanvas";
import { ControlPanel } from "@/components/floor-plan/ControlPanel";
import { DevtaInfoCard } from "@/components/floor-plan/DevtaInfoCard";
import { PlacedObject, DevtaRegion, Point } from "@/lib/floorPlanInterfaces";

export default function FloorPlanPage() {
  const params = useParams();
  const router = useRouter(); // Initialize router
  const projectId = params.projectId as string;
  const [refreshKey, setRefreshKey] = useState(0);

  // 1. Data Hooks
  const {
    project,
    setProject,
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
    "setup" | "grids" | "objects"
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
  const [analysisStale, setAnalysisStale] = useState(false);

  const uploadFloorPlan = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload floor plan.");
      }

      if (data.project) {
        setProject(data.project);
        setFloorPlanImage(data.project.floor_plan_path);
      }
    } catch (error) {
      console.error(error);
      // Handle upload error (e.g., show a notification)
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {

      };
      reader.readAsDataURL(file);

      // Upload the file
      await uploadFloorPlan(file);
    }
  };

  // 3. Analysis Hooks & Debouncing
  const [drawingMode, setDrawingMode] = useState<
    "boundary" | "objects" | "select" | null
  >(null);
  const {
    devtaRegions,
    zones16,
    zones8,
    isAnalyzing,
    createAnalysisRequest,
    fetchDetailedAnalysisResults,
    currentAnalysisId,
    error: analysisError
  } = useFloorPlanAnalysis();
  const { marmaData, isLoading: isMarmaAnalyzing, error: marmaError } = useMarmaAnalysis(currentAnalysisId);

  const debouncedBoundary = useDebounce(boundary, 500);
  const debouncedNorthDirection = useDebounce(liveNorthDirection, 500);



  // Effect to fetch detailed analysis results once a pending analysis ID is available (placeholder for approval)
  useEffect(() => {
    if (currentAnalysisId) {
      // In a full implementation, you would check the status of currentAnalysisId
      // via an API call or a real-time subscription.
      // For now, we'll assume it's approved and immediately fetch results.
      const analysisType = "devta"; // This hook specifically handles devta analysis
      fetchDetailedAnalysisResults(currentAnalysisId, analysisType);
    }
  }, [currentAnalysisId, fetchDetailedAnalysisResults]);

  useEffect(() => {
    setAnalysisStale(true);
  }, [boundary, placedObjects, liveNorthDirection]);

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
    setPlacedObjects((prev) =>
      prev.map((obj) => {
        if (obj.id === id) {
          const dx = x - obj.boundary_normalized[0].x;
          const dy = y - obj.boundary_normalized[0].y;

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

      setActiveView("grids"); // Move to the next phase
    } catch (error) {
      console.error(error);
      // You might want to show an error message to the user
    }
  };

  const handleSaveObjects = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/objects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objects: placedObjects }),
      });

      if (!response.ok) {
        throw new Error("Failed to save project objects.");
      }

      setRefreshKey(prev => prev + 1); // Trigger refresh of data

      let finalAnalysisId = currentAnalysisId;

      // If no active analysis or analysis is stale, trigger a new one
      if (analysisStale || !finalAnalysisId || isAnalyzing) {
        // Ensure boundary and northDirection are available from the state
        if (boundary.length === 0) {
            alert("Please draw a boundary for the analysis.");
            return;
        }
        const newId = await createAnalysisRequest(projectId, "devta", boundary, liveNorthDirection, undefined, undefined);
        if (!newId) {
            alert("Failed to initiate analysis. Please try again.");
            return;
        }
        finalAnalysisId = newId;
        setAnalysisStale(false);
      }

      if (!finalAnalysisId) {
        alert("No active analysis to generate report for. Please initiate an analysis first.");
        return;
      }

      // Add a small delay to ensure the database has time to commit
      // This delay might still be necessary even with the above logic,
      // as the analysis record might be created but not yet fully processed.
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

      // --- Deduct Credit for Report View ---
      const deductCreditResponse = await fetch(`/api/analysis/${finalAnalysisId}/deduct-credit-for-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!deductCreditResponse.ok) {
        const errorData = await deductCreditResponse.json();
        alert(errorData.message || "Failed to deduct credit for report access.");
        return;
      }

      router.push(`/projects/${projectId}/report?analysisId=${finalAnalysisId}`); // Navigate to dedicated report page with analysisId
    } catch (error: any) {
      console.error("Error saving objects or accessing report:", error);
      alert(error.message || "An unexpected error occurred.");
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
          error={error || analysisError}
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
          // New analysis props
          isAnalyzing={isAnalyzing}
          analysisStale={analysisStale}

        />
      </div>
    </div>
  );
}