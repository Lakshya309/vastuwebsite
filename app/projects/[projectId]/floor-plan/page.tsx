"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import AuthGuard from "../../../../components/AuthGuard";
import Link from "next/link";
import { useAuthStore } from "../../../../lib/store/authStore";
import { useProjectStore } from "../../../../lib/store/projectStore"; // Import the new project store
import {
  getEventPixelPosition,
  Point,
  toNormalized,
  toPixels,
} from "../../../../lib/coordinates";
import {
  calculateCentroid,
  pointInPolygon,
  rayPolygonIntersection,
} from "../../../../lib/geometry";
import {
  DevtaAnalysisResult,
  analyzePlot,
  getDevtaForObject,
  ClippedDevta,
} from "../../../../lib/vastu/devtaAnalysis";
import { useSupabase } from "../../../../components/SupabaseProvider";
import {
  generateTransformedMarmaPoints,
  MarmaPoint,
  ClosestMarmaResult,
} from "../../../../lib/vastu/marmaAnalysis";
import {
  analyzeObjectPlacement,
  ObjectAnalysisResult,
} from "../../../../lib/vastu/objectAnalysis";
import { VastuRule, vastuRules } from "../../../../lib/vastu/vastuRules";

interface Project {
  id: string;
  name: string;
  floor_plan_url: string | null;
  boundary_normalized: Point[] | null;
  north_direction: number | null;
}

// The PlacedObject interface is now purely geometric.
interface PlacedObject {
  id: string; // Can be a temporary string for new objects or UUID for saved ones
  project_id: string;
  object_type: string;
  boundary_normalized: Point[];
  centroid: Point;
}

const AVAILABLE_OBJECTS = [
  "Bed",
  "Chair",
  "Dining Table",
  "Door",
  "Pooja Room",
  "Sofa",
  "Stove",
  "Television",
  "Toilet",
  "Wardrobe",
];

type ZoneDivision = 8 | 16 | 32 | 0;

// Modern color scheme for Devtas
const DEVTA_COLORS: Record<string, string> = {
  "Brahma": "#FFD700", // Gold
  "Shikhi": "#FF6347",
  "Parjanya": "#4682B4",
  "Jayanta": "#32CD32",
  "Indra": "#FF4500",
  "Surya": "#FFD700",
  "Satya": "#8A2BE2",
  "Bhrisha": "#A52A2A",
  "Akash": "#87CEEB",
  "Vayu": "#B0C4DE",
  "Pusha": "#FFC0CB",
  "Vitatha": "#DDA0DD",
  "Gruhakshat": "#696969",
  "Yama": "#778899",
  "Gandharva": "#BA55D3",
  "Bhringraj": "#9932CC",
  "Marut": "#ADD8E6",
  "Dishah Shiva": "#F0FFF0",
  "Soma": "#F5F5DC",
  "Sthana": "#A9A9A9",
  "Bhallat": "#FF69B4",
  "Mukhya": "#4169E1",
  "Bhujag": "#8B4513",
  "Aaditi": "#F0E68C",
  "Diti": "#DAA520",
  "Shura": "#B22222",
  "Apa": "#00FFFF",
  "Apavatsa": "#7FFFD4",
  "Savitri": "#F0E68C",
  "Indrajit": "#8B0000",
  "Vivashvana": "#FF8C00",
  "Mitra": "#FFDAB9",
  "Prithvidhara": "#D2B48C",

  "Aaryama": "#FFE4B5",
  "Savitar": "#FFDEAD",
  "Vivasvat": "#FFA500",
  "Jaya": "#ADFF2F",
  "Rudra": "#DC143C",
  "Rajayakshma": "#FF0000",
  "Asura": "#800000",
  "Shosha": "#F5DEB3",
  "Papayakshma": "#FFB6C1",
  "Roga": "#FA8072",
  "Naga": "#6A5ACD",
  // Default color
  "default": "#E0E0E0",
};

export default function FloorPlanPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, idToken, loading: authLoading } = useAuthStore();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { liveNorthDirection, setLiveNorthDirection } = useProjectStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);

  const [boundary, setBoundary] = useState<Point[]>([]);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [objectsToDelete, setObjectsToDelete] = useState<string[]>([]);
  const [drawingObjectBoundary, setDrawingObjectBoundary] = useState<Point[]>(
    [],
  );

  const [drawingMode, setDrawingMode] = useState<"boundary" | "objects">(
    "boundary",
  );
  const [selectedObjectType, setSelectedObjectType] = useState<string>(
    AVAILABLE_OBJECTS[0],
  );
  const [devtaAnalysisResult, setDevtaAnalysisResult] = useState<
    DevtaAnalysisResult | null
  >(null);
  const [analysisMode, setAnalysisMode] = useState<string>("concentric");

  // New state for Marma points and UI interaction
  const [marmas, setMarmas] = useState<MarmaPoint[]>([]);
  const [hoveredMarma, setHoveredMarma] = useState<MarmaPoint | null>(null);
  const [selectedObject, setSelectedObject] = useState<PlacedObject | null>(
    null,
  );
  const [objectAnalyses, setObjectAnalyses] = useState<Record<string, ObjectAnalysisResult>>({});
  const [selectedDevta, setSelectedDevta] = useState<ClippedDevta | null>(null);


  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchProjectAndObjects = async () => {
      if (!user || !projectId || authLoading || !idToken) return;
      setLoading(true);
      try {
        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!projectResponse.ok) throw new Error("Failed to fetch project data.");
        const projectData = await projectResponse.json();
        setProject(projectData.project);
        setFloorPlanImage(projectData.project.floor_plan_url);
        if (projectData.project.boundary_normalized) {
          setBoundary(projectData.project.boundary_normalized);
        }
        if (projectData.project.north_direction !== null) {
          // Initialize the live direction from the last saved value
          setLiveNorthDirection(projectData.project.north_direction);
        }

        // Fetch project objects
        const objectsResponse = await fetch(`/api/projects/${projectId}/objects`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!objectsResponse.ok) throw new Error("Failed to fetch objects.");
        const objectsData = await objectsResponse.json();
        setPlacedObjects(objectsData.objects);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectAndObjects();
  }, [user, projectId, authLoading, idToken, setLiveNorthDirection]);

  // --- CORE REAL-TIME ANALYSIS ENGINE ---
  useEffect(() => {
    if (boundary.length < 3) return;

    // 1. Recalculate Vastu grids based on liveNorthDirection
    const result = analyzePlot(boundary, liveNorthDirection);
    setDevtaAnalysisResult(result);
    
    const newMarmas = generateTransformedMarmaPoints(result);
    setMarmas(newMarmas);

    if (!result || result.clippedDevtas.length === 0) return;

    // 2. Recalculate analysis for all placed objects
    const newAnalyses: Record<string, ObjectAnalysisResult> = {};
    for (const obj of placedObjects) {
      newAnalyses[obj.id] = analyzeObjectPlacement(
        obj.boundary_normalized,
        obj.object_type,
        result, // Pass the entire analysis result
      );
    }
    setObjectAnalyses(newAnalyses);
  }, [liveNorthDirection, boundary, placedObjects]);

  useEffect(() => {
    draw();
  }, [
    boundary,
    placedObjects,
    floorPlanImage,
    liveNorthDirection,
    drawingObjectBoundary,
    devtaAnalysisResult,
    marmas,
    analysisMode,
    hoveredMarma,
    selectedObject,
    objectAnalyses,
    selectedDevta,
  ]);

  const draw = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !image.complete) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = image.clientWidth;
    canvas.height = image.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (boundary.length < 3) {
      drawIncompleteBoundary(ctx, boundary, {
        width: canvas.width,
        height: canvas.height,
      });
      return;
    }

    const dims = { width: canvas.width, height: canvas.height };
    const centroid = calculateCentroid(boundary);

    // --- RENDER LAYERS ---
    if (analysisMode === "concentric" && devtaAnalysisResult) {
      drawDevtaRegions(ctx, devtaAnalysisResult, dims, selectedDevta);
    } else if (analysisMode.startsWith("zones-")) {
      const divisions = parseInt(
        analysisMode.split("-")[1] || "0",
      ) as ZoneDivision;
      drawZoneLines(ctx, divisions, centroid, boundary, liveNorthDirection, dims);
    }

    drawMarmas(ctx, marmas, dims);
    drawPlacedObjects(ctx, placedObjects, selectedObject, dims);
    drawBoundary(ctx, boundary, dims);
    drawBrahmasthan(ctx, centroid, dims);
    drawNorthLine(ctx, centroid, liveNorthDirection, dims);

    // --- RENDER UI/UX LAYERS ---
    if (drawingMode === "objects" && drawingObjectBoundary.length > 0) {
      drawIncompleteBoundary(
        ctx,
        drawingObjectBoundary,
        dims,
        "rgba(25, 118, 210, 0.9)",
      );
    }

    if (hoveredMarma) {
      drawMarmaTooltip(ctx, hoveredMarma, dims);
    }

    if (selectedObject && objectAnalyses[selectedObject.id]) {
      drawObjectAnalysis(ctx, selectedObject, objectAnalyses[selectedObject.id], dims);
    }

    if (selectedDevta) {
      const rule = vastuRules[selectedDevta.name];
      if (rule) {
        drawDevtaInfoBox(ctx, rule, dims);
      }
    }
  };

  // NEW: Modern drawing functions
  const drawBoundary = (
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

  const drawIncompleteBoundary = (
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

  const drawBrahmasthan = (
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

  const drawNorthLine = (
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

  const drawDevtaRegions = (
    ctx: CanvasRenderingContext2D,
    analysisResult: DevtaAnalysisResult,
    dims: { width: number; height: number },
    selected: ClippedDevta | null,
  ) => {
    analysisResult.clippedDevtas.forEach((devta) => {
      const isSelected = selected?.name === devta.name;

      let fillColor = DEVTA_COLORS[devta.name] || DEVTA_COLORS["default"];

      // Draw each clipped polygon part
      devta.clippedPolygons.forEach(polygon => {
        const pixelPolygon = polygon.map((p) => toPixels(p, dims));

        if (pixelPolygon.length > 0) {
          ctx.fillStyle = isSelected
            ? "rgba(255, 255, 255, 0.3)"
            : `${fillColor}33`; // 20% opacity
          ctx.strokeStyle = isSelected ? "#0ea5e9" : `${fillColor}80`; // 50% opacity
          ctx.lineWidth = isSelected ? 3 : 1;

          ctx.beginPath();
          ctx.moveTo(pixelPolygon[0].x, pixelPolygon[0].y);
          for (let i = 1; i < pixelPolygon.length; i++) {
            ctx.lineTo(pixelPolygon[i].x, pixelPolygon[i].y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      });

      // Draw Devta name once per devta (use the first polygon for centroid calculation)
      if (devta.clippedPolygons.length > 0) {
        const devtaCentroid = calculateCentroid(devta.clippedPolygons[0]);
        const pixelDevtaCentroid = toPixels(devtaCentroid, dims);

        ctx.fillStyle = "rgba(31, 41, 55, 0.75)"; // Dark slate, semi-transparent
        ctx.font = devta.name === "Brahma"
          ? "12px sans-serif"
          : (devta.name.includes("OuterDevta") ? "8px sans-serif" : "10px sans-serif"); // Adjust font size based on name or if it's Brahma
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(devta.name, pixelDevtaCentroid.x, pixelDevtaCentroid.y);
      }
    });
  };

  const drawMarmas = (
    ctx: CanvasRenderingContext2D,
    marmas: MarmaPoint[],
    dims: { width: number; height: number },
  ) => {
    // MarmaPoint no longer has a 'strength' property, so using a default color.
    const defaultMarmaColor = "#3b82f6"; // Blue
    marmas.forEach((marma) => {
      const p = toPixels(marma.point, dims);
      ctx.fillStyle = defaultMarmaColor;
      ctx.shadowColor = defaultMarmaColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  };

  const drawMarmaTooltip = (
    ctx: CanvasRenderingContext2D,
    marma: MarmaPoint,
    dims: { width: number; height: number },
  ) => {
    const p = toPixels(marma.point, dims);
    const text = `Marma Point ID: ${marma.id}`;
    ctx.font = "12px sans-serif";
    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(p.x + 10, p.y - 20, textWidth + 10, 25);
    ctx.fillStyle = "white";
    ctx.fillText(text, p.x + 15, p.y - 5);
  };

  const drawZoneLines = (
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

  const drawPlacedObjects = (
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

  const drawObjectAnalysis = (
    ctx: CanvasRenderingContext2D,
    obj: PlacedObject,
    analysis: ObjectAnalysisResult,
    dims: { width: number; height: number },
  ) => {
    const p = toPixels(obj.centroid, dims);
    const lines = [
      `Object: ${obj.object_type}`,
      `Devta: ${analysis.devtaName || 'N/A'}`,
    ];
    if (analysis.closestMarma) {
      lines.push(
        `Marma ID: ${analysis.closestMarma.id}`,
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

  const drawDevtaInfoBox = (
    ctx: CanvasRenderingContext2D,
    rule: VastuRule,
    dims: { width: number; height: number },
  ) => {
    // Check if the rule corresponds to the currently selected devta
    if (!selectedDevta || selectedDevta.name !== rule.devtaName) {
      return; // Only draw if the info box matches the selected devta
    }

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







  const handleCanvasClick = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getEventPixelPosition(event, canvas);
    const normalizedPoint = toNormalized(point, {
      width: canvas.width,
      height: canvas.height,
    });

    if (drawingMode === "boundary") {
      setBoundary([...boundary, normalizedPoint]);
      return;
    }

    if (drawingMode === "objects") {
      setDrawingObjectBoundary([...drawingObjectBoundary, normalizedPoint]);
      return;
    }

    if (drawingMode === "select") {
      // First, check for object selection
      let clickedObject = null;
      for (let i = placedObjects.length - 1; i >= 0; i--) {
        const obj = placedObjects[i];
        if (pointInPolygon(normalizedPoint, obj.boundary_normalized)) {
          clickedObject = obj;
          break;
        }
      }

      if (clickedObject) {
        setSelectedObject(clickedObject);
        setSelectedDevta(null); // Deselect Devta
        return;
      }

      // If no object clicked, check for Devta selection
      let clickedDevta: ClippedDevta | null = null;
      if (devtaAnalysisResult) {
        for (const devta of devtaAnalysisResult.clippedDevtas) {
          for (const polygon of devta.clippedPolygons) {
            if (pointInPolygon(normalizedPoint, polygon)) {
              clickedDevta = devta;
              break;
            }
          }
          if (clickedDevta) break;
        }
      }

      if (clickedDevta) {
        setSelectedDevta(clickedDevta);
        setSelectedObject(null); // Deselect object
        return;
      }

      // If clicking outside anything, deselect all
      setSelectedObject(null);
      setSelectedDevta(null);
    }
  };

  const handleMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getEventPixelPosition(event, canvas);

    let marmaFound = null;
    const hoverRadius = 8; // 8px hover radius
    for (const marma of marmas) {
      const marmaPixelPos = toPixels(marma.point, {
        width: canvas.width,
        height: canvas.height,
      });
      const distance = Math.hypot(
        pos.x - marmaPixelPos.x,
        pos.y - marmaPixelPos.y,
      );
      if (distance < hoverRadius) {
        marmaFound = marma;
        break;
      }
    }

    // Only update state if the hovered marma changes to prevent excessive re-renders
    if (marmaFound?.id !== hoveredMarma?.id) {
      setHoveredMarma(marmaFound);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setFloorPlanImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

    const handleSaveChanges = async () => {
    if (!projectId || !idToken) {
      setError("Project ID missing or user not authenticated.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Save North Direction and main boundary
      const projectUpdateResponse = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          boundary_normalized: boundary,
          north_direction: liveNorthDirection,
        }),
      });
      if (!projectUpdateResponse.ok) throw new Error("Failed to save project settings (North direction).");

      // 2. Save object geometry changes (creations/deletions)
      const newObjects = placedObjects.filter(obj => obj.id.includes("T")); // Temporary IDs are timestamps

      const response = await fetch(`/api/projects/${projectId}/objects/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          objectsToSave: newObjects,
          objectsToDelete: objectsToDelete,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save object configuration.");
      }

      const { objects: savedObjects } = await response.json();
      setPlacedObjects(savedObjects); // Refresh local objects with ones from DB (with real UUIDs)
      setObjectsToDelete([]); // Clear the delete list
      alert("Configuration saved successfully!");

    } catch (err: any) {
      console.error("Error during configuration save:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddObject = () => {
    if (drawingObjectBoundary.length < 3) {
      alert("Please draw an object with at least 3 points.");
      return;
    }
    if (!projectId) {
      alert("Project not loaded correctly.");
      return;
    }

    // Create the object with only its geometric data.
    // The main `useEffect` will automatically analyze it.
    const newObjectData: PlacedObject = {
      id: `T${new Date().toISOString()}`, // Temporary ID for local state
      project_id: projectId,
      object_type: selectedObjectType,
      boundary_normalized: drawingObjectBoundary,
      centroid: calculateCentroid(drawingObjectBoundary),
    };
    setPlacedObjects([...placedObjects, newObjectData]);
    setDrawingObjectBoundary([]);
  };

  const handleResetObjects = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all objects? This will permanently delete them from the database.",
      )
    ) {
      return;
    }

    if (!projectId || !idToken) {
      setError("Cannot reset objects: missing project ID or authentication token.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/objects`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset objects.");
      }

      setPlacedObjects([]);
      setObjectsToDelete([]);
      setSelectedObject(null);
      alert("All objects have been reset.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteObject = (objectId: string) => {
    // If the object has a real UUID (not a temporary one), mark it for deletion from DB
    if (!objectId.includes("T")) {
        setObjectsToDelete([...objectsToDelete, objectId]);
    }
    setPlacedObjects(placedObjects.filter((obj) => obj.id !== objectId));
    setSelectedObject(null);
  };


  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <h1 className="text-4xl font-bold mb-4">
          Project: {project?.name} - Floor Plan
        </h1>
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <Link href={`/projects/${projectId}`}>Overview</Link>
            <Link href={`/projects/${projectId}/floor-plan`}>Floor Plan</Link>
            <Link href={`/projects/${projectId}/report`}>Report</Link>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm">
            <div className="relative w-full h-[600px] border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {floorPlanImage
                ? (
                  <>
                    <img
                      ref={imageRef}
                      src={floorPlanImage}
                      alt="Floor Plan"
                      className="absolute top-0 left-0 w-full h-full object-contain"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                      onClick={handleCanvasClick}
                      onMouseMove={handleMouseMove}
                    />
                  </>
                )
                : <p className="text-gray-500">Upload a floor plan image</p>}
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Controls</h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Floor Plan
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <hr />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  North Direction ({liveNorthDirection}°)
                </label>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={liveNorthDirection}
                  onChange={(e) => setLiveNorthDirection(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode
                </label>
                <select
                  onChange={(e) => {
                    setDrawingMode(e.target.value as any);
                    setSelectedObject(null);
                  }}
                  value={drawingMode}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="boundary">Draw Boundary</option>
                  <option value="objects">Place Objects</option>
                  <option value="select">Select & Analyze</option>
                </select>
              </div>

              {drawingMode === "boundary" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Boundary Controls
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setBoundary([])}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setBoundary(boundary.slice(0, -1))}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              )}

              {drawingMode === "objects" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Object Controls
                  </label>
                  <select
                    onChange={(e) => setSelectedObjectType(e.target.value)}
                    value={selectedObjectType}
                    className="w-full p-2 border border-gray-300 rounded-lg mb-2"
                  >
                    {AVAILABLE_OBJECTS.map((obj) => (
                      <option key={obj} value={obj}>{obj}</option>
                    ))}
                  </select>
                  <div className="flex space-x-2 mb-2">
                    <button
                      onClick={handleAddObject}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Add Object
                    </button>
                    <button
                      onClick={() => setDrawingObjectBoundary([])}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Clear Current
                    </button>
                  </div>
                   <button
                    onClick={handleResetObjects}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                    disabled={loading}
                  >
                    Reset All Objects
                  </button>
                </div>
              )}
              {selectedObject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Object
                  </label>
                  <div className="p-2 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="font-semibold">
                      {selectedObject.object_type}
                    </p>
                    <button
                      onClick={() => handleDeleteObject(selectedObject.id)}
                      className="mt-2 px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 w-full"
                      disabled={loading}
                    >
                      {loading ? "Deleting..." : "Delete Object"}
                    </button>
                  </div>
                </div>
              )}
              <hr />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analysis Display
                </label>
                <select
                  onChange={(e) => setAnalysisMode(e.target.value as any)}
                  value={analysisMode}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="none">None</option>
                  <option value="concentric">Concentric (45 Devtas)</option>
                  <option value="zones-8">8 Directions</option>
                  <option value="zones-16">16 Directions</option>
                  <option value="zones-32">32 Directions</option>
                </select>
              </div>

              <button
                onClick={handleSaveChanges}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
