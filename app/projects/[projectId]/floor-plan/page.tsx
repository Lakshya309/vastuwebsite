"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Video, VideoOff } from "lucide-react";
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
import { ResizableLayout } from "@/components/floor-plan/ResizableLayout";
import { VideoPlayer } from "@/components/floor-plan/VideoPlayer";

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
  const [showVideo, setShowVideo] = useState(false);
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
      content: "Design your Vastu-compliant floor plan in a few simple steps.",
      position: "center"
    },
    {
      targetId: "tutorial-dimensions",
      title: "Set Your Plot Size",
      content: "Enter your plot's Width and Length to get accurate measurements.",
      position: "left"
    },
    {
      targetId: "tutorial-north",
      title: "Set North Direction",
      content: "Use this slider to set which direction your plot faces using a compass.",
      position: "left"
    },
    {
      targetId: "tutorial-objects",
      title: "Place Room Items",
      content: "Click items from the list to place them on your floor plan. Each item has an ideal direction in Vastu.",
      position: "left"
    },
    {
      targetId: "tutorial-layers",
      title: "View Energy Grids",
      content: "Toggle different grids to see how energy flows through your plan.",
      position: "left"
    },
    {
      targetId: "tutorial-analyze",
      title: "Get Your Report",
      content: "Click here to generate a detailed Vastu analysis report for your floor plan.",
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
        // Force a re-fetch of the project data to obtain the new presigned R2 URL
        setFloorPlanImage(null);
        setRefreshKey(prev => prev + 1);
        setSelectedFile(null);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "An error occurred during upload.");
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

  const isManualMode = !!(project?.plot_width && project?.plot_height) || 
                     !!(project?.plot_side_front && project?.plot_side_back && 
                        project?.plot_side_left && project?.plot_side_right);

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

  // Initialize or Update manual boundary (Parallelogram or Irregular Quadrilateral)
  useEffect(() => {
    const isIrregular = !!(project?.plot_side_front && project?.plot_side_back && project?.plot_side_left && project?.plot_side_right);
    const isRegular = !!(project?.plot_width && project?.plot_height);

    if (isIrregular || isRegular) {
      if (boundary.length > 4) return;
      if (isManualUpdate.current) {
        isManualUpdate.current = false;
        return;
      }

      let pts: Point[] = [];
      let totalPxW = 0;
      let totalPxH = 0;

      if (isIrregular) {
        // 1. Calculate geometry in REAL units (meters) first
        const a = project.plot_side_front! * unitFactor; // Front
        const b = project.plot_side_back! * unitFactor;  // Back
        const c = project.plot_side_left! * unitFactor;  // Left
        const d = project.plot_side_right! * unitFactor; // Right

        let p0: Point, p1: Point, p2: Point, p3: Point;

        // Check if right-angle trapezoid calculation should be used
        const hasRightAngle = project.has_right_angle && project.right_angle_corner;
        
        if (hasRightAngle && project.right_angle_corner) {
          // Right-angle trapezoid calculation
          // The 90° corner is placed at origin, sides extend along axes
          switch (project.right_angle_corner) {
            case "FR": {
              // Front-Right corner is 90°
              // p1 = FR at origin, p0 = FL on x-axis, p2 = BR on y-axis, p3 = BL
              p1 = { x: 0, y: 0 };
              p0 = { x: -a, y: 0 };
              p2 = { x: 0, y: d };
              p3 = { x: -a, y: d };
              break;
            }
            case "FL": {
              // Front-Left corner is 90°
              // p0 = FL at origin, p1 = FR on x-axis, p3 = BL on y-axis, p2 = BR
              p0 = { x: 0, y: 0 };
              p1 = { x: a, y: 0 };
              p3 = { x: 0, y: c };
              p2 = { x: a, y: c };
              break;
            }
            case "BR": {
              // Back-Right corner is 90°
              // p2 = BR at origin, p1 = FR on x-axis, p3 = BL on y-axis, p0 = FL
              p2 = { x: 0, y: 0 };
              p1 = { x: -d, y: 0 };
              p3 = { x: 0, y: -b };
              p0 = { x: -d, y: -b };
              break;
            }
            case "BL": {
              // Back-Left corner is 90°
              // p3 = BL at origin, p2 = BR on x-axis, p0 = FL on y-axis, p1 = FR
              p3 = { x: 0, y: 0 };
              p2 = { x: b, y: 0 };
              p0 = { x: 0, y: -c };
              p1 = { x: b, y: -c };
              break;
            }
            default:
              // Fallback to cyclic quadrilateral calculation
              p0 = { x: 0, y: 0 };
              p1 = { x: 0, y: 0 };
              p2 = { x: 0, y: 0 };
              p3 = { x: 0, y: 0 };
          }
        } else {
          // Original cyclic quadrilateral calculation for general irregular shapes
          let e;
          if (project.plot_diagonal) {
            e = project.plot_diagonal * unitFactor;
          } else {
            // Auto-calculate diagonal using Cyclic Quadrilateral formula (most regular shape)
            e = Math.sqrt(((a * d + b * c) * (a * b + c * d)) / (a * c + b * d));
          }

          // Law of Cosines on Triangle 1 (Side Front, Side Right, Diagonal)
          const cosAngleFR = (a * a + d * d - e * e) / (2 * a * d);
          const sinAngleFR = Math.sqrt(Math.max(0, 1 - cosAngleFR * cosAngleFR));

          // Let Front-Left be (0,0) and Front-Right be (a, 0)
          p0 = { x: 0, y: 0 };
          p1 = { x: a, y: 0 };
          p2 = { x: a - d * cosAngleFR, y: d * sinAngleFR };

          // Law of Cosines on Triangle 2 (Side Left, Side Back, Diagonal)
          const cosAngleFL = (c * c + e * e - b * b) / (2 * c * e);
          const angleFL = Math.acos(Math.max(-1, Math.min(1, cosAngleFL)));
          const angleDiag = Math.atan2(p2.y, p2.x);

          p3 = {
            x: c * Math.cos(angleDiag + angleFL),
            y: c * Math.sin(angleDiag + angleFL)
          };
        }

        const minX = Math.min(p0.x, p1.x, p2.x, p3.x);
        const minY = Math.min(p0.y, p1.y, p2.y, p3.y);
        const maxX = Math.max(p0.x, p1.x, p2.x, p3.x);
        const maxY = Math.max(p0.y, p1.y, p2.y, p3.y);

        const realW = maxX - minX;
        const realH = maxY - minY;

        // 2. Determine/Update Scale
        const canvasAspect = 800 / 600;
        const shapeAspect = realH === 0 ? 1 : realW / realH;
        const adjustedAspect = shapeAspect / canvasAspect;

        let normWidth;
        if (adjustedAspect > 1) normWidth = 0.8;
        else normWidth = 0.8 * adjustedAspect;

        const pixelWidth = normWidth * 800;
        const currentScale = realW / pixelWidth;

        if (scale !== currentScale) {
          setScale(currentScale);
          setReferenceWallIndex(0);
          setReferenceWallLength(project.plot_side_front!);
        }

        // 3. Normalize points
        pts = [p0, p1, p2, p3].map(p => ({
          x: (p.x - minX) / currentScale,
          y: (p.y - minY) / currentScale
        }));
        totalPxW = realW / currentScale;
        totalPxH = realH / currentScale;

      } else {
        const w = project?.plot_width || 0;
        const h = project?.plot_height || 0;
        const a = (plotAngle * Math.PI) / 180;

        const initialBboxW = w + Math.abs(h * Math.cos(a));
        const initialBboxH = h * Math.sin(a);
        const canvasAspect = 800 / 600;
        const shapeAspect = initialBboxH === 0 ? 1 : initialBboxW / initialBboxH;
        const adjustedAspect = shapeAspect / canvasAspect;

        let normWidth;
        if (adjustedAspect > 1) normWidth = 0.8;
        else normWidth = 0.8 * adjustedAspect;

        const pixelWidth = normWidth * 800;
        const currentScale = (w * unitFactor) / pixelWidth;

        if (scale !== currentScale) {
          setScale(currentScale);
          setReferenceWallIndex(0);
          setReferenceWallLength(w);
        }

        const pxW = (w * unitFactor) / currentScale;
        const pxH = (h * unitFactor) / currentScale;

        const shiftTop = Math.max(0, pxH * Math.cos(a));
        const shiftBottom = Math.max(0, -pxH * Math.cos(a));

        pts = [
          { x: shiftTop, y: 0 },
          { x: shiftTop + pxW, y: 0 },
          { x: shiftBottom + pxW, y: pxH * Math.sin(a) },
          { x: shiftBottom, y: pxH * Math.sin(a) },
        ];

        totalPxW = pxW + Math.abs(pxH * Math.cos(a));
        totalPxH = pxH * Math.sin(a);
      }

      const xOff = (800 - totalPxW) / 2;
      const yOff = (600 - totalPxH) / 2;

      const finalBoundary: Point[] = pts.map(p => ({
        x: (xOff + p.x) / 800,
        y: (yOff + p.y) / 600,
      }));

      const isSame = boundary.length === 4 && boundary.every((p, i) =>
        Math.abs(p.x - finalBoundary[i].x) < 0.0001 &&
        Math.abs(p.y - finalBoundary[i].y) < 0.0001
      );

      if (!isSame) {
        setBoundary(finalBoundary);
      }
    }
  }, [
    boundary,
    project?.plot_width,
    project?.plot_height,
    project?.plot_side_front,
    project?.plot_side_back,
    project?.plot_side_left,
    project?.plot_side_right,
    project?.plot_diagonal,
    plotAngle,
    referenceWallUnit
  ]);

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

          if (project?.plot_side_front !== undefined && project?.plot_side_front !== null) {
            // Sync Irregular fields
            const diagPx = Math.sqrt(
              Math.pow((updated[2].x - updated[0].x) * canvasWidth, 2) +
              Math.pow((updated[2].y - updated[0].y) * canvasHeight, 2)
            );

            setProject((p: any) => ({
              ...p,
              plot_side_front: newWallLengths[0],
              plot_side_right: newWallLengths[1],
              plot_side_back: newWallLengths[2],
              plot_side_left: newWallLengths[3],
              plot_diagonal: (diagPx * scale) / unitFactor
            }));
          } else {
            // Sync Regular Width (seg 0) and Height (seg 1)
            setProject((p: any) => ({
              ...p,
              plot_width: newWallLengths[0],
              plot_height: newWallLengths[1]
            }));
          }
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
    <div className="h-screen relative flex flex-col overflow-hidden bg-white/20">
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none organic-gradient opacity-40" />

      {/* Header */}
      <header className="relative z-20 glass border-b border-white/50 h-20 flex items-center justify-between px-8 shrink-0 shadow-lg backdrop-blur-3xl">
        <div className="flex items-center gap-6">
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center justify-center w-10 h-10 bg-white/50 rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm border border-white"
          >
            ←
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-cormorant font-bold italic text-primary leading-none">
              {project?.name || "Floor Plan"}
            </h1>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 italic">Vastu Analysis</span>
          </div>
        </div>
          <div className="flex items-center gap-4">
          {project?.video_url && (
            <button
              onClick={() => setShowVideo(!showVideo)}
              className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 border shadow-sm ${
                showVideo 
                  ? 'bg-teal-500 text-white border-teal-600 shadow-teal-200' 
                  : 'bg-white/70 text-primary border-white hover:bg-white'
              }`}
            >
              {showVideo ? <VideoOff size={14} /> : <Video size={14} />}
              {showVideo ? 'Close Video' : 'Open Video'}
            </button>
          )}
          <button className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
            Save Draft
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {showVideo && project?.video_url ? (
          <ResizableLayout
            minLeftWidth={380}
            maxLeftWidth={700}
            defaultLeftWidth={500}
            leftPanel={
              <div className="h-full bg-gray-900 flex flex-col">
                {/* Video Player - fills available space */}
                <div className="flex-1 min-h-0">
                  <VideoPlayer
                    url={project.video_url}
                    onClose={() => setShowVideo(false)}
                    title={`Video Analysis - ${project.name}`}
                    className="h-full"
                  />
                </div>
                {/* Info Panel */}
                <div className="p-4 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                    <h4 className="text-white text-xs font-semibold">Video Analysis Mode</h4>
                  </div>
                  <p className="text-gray-400 text-[10px] leading-relaxed">
                    Pause the video to place objects on your floor plan. Use it to verify structural elements.
                  </p>
                </div>
              </div>
            }
            rightPanel={
              <div className="flex h-full min-h-0">
                <div className="flex-1 bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
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
                          45 Energy Zones
                        </span>
                      )}
                      {showGrid.zone16 && (
                        <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow">
                          16 Zones
                        </span>
                      )}
                      {showGrid.zone8 && (
                        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded shadow">
                          8 Directions
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
                <div className="h-full overflow-y-auto flex-shrink-0">
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
                    plotSideFront={project?.plot_side_front}
                    plotSideBack={project?.plot_side_back}
                    plotSideLeft={project?.plot_side_left}
                    plotSideRight={project?.plot_side_right}
                    plotDiagonal={project?.plot_diagonal}
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
                    isManualMode={isManualMode}
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
            }
          />
        ) : (
          <div className="flex-1 flex h-full min-h-0">
            <div className="flex-1 bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
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
                      45 Energy Zones
                    </span>
                  )}
                  {showGrid.zone16 && (
                    <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow">
                      16 Zones
                    </span>
                  )}
                  {showGrid.zone8 && (
                    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded shadow">
                      8 Directions
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
            <div className="h-full overflow-y-auto flex-shrink-0">
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
                plotSideFront={project?.plot_side_front}
                plotSideBack={project?.plot_side_back}
                plotSideLeft={project?.plot_side_left}
                plotSideRight={project?.plot_side_right}
                plotDiagonal={project?.plot_diagonal}
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
                isManualMode={isManualMode}
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
                walls={walls}
                onAddWall={handleAddWall}
                onUpdateWall={handleUpdateWall}
                onDeleteWall={handleDeleteWall}
                selectedWall={selectedWall}
                onSelectWall={setSelectedWall}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}