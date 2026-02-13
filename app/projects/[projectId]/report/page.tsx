"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { useProjectStore } from "../../../../lib/store/projectStore";

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
import domToImage from "dom-to-image";
import jsPDF from "jspdf";
import { Point } from "../../../../lib/floorPlanInterfaces";
import { calculateBoundaryDistribution } from "../../../utils/calculateBoundaryDistribution";
import { calculateAreaDistribution } from "../../../utils/calculateAreaDistribution";
import { ZoneBarChart } from "../../../../components/ZoneBarChart";

// --- INTERFACES ---

interface Project {
  id: string;
  name: string;
  creator_name?: string;
  report_for?: string;
  boundary_normalized: Point[] | null;
  north_direction: number | null;
}

interface PlacedObject {
  id: string;
  project_id: string;
  object_type: string;
  boundary_normalized: Point[];
  centroid: Point;
}

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

const ZONES_DEFINITION = [
  { zone: 'NNE', startAngle: 11.25, endAngle: 33.75 },
  { zone: 'NE', startAngle: 33.75, endAngle: 56.25 },
  { zone: 'ENE', startAngle: 56.25, endAngle: 78.75 },
  { zone: 'E', startAngle: 78.75, endAngle: 101.25 },
  { zone: 'ESE', startAngle: 101.25, endAngle: 123.75 },
  { zone: 'SE', startAngle: 123.75, endAngle: 146.25 },
  { zone: 'SSE', startAngle: 146.25, endAngle: 168.75 },
  { zone: 'S', startAngle: 168.75, endAngle: 191.25 },
  { zone: 'SSW', startAngle: 191.25, endAngle: 213.75 },
  { zone: 'SW', startAngle: 213.75, endAngle: 236.25 },
  { zone: 'WSW', startAngle: 236.25, endAngle: 258.75 },
  { zone: 'W', startAngle: 258.75, endAngle: 281.25 },
  { zone: 'WNW', startAngle: 281.25, endAngle: 303.75 },
  { zone: 'NW', startAngle: 303.75, endAngle: 326.25 },
  { zone: 'NNW', startAngle: 326.25, endAngle: 348.75 },
  { zone: 'N', startAngle: 348.75, endAngle: 11.25 }, // Special case for N zone wrapping around 0/360
];


// --- CONSTANTS ---
const COLORS = {
  EXCELLENT: "#10B981", // Green
  GOOD: "#34D399", // Lighter Green
  BAD: "#F59E0B", // Amber
  CRITICAL: "#EF4444", // Red
};

const getVerdictTextColor = (verdict: string) => {
  switch (verdict) {
    case "EXCELLENT": return "text-green-800";
    case "GOOD": return "text-green-700";
    case "BAD": return "text-orange-800";
    case "CRITICAL": return "text-red-800";
    default: return "text-gray-700";
  }
};

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
  const reportContentRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [vastuAnalysisResult, setVastuAnalysisResult] = useState<VastuAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoneGraphData, setZoneGraphData] = useState<any[]>([]);



  // --- PDF Export Logic ---
  const handleExportPdf = async () => {
    if (!reportContentRef.current) {
      alert("Report content not found for PDF export.");
      return;
    }

    setLoading(true);
    setError(null);

    const pdf = new jsPDF("p", "mm", "a4");

    const node = reportContentRef.current;
    const originalWidth = node.style.width;
    const originalMargin = node.style.margin;
    const originalBackground = node.style.background;
    const originalOverflow = node.style.overflow; // Save original overflow

    const CAPTURE_WIDTH = 794; // A4 width in px (roughly 210mm @ 96 DPI)

    // Temporarily force the report container width and set background
    node.style.width = `${CAPTURE_WIDTH}px`;
    node.style.margin = "0"; // Explicitly remove margin during capture
    node.style.background = "white"; // Ensure white background for PDF
    node.style.overflow = "visible"; // Ensure content is not clipped

    // Temporarily hide no-print elements and record their original display styles
    const originalNoPrintDisplays: string[] = [];
    node.querySelectorAll('.no-print').forEach((el: Element) => {
      originalNoPrintDisplays.push((el as HTMLElement).style.display);
      (el as HTMLElement).style.display = 'none';
    });

    try {
      // Wait for any responsive adjustments to take effect
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for rendering

      // Capture at high resolution (CRUCIAL)
      const dataUrl = await domToImage.toPng(node, {
        width: CAPTURE_WIDTH,
        height: node.scrollHeight, // Capture full scroll height
        style: {
          transform: "none", // Explicitly reset all transforms
          transformOrigin: "top left",
          overflow: "visible", // Ensure overflow is visible during capture
          boxSizing: "content-box", // Ensure consistent box model
          padding: "0", // Remove padding during capture to prevent visual shifts
          // Add other common resets if needed, e.g., perspective: 'none', filter: 'none'
        },
        quality: 1, // High quality
        cacheBust: true,
      });

      // Insert into jsPDF (CENTERED & FULL WIDTH)
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm (A4)
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm (A4)

      const imgProps = pdf.getImageProperties(dataUrl);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Center vertically if it fits on one page
      const yOffset = imgHeight < pdfHeight
        ? (pdfHeight - imgHeight) / 2
        : 0; // If content is taller than one page, start from top

      pdf.addImage(
        dataUrl,
        "PNG",
        0, // x: Start from left edge. CSS within captured image handles internal centering if any.
        yOffset,
        pdfWidth, // Use full PDF width for the image
        imgHeight
      );

      // Handle pagination if imgHeight exceeds one page.
      // The image is a single long image. For subsequent pages, we need to shift the image up.
      let heightLeft = imgHeight;
      let position = yOffset; // Current y position of the image on the PDF

      while (heightLeft > pdfHeight) { // As long as there's more content than a page
        pdf.addPage();
        position -= pdfHeight; // Shift the image up by one page height
        pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }


      pdf.save(`Vastu_Report_${project?.name || projectId}.pdf`);
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF. Please try again.");
      alert("Failed to generate PDF. Please try again.");
    } finally {
      // Restore original styles
      node.style.width = originalWidth;
      node.style.margin = originalMargin;
      node.style.background = originalBackground;
      node.style.overflow = originalOverflow; // Restore original overflow
      // Restore original display styles for no-print elements
      let i = 0;
      node.querySelectorAll('.no-print').forEach((el: Element) => {
        (el as HTMLElement).style.display = originalNoPrintDisplays[i++];
      });
      setLoading(false);
    }
  };
  // --- DATA FETCHING ---
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
        const analysisResponse = await fetch(`/api/analysis/full-report?analysisId=${analysisId}`);
        if (!analysisResponse.ok) {
          const errorDetail = await analysisResponse.json();
          throw new Error(errorDetail.error || "Failed to fetch Vastu analysis report.");
        }
        const vastuData: VastuAnalysisResult = await analysisResponse.json();
        setVastuAnalysisResult(vastuData);

        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) {
          throw new Error("Failed to fetch project details.");
        }
        const projectData = await projectResponse.json();
        setProject(projectData.project);

        if (projectData.project.north_direction !== null) {
          setLiveNorthDirection(projectData.project.north_direction);
        }

        // Calculate and set zone graph data
        if (projectData.project.boundary_normalized) {
          const getCentroid = (points: Point[]): Point => {
            let x = 0;
            let y = 0;
            points.forEach(p => {
              x += p.x;
              y += p.y;
            });
            return { x: x / points.length, y: y / points.length };
          };
          const centroid = getCentroid(projectData.project.boundary_normalized);
          const zones = ZONES_DEFINITION;

          const boundaryDistribution = calculateBoundaryDistribution(projectData.project.boundary_normalized, centroid, zones);
          
          const zoneAreas = vastuData.analyzed_objects.reduce((acc, obj) => {
            if (obj.zone16_direction) {
              if (!acc[obj.zone16_direction]) {
                acc[obj.zone16_direction] = 0;
              }
              acc[obj.zone16_direction] += 1; // Assuming area is proportional to object count for now
            }
            return acc;
          }, {} as Record<string, number>);

          const areaData = Object.keys(zoneAreas).map(zone => ({ zone, area: zoneAreas[zone] }));

          const areaDistribution = calculateAreaDistribution(areaData);

          const mergedData = zones.map(zone => {
            const boundaryData = boundaryDistribution.find(b => b.zone === zone.zone);
            const areaData = areaDistribution.find(a => a.zone === zone.zone);
            return {
              zone: zone.zone,
              boundaryPercent: boundaryData ? boundaryData.boundaryPercent : 0,
              areaPercent: areaData ? areaData.areaPercent : 0,
            };
          });

          setZoneGraphData(mergedData);
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

  // --- RENDER LOGIC ---
  if (loading && !vastuAnalysisResult) { // Show initial loading screen
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
    <div className="min-h-screen bg-gray-100 text-gray-900 p-8 print-container">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-8 no-print">
        <h1 className="text-4xl font-bold">
          Vastu Analysis Report for {project.name}
        </h1>
        <div>
          <p className="text-sm text-gray-500">Created by: {project.creator_name}</p>
          <p className="text-sm text-gray-500">Report for: {project.report_for}</p>
        </div>
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link href={`/projects/${projectId}`} className="text-gray-500 hover:text-gray-800">Overview</Link>
          <Link href={`/projects/${projectId}/floor-plan`} className="text-gray-500 hover:text-gray-800">Floor Plan</Link>
          <Link href={`/projects/${projectId}/report`} className="text-blue-600 border-b-2 border-blue-600 font-semibold">Report</Link>
        </nav>
        <button
          onClick={handleExportPdf}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded shadow no-print disabled:bg-gray-400"
        >
          {loading ? 'Preparing...' : 'Save as PDF'}
        </button>
      </div>

      <div id="report-content" ref={reportContentRef} className="bg-white">
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
                  startAngle={90}
                  endAngle={90 - (360 * vastuAnalysisResult.overall_percentage / 100)}
                >
                  <RadialBar cornerRadius={10} background dataKey="uv" />
                  <Tooltip formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, 'Score']} />
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
                      value: count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {Object.keys(
                      vastuAnalysisResult.analyzed_objects.reduce((acc, obj) => {
                        acc[obj.verdict] = (acc[obj.verdict] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map((verdict, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[verdict as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {zoneGraphData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <ZoneBarChart
              data={zoneGraphData}
              chartType="boundary"
              title="Directional Boundary Distribution"
            />
            <ZoneBarChart
              data={zoneGraphData}
              chartType="area"
              title="Zone Area Distribution"
            />
          </div>
        )}

        <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Detailed Object Report</h2>
          {vastuAnalysisResult.analyzed_objects.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No objects placed for detailed analysis.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Object Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devta</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verdict</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vastuAnalysisResult.analyzed_objects.map((obj) => (
                    <tr key={obj.object_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{obj.object_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obj.zone16_direction || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obj.devta_region || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obj.score_impact}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVerdictColor(obj.verdict)} ${getVerdictTextColor(obj.verdict)}`}>
                          {obj.verdict}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obj.message}</td>
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



