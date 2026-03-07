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
import { PlacedObject, DevtaRegion, Point, Wall } from "@/lib/floorPlanInterfaces";

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
    shaktiChakra: false,
  });
  const [selectedObjectType, setSelectedObjectType] = useState("Toilet");
  const [drawingObjectBoundary, setDrawingObjectBoundary] = useState<Point[]>(
    [],
  ); // simplified for brevity
  const [selectedDevta, setSelectedDevta] = useState<DevtaRegion | null>(null);
  const [selectedZone, setSelectedZone] = useState<DevtaRegion | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisStale, setAnalysisStale] = useState(false);
  const [shaktiChakraSize, setShaktiChakraSize] = useState(0.8);
  const [scale, setScale] = useState<number | null>(null);
  const [wallLengths, setWallLengths] = useState<number[]>([]);
  const [referenceWallIndex, setReferenceWallIndex] = useState<number | null>(null);
  const [referenceWallLength, setReferenceWallLength] = useState<number | null>(null);
  const [referenceWallUnit, setReferenceWallUnit] = useState<"feet" | "meters" | "inches">("meters");
  const [wallColors, setWallColors] = useState<(string | null)[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [highlightedZones, setHighlightedZones] = useState<string[]>([]);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [selectedWall, setSelectedWall] = useState<Wall | null>(null);

  const handleAddWall = (wall: Wall) => {
    // Calculate real-world length if scale is available
    if (scale) {
      const canvasWidth = 800; // Match internal canvas width
      const canvasHeight = 600;
      const pixelLength = Math.sqrt(
        Math.pow((wall.end.x - wall.start.x) * canvasWidth, 2) +
        Math.pow((wall.end.y - wall.start.y) * canvasHeight, 2)
      );
      wall.length = pixelLength * scale;
    }
    setWalls((prev) => [...prev, wall]);
  };

  const handleUpdateWall = (updatedWall: Wall) => {
    setWalls((prev) => prev.map((w) => (w.id === updatedWall.id ? updatedWall : w)));
    if (selectedWall?.id === updatedWall.id) {
      setSelectedWall(updatedWall);
    }
  };

  const handleDeleteWall = (id: string) => {
    setWalls((prev) => prev.filter((w) => w.id !== id));
    if (selectedWall?.id === id) {
      setSelectedWall(null);
    }
  };

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
    "boundary" | "objects" | "select" | "wall" | "measure" | null
  >(null);
  const {
    devtaRegions,
    zones16,
    zones8,
    plotCentroid,
    isAnalyzing,
    createAnalysisRequest,
    fetchDetailedAnalysisResults,
    currentAnalysisId,
    error: analysisError
  } = useFloorPlanAnalysis();
  const { marmaData, isLoading: isMarmaAnalyzing, error: marmaError } = useMarmaAnalysis(currentAnalysisId);

  const debouncedBoundary = useDebounce(boundary, 500);
  const debouncedNorthDirection = useDebounce(liveNorthDirection, 500);

  // Initialize rectangular boundary for manual plots
  useEffect(() => {
    if (project?.plot_width && project?.plot_height && boundary.length === 0) {
      const width = project.plot_width;
      const height = project.plot_height;
      const aspect = width / height;
      const adjustedAspect = aspect * (600 / 800); // Counteract the 800x600 canvas coordinate squish

      // Define a rectangle centered in the normalized [0, 1] space
      // Let's make it occupy about 80% of the canvas
      let normWidth, normHeight;
      if (adjustedAspect > 1) {
        normWidth = 0.8;
        normHeight = 0.8 / adjustedAspect;
      } else {
        normHeight = 0.8;
        normWidth = 0.8 * adjustedAspect;
      }

      const xOff = (1 - normWidth) / 2;
      const yOff = (1 - normHeight) / 2;

      const rectBoundary: Point[] = [
        { x: xOff, y: yOff },
        { x: xOff + normWidth, y: yOff },
        { x: xOff + normWidth, y: yOff + normHeight },
        { x: xOff, y: yOff + normHeight },
      ];
      setBoundary(rectBoundary);

      // Automatically calculate and set scale for manual plots
      // Use the top edge (index 0 to 1) as the reference wall (width).
      const canvasWidth = 800; // Fixed canvas internal width based on FloorPlanCanvas logic
      const pixelWidth = normWidth * canvasWidth;

      if (pixelWidth > 0 && width > 0) {
        // Assume input dimensions are in feet by default for manual plots 
        const UNIT_CONVERSIONS = {
          feet: 0.3048,   // 1 foot = 0.3048 meters
          meters: 1,      // 1 meter = 1 meter
          inches: 0.0254, // 1 inch = 0.0254 meters
        };
        const realLengthInMeters = width * UNIT_CONVERSIONS["feet"];
        const calculatedScale = realLengthInMeters / pixelWidth;

        setScale(calculatedScale);
        setReferenceWallIndex(0);
        setReferenceWallLength(width);
        setReferenceWallUnit("feet");

        // Populate wall lengths array
        const canvasHeight = 600;
        const newWallLengths = rectBoundary.map((_, i) => {
          const point1 = rectBoundary[i];
          const point2 = rectBoundary[(i + 1) % rectBoundary.length];
          const lengthInPixels = Math.sqrt(
            Math.pow((point2.x - point1.x) * canvasWidth, 2) +
            Math.pow((point2.y - point1.y) * canvasHeight, 2)
          );
          return lengthInPixels * calculatedScale;
        });
        setWallLengths(newWallLengths);
      }
    }
  }, [project, boundary.length]);

  useEffect(() => {
    if (currentAnalysisId) {
      const analysisType = "devta"; // This hook specifically handles devta analysis

      const pollStatus = setInterval(async () => {
        try {
          const response = await fetch(`/api/analysis/${currentAnalysisId}/status`);
          if (!response.ok) {
            // Handle HTTP errors (e.g., 404, 500)

            clearInterval(pollStatus); // Stop polling on critical error
            return;
          }
          const { status } = await response.json();

          if (status !== "pending") {
            clearInterval(pollStatus);
            fetchDetailedAnalysisResults(currentAnalysisId, analysisType);
          }
        } catch (error) {
          // Handle network errors
          console.error("Error polling analysis status:", error);
          clearInterval(pollStatus); // Stop polling on network error
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup function to stop polling if the component unmounts or dependencies change
      return () => clearInterval(pollStatus);
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

  const handleZoneClick = (zone: DevtaRegion) => {
    setSelectedZone(zone);
  };

  const handleCloseZoneCard = () => {
    setSelectedZone(null);
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

      if (boundary.length > 0) {
        const newId = await createAnalysisRequest(projectId, "devta", boundary, liveNorthDirection, undefined, undefined);
        if (newId) {
          fetchDetailedAnalysisResults(newId, "devta");
          setAnalysisStale(false);
        } else {
          alert("Failed to initiate analysis. Please try again.");
        }
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

      const finalAnalysisId = currentAnalysisId;

      if (!finalAnalysisId) {
        alert("No active analysis to generate report for. Please initiate an analysis first.");
        return;
      }

      router.push(`/projects/${projectId}/report?analysisId=${finalAnalysisId}`); // Navigate to dedicated report page with analysisId
    } catch (error: any) {
      console.error("Error saving objects or accessing report:", error);
      alert(error.message || "An unexpected error occurred.");
    }
  };

  const objectSvgMap: { [key: string]: string } = {
    "Stove": "/objects/stove.svg",
    "Toilet": "/objects/toilet.svg",
    "Bed": "/objects/bed.svg",
    "Wardrobe": "/objects/wardrobe.svg",
    "Sofa": "/objects/sofa.svg",
    "Pooja": "/objects/pooja.png",
    "Staircase": "/objects/stairs.svg",
    "Dining Room": "/objects/dining.svg",
    "Overhead Tank": "/objects/overheadtank.png",
    "Underground Tank": "/objects/undergroundtank.png",
    "Kitchen": "/objects/stove.svg",
  };

  // We can use a Proxy to fallback to the generic icon
  const proxiedObjectSvgMap = new Proxy(objectSvgMap, {
    get: function (target, prop, receiver) {
      if (typeof prop === 'string') {
        // Try exact match
        if (target[prop]) return target[prop];

        // Try title casing for the lookup if it's uppercase
        const titleCase = prop.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        if (target[titleCase]) return target[titleCase];
      }
      return "/objects/generic.svg";
    }
  });

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
              objectSvgMap={proxiedObjectSvgMap}
              devtaRegions={showGrid.devta45 ? devtaRegions : []}
              zone16Regions={showGrid.zone16 ? zones16 : []}
              zone8Regions={showGrid.zone8 ? zones8 : []}
              marmaData={showGrid.marma ? marmaData : null}
              shaktiChakra={showGrid.shaktiChakra}
              shaktiChakraSize={shaktiChakraSize}
              plotCentroid={plotCentroid}
              onDevtaClick={handleDevtaClick}
              onZoneClick={handleZoneClick}
              drawingMode={drawingMode}
              setDrawingMode={setDrawingMode}
              onPlaceObject={handlePlaceObject}
              onCanvasClick={handleCanvasClick}
              drawingObjectBoundary={drawingObjectBoundary}
              setDrawingObjectBoundary={setDrawingObjectBoundary}
              selectedObjectType={selectedObjectType}
              northDirection={liveNorthDirection}
              scale={scale}
              wallLengths={wallLengths}
              setReferenceWallIndex={setReferenceWallIndex}
              referenceWallIndex={referenceWallIndex}
              wallColors={wallColors}
              plotWidth={project?.plot_width}
              plotHeight={project?.plot_height}
              activeView={activeView}
              highlightedZones={highlightedZones}
              walls={walls}
              onAddWall={handleAddWall}
              onSelectWall={setSelectedWall}
              selectedWall={selectedWall}
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
            {selectedZone && (
              <DevtaInfoCard
                devta={selectedZone}
                onClose={handleCloseZoneCard}
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
          setDrawingMode={setDrawingMode}
          boundary={boundary}
          handleSaveChanges={handleSaveChanges}
          handleSaveObjects={handleSaveObjects}
          // New analysis props
          isAnalyzing={isAnalyzing}
          analysisStale={analysisStale}
          shaktiChakraSize={shaktiChakraSize}
          setShaktiChakraSize={setShaktiChakraSize}
          scale={scale}
          setScale={setScale}
          wallLengths={wallLengths}
          setWallLengths={setWallLengths}
          referenceWallIndex={referenceWallIndex}
          setReferenceWallIndex={setReferenceWallIndex}
          referenceWallLength={referenceWallLength}
          setReferenceWallLength={setReferenceWallLength}
          referenceWallUnit={referenceWallUnit}
          setReferenceWallUnit={setReferenceWallUnit}
          wallColors={wallColors}
          setWallColors={setWallColors}
          selectedProblem={selectedProblem}
          setSelectedProblem={setSelectedProblem}
          setHighlightedZones={setHighlightedZones}
          // Wall props
          walls={walls}
          onAddWall={handleAddWall}
          onUpdateWall={handleUpdateWall}
          onDeleteWall={handleDeleteWall}
          selectedWall={selectedWall}
          onSelectWall={setSelectedWall}
        />
      </div>
    </div>
  );
}