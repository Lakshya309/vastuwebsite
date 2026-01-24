"use client";

import React, { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { useFloorPlanData } from "../../../../hooks/useFloorPlanData";
import { useFloorPlanAnalysis } from "../../../../hooks/useFloorPlanAnalysis";
import { FloorPlanCanvas } from "../../../../components/floor-plan/FloorPlanCanvas";
import { ControlPanel } from "../../../../components/floor-plan/ControlPanel";

import { PlacedObject } from "../../../../lib/floorPlanInterfaces";
import { Point } from "../../../../lib/geometry";
import { MarmaPoint } from "@/lib/vastu/marmaAnalysis";

/* =========================================================
   Helpers
========================================================= */

function averagePoint(points: Point[]): Point {
  let x = 0, y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return {
    x: x / points.length,
    y: y / points.length,
  };
}

/* =========================================================
   Page
========================================================= */

export default function FloorPlanPage() {
  const { projectId } = useParams() as { projectId: string };

  /* ---------------- Data ---------------- */

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

  const {
    marmas,
    objectAnalyses,
  } = useFloorPlanAnalysis(boundary, placedObjects, liveNorthDirection);

  /* ---------------- UI State ---------------- */

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [objectsToDelete, setObjectsToDelete] = useState<string[]>([]);
  const [drawingObjectBoundary, setDrawingObjectBoundary] = useState<Point[]>([]);
  const [drawingMode, setDrawingMode] =
    useState<"boundary" | "objects" | "select">("boundary");

  const [selectedObjectType, setSelectedObjectType] = useState("Bed");

  const [hoveredMarma, setHoveredMarma] = useState<MarmaPoint | null>(null);
  const [selectedObject, setSelectedObject] =
    useState<PlacedObject | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* =========================================================
     Image Upload
  ========================================================= */

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) =>
      setFloorPlanImage(e.target?.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      setFloorPlanImage(data.url);
    }
  };

  /* =========================================================
     Object Handling
  ========================================================= */

  const handleAddObject = () => {
    if (drawingObjectBoundary.length < 3) {
      alert("Object must have at least 3 points.");
      return;
    }

    const newObject: PlacedObject = {
      id: `T${Date.now()}`,
      project_id: projectId,
      object_type: selectedObjectType,
      boundary_normalized: drawingObjectBoundary,
      centroid: averagePoint(drawingObjectBoundary), // lightweight, safe
    };

    setPlacedObjects([...placedObjects, newObject]);
    setDrawingObjectBoundary([]);
  };

  const handleDeleteObject = (id: string) => {
    if (!id.startsWith("T")) {
      setObjectsToDelete([...objectsToDelete, id]);
    }
    setPlacedObjects(placedObjects.filter(o => o.id !== id));
    setSelectedObject(null);
  };

  /* =========================================================
     Save
  ========================================================= */

  const handleSaveChanges = async () => {
    await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boundary_normalized: boundary,
        north_direction: liveNorthDirection,
      }),
    });

    await fetch(`/api/projects/${projectId}/objects/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objectsToSave: placedObjects.filter(o => o.id.startsWith("T")),
        objectsToDelete,
      }),
    });

    setObjectsToDelete([]);
    alert("Saved successfully");
  };

  /* =========================================================
     Analysis
  ========================================================= */

  const handleRunAnalysis = async (
    projectId: string,
    objects: PlacedObject[],
  ) => {
    if (!project || !project.boundary_normalized) {
      throw new Error("Project boundary is not defined.");
    }
    const response = await fetch("/api/analysis/devta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        boundary_normalized: project.boundary_normalized,
        north_direction: liveNorthDirection,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to run devta analysis.");
    }
    // Optionally, handle the successful response, e.g., display a success message
  };

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-4">
        {project?.name} – Floor Plan
      </h1>

      <nav className="mb-8 flex gap-6">
        <Link href={`/projects/${projectId}`}>Overview</Link>
        <Link href={`/projects/${projectId}/floor-plan`}>Floor Plan</Link>
        <Link href={`/projects/${projectId}/report`}>Report</Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
          <FloorPlanCanvas
            floorPlanImage={floorPlanImage}
            boundary={boundary}
            placedObjects={placedObjects}
            drawingObjectBoundary={drawingObjectBoundary}
            drawingMode={drawingMode}
            selectedObject={selectedObject}
            hoveredMarma={hoveredMarma}
            imageRef={imageRef}
            canvasRef={canvasRef}
            marmas={marmas}
            objectAnalyses={objectAnalyses}
            setBoundary={setBoundary}
            setDrawingObjectBoundary={setDrawingObjectBoundary}
            setPlacedObjects={setPlacedObjects}
            setSelectedObject={setSelectedObject}
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
          handleResetObjects={async () => {
            setPlacedObjects([]);
          }}
          handleSaveChanges={handleSaveChanges}
          selectedObject={selectedObject}
          handleDeleteObject={handleDeleteObject}
          onRunAnalysis={handleRunAnalysis}
          placedObjects={placedObjects}
        />
      </div>
    </div>
  );
}
