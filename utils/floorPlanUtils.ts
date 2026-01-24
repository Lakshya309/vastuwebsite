// utils/floorPlanUtils.ts
import { Point, toPixels } from "../lib/coordinates";
import { calculateCentroid, rayPolygonIntersection, getAABB } from "../lib/geometry";
import { MarmaPoint } from "@/lib/vastu/marmaAnalysis"; 
import { ObjectAnalysisResult } from "@/lib/vastu/objectAnalysis";
import { ZoneDivision } from "../lib/floorPlanInterfaces";
import { PlacedObject } from "../lib/floorPlanInterfaces";

export const drawBoundary = (
  ctx: CanvasRenderingContext2D,
  boundary: Point[],
  dims: { width: number; height: number },
) => {
// ... keep the rest of the file
  const pixelBoundary = boundary.map((p: Point) => toPixels(p, dims));
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pixelBoundary[0].x, pixelBoundary[0].y);
  for (let i = 1; i < pixelBoundary.length; i++) {
    ctx.lineTo(pixelBoundary[i].x, pixelBoundary[i].y);
  }
  ctx.closePath();
  ctx.stroke();
};

export const drawIncompleteBoundary = (
  ctx: CanvasRenderingContext2D,
  boundary: Point[],
  dims: { width: number; height: number },
  color = "#1f2937",
) => {
  const pixelBoundary = boundary.map((p: Point) => toPixels(p, dims));
  ctx.fillStyle = color;
  pixelBoundary.forEach((p: Point) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
    ctx.fill();
  });
  if (pixelBoundary.length > 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pixelBoundary[0].x, pixelBoundary[0].y);
    for (let i = 1; i < pixelBoundary.length; i++) {
      ctx.lineTo(pixelBoundary[i].x, pixelBoundary[i].y);
    }
    ctx.stroke();
  }
};

export const drawBrahmasthan = (
  ctx: CanvasRenderingContext2D,
  centroid: Point,
  dims: { width: number; height: number },
) => {
  const pixelCentroid = toPixels(centroid, dims);
  ctx.fillStyle = "rgba(255, 215, 0, 0.25)"; // Gold
  ctx.beginPath();
  ctx.arc(pixelCentroid.x, pixelCentroid.y, 10, 0, 2 * Math.PI);
  ctx.fill();
};

export const drawNorthLine = (
  ctx: CanvasRenderingContext2D,
  centroid: Point,
  north: number,
  dims: { width: number; height: number },
) => {
  const pixelCentroid = toPixels(centroid, dims);
  const lineLength = 50;
  const angleRad = (north - 90) * (Math.PI / 180);
  const endX = pixelCentroid.x + lineLength * Math.cos(angleRad);
  const endY = pixelCentroid.y + lineLength * Math.sin(angleRad);
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pixelCentroid.x, pixelCentroid.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.fillStyle = "#374151";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "N",
    endX + 15 * Math.cos(angleRad),
    endY + 15 * Math.sin(angleRad),
  );
};

export const drawMarmas = (
  ctx: CanvasRenderingContext2D,
  marmas: MarmaPoint[],
  dims: { width: number; height: number },
) => {
  const marmaColors: Record<MarmaPoint["strength"], string> = {
    high: "#f87171", // Red
    medium: "#fb923c", // Orange
    low: "#4ade80", // Green
  };
  marmas.forEach((marma) => {
    const p = toPixels(marma.point, dims);
    const color = marmaColors[marma.strength];
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, 2 * Math.PI);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
};

export const drawMarmaTooltip = (
  ctx: CanvasRenderingContext2D,
  marma: MarmaPoint,
  dims: { width: number; height: number },
) => {
  const p = toPixels(marma.point, dims);
  const text = `Marma: ${marma.angleDeg}° (${marma.strength})`;
  ctx.font = "12px sans-serif";
  const textWidth = ctx.measureText(text).width;
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(p.x + 10, p.y - 20, textWidth + 10, 25);
  ctx.fillStyle = "white";
  ctx.fillText(text, p.x + 15, p.y - 5);
};

export const drawZoneLines = (
  ctx: CanvasRenderingContext2D,
  divisions: ZoneDivision,
  centroid: Point,
  boundary: Point[],
  north: number,
  dims: { width: number; height: number },
) => {
  if (divisions === 0) return;
  const pixelCentroid = toPixels(centroid, dims);
  const angleStep = 360 / divisions;
  ctx.strokeStyle = "rgba(75, 85, 99, 0.3)";
  ctx.lineWidth = 1;
  for (let i = 0; i < divisions; i++) {
    const angle = (north + i * angleStep) % 360;
    const endPoint = rayPolygonIntersection(angle, boundary, centroid);
    if (endPoint) {
      const pixelEnd = toPixels(endPoint, dims);
      ctx.beginPath();
      ctx.moveTo(pixelCentroid.x, pixelCentroid.y);
      ctx.lineTo(pixelEnd.x, pixelEnd.y);
      ctx.stroke();
    }
  }
};



export const drawPlacedObjects = (
  ctx: CanvasRenderingContext2D,
  objects: PlacedObject[],
  selected: PlacedObject | null,
  dims: { width: number; height: number },
) => {
  objects.forEach((obj) => {
    const pixelBoundary = obj.boundary_normalized.map((p: Point) =>
      toPixels(p, dims)
    );
    const isSelected = selected?.id === obj.id;
    ctx.fillStyle = "rgba(55, 65, 81, 0.5)"; // semi-transparent slate
    ctx.strokeStyle = isSelected ? "#0ea5e9" : "#374151"; // highlight if selected
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(pixelBoundary[0].x, pixelBoundary[0].y);
    for (let i = 1; i < pixelBoundary.length; i++) {
      ctx.lineTo(pixelBoundary[i].x, pixelBoundary[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const pixelCentroid = toPixels(obj.centroid, dims);
    ctx.fillStyle = "white";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(obj.object_type, pixelCentroid.x, pixelCentroid.y);
  });
};

export const drawObjectAnalysis = (
  ctx: CanvasRenderingContext2D,
  obj: PlacedObject,
  analysis: ObjectAnalysisResult,
  dims: { width: number; height: number },
) => {
  const p = toPixels(obj.centroid, dims);
  const lines = [
    `Object: ${obj.object_type}`,
  ];
  if (analysis.closestMarma) {
    lines.push(
      `Marma: ${analysis.closestMarma.angleDeg}° (${analysis.marmaStrength})`,
    );
    lines.push(`Dist: ${analysis.marmaDistance?.toFixed(2)} units`);
    const marmaPixel = toPixels(analysis.closestMarma.point, dims);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(marmaPixel.x, marmaPixel.y);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    lines.push("No influential Marma nearby.");
  }

  ctx.font = "13px sans-serif";
  const width = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 20;
  const height = lines.length * 18 + 10;
  const x = p.x + 15;
  const y = p.y - 15;

  ctx.fillStyle = "rgba(249, 250, 251, 0.9)"; // Light background
  ctx.strokeStyle = "rgba(209, 213, 219, 1)"; // Light border
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = "#1f2937"; // Dark text
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach((line, i) => {
    ctx.fillText(line, x + 10, y + 8 + i * 18);
  });
};
