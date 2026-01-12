"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import AuthGuard from "../../../../components/AuthGuard";
import Link from "next/link";
import { useAuthStore } from "../../../../lib/store/authStore";
import { Point, toNormalized, toPixels, getEventPixelPosition } from "../../../../lib/coordinates";
import { 
  calculateCentroid, 
  generate45Devtas, 
  getZoneForPoint,
  DevtaRegion 
} from "../../../../lib/geometry";
import { useSupabase } from "../../../../components/SupabaseProvider";

interface Project {
  id: string;
  name: string;
  floor_plan_url: string | null;
  boundary_normalized: Point[] | null;
  north_direction: number | null;
}

interface PlacedObject {
  type: string;
  boundary: Point[];
}

const AVAILABLE_OBJECTS = ["Toilet", "Kitchen", "Bed", "Main Door", "Pooja Room"];

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

    // Draw boundary
    if (boundary.length > 0) {
      ctx.strokeStyle = "red";
      ctx.fillStyle = "red";
      ctx.lineWidth = 2;
      const pixelBoundary = boundary.map(p => 
        toPixels(p, { width: canvas.width, height: canvas.height })
      );
      
      // Draw boundary points
      pixelBoundary.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
      
      // Draw boundary lines
      ctx.beginPath();
      ctx.moveTo(pixelBoundary[0].x, pixelBoundary[0].y);
      for (let i = 1; i < pixelBoundary.length; i++) {
        ctx.lineTo(pixelBoundary[i].x, pixelBoundary[i].y);
      }
      if (boundary.length > 2) {
        ctx.closePath();
      }
      ctx.stroke();

      if (boundary.length > 2) {
        // Draw centroid
        const centroid = calculateCentroid(boundary);
        const pixelCentroid = toPixels(centroid, { 
          width: canvas.width, 
          height: canvas.height 
        });
        ctx.fillStyle = "purple";
        ctx.beginPath();
        ctx.arc(pixelCentroid.x, pixelCentroid.y, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Draw North line
        const lineLength = 60;
        const angleRad = (northDirection - 90) * (Math.PI / 180);
        const endX = pixelCentroid.x + lineLength * Math.cos(angleRad);
        const endY = pixelCentroid.y + lineLength * Math.sin(angleRad);

        ctx.strokeStyle = "blue";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pixelCentroid.x, pixelCentroid.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // North label
        ctx.fillStyle = "blue";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        const labelX = endX + 15 * Math.cos(angleRad);
        const labelY = endY + 15 * Math.sin(angleRad);
        ctx.fillText("N", labelX, labelY);

        // Draw Devta regions
        if (analysisResult) {
          analysisResult.forEach(devta => {
            const pixelPolygon = devta.polygon.map(p => 
              toPixels(p, { width: canvas.width, height: canvas.height })
            );
            
            // Color by ring
            let fillColor = "rgba(200, 200, 200, 0.2)";
            let strokeColor = "rgba(100, 100, 100, 0.5)";
            
            if (devta.ring === 'center') {
              fillColor = "rgba(255, 215, 0, 0.4)"; // Golden for Brahma
              strokeColor = "rgba(218, 165, 32, 0.8)";
            } else if (devta.ring === 'middle') {
              fillColor = "rgba(100, 200, 255, 0.3)"; // Light blue
              strokeColor = "rgba(70, 130, 180, 0.7)";
            } else if (devta.ring === 'outer') {
              fillColor = "rgba(144, 238, 144, 0.25)"; // Light green
              strokeColor = "rgba(34, 139, 34, 0.6)";
            }

            ctx.fillStyle = fillColor;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            
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
              const pixelDevtaCentroid = toPixels(devtaCentroid, { 
                width: canvas.width, 
                height: canvas.height 
              });
              
              ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
              ctx.font = devta.ring === 'center' ? "bold 12px Arial" : "9px Arial";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(devta.name, pixelDevtaCentroid.x, pixelDevtaCentroid.y);
            }
          });
        }
      }
    }

    // Draw placed objects
    placedObjects.forEach(obj => {
      const pixelBoundary = obj.boundary.map(p => 
        toPixels(p, { width: canvas.width, height: canvas.height })
      );
      ctx.fillStyle = "rgba(255, 100, 0, 0.6)";
      ctx.strokeStyle = "rgba(200, 50, 0, 0.9)";
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(pixelBoundary[0].x, pixelBoundary[0].y);
      for (let i = 1; i < pixelBoundary.length; i++) {
        ctx.lineTo(pixelBoundary[i].x, pixelBoundary[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const centroid = calculateCentroid(obj.boundary);
      const pixelCentroid = toPixels(centroid, { 
        width: canvas.width, 
        height: canvas.height 
      });
      ctx.fillStyle = "white";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.type, pixelCentroid.x, pixelCentroid.y);
    });

    // Draw currently drawing object boundary
    if (drawingMode === 'objects' && drawingObjectBoundary.length > 0) {
      ctx.strokeStyle = "blue";
      ctx.fillStyle = "blue";
      ctx.lineWidth = 2;
      
      const pixelBoundary = drawingObjectBoundary.map(p => 
        toPixels(p, { width: canvas.width, height: canvas.height })
      );
      
      // Draw points
      pixelBoundary.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
      
      // Draw lines
      ctx.beginPath();
      ctx.moveTo(pixelBoundary[0].x, pixelBoundary[0].y);
      for (let i = 1; i < pixelBoundary.length; i++) {
        ctx.lineTo(pixelBoundary[i].x, pixelBoundary[i].y);
      }
      ctx.stroke();
    }
  };

  const handleGenerateAnalysis = () => {
    if (boundary.length > 2) {
      const result = generate45Devtas(boundary, northDirection);
      setAnalysisResult(result);
      if (!result) {
        alert("Could not generate 45 Devtas analysis. Please check the boundary polygon.");
      } else {
        console.log(`Generated ${result.length} Devta regions`);
      }
    } else {
      alert("Please draw a valid boundary with at least 3 points.");
    }
  };

  useEffect(() => {
    draw();
  }, [boundary, placedObjects, floorPlanImage, northDirection, drawingObjectBoundary, analysisResult]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getEventPixelPosition(event, canvas);
    const normalizedPoint = toNormalized(point, { 
      width: canvas.width, 
      height: canvas.height 
    });

    if (drawingMode === 'boundary') {
      setBoundary([...boundary, normalizedPoint]);
    } else if (drawingMode === 'objects') {
      setDrawingObjectBoundary([...drawingObjectBoundary, normalizedPoint]);
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
        const centroid = calculateCentroid(obj.boundary);
        const zone = getZoneForPoint(centroid, boundary, northDirection);
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
      setPlacedObjects([]);
    } catch (err: any) {
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
                  Drawing Mode
                </label>
                <select 
                  onChange={(e) => setDrawingMode(e.target.value as any)} 
                  value={drawingMode} 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="boundary">Draw Boundary</option>
                  <option value="objects">Place Objects</option>
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
                          setPlacedObjects([...placedObjects, { 
                            type: selectedObjectType, 
                            boundary: drawingObjectBoundary 
                          }]);
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
                  <option value="concentric">Concentric Analysis (45 Devtas)</option>
                </select>
              </div>

              <button 
                onClick={handleGenerateAnalysis} 
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold" 
                disabled={loading || boundary.length < 3}
              >
                {analysisResult ? "Regenerate 45 Devtas" : "Generate 45 Devtas"}
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
                <p className="text-center font-semibold text-lg mt-2">
                  {northDirection}°
                </p>
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