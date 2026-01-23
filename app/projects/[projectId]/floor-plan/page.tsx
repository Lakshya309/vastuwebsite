// app/projects/[projectId]/floor-plan/page.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useFloorPlanData } from "../../../../hooks/useFloorPlanData";
import { useFloorPlanAnalysis } from "../../../../hooks/useFloorPlanAnalysis";
import { FloorPlanCanvas } from "../../../../components/floor-plan/FloorPlanCanvas";
import { ControlPanel } from "../../../../components/floor-plan/ControlPanel";
import { PlacedObject } from "../../../../lib/floorPlanInterfaces";
import { calculateCentroid } from "../../../../lib/geometry";
import { Point } from "@/lib/coordinates";
import { MarmaPoint } from "@/lib/vastu/marmaAnalysis";
import { DevtaRegion } from "../../../../lib/floorPlanInterfaces";

export default function FloorPlanPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  // Data Management Hook
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
  } = useFloorPlanData(projectId);

  // State for drawing new objects
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [objectsToDelete, setObjectsToDelete] = useState<string[]>([]);
  const [drawingObjectBoundary, setDrawingObjectBoundary] = useState<Point[]>(
    [],
  );
  const [drawingMode, setDrawingMode] = useState<"boundary" | "objects" | "select">(
    "boundary",
  );
  const [selectedObjectType, setSelectedObjectType] = useState<string>(
    "Bed", // Default to the first available object
  );

  // Analysis Management Hook
  const {
    devtaRegions,
    marmas,
    objectAnalyses,
    analysisMode,
    setAnalysisMode,
  } = useFloorPlanAnalysis(boundary, placedObjects, liveNorthDirection);

  // UI state for selections
  const [hoveredMarma, setHoveredMarma] = useState<MarmaPoint | null>(null);
  const [selectedObject, setSelectedObject] = useState<PlacedObject | null>(
    null,
  );
  const [selectedDevta, setSelectedDevta] = useState<DevtaRegion | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  // NEW: Handle image upload logic, including API call
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);

      // Display the image immediately
      const reader = new FileReader();
      reader.onload = (e) => setFloorPlanImage(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image.");
        }

        const data = await response.json();
        setFloorPlanImage(data.url); // Update with the persistent URL from the backend
      } catch (err: any) {
        console.error("Image upload error:", err);
        // setError(err.message); // Handle error display
      }
    }
  };


  const handleSaveChanges = async () => {
    if (!projectId) {
      // setError("Project ID missing or user not authenticated."); // Handle error display
      return;
    }
    // setLoading(true); // Loading state is now managed by useFloorPlanData, but we can have a local one for save action
    // setError(null); // Clear previous errors

    try {
      // 1. Save North Direction and main boundary
      const projectUpdateResponse = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boundary_normalized: boundary,
          north_direction: liveNorthDirection,
        }),
      });

      if (!projectUpdateResponse.ok) {
        throw new Error("Failed to save project settings (North direction).");
      }

      // 2. Save object geometry changes (creations/deletions)
      const newObjects = placedObjects.filter((obj) =>
        obj.id.startsWith("T")
      ); // Temporary IDs are timestamps

      const response = await fetch(`/api/projects/${projectId}/objects/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objectsToSave: newObjects,
          objectsToDelete: objectsToDelete,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to save object configuration.",
        );
      }

      const { objects: savedObjects } = await response.json();
      setPlacedObjects(savedObjects); // Refresh local objects with ones from DB (with real UUIDs)
      setObjectsToDelete([]); // Clear the delete list
      alert("Configuration saved successfully!");
    } catch (err: any) {
      console.error("Error during configuration save:", err);
      // setError(err.message); // Handle error display
    } finally {
      // setLoading(false); // Reset loading state
    }
  };

  const handleAddObject = () => {
    if (drawingObjectBoundary.length < 3) {
      alert("Please draw an object with at least 3 points.");
      return;
    }
    if (!projectId) {
      alert("Project not loaded correctly.");
      return;
    }

    // Create the object with only its geometric data.
    const newObjectData: PlacedObject = {
      id: `T${new Date().getTime()}`, // Temporary ID for local state
      project_id: projectId,
      object_type: selectedObjectType,
      boundary_normalized: drawingObjectBoundary,
      centroid: calculateCentroid(drawingObjectBoundary),
    };
    setPlacedObjects([...placedObjects, newObjectData]);
    setDrawingObjectBoundary([]);
  };

  const handleResetObjects = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all objects? This will permanently delete them from the database.",
      )
    ) {
      return;
    }

    if (!projectId) {
      // setError("Cannot reset objects: missing project ID or authentication token."); // Handle error display
      return;
    }

    // setLoading(true); // Loading state
    // setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/objects`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset objects.");
      }

      setPlacedObjects([]);
      setObjectsToDelete([]);
      setSelectedObject(null);
      alert("All objects have been reset.");
    } catch (err: any) {
      // setError(err.message);
    } finally {
      // setLoading(false);
    }
  };

  const handleDeleteObject = (objectId: string) => {
    // If the object has a real UUID (not a temporary one), mark it for deletion from DB
    if (!objectId.startsWith("T")) {
      setObjectsToDelete([...objectsToDelete, objectId]);
    }
    setPlacedObjects(placedObjects.filter((obj) => obj.id !== objectId));
    setSelectedObject(null);
  };

  // Function to run the Vastu analysis
  const handleRunAnalysis = async (projectId: string, objects: PlacedObject[]) => {
    if (objects.length === 0) {
      throw new Error("Cannot run analysis with no placed objects.");
    }

    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, objects }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to run analysis.");
      }

      const data = await response.json();
      console.log("Analysis successful:", data);
      // Optionally, you might want to refresh analysis data or navigate to report
      // For now, a successful call means credit was consumed if applicable.
    } catch (err: any) {
      console.error("Error during analysis run:", err);
      throw err; // Re-throw to be caught by ControlPanel's handleRunAnalysisClick
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <h1 className="text-4xl font-bold mb-4">
        Project: {project?.name} - Floor Plan
      </h1>
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link href={`/projects/${projectId}`}>Overview</Link>
          <Link href={`/projects/${projectId}/floor-plan`}>Floor Plan</Link>
          <Link href={`/projects/${projectId}/report`}>Report</Link>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm">
          <FloorPlanCanvas
            floorPlanImage={floorPlanImage}
            boundary={boundary}
            placedObjects={placedObjects}
            drawingObjectBoundary={drawingObjectBoundary}
            drawingMode={drawingMode}
            selectedObject={selectedObject}
            selectedDevta={selectedDevta}
            hoveredMarma={hoveredMarma}
            analysisMode={analysisMode}
            imageRef={imageRef}
            canvasRef={canvasRef}
            devtaRegions={devtaRegions}
            marmas={marmas}
            objectAnalyses={objectAnalyses}
            setBoundary={setBoundary}
            setDrawingObjectBoundary={setDrawingObjectBoundary}
            setPlacedObjects={setPlacedObjects}
            setSelectedObject={setSelectedObject}
            setSelectedDevta={setSelectedDevta}
            setHoveredMarma={setHoveredMarma}
          />
        </div>

        <ControlPanel
          projectId={projectId}
          projectName={project?.name}
          error={error}
          loading={loading}
          liveNorthDirection={liveNorthDirection}
          setLiveNorthDirection={setLiveNorthDirection}
          selectedFile={selectedFile}
          handleImageUpload={handleImageUpload}
          drawingMode={drawingMode}
          setDrawingMode={setDrawingMode}
          boundary={boundary}
          setBoundary={setBoundary}
          selectedObjectType={selectedObjectType}
          setSelectedObjectType={setSelectedObjectType}
          handleAddObject={handleAddObject}
          handleResetObjects={handleResetObjects}
          handleSaveChanges={handleSaveChanges}
          selectedObject={selectedObject}
          handleDeleteObject={handleDeleteObject}
          analysisMode={analysisMode}
          setAnalysisMode={setAnalysisMode}
          onRunAnalysis={handleRunAnalysis} // Pass the new function
          placedObjects={placedObjects} // Pass placedObjects
        />
      </div>
    </div>
  );
}