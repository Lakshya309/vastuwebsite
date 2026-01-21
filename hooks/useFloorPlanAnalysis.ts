// hooks/useFloorPlanAnalysis.ts
import { useEffect, useState } from "react";
import { PlacedObject, ZoneDivision, FloorPlanAnalysisData } from "../lib/floorPlanInterfaces";
import { Point } from "../lib/coordinates";
import { DevtaRegion, generate45Devtas } from "../lib/vastu/devtaAnalysis";
import { generateMarmaPoints, MarmaPoint } from "../lib/vastu/marmaAnalysis";
import { analyzeObjectPlacement, ObjectAnalysisResult } from "../lib/vastu/objectAnalysis";

interface UseFloorPlanAnalysisResult extends FloorPlanAnalysisData {
  setAnalysisMode: (mode: "concentric" | "zones-8" | "zones-16" | "zones-32" | "none") => void;
  analysisMode: "concentric" | "zones-8" | "zones-16" | "zones-32" | "none";
  marmas: MarmaPoint[];
}

export function useFloorPlanAnalysis(
  boundary: Point[],
  placedObjects: PlacedObject[],
  liveNorthDirection: number
): UseFloorPlanAnalysisResult {
  const [devtaRegions, setDevtaRegions] = useState<DevtaRegion[] | null>(null);
  const [marmas, setMarmas] = useState<MarmaPoint[]>([]);
  const [objectAnalyses, setObjectAnalyses] = useState<Record<string, ObjectAnalysisResult>>({});
  const [analysisMode, setAnalysisMode] = useState<"concentric" | "zones-8" | "zones-16" | "zones-32" | "none">("concentric");


  // --- CORE REAL-TIME ANALYSIS ENGINE ---
  useEffect(() => {
    if (boundary.length < 3) {
      setDevtaRegions(null);
      setMarmas([]);
      setObjectAnalyses({});
      return;
    }

    // 1. Recalculate Vastu grids based on liveNorthDirection
    const newDevtas = generate45Devtas(boundary, liveNorthDirection) || [];
    setDevtaRegions(newDevtas);
    const newMarmas = generateMarmaPoints(boundary, liveNorthDirection);
    setMarmas(newMarmas);

    if (newDevtas.length === 0) {
      setObjectAnalyses({});
      return;
    }

    // 2. Recalculate analysis for all placed objects
    const newAnalyses: Record<string, ObjectAnalysisResult> = {};
    for (const obj of placedObjects) {
      newAnalyses[obj.id] = analyzeObjectPlacement(
        obj.boundary_normalized,
        obj.object_type,
        newDevtas,
        newMarmas,
        boundary,
        liveNorthDirection,
      );
    }
    setObjectAnalyses(newAnalyses);

  }, [liveNorthDirection, boundary, placedObjects]);

  return {
    devtaRegions,
    marmas,
    objectAnalyses,
    setAnalysisMode,
    analysisMode,
  };
}