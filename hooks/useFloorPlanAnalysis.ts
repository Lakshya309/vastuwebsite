// hooks/useFloorPlanAnalysis.ts
import { useState, useCallback } from "react";
import { Point, PlacedObject, DevtaRegion, MarmaPoint } from "@/lib/floorPlanInterfaces";

interface AnalysisResponse {
  devtas45: DevtaRegion[];
  zones16: DevtaRegion[];
  zones8: DevtaRegion[];
}

export function useFloorPlanAnalysis() {
    const [devtaRegions, setDevtaRegions] = useState<DevtaRegion[]>([]);
    const [zones16, setZones16] = useState<DevtaRegion[]>([]);
    const [zones8, setZones8] = useState<DevtaRegion[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runAnalysis = useCallback(async (
        boundary: Point[], 
        northDirection: number
    ) => {
        if (boundary.length < 3) {
            setDevtaRegions([]);
            setZones16([]);
            setZones8([]);
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await fetch("/api/analysis/devta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    boundary_normalized: boundary,
                    north_direction: northDirection,
                })
            });

            if (!response.ok) {
                throw new Error("Failed to fetch floor plan analysis");
            }

            const data: AnalysisResponse = await response.json();
            setDevtaRegions(data.devtas45 || []);
            setZones16(data.zones16 || []);
            setZones8(data.zones8 || []);
        } catch (err: any) {
            console.error("Analysis fetch failed", err);
            setError(err.message);
            setDevtaRegions([]);
            setZones16([]);
            setZones8([]);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    return {
        devtaRegions,
        zones16,
        zones8,
        isAnalyzing,
        error,
        runAnalysis
    };
}