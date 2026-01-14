"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import AuthGuard from "../../../../components/AuthGuard";
import Link from "next/link";
import { useAuthStore } from "../../../../lib/store/authStore";
import { Point, toNormalized, toPixels, getEventPixelPosition } from "../../../../lib/coordinates";
import { 
  calculateCentroid,
  pointInPolygon,rayPolygonIntersection
} from "../../../../lib/geometry";
import { 
  generate45Devtas, 
  getZoneForPoint,
  DevtaRegion 
} from "../../../../lib/vastu/devtaAnalysis";
import { useSupabase } from "../../../../components/SupabaseProvider";
import { MarmaPoint, generateMarmaPoints } from "../../../../lib/vastu/marmaAnalysis";
import { ObjectAnalysisResult, analyzeObjectPlacement } from "../../../../lib/vastu/objectAnalysis";
import { VastuRule, vastuRules } from "../../../../lib/vastu/vastuRules";

interface Project {
  id: string;
  name: string;
  floor_plan_url: string | null;
  boundary_normalized: Point[] | null;
  north_direction: number | null;
}

interface PlacedObject {
  id: string;
  type: string;
  boundary: Point[];
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

export default function FloorPlanPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, idToken, loading: authLoading } = useAuthStore();
  const { supabase, loading: supabaseLoading } = useSupabase();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);

  const [boundary, setBoundary] = useState<Point[]>([]);
  const [northDirection, setNorthDirection] = useState(0);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [drawingObjectBoundary, setDrawingObjectBoundary] = useState<Point[]>([]);
  
  const [drawingMode, setDrawingMode] = useState<"boundary" | "objects">("boundary");
  const [selectedObjectType, setSelectedObjectType] = useState<string>(AVAILABLE_OBJECTS[0]);
  const [analysisResult, setAnalysisResult] = useState<DevtaRegion[] | null>(null);
  const [analysisMode, setAnalysisMode] = useState<"concentric">("concentric");
  
  // New state for Marma points and UI interaction
  const [marmas, setMarmas] = useState<MarmaPoint[]>([]);
  // const [zoneDivision, setZoneDivision] = useState<ZoneDivision>(0); // Replaced by analysisMode
  const [hoveredMarma, setHoveredMarma] = useState<MarmaPoint | null>(null);
  const [selectedObject, setSelectedObject] = useState<PlacedObject | null>(null);
  const [selectedObjectAnalysis, setSelectedObjectAnalysis] = useState<ObjectAnalysisResult | null>(null);
  const [selectedDevta, setSelectedDevta] = useState<DevtaRegion | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!user || !projectId || authLoading || supabaseLoading || !idToken) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!response.ok) throw new Error("Failed to fetch project data.");
        const data = await response.json();
        setProject(data.project);
        setFloorPlanImage(data.project.floor_plan_url);
        if (data.project.boundary_normalized) {
          setBoundary(data.project.boundary_normalized);
        }
        if (data.project.north_direction !== null) {
          setNorthDirection(data.project.north_direction);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [user, projectId, authLoading, supabaseLoading, idToken]);

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
      drawIncompleteBoundary(ctx, boundary, { width: canvas.width, height: canvas.height });
      return;
    }

    const dims = { width: canvas.width, height: canvas.height };
    const centroid = calculateCentroid(boundary);

    // --- RENDER LAYERS ---
    if (analysisMode === 'concentric' && analysisResult) {
      drawDevtaRegions(ctx, analysisResult, dims, selectedDevta);
    } else if (analysisMode.startsWith('zones-')) {
      const divisions = parseInt(analysisMode.split('-')[1] || '0') as ZoneDivision;
      drawZoneLines(ctx, divisions, centroid, boundary, northDirection, dims);
    }
    
    drawMarmas(ctx, marmas, dims);
    drawPlacedObjects(ctx, placedObjects, selectedObject, dims);
    drawBoundary(ctx, boundary, dims);
    drawBrahmasthan(ctx, centroid, dims);
    drawNorthLine(ctx, centroid, northDirection, dims);

    // --- RENDER UI/UX LAYERS ---
    if (drawingMode === 'objects' && drawingObjectBoundary.length > 0) {
      drawIncompleteBoundary(ctx, drawingObjectBoundary, dims, "rgba(25, 118, 210, 0.9)");
    }
    
    if (hoveredMarma) {
      drawMarmaTooltip(ctx, hoveredMarma, dims);
    }

    if (selectedObject && selectedObjectAnalysis) {
        drawObjectAnalysis(ctx, selectedObject, selectedObjectAnalysis, dims);
    }

    if (selectedDevta) {
      const rule = vastuRules[selectedDevta.name];
      if (rule) {
        drawDevtaInfoBox(ctx, rule, dims);
      }
    }
  };

  // NEW: Modern drawing functions
  const drawBoundary = (ctx: CanvasRenderingContext2D, boundary: Point[], dims: {width: number, height: number}) => {
      const pixelBoundary = boundary.map(p => toPixels(p, dims));
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pixelBoundary[0].x, pixelBoundary[0].y);
      for (let i = 1; i < pixelBoundary.length; i++) {
        ctx.lineTo(pixelBoundary[i].x, pixelBoundary[i].y);
      }
      ctx.closePath();
      ctx.stroke();
  };

  const drawIncompleteBoundary = (ctx: CanvasRenderingContext2D, boundary: Point[], dims: {width: number, height: number}, color = '#1f2937') => {
      const pixelBoundary = boundary.map(p => toPixels(p, dims));
      ctx.fillStyle = color;
      pixelBoundary.forEach(p => {
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

  const drawBrahmasthan = (ctx: CanvasRenderingContext2D, centroid: Point, dims: {width: number, height: number}) => {
    const pixelCentroid = toPixels(centroid, dims);
    ctx.fillStyle = "rgba(255, 215, 0, 0.25)"; // Gold
    ctx.beginPath();
    ctx.arc(pixelCentroid.x, pixelCentroid.y, 10, 0, 2 * Math.PI);
    ctx.fill();
  };
  
  const drawNorthLine = (ctx: CanvasRenderingContext2D, centroid: Point, north: number, dims: {width: number, height: number}) => {
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
    ctx.fillText("N", endX + 15 * Math.cos(angleRad), endY + 15 * Math.sin(angleRad));
  };

  const drawDevtaRegions = (ctx: CanvasRenderingContext2D, devtas: DevtaRegion[], dims: {width: number, height: number}, selected: DevtaRegion | null) => {
      devtas.forEach(devta => {
        const pixelPolygon = devta.polygon.map(p => toPixels(p, dims));
        const isSelected = selected?.id === devta.id;

        let fillColor = "rgba(107, 114, 128, 0.1)";
        if (devta.ring === 'center') fillColor = "rgba(255, 215, 0, 0.2)";
        else if (devta.ring === 'middle') fillColor = "rgba(199, 210, 254, 0.2)";
        else if (devta.ring === 'outer') fillColor = "rgba(167, 243, 208, 0.2)";
        
        ctx.fillStyle = isSelected ? "rgba(255, 255, 255, 0.3)" : fillColor;
        ctx.strokeStyle = isSelected ? "#0ea5e9" : "rgba(107, 114, 128, 0.4)";
        ctx.lineWidth = isSelected ? 3 : 1;

        if (pixelPolygon.length > 0) {
          ctx.beginPath();
          ctx.moveTo(pixelPolygon[0].x, pixelPolygon[0].y);
          for (let i = 1; i < pixelPolygon.length; i++) ctx.lineTo(pixelPolygon[i].x, pixelPolygon[i].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Draw Devta name
          const devtaCentroid = calculateCentroid(devta.polygon);
          const pixelDevtaCentroid = toPixels(devtaCentroid, dims);
          
          ctx.fillStyle = "rgba(31, 41, 55, 0.75)"; // Dark slate, semi-transparent
          ctx.font = devta.ring === 'outer' ? "8px sans-serif" : "10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(devta.name, pixelDevtaCentroid.x, pixelDevtaCentroid.y);
        }
      });
  };

  const drawMarmas = (ctx: CanvasRenderingContext2D, marmas: MarmaPoint[], dims: {width: number, height: number}) => {
    const marmaColors: Record<MarmaPoint['strength'], string> = {
      high: '#f87171', // Red
      medium: '#fb923c', // Orange
      low: '#4ade80', // Green
    };
    marmas.forEach(marma => {
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
  
  const drawMarmaTooltip = (ctx: CanvasRenderingContext2D, marma: MarmaPoint, dims: {width: number, height: number}) => {
    const p = toPixels(marma.point, dims);
    const text = `Marma: ${marma.angleDeg}° (${marma.strength})`;
    ctx.font = "12px sans-serif";
    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(p.x + 10, p.y - 20, textWidth + 10, 25);
    ctx.fillStyle = "white";
    ctx.fillText(text, p.x + 15, p.y - 5);
  };

  const drawZoneLines = (ctx: CanvasRenderingContext2D, divisions: ZoneDivision, centroid: Point, boundary: Point[], north: number, dims: {width: number, height: number}) => {
    if (divisions === 0) return;
    const pixelCentroid = toPixels(centroid, dims);
    const angleStep = 360 / divisions;
    ctx.strokeStyle = 'rgba(75, 85, 99, 0.3)';
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

  const drawPlacedObjects = (ctx: CanvasRenderingContext2D, objects: PlacedObject[], selected: PlacedObject | null, dims: {width: number, height: number}) => {
    objects.forEach(obj => {
      const pixelBoundary = obj.boundary.map(p => toPixels(p, dims));
      const isSelected = selected?.id === obj.id;
      ctx.fillStyle = "rgba(55, 65, 81, 0.5)"; // semi-transparent slate
      ctx.strokeStyle = isSelected ? "#0ea5e9" : "#374151"; // highlight if selected
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(pixelBoundary[0].x, pixelBoundary[0].y);
      for (let i = 1; i < pixelBoundary.length; i++) ctx.lineTo(pixelBoundary[i].x, pixelBoundary[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      const pixelCentroid = toPixels(obj.centroid, dims);
      ctx.fillStyle = "white";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.type, pixelCentroid.x, pixelCentroid.y);
    });
  };
  
  const drawObjectAnalysis = (ctx: CanvasRenderingContext2D, obj: PlacedObject, analysis: ObjectAnalysisResult, dims: {width: number, height: number}) => {
    const p = toPixels(obj.centroid, dims);
    const lines = [
        `Object: ${obj.type}`,
        `Devta: ${analysis.devtaName}`,
    ];
    if(analysis.closestMarma) {
        lines.push(`Marma: ${analysis.closestMarma.angleDeg}° (${analysis.marmaStrength})`);
        lines.push(`Dist: ${analysis.marmaDistance?.toFixed(2)} units`);
        const marmaPixel = toPixels(analysis.closestMarma.point, dims);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
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
    const width = Math.max(...lines.map(l => ctx.measureText(l).width)) + 20;
    const height = lines.length * 18 + 10;
    const x = p.x + 15;
    const y = p.y - 15;

    ctx.fillStyle = "rgba(249, 250, 251, 0.9)"; // Light background
    ctx.strokeStyle = "rgba(209, 213, 219, 1)"; // Light border
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = "#1f2937"; // Dark text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => {
        ctx.fillText(line, x + 10, y + 8 + i * 18);
    });
  };

  const drawDevtaInfoBox = (ctx: CanvasRenderingContext2D, rule: VastuRule, dims: {width: number, height: number}) => {
    const boxX = 20;
    const boxY = 20;
    const boxWidth = 250;
    const lineHeight = 18;
    
    const lines = [
      `Devta: ${rule.devtaName}`,
      `"${rule.description}"`,
      '',
      'Optimal:',
      ...rule.optimal.map(s => `• ${s}`),
      '',
      'Avoid:',
      ...rule.avoid.map(s => `• ${s}`),
    ];
    const boxHeight = lines.length * lineHeight + 20;

    ctx.fillStyle = "rgba(249, 250, 251, 0.95)";
    ctx.strokeStyle = "rgba(209, 213, 219, 1)";
    ctx.lineWidth = 1;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = "#1f2937"; 

    lines.forEach((line, i) => {
      if (line === 'Optimal:' || line === 'Avoid:') {
        ctx.font = "bold 13px sans-serif";
      } else if (line.startsWith('•')) {
        ctx.font = "13px sans-serif";
      } else if (line.startsWith('"')) {
        ctx.font = "italic 13px sans-serif";
      } else {
        ctx.font = "bold 14px sans-serif";
      }
      ctx.fillText(line, boxX + 10, boxY + 10 + i * lineHeight);
    });
  };
  
  // Effect for auto-generating Marma points when boundary changes
  useEffect(() => {
    if (boundary.length > 2) {
      const newMarmas = generateMarmaPoints(boundary, northDirection);
      setMarmas(newMarmas);
    } else {
      setMarmas([]);
    }
  }, [boundary, northDirection]);

  const handleGenerateAnalysis = () => {
    if (boundary.length > 2) {
      const result = generate45Devtas(boundary, northDirection);
      setAnalysisResult(result);
      if (!result) {
        alert("Could not generate 45 Devtas analysis. Please check the boundary polygon.");
      }
    } else {
      alert("Please draw a valid boundary with at least 3 points.");
    }
  };

  useEffect(() => {
    draw();
  }, [boundary, placedObjects, floorPlanImage, northDirection, drawingObjectBoundary, analysisResult, marmas, analysisMode, hoveredMarma, selectedObject, selectedObjectAnalysis, selectedDevta]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getEventPixelPosition(event, canvas);
    const normalizedPoint = toNormalized(point, { width: canvas.width, height: canvas.height });

    if (drawingMode === 'boundary') {
      setBoundary([...boundary, normalizedPoint]);
      return;
    } 
    
    if (drawingMode === 'objects') {
      setDrawingObjectBoundary([...drawingObjectBoundary, normalizedPoint]);
      return;
    }

    if (drawingMode === 'select') {
      // First, check for object selection
      let clickedObject = null;
      for (let i = placedObjects.length - 1; i >= 0; i--) {
        const obj = placedObjects[i];
        if (pointInPolygon(normalizedPoint, obj.boundary)) {
          clickedObject = obj;
          break;
        }
      }

      if (clickedObject) {
        setSelectedObject(clickedObject);
        setSelectedDevta(null); // Deselect Devta
        if (analysisResult) {
          const analysis = analyzeObjectPlacement(clickedObject.centroid, analysisResult, marmas, boundary);
          setSelectedObjectAnalysis(analysis);
        }
        return;
      }

      // If no object clicked, check for Devta selection
      let clickedDevta = null;
      if(analysisResult) {
        for(const devta of analysisResult) {
          if(pointInPolygon(normalizedPoint, devta.polygon)) {
            clickedDevta = devta;
            break;
          }
        }
      }

      if (clickedDevta) {
        setSelectedDevta(clickedDevta);
        setSelectedObject(null); // Deselect object
        setSelectedObjectAnalysis(null);
        return;
      }
      
      // If clicking outside anything, deselect all
      setSelectedObject(null);
      setSelectedObjectAnalysis(null);
      setSelectedDevta(null);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getEventPixelPosition(event, canvas);
    
    let marmaFound = null;
    const hoverRadius = 8; // 8px hover radius
    for (const marma of marmas) {
      const marmaPixelPos = toPixels(marma.point, { width: canvas.width, height: canvas.height });
      const distance = Math.hypot(pos.x - marmaPixelPos.x, pos.y - marmaPixelPos.y);
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
  
  const handleUploadAndSave = async () => {
    if (!projectId || !user || !idToken) {
      setError("Project ID missing, user not authenticated, or token unavailable.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("projectId", projectId);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.message || "Failed to upload file");
        }
        const uploadData = await uploadResponse.json();
        setFloorPlanImage(uploadData.url);
      }
      
      await handleSaveBoundaryAndNorth();
    } catch (err: any) {
      console.error("Error during upload or save:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBoundaryAndNorth = async () => {
    if (!projectId || !user || !idToken) {
      setError("Project ID missing, user not authenticated, or token unavailable.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          boundary_normalized: boundary,
          north_direction: northDirection,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save boundary.");
      }
      alert("Configuration saved successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveObjects = async () => {
    if (!projectId || !user || placedObjects.length === 0 || !idToken) {
      setError("No objects placed, user not authenticated, or token unavailable.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const objectsToSave = placedObjects.map(obj => {
        // Centroid is already calculated and stored with the object
        const zone = analysisResult ? getZoneForPoint(obj.centroid, boundary, northDirection) : "Unknown";
        return {
          type: obj.type,
          boundary_normalized: obj.boundary,
          zone: zone
        };
      });

      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ projectId, objects: objectsToSave }),
      });
      if (!response.ok) {
        throw new Error("Failed to save objects.");
      }
      alert("Objects saved for analysis!");
      // Decide if we should clear objects after saving. For now, we keep them.
      // setPlacedObjects([]);
    } catch (err: any)
    {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            <Link href={`/projects/${projectId}/analysis`}>Analysis</Link>
            <Link href={`/projects/${projectId}/report`}>Report</Link>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm">
            <div className="relative w-full h-[600px] border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {floorPlanImage ? (
                <>
                  <img 
                    ref={imageRef} 
                    src={floorPlanImage} 
                    alt="Floor Plan" 
                    className="absolute top-0 left-0 w-full h-full object-contain" 
                    onLoad={draw}
                  />
                  <canvas 
                    ref={canvasRef} 
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair" 
                    onClick={handleCanvasClick}
                    onMouseMove={handleMouseMove}
                  />
                </>
              ) : (
                <p className="text-gray-500">Upload a floor plan image</p>
              )}
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
                  Mode
                </label>
                <select 
                  onChange={(e) => {
                    setDrawingMode(e.target.value as any);
                    // Deselect object when changing mode
                    setSelectedObject(null);
                    setSelectedObjectAnalysis(null);
                  }} 
                  value={drawingMode} 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="boundary">Draw Boundary</option>
                  <option value="objects">Place Objects</option>
                  <option value="select">Select & Analyze</option>
                </select>
              </div>

              {drawingMode === 'boundary' && (
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

              {drawingMode === 'objects' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Object Controls
                  </label>
                  <select 
                    onChange={(e) => setSelectedObjectType(e.target.value)} 
                    value={selectedObjectType} 
                    className="w-full p-2 border border-gray-300 rounded-lg mb-2"
                  >
                    {AVAILABLE_OBJECTS.map(obj => (
                      <option key={obj} value={obj}>{obj}</option>
                    ))}
                  </select>
                  <div className="flex space-x-2 mb-2">
                    <button 
                      onClick={() => {
                        if (drawingObjectBoundary.length > 2) {
                          const newObject: PlacedObject = {
                            id: `obj_${Date.now()}`, // Simple unique ID
                            type: selectedObjectType, 
                            boundary: drawingObjectBoundary,
                            centroid: calculateCentroid(drawingObjectBoundary),
                          };
                          setPlacedObjects([...placedObjects, newObject]);
                          setDrawingObjectBoundary([]);
                        } else {
                          alert("An object needs at least 3 points.");
                        }
                      }} 
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Finish Object
                    </button>
                    <button 
                      onClick={() => setDrawingObjectBoundary([])} 
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Clear Current
                    </button>
                  </div>
                  <button 
                    onClick={() => setPlacedObjects([])} 
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Clear All Objects
                  </button>
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
                onClick={handleGenerateAnalysis} 
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold" 
                disabled={loading || boundary.length < 3}
              >
                {analysisResult ? "Regenerate Analysis" : "Generate Analysis"}
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  North Direction ({northDirection}°)
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="359" 
                  value={northDirection} 
                  onChange={(e) => setNorthDirection(Number(e.target.value))} 
                  className="w-full"
                />
              </div>

              <button 
                onClick={handleUploadAndSave} 
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold" 
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Configuration"}
              </button>
              
              <button 
                onClick={handleSaveObjects} 
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold" 
                disabled={loading || placedObjects.length === 0}
              >
                {loading ? "Saving..." : "Save Objects"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}