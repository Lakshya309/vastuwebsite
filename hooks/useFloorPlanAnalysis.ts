import { useState, useCallback } from "react";
import { Point, PlacedObject, DevtaRegion, MarmaPoint } from "@/lib/floorPlanInterfaces";

// Define a new interface for the response from POST /api/analysis
interface CreateAnalysisResponse {
    analysisId: string;
    status: "pending" | "reviewed" | "completed" | "failed"; // Or other relevant status
}

// Define the interface for the detailed analysis results (e.g., devta analysis)
interface DetailedAnalysisResponse {
    devtas45: DevtaRegion[];
    zones16: DevtaRegion[];
    zones8: DevtaRegion[];
    plot_centroid: Point;
    // ... other analysis specific data
}

export function useFloorPlanAnalysis() {
    const [devtaRegions, setDevtaRegions] = useState<DevtaRegion[]>([]);
    const [zones16, setZones16] = useState<DevtaRegion[]>([]);
    const [zones8, setZones8] = useState<DevtaRegion[]>([]);
    const [plotCentroid, setPlotCentroid] = useState<Point | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null); // To store the created analysis ID

    const createAnalysisRequest = useCallback(async (
        projectId: string,
        analysisType: "devta" | "marma" | "full-report",
        boundary: Point[],
        northDirection: number,
        analysisDate?: string,
        analysisTime?: string
    ): Promise<string | undefined> => {
        if (boundary.length < 3) {
            setError("Boundary must have at least 3 points.");
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setCurrentAnalysisId(null); // Reset analysisId

        try {
            const requestBody = {
                projectId,
                analysisType,
                boundary_normalized: boundary,
                north_direction: northDirection,
                analysisDate,
                analysisTime,
            };
            // 1. Create a new analysis record (deduct credits)
            const createResponse = await fetch("/api/analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                console.error("Failed to create analysis record:", errorData);
                throw new Error(errorData.message || "Failed to create analysis record.");
            }

            const { analysisId: newAnalysisId }: CreateAnalysisResponse = await createResponse.json();
            setCurrentAnalysisId(newAnalysisId); // Store the new analysis ID

            // At this point, the analysis record is created and credits are deducted.
            // The actual detailed analysis (devta, marma, full-report) will be
            // triggered only *after* this initial record is approved.
            // Clear previous results as they are no longer valid for the pending analysis
            setDevtaRegions([]);
            setZones16([]);
            setZones8([]);

            return newAnalysisId;

        } catch (err: any) {
            console.error("Analysis creation failed", err);
            setError(err.message);
            return;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    // A new function to fetch the results for an *approved* analysis
    const fetchDetailedAnalysisResults = useCallback(async (
        analysisId: string,
        analysisType: "devta" | "marma" | "full-report",
        gridType: "81" | "64" = "81"
    ) => {
        setIsAnalyzing(true);
        setError(null);

        try {
            let endpoint = "";
            switch (analysisType) {
                case "devta":
                    endpoint = `/api/analysis/devta?analysisId=${analysisId}&gridType=${gridType}`;
                    break;
                case "marma":
                    endpoint = `/api/analysis/marma?analysisId=${analysisId}&gridType=${gridType}`;
                    break;
                case "full-report":
                    endpoint = `/api/analysis/full-report?analysisId=${analysisId}&gridType=${gridType}`;
                    break;
                default:
                    throw new Error("Invalid analysis type.");
            }

            const response = await fetch(endpoint, {
                method: "GET", // Assuming GET for fetching results of an existing analysis
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch ${analysisType} analysis results.`);
            }

            const data: DetailedAnalysisResponse = await response.json();
            // Assuming data structure is consistent enough for now.
            // Further refinement might be needed if each type returns vastly different shapes.
            setDevtaRegions(data.devtas45 || []);
            setZones16(data.zones16 || []);
            setZones8(data.zones8 || []);
            setPlotCentroid(data.plot_centroid || null);

        } catch (err: any) {
            console.error(`Fetching ${analysisType} analysis failed`, err);
            setError(err.message);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);


    return {
        devtaRegions,
        zones16,
        zones8,
        plotCentroid,
        isAnalyzing,
        error,
        createAnalysisRequest, // For initiating the request
        fetchDetailedAnalysisResults, // For fetching results after approval
        currentAnalysisId, // The ID of the created analysis
    };
}