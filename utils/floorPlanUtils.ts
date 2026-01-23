// utils/floorPlanUtils.ts
import { Point, toPixels } from "../lib/coordinates";
import { calculateCentroid, rayPolygonIntersection } from "../lib/geometry";
import {
  DevtaRegion
} from "../lib/vastu/devtaAnalysis";
import { MarmaPoint } from "@/lib/vastu/marmaAnalysis"; 
import { ObjectAnalysisResult } from "@/lib/vastu/objectAnalysis";
import { VastuRule } from "../lib/vastu/vastuRules";// Assuming DevtaRegion and MarmaPoint are also exported from vastuAnalysis or similar
import { DEVTA_COLORS } from "../lib/floorPlanConstants";
import { ZoneDivision } from "../lib/floorPlanInterfaces";
import { PlacedObject } from "../lib/floorPlanInterfaces";


// Re-export specific types if they were only used internally before
// export type { DevtaRegion, MarmaPoint, ObjectAnalysisResult, VastuRule }; // Removed this line

export const drawBoundary = (
  ctx: CanvasRenderingContext2D,
  boundary: Point[],
  dims: { width: number; height: number },
) => {
  const pixelBoundary = boundary.map((p) => toPixels(p, dims));
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
  const pixelBoundary = boundary.map((p) => toPixels(p, dims));
  ctx.fillStyle = color;
  pixelBoundary.forEach((p) => {
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

export const drawDevtaRegions = (
  ctx: CanvasRenderingContext2D,
  devtas: DevtaRegion[],
  dims: { width: number; height: number },
  selected: DevtaRegion | null,
) => {
  devtas.forEach((devta) => {
    const pixelPolygon = devta.polygon.map((p) => toPixels(p, dims));
    const isSelected = selected?.id === devta.id;

    let fillColor = DEVTA_COLORS[devta.name] || DEVTA_COLORS["default"];

    ctx.fillStyle = isSelected
      ? "rgba(255, 255, 255, 0.3)"
      : `${fillColor}33`; // 20% opacity
    ctx.strokeStyle = isSelected ? "#0ea5e9" : `${fillColor}80`; // 50% opacity
    ctx.lineWidth = isSelected ? 3 : 1;

    if (pixelPolygon.length > 0) {
      ctx.beginPath();
      ctx.moveTo(pixelPolygon[0].x, pixelPolygon[0].y);
      for (let i = 1; i < pixelPolygon.length; i++) {
        ctx.lineTo(pixelPolygon[i].x, pixelPolygon[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw Devta name
      const devtaCentroid = calculateCentroid(devta.polygon);
      const pixelDevtaCentroid = toPixels(devtaCentroid, dims);

      ctx.fillStyle = "rgba(31, 41, 55, 0.75)"; // Dark slate, semi-transparent
      ctx.font = devta.ring === "outer"
        ? "8px sans-serif"
        : "10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(devta.name, pixelDevtaCentroid.x, pixelDevtaCentroid.y);
    }
  });
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
    const pixelBoundary = obj.boundary_normalized.map((p) =>
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
    `Devta: ${analysis.devtaName}`,
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

  if (analysis.incorrectPoints.length > 0) {
    lines.push("");
    lines.push("Incorrect Placements:");
    analysis.incorrectPoints.forEach((ip) => {
      lines.push(`- Point in ${ip.devtaName}`);
      const pixelPoint = toPixels(ip.point, dims);
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(pixelPoint.x, pixelPoint.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
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

export const drawDevtaInfoBox = (
  ctx: CanvasRenderingContext2D,
  rule: VastuRule,
  dims: { width: number; height: number },
) => {
  const boxX = dims.width - 270; // Position on the right side
  const boxY = 20;
  const boxWidth = 250;
  let currentY = boxY;
  const padding = 15;
  const lineHeight = 18;
  const borderRadius = 10;

  const devtaColor = DEVTA_COLORS[rule.devtaName] || DEVTA_COLORS["default"];
  const textColor = "#1f2937"; // Dark text for readability

  // Calculate total height for the box
  const descriptionLines =
    ctx.measureText(rule.description).width > (boxWidth - 2 * padding)
      ? Math.ceil(
        ctx.measureText(rule.description).width / (boxWidth - 2 * padding),
      )
      : 1;
  const estimatedHeight = padding +
    lineHeight + // Devta Name
    lineHeight * descriptionLines + // Description
    lineHeight + // Empty line
    lineHeight + // Optimal header
    rule.optimal.length * lineHeight +
    lineHeight + // Empty line
    lineHeight + // Avoid header
    rule.avoid.length * lineHeight +
    padding;

  const boxHeight = estimatedHeight;

  // Draw card background with rounded corners and shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "#ffffff"; // White background
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, borderRadius);
  ctx.fill();
  ctx.shadowColor = "transparent"; // Reset shadow

  // Draw header with Devta color
  ctx.fillStyle = devtaColor;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, 35, [borderRadius, borderRadius, 0, 0]); // Top rounded corners
  ctx.fill();

  // Draw Devta Name in header
  currentY += padding;
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "white"; // White text for header
  ctx.fillText(`Devta: ${rule.devtaName}`, boxX + boxWidth / 2, currentY);

  currentY += 35 - padding + 5; // Move past header area, add some space

  // Draw description
  ctx.font = "italic 12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = textColor;
  // Basic text wrapping (can be improved)
  const words = rule.description.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > boxWidth - 2 * padding && n > 0) {
      ctx.fillText(`"${line.trim()}"`, boxX + padding, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(`"${line.trim()}"`, boxX + padding, currentY);
  currentY += lineHeight + 5;

  // Optimal section
  currentY += 5; // Extra space
  ctx.font = "bold 13px sans-serif";
  ctx.fillStyle = textColor;
  ctx.fillText("Optimal:", boxX + padding, currentY);
  currentY += lineHeight;
  ctx.font = "13px sans-serif";
  rule.optimal.forEach((s) => {
    ctx.fillText(`• ${s}`, boxX + padding + 10, currentY);
    currentY += lineHeight;
  });

  // Avoid section
  currentY += 5; // Extra space
  ctx.font = "bold 13px sans-serif";
  ctx.fillStyle = textColor;
  ctx.fillText("Avoid:", boxX + padding, currentY);
  currentY += lineHeight;
  ctx.font = "13px sans-serif";
  rule.avoid.forEach((s) => {
    ctx.fillText(`• ${s}`, boxX + padding + 10, currentY);
    currentY += lineHeight;
  });
};