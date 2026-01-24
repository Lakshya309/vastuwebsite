// hooks/useFloorPlanAnalysis.ts
import { useEffect, useState } from "react";
import {
  PlacedObject,
} from "@/lib/floorPlanInterfaces";
import { Point } from "@/lib/coordinates";
import { generateMarmaPoints, MarmaPoint } from "@/lib/vastu/marmaAnalysis";
import {
  analyzeObjectPlacement,
  ObjectAnalysisResult,
} from "@/lib/vastu/objectAnalysis";

interface UseFloorPlanAnalysisResult {
  marmas: MarmaPoint[];
  objectAnalyses: Record<string, ObjectAnalysisResult>;
}

export function useFloorPlanAnalysis(
  boundary: Point[],
  placedObjects: PlacedObject[],
  liveNorthDirection: number,
): UseFloorPlanAnalysisResult {
  const [marmas, setMarmas] = useState<MarmaPoint[]>([]);
  const [objectAnalyses, setObjectAnalyses] = useState<
    Record<string, ObjectAnalysisResult>
  >({});

  // --- CORE REAL-TIME ANALYSIS ENGINE ---
  useEffect(() => {
    if (boundary.length < 3) {
      setMarmas([]);
      setObjectAnalyses({});
      return;
    }

    // 2. Generate Marma points (still allowed to use north direction)
    const newMarmas = generateMarmaPoints(boundary, liveNorthDirection);
    setMarmas(newMarmas);

    // 3. Analyze placed objects against Marma geometry
    const newAnalyses: Record<string, ObjectAnalysisResult> = {};

    for (const obj of placedObjects) {
      newAnalyses[obj.id] = analyzeObjectPlacement(
        obj.boundary_normalized,
        obj.object_type,
        newMarmas,
        boundary,
        liveNorthDirection,
      );
    }

    setObjectAnalyses(newAnalyses);
  }, [boundary, placedObjects, liveNorthDirection]);

  return {
    marmas,
    objectAnalyses,
  };
}
