import { useState, useEffect } from "react";
import { Point, PlacedObject, DevtaRegion, MarmaPoint } from "@/lib/floorPlanInterfaces";

interface AnalysisResponse {
  devtas45: DevtaRegion[];
  zones16: DevtaRegion[];
  zones8: DevtaRegion[];
}

export function useFloorPlanAnalysis(
    boundary: Point[], 
    placedObjects: PlacedObject[], 
    northDirection: number
) {
    const [devtaRegions, setDevtaRegions] = useState<DevtaRegion[]>([]);
    const [zones16, setZones16] = useState<DevtaRegion[]>([]);
    const [zones8, setZones8] = useState<DevtaRegion[]>([]);
    const [marmas, setMarmas] = useState<MarmaPoint[]>([]);
    const [objectAnalyses, setObjectAnalyses] = useState<any[]>([]);
    const [analysisMode, setAnalysisMode] = useState(false);

    useEffect(() => {
        if (boundary.length < 3) {
            setDevtaRegions([]);
            setZones16([]);
            setZones8([]);
            return;
        }

        const fetchAnalysis = async () => {
            const response = await fetch("/api/analysis/devta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    boundary_normalized: boundary,
                    north_direction: northDirection,
                    objects: placedObjects
                })
            });
            if (!response.ok) {
                throw new Error("Failed to fetch floor plan analysis");
            }
            return response.json() as Promise<AnalysisResponse>;
        };

        fetchAnalysis().then(data => {
            setDevtaRegions(data.devtas45 || []);
            setZones16(data.zones16 || []);
            setZones8(data.zones8 || []);
        }).catch(err => {
            console.error("Analysis fetch failed", err);
            setDevtaRegions([]);
            setZones16([]);
            setZones8([]);
        });

    }, [boundary, northDirection, placedObjects.length]); 

    return {
        devtaRegions,
        zones16,
        zones8,
        marmas,
        objectAnalyses,
        analysisMode,
        setAnalysisMode
    };
}
