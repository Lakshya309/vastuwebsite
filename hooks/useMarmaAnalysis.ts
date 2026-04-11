import { useState, useEffect } from "react";
import { Point } from "@/lib/floorPlanInterfaces";
import { getMarmaPoints } from "@/lib/marmaAnalysis";

export const useMarmaAnalysis = (
  analysisId: string | null,
  boundary: Point[] | null,
  plotCentroid: Point | null = null
) => {
  const [marmaData, setMarmaData] = useState<{
    marmaPoints: Point[];
    vanshaLines: Point[][];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!analysisId || !boundary || boundary.length < 3) {
      setMarmaData(null);
      return;
    }

    try {
      setIsLoading(true);
      const data = getMarmaPoints(boundary, plotCentroid);
      setMarmaData(data);
      setError(null);
    } catch (err: any) {
      console.error("Error computing marma points:", err);
      setError(err.message);
      setMarmaData(null);
    } finally {
      setIsLoading(false);
    }
  }, [analysisId, boundary, plotCentroid]);

  return { marmaData, isLoading, error };
};