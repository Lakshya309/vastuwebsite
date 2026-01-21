// hooks/useFloorPlanData.ts
import { useEffect, useState } from "react";
import { useProjectStore } from "../lib/store/projectStore";
import { PlacedObject, Project } from "../lib/floorPlanInterfaces";
import { Point } from "../lib/coordinates";

interface UseFloorPlanDataResult {
  project: Project | null;
  loading: boolean;
  error: string | null;
  floorPlanImage: string | null;
  setFloorPlanImage: (url: string | null) => void;
  boundary: Point[];
  setBoundary: (boundary: Point[]) => void;
  placedObjects: PlacedObject[];
  setPlacedObjects: (objects: PlacedObject[]) => void;
  liveNorthDirection: number;
  setLiveNorthDirection: (direction: number) => void;
}

export function useFloorPlanData(projectId: string): UseFloorPlanDataResult {
  const { liveNorthDirection, setLiveNorthDirection } = useProjectStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);
  const [boundary, setBoundary] = useState<Point[]>([]);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectAndObjects = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (projectResponse.status === 401) {
          throw new Error("Unauthorized");
        }
        if (!projectResponse.ok) {
          throw new Error("Failed to fetch project data.");
        }

        const projectData = await projectResponse.json();
        const project = projectData.project;

        setProject(project);
        setFloorPlanImage(project.floor_plan_path);

        if (project.boundary_normalized) {
          setBoundary(project.boundary_normalized);
        }

        if (project.north_direction !== null) {
          setLiveNorthDirection(project.north_direction);
        }

        // Fetch project objects
        const objectsResponse = await fetch(
          `/api/projects/${projectId}/objects`
        );

        if (!objectsResponse.ok) {
          throw new Error("Failed to fetch objects.");
        }

        const objectsData = await objectsResponse.json();
        setPlacedObjects(objectsData.objects);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndObjects();
  }, [projectId, setLiveNorthDirection]);

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