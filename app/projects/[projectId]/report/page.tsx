"use client";

import React, { useState, useEffect, useRef } from "react"; // Added useRef
import { useParams } from "next/navigation";
import Link from "next/link";
import { useProjectStore } from "../../../../lib/store/projectStore"; // Import the project store
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
  Tooltip,
} from "recharts";
import { Point } from "../../../../lib/floorPlanInterfaces";
// Removed client-side analysis
// import { analyzeObject, ObjectAnalysisResult } from "../../../../lib/vastuAnalysis";
// import { useFloorPlanAnalysis } from "../../../../hooks/useFloorPlanAnalysis";
// import { isPointInPolygon } from "../../../../lib/gridUtils";

// PDF export libraries
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


// --- INTERFACES ---

// Core data fetched from the DB
interface Project {
  id: string;
  name: string;
  boundary_normalized: Point[] | null;
  north_direction: number | null;
}

interface PlacedObject {
  id: string;
  project_id: string;
  object_type: string;
  boundary_normalized: Point[];
  centroid: Point;
  // rotation is not stored in DB project_objects table, so removed here
}

// Backend Vastu Analysis Result Interface
interface AnalyzedObjectResult {
  object_id: string;
  object_type: string;
  devta_region: string | null;
  zone16_direction: string | null;
  score_impact: number;
  verdict: "EXCELLENT" | "GOOD" | "BAD" | "CRITICAL";
  message: string;
}

interface VastuAnalysisResult {
  analyzed_objects: AnalyzedObjectResult[];
  total_score: number;
  overall_percentage: number;
  overall_verdict: "EXCELLENT" | "GOOD" | "BAD" | "CRITICAL";
}


// --- CONSTANTS ---
const COLORS = {
  EXCELLENT: "#10B981", // Green
  GOOD: "#34D399", // Lighter Green
  BAD: "#F59E0B", // Amber
  CRITICAL: "#EF4444", // Red
};

// Helper to get text color based on verdict
const getVerdictTextColor = (verdict: string) => {
  switch (verdict) {
    case "EXCELLENT": return "text-green-800";
    case "GOOD": return "text-green-700";
    case "BAD": return "text-orange-800";
    case "CRITICAL": return "text-red-800";
    default: return "text-gray-700";
  }
};

// Helper to get background color based on verdict
const getVerdictColor = (verdict: string) => {
  switch (verdict) {
    case "EXCELLENT": return "bg-green-100";
    case "GOOD": return "bg-green-100";
    case "BAD": return "bg-orange-100";
    case "CRITICAL": return "bg-red-100";
    default: return "bg-gray-100";
  }
};


// --- COMPONENT ---
export default function ReportPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { liveNorthDirection, setLiveNorthDirection } = useProjectStore();

  // Ref for the report content to capture for PDF
  const reportContentRef = useRef<HTMLDivElement>(null);


  // --- STATE ---

  // Data from DB
  const [project, setProject] = useState<Project | null>(null);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [vastuAnalysisResult, setVastuAnalysisResult] = useState<VastuAnalysisResult | null>(null);


  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- DATA FETCHING & ANALYSIS ---
  useEffect(() => {
    const fetchReportData = async () => {
      if (!projectId) return;

      const urlParams = new URLSearchParams(window.location.search);
      const analysisId = urlParams.get("analysisId");

      if (!analysisId) {
        setError("Analysis ID is missing from the URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch project and analysis data using the analysisId
        const analysisResponse = await fetch(`/api/analysis/full-report?analysisId=${analysisId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!analysisResponse.ok) {
          const errorDetail = await analysisResponse.json();
          throw new Error(
            errorDetail.error || "Failed to fetch Vastu analysis report."
          );
        }

        const vastuData: VastuAnalysisResult = await analysisResponse.json();
        setVastuAnalysisResult(vastuData);

        // Fetch project details for display purposes (name, etc.)
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) {
            throw new Error("Failed to fetch project details.");
        }
        const projectData = await projectResponse.json();
        setProject(projectData.project);

        // Fetch placed objects if needed for display (not for analysis input anymore)
        const objectsResponse = await fetch(`/api/projects/${projectId}/objects`);
        if (!objectsResponse.ok) {
            throw new Error("Failed to fetch placed objects.");
        }
        const objectsData = await objectsResponse.json();
        setPlacedObjects(objectsData.objects);

        // Initialize liveNorthDirection from saved value if it hasn't been set
        if (projectData.project.north_direction !== null) {
          setLiveNorthDirection(projectData.project.north_direction);
        }

      } catch (err: any) {
        console.error("Error fetching report data:", err);
        setError(err.message);
        setVastuAnalysisResult(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [projectId, setLiveNorthDirection]);

  // --- PDF Export ---
  const handleExportPdf = async () => {
    if (reportContentRef.current) {
      setLoading(true); // Indicate loading for PDF generation
      try {
        // Ensure all images (charts, etc.) are loaded before capturing
        const images = reportContentRef.current.querySelectorAll('img');
        const imageLoadPromises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // Resolve even if image fails to load
            });
        });
        await Promise.all(imageLoadPromises);

        const canvas = await html2canvas(reportContentRef.current, {
          scale: 2, // Increase scale for better quality
          useCORS: true, // Enable cross-origin image loading if necessary
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4"); // Portrait, millimeters, A4 page size
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft >= 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }

        pdf.save(`Vastu_Report_${project?.name || projectId}.pdf`);
      } catch (pdfError) {
        console.error("Error generating PDF:", pdfError);
        alert("Failed to generate PDF. Please try again.");
      } finally {
        setLoading(false); // End loading
      }
    } else {
      alert("Report content not found for PDF export.");
    }
  };


  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading Vastu Report...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!project || !vastuAnalysisResult) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-gray-600">No project data or analysis available.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-8">
      <h1 className="text-4xl font-bold mb-4">
        Vastu Analysis Report for {project.name}
      </h1>
      <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link href={`/projects/${projectId}`} className="text-gray-500 hover:text-gray-800">Overview</Link>
          <Link href={`/projects/${projectId}/floor-plan`} className="text-gray-500 hover:text-gray-800">Floor Plan</Link>
          <Link href={`/projects/${projectId}/report`} className="text-blue-600 border-b-2 border-blue-600 font-semibold">Report</Link>
        </nav>
        <button
          onClick={handleExportPdf}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded shadow"
        >
          Export as PDF
        </button>
      </div>

      {/* Report Content to be captured for PDF */}
      <div id="report-content" ref={reportContentRef} className="bg-gray-100"> 
        {/* Overall Score Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Overall Vastu Compliance</h2>
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="90%"
                  outerRadius="70%"
                  barSize={20}
                  data={[{ name: "Vastu Score", uv: vastuAnalysisResult.overall_percentage, fill: COLORS[vastuAnalysisResult.overall_verdict] }]}
                  startAngle={90} // Start from top
                  endAngle={90 - (360 * vastuAnalysisResult.overall_percentage / 100)} // Go clockwise from top
                >
                  <RadialBar cornerRadius={10} background dataKey="uv" />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']} />
                </RadialBarChart>
              </ResponsiveContainer>
              <p
                  className="absolute inset-0 flex items-center justify-center text-5xl font-bold"
                  style={{ color: COLORS[vastuAnalysisResult.overall_verdict] }}
                >
                  {vastuAnalysisResult.overall_percentage.toFixed(0)}%
                </p>
            </div>
            <p className="text-lg text-gray-600 mt-2">
              Status: <span className={`font-bold ${getVerdictTextColor(vastuAnalysisResult.overall_verdict)}`}>
                {vastuAnalysisResult.overall_verdict}
              </span>
            </p>
            <p className="text-sm text-gray-500">Total Score: {vastuAnalysisResult.total_score}</p>
          </div>
          
          {/* Object Status Distribution (Placeholder for pie chart, using overall data for now) */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Object Status Distribution</h2>
              {vastuAnalysisResult.analyzed_objects.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No objects placed for distribution analysis.</p>
              ) : (
                  <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                          <Pie
                              data={Object.values(
                                  vastuAnalysisResult.analyzed_objects.reduce((acc, obj) => {
                                      acc[obj.verdict] = (acc[obj.verdict] || 0) + 1;
                                      return acc;
                                  }, {} as Record<string, number>)
                              ).map((count, i) => ({
                                  name: Object.keys(
                                      vastuAnalysisResult.analyzed_objects.reduce((acc, obj) => {
                                          acc[obj.verdict] = (acc[obj.verdict] || 0) + 1;
                                          return acc;
                                      }, {} as Record<string, number>)
                                  )[i],
                                  value: count
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              dataKey="value"
                              label={({ name, percent }) =>
                                  `${name} ${(percent * 100).toFixed(0)}%`
                              }
                          >
                              {Object.keys(
                                  vastuAnalysisResult.analyzed_objects.reduce((acc, obj) => {
                                      acc[obj.verdict] = (acc[obj.verdict] || 0) + 1;
                                      return acc;
                                  }, {} as Record<string, number>)
                              ).map((verdict, index) => (
                                  <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[verdict as keyof typeof COLORS]}
                                  />
                              ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                      </PieChart>
                  </ResponsiveContainer>
              )}
          </div>
        </div>


        {/* Detailed Table */}
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Detailed Object Report</h2>
          {vastuAnalysisResult.analyzed_objects.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No objects placed for detailed analysis.</p>
          ) : (
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                  <tr>
                      <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                      Object Type
                      </th>
                      <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                      Zone
                      </th>
                      <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                      Devta
                      </th>
                      <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                      Score
                      </th>
                      <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                      Verdict
                      </th>
                      <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                      Message
                      </th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {vastuAnalysisResult.analyzed_objects.map((obj) => (
                      <tr key={obj.object_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {obj.object_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {obj.zone16_direction || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {obj.devta_region || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {obj.score_impact}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVerdictColor(obj.verdict)} ${getVerdictTextColor(obj.verdict)}`}
                          >
                          {obj.verdict}
                          </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {obj.message}
                      </td>
                      </tr>
                  ))}
                  </tbody>
              </table>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}



