import { useState, useEffect } from "react";
import { Point } from "@/lib/floorPlanInterfaces";

export const useMarmaAnalysis = (boundary: Point[]) => {
  const [marmaData, setMarmaData] = useState<{
    marmaPoints: Point[];
    vanshaLines: Point[][];
  } | null>(null);

  useEffect(() => {
    if (boundary.length > 2) {
      const fetchMarmaData = async () => {
        try {
          const response = await fetch("/api/analysis/marma", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ boundary }),
          });
          const data = await response.json();
          setMarmaData(data);
        } catch (error) {
          console.error("Error fetching marma data:", error);
        }
      };

      fetchMarmaData();
    }
  }, [boundary]);

  return marmaData;
};