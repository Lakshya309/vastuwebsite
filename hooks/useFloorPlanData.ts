// hooks/useFloorPlanData.ts
import { useState, useEffect, useCallback } from "react";
import { ProjectData, PlacedObject, Point } from "@/lib/floorPlanInterfaces";

export function useFloorPlanData(projectId: string, refreshKey: number) {
  // State
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable State (Local UI state before saving)
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);
  const [boundary, setBoundary] = useState<Point[]>([]);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [liveNorthDirection, setLiveNorthDirection] = useState(0);

  // 1. Fetch Project Data on Mount
  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        // Replace this URL with your actual API endpoint
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Failed to load project");
        
        const { project } = await res.json();
        
        // Hydrate state
        setProject(project);
        setFloorPlanImage(project.floor_plan_path || null);
        setBoundary(project.boundary_normalized || []);
        setLiveNorthDirection(project.north_direction || 0);
        setPlacedObjects(project.placed_objects || []);

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, refreshKey]);

  return {
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
  };
}