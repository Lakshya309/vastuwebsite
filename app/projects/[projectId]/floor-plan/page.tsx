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
import { OBJECT_ICONS } from "@/lib/objectIcons";
import { TutorialOverlay, TutorialStep } from "@/components/floor-plan/TutorialOverlay";

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
  const [shaktiChakraType, setShaktiChakraType] = useState<"complete" | "zones">("complete");
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
  const [plotAngle, setPlotAngle] = useState<number>(90);
  const [gridType, setGridType] = useState<"81" | "64">("81");

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const hasCompletedTutorial = localStorage.getItem("vastu_tutorial_completed");
    if (!hasCompletedTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const tutorialSteps: TutorialStep[] = [
    {
      targetId: "viewport",
      title: "Welcome to Vastu Studio",
      content: "Let's take a quick tour to help you design your perfect Vastu-compliant floor plan.",
      position: "center"
    },
    {
      targetId: "tutorial-dimensions",
      title: "Set Your Plot Size",
      content: "Start by entering your plot's Width and Length. This ensures all your measurements are accurate.",
      position: "left"
    },
    {
      targetId: "tutorial-north",
      title: "Align with Truth North",
      content: "Use this slider to align your plan with geographic North. Vastu is all about directions!",
      position: "left"
    },
    {
      targetId: "tutorial-objects",
      title: "Place Your Rooms",
      content: "Drag or click items from the Palette to place them on the canvas. Toilets, Kitchens, and Beds have specific zones!",
      position: "left"
    },
    {
      targetId: "tutorial-layers",
      title: "Analyze Energy Grids",
      content: "Toggle between 45 Devtas or 16 Zones to see how energy flows through your plan.",
      position: "left"
    },
    {
      targetId: "tutorial-analyze",
      title: "Get Your Report",
      content: "Once you're happy with the placement, click here to generate a detailed Vastu compliance report.",
      position: "left"
    }
  ];

  const handleTutorialComplete = () => {
    localStorage.setItem("vastu_tutorial_completed", "true");
    setShowTutorial(false);
  };

  const handleAddWall = (wall: Wall) => {
    // Calculate real-world length if scale is available
    if (scale) {
      const canvasWidth = 800; // Match internal canvas width
      const canvasHeight = 600;
      const pixelLength = Math.sqrt(
        Math.pow((wall.end.x - wall.start.x) * canvasWidth, 2) +
        Math.pow((wall.end.y - wall.start.y) * canvasHeight, 2)
      );
      wall.length = pixelLength * (scale / unitFactor);
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
  const isManualUpdate = useRef(false);

  // Unit conversion factor (base is meters)
  const UNIT_CONVERSIONS = {
    feet: 0.3048,
    meters: 1,
    inches: 0.0254,
  };
  const unitFactor = UNIT_CONVERSIONS[referenceWallUnit];

  // Initialize or Update parallelogram boundary for manual plots
  useEffect(() => {
    if (project?.plot_width && project?.plot_height) {
      if (boundary.length > 4) return;
      if (isManualUpdate.current) {
        isManualUpdate.current = false;
        return;
      }

      const w = project.plot_width;
      const h = project.plot_height;
      const a = (plotAngle * Math.PI) / 180;

      // 1. Determine Scale (Fixed for manual plots after first creation)
      let currentScale = scale;
      if (!currentScale) {
        // Initialization: Calculate a scale that fits the initial dimensions nicely
        const initialBboxW = w + Math.abs(h * Math.cos(a));
        const initialBboxH = h * Math.sin(a);
        const canvasAspect = 800 / 600;
        const shapeAspect = initialBboxH === 0 ? 1 : initialBboxW / initialBboxH;
        const adjustedAspect = shapeAspect / canvasAspect;

        let normWidth;
        if (adjustedAspect > 1) {
          normWidth = 0.8;
        } else {
          normWidth = 0.8 * adjustedAspect;
        }

        const pixelWidth = normWidth * 800; // normalized to absolute pixels in reference 800x600 space
        currentScale = (w * unitFactor) / pixelWidth; // meters per pixel
        setScale(currentScale);
        setReferenceWallIndex(0);
        setReferenceWallLength(w);
      }

      // 2. Calculate Geometry based on STICKY Scale
      // Positions are derived from absolute dimensions / scale
      const pxW = (w * unitFactor) / currentScale;
      const pxH = (h * unitFactor) / currentScale;

      const shiftTop = Math.max(0, pxH * Math.cos(a));
      const shiftBottom = Math.max(0, -pxH * Math.cos(a));

      const pt0 = { x: shiftTop, y: 0 };
      const pt1 = { x: shiftTop + pxW, y: 0 };
      const pt2 = { x: shiftBottom + pxW, y: pxH * Math.sin(a) };
      const pt3 = { x: shiftBottom, y: pxH * Math.sin(a) };

      const totalPxW = pxW + Math.abs(pxH * Math.cos(a));
      const totalPxH = pxH * Math.sin(a);

      // Centering and normalizing
      const xOff = (800 - totalPxW) / 2;
      const yOff = (600 - totalPxH) / 2;

      const rectBoundary: Point[] = [
        { x: (xOff + pt0.x) / 800, y: (yOff + pt0.y) / 600 },
        { x: (xOff + pt1.x) / 800, y: (yOff + pt1.y) / 600 },
        { x: (xOff + pt2.x) / 800, y: (yOff + pt2.y) / 600 },
        { x: (xOff + pt3.x) / 800, y: (yOff + pt3.y) / 600 },
      ];

      const isSame = boundary.length === 4 && boundary.every((p, i) =>
        Math.abs(p.x - rectBoundary[i].x) < 0.0001 &&
        Math.abs(p.y - rectBoundary[i].y) < 0.0001
      );

      if (!isSame) {
        setBoundary(rectBoundary);
        // Wall lengths label update will be handled by the specialized synchronization effect
      }
    }
  }, [project?.plot_width, project?.plot_height, plotAngle, referenceWallUnit]);

  // Synchronize wall lengths whenever scale, boundary, or unit changes
  useEffect(() => {
    if (scale && boundary.length >= 2) {
      const canvasWidth = 800;
      const canvasHeight = 600;
      const newWallLengths = boundary.map((_, i) => {
        const p1 = boundary[i];
        const p2 = boundary[(i + 1) % boundary.length];
        const lengthInPixels = Math.sqrt(
          Math.pow((p2.x - p1.x) * canvasWidth, 2) +
          Math.pow((p2.y - p1.y) * canvasHeight, 2)
        );
        return (lengthInPixels * scale) / unitFactor;
      });

      // Only update if values actually changed to avoid infinite loops
      const isSame = wallLengths.length === newWallLengths.length &&
        wallLengths.every((l, i) => Math.abs(l - newWallLengths[i]) < 0.001);

      if (!isSame) {
        setWallLengths(newWallLengths);
      }
    }
  }, [scale, boundary, unitFactor]);

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
            fetchDetailedAnalysisResults(currentAnalysisId, analysisType, gridType);
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

  const handleMoveBoundaryVertex = (index: number, newPoint: Point) => {
    setBoundary(prev => {
      const updated = [...prev];
      updated[index] = newPoint;

      if (scale) {
        const canvasWidth = 800;
        const canvasHeight = 600;
        const newWallLengths = updated.map((_, i) => {
          const p1 = updated[i];
          const p2 = updated[(i + 1) % updated.length];
          const lengthInPixels = Math.sqrt(
            Math.pow((p2.x - p1.x) * canvasWidth, 2) +
            Math.pow((p2.y - p1.y) * canvasHeight, 2)
          );
          return (lengthInPixels * scale) / unitFactor;
        });
        setWallLengths(newWallLengths);

        // SYNC dimension boxes if it's a 4-point boundary
        if (updated.length === 4) {
          isManualUpdate.current = true;
          // Sync Width (seg 0) and Height (seg 1)
          setProject((p: any) => ({
            ...p,
            plot_width: newWallLengths[0],
            plot_height: newWallLengths[1]
          }));
        }
      }

      return updated;
    });
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
          fetchDetailedAnalysisResults(newId, "devta", gridType);
          setAnalysisStale(false);
        } else {
          alert("Failed to initiate analysis. Please try again.");
        }
      }


      // Phase change handled via scrolling down
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

  const proxiedObjectSvgMap = new Proxy(OBJECT_ICONS, {
    get: function (target, prop, receiver) {
      if (typeof prop === 'string') {
        const type = prop as string;
        // Try exact match
        if (target[type]) return target[type];

        // Try title casing for the lookup
        const titleCase = type.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
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
              shaktiChakraType={shaktiChakraType}
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
              scale={scale ? scale / unitFactor : null}
              wallLengths={wallLengths}
              setReferenceWallIndex={setReferenceWallIndex}
              referenceWallIndex={referenceWallIndex}
              wallColors={wallColors}
              plotWidth={project?.plot_width}
              plotHeight={project?.plot_height}
              highlightedZones={highlightedZones}
              walls={walls}
              onAddWall={handleAddWall}
              onSelectWall={setSelectedWall}
              selectedWall={selectedWall}
              onMoveBoundaryVertex={handleMoveBoundaryVertex}
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
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          gridType={gridType}
          onGridTypeChange={(val) => {
            setGridType(val);
            if (currentAnalysisId) {
              fetchDetailedAnalysisResults(currentAnalysisId, "devta", val);
            }
          }}
          plotWidth={project?.plot_width}
          plotHeight={project?.plot_height}
          setProject={setProject}
          plotAngle={plotAngle}
          setPlotAngle={setPlotAngle}
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
          shaktiChakraType={shaktiChakraType}
          setShaktiChakraType={setShaktiChakraType}
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