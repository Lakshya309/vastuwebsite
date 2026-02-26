import { useState, useEffect } from "react";
import { Point } from "@/lib/floorPlanInterfaces";

export const useMarmaAnalysis = (analysisId: string | null) => { // Accept analysisId as a prop
  const [marmaData, setMarmaData] = useState<{
    marmaPoints: Point[];
    vanshaLines: Point[][];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!analysisId) { // Only fetch if analysisId is present
      setMarmaData(null);
      return;
    }

    const fetchMarmaData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/analysis/marma?analysisId=${analysisId}`, { // Use GET with analysisId
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch marma analysis results");
        }

        const data = await response.json();
        setMarmaData(data);
      } catch (err: any) {
        console.error("Error fetching marma data:", err);
        setError(err.message);
        setMarmaData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarmaData();
  }, [analysisId]); // Dependency is analysisId

  return { marmaData, isLoading, error };
};