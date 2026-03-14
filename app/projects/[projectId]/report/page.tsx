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
import html2canvas from 'html2canvas';
import jsPDF from "jspdf";
import { Point, PlacedObject } from "../../../../lib/floorPlanInterfaces";
import { calculateBoundaryDistribution } from "../../../utils/calculateBoundaryDistribution";
import { calculateAreaDistribution } from "../../../utils/calculateAreaDistribution";
import { ZoneBarChart } from "../../../../components/ZoneBarChart";
import { DevtaBarChart } from "../../../../components/DevtaBarChart";
import { FloorPlanCanvas } from "../../../../components/floor-plan/FloorPlanCanvas";

// --- INTERFACES ---

interface Project {
  id: string;
  name: string;
  creator_name?: string;
  report_for?: string;
  floor_plan_path?: string | null; // Added to interface for image
  boundary_normalized: Point[] | null;
  north_direction: number | null;
  placed_objects: PlacedObject[] | null;
}


interface AnalyzedObjectResult {
  object_id: string;
  object_type: string;
  devta_region: string | null;
  zone16_direction: string | null;
  score_impact: number;
  grade?: string | null;
  verdict: "EXCELLENT" | "GOOD" | "BAD" | "CRITICAL";
  message: string;
}

interface DevtaArea {
  name: string;
  area: number;
  percentage: number;
}

interface VastuAnalysisResult {
  analyzed_objects: AnalyzedObjectResult[];
  total_score: number;
  overall_percentage: number;
  overall_verdict: "EXCELLENT" | "GOOD" | "BAD" | "CRITICAL";
  devta_areas_32: DevtaArea[];
  devta_areas_45: DevtaArea[];
  zone_areas_16: DevtaArea[];
  zone_boundary_16: DevtaArea[];
  zones16: any[];
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
  { zone: 'N', startAngle: 348.75, endAngle: 11.25 },
];


// --- CONSTANTS ---
const COLORS = {
  EXCELLENT: "#10B981",
  GOOD: "#34D399",
  BAD: "#F59E0B",
  CRITICAL: "#EF4444",
};

const getVerdictTextColor = (verdict: string) => {
  switch (verdict) {
    case "EXCELLENT": return { color: 'rgb(22 101 52)' };
    case "GOOD": return { color: 'rgb(21 128 61)' };
    case "BAD": return { color: 'rgb(180 83 9)' };
    case "CRITICAL": return { color: 'rgb(185 28 28)' };
    default: return { color: 'rgb(75 85 99)' };
  }
};

const getVerdictColor = (verdict: string) => {
  switch (verdict) {
    case "EXCELLENT": return { backgroundColor: 'rgb(209 250 229)' };
    case "GOOD": return { backgroundColor: 'rgb(209 250 229)' };
    case "BAD": return { backgroundColor: 'rgb(254 243 199)' };
    case "CRITICAL": return { backgroundColor: 'rgb(254 226 226)' };
    default: return { backgroundColor: 'rgb(243 244 246)' };
  }
};

// --- COMPONENT ---
export default function ReportPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { setLiveNorthDirection } = useProjectStore();
  const reportContentRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [vastuAnalysisResult, setVastuAnalysisResult] = useState<VastuAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoneGraphData, setZoneGraphData] = useState<any[]>([]);
  const [highlightedZones, setHighlightedZones] = useState<string[]>([]);
  const [reportSections, setReportSections] = useState({
    overallCompliance: true,
    objectDistribution: true,
    boundaryDistribution: true,
    areaDistribution: true,
    devta32: true,
    devta45: true,
    floorPlan: true,
    detailedReport: true,
  });

  const [solution, setSolution] = useState<string | null>(null);

  const handleObjectClick = (object: PlacedObject) => {
    const analysis = vastuAnalysisResult?.analyzed_objects.find(ao => ao.object_id === object.id);
    if (analysis && analysis.message) {
      setSolution(analysis.message);
    } else {
      setSolution("No specific solution found.");
    }
  };

  const handleSectionChange = (section: keyof typeof reportSections) => {
    setReportSections(prev => ({ ...prev, [section]: !prev[section] }));
  };



  // --- PDF Export Logic ---
  const handleExportPdf = async () => {
    if (!reportContentRef.current) {
      alert("Report content not found for PDF export.");
      return;
    }

    setLoading(true);
    setError(null);

    const canvas = await html2canvas(reportContentRef.current, {
      backgroundColor: '#ffffff',
    });
    const dataUrl = canvas.toDataURL('image/png');

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(dataUrl);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`Vastu_Report_${project?.name || projectId}.pdf`);

    setLoading(false);
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

        const badZones = vastuData.analyzed_objects
          .filter(obj => obj.verdict === 'BAD' || obj.verdict === 'CRITICAL')
          .map(obj => obj.zone16_direction)
          .filter((zone): zone is string => zone !== null);
        setHighlightedZones([...new Set(badZones)]);

        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) {
          throw new Error("Failed to fetch project details.");
        }
        const projectData = await projectResponse.json();
        setProject(projectData.project);

        if (projectData.project.north_direction !== null) {
          setLiveNorthDirection(projectData.project.north_direction);
        }

        // Calculate and set zone graph data using the more accurate API results
        const mergedData = ZONES_DEFINITION.map(zDef => {
          const areaData = vastuData.zone_areas_16.find(a => a.name === zDef.zone);
          const boundaryData = vastuData.zone_boundary_16.find(b => b.name === zDef.zone);
          return {
            zone: zDef.zone,
            boundaryPercent: boundaryData ? boundaryData.percentage : 0,
            areaPercent: areaData ? areaData.percentage : 0,
          };
        });

        setZoneGraphData(mergedData);

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

      <div className="bg-white p-4 rounded-lg shadow-md mb-8 no-print">
        <h3 className="text-lg font-semibold mb-2">Customize Report</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(reportSections).map(key => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={reportSections[key as keyof typeof reportSections]}
                onChange={() => handleSectionChange(key as keyof typeof reportSections)}
                className="rounded text-blue-600"
              />
              <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important; /* A4 width */
            height: 297mm !important; /* A4 height */
            overflow: hidden !important; /* Prevent scrollbars on print */
          }
          @page {
            size: A4;
            margin: 0;
          }
          .print-container {
            width: 210mm !important;
            box-sizing: border-box !important;
            padding: 10mm !important; /* Add some padding for content inside A4 */
            background-color: #fff !important;
            color: #000 !important;
          }
          /* Hide elements that shouldn't appear in print */
          .no-print, .no-print * {
            display: none !important;
          }
          /* Adjust font sizes for print readability */
          h1, h2, h3, h4, h5, h6 {
            font-size: unset !important; /* Reset to allow relative scaling */
          }
          .text-4xl { font-size: 24pt !important; }
          .text-2xl { font-size: 16pt !important; }
          .text-xl { font-size: 14pt !important; }
          .text-lg { font-size: 12pt !important; }
          .text-base { font-size: 10pt !important; }
          .text-sm { font-size: 9pt !important; }
          .text-xs { font-size: 8pt !important; }
          
          /* Ensure charts and images scale correctly */
          .recharts-responsive-container {
            width: 100% !important;
            height: auto !important;
            max-height: 120mm; /* Increased limit to accommodate taller devta charts */
          }
          img {
            max-width: 100% !important;
            height: auto !important;
          }

          /* Control table layout for print */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            padding: 8px 5px !important;
            border: 1px solid #ccc !important;
            font-size: 9pt !important;
            white-space: normal !important; /* Allow text to wrap */
          }
          thead {
            display: table-header-group !important; /* Repeat table headers on each page */
          }
          tr {
            page-break-inside: avoid !important; /* Avoid breaking rows across pages */
            page-break-after: auto !important;
          }
          /* Ensure content within these divs doesn't break poorly */
          .grid {
            display: block !important; /* Break grid layout for print */
          }
          .grid > div {
            width: 100% !important;
            margin-bottom: 10mm !important; /* Space between sections */
            page-break-inside: avoid !important;
          }
          .page-break-before-detailed-report {
            page-break-before: always !important;
            margin-top: 0 !important; /* Remove top margin when breaking page */
          }
        }
      `}</style>

      <div id="report-content" ref={reportContentRef} className="bg-white p-8">
        {/* Professional Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              MV
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manglam Vastu</h2>
              <p className="text-sm text-gray-600 italic">Vedic Architecture & Sacred Science</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-extrabold text-blue-700 uppercase tracking-tight">Vastu Analysis Report</h1>
            <div className="mt-2 space-y-1">
              <p className="text-sm font-medium text-gray-700">Project: <span className="text-gray-900">{project.name}</span></p>
              <p className="text-sm font-medium text-gray-700">Created For: <span className="text-gray-900">{project.report_for || "Valued Client"}</span></p>
              <p className="text-sm font-medium text-gray-700">Expert: <span className="text-gray-900">{project.creator_name || "Yogesh Keshwani"}</span></p>
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {reportSections.overallCompliance && vastuAnalysisResult.analyzed_objects.length > 0 && (
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
                    <RadialBar cornerRadius={10} background={{ fill: '#eeeeee' }} dataKey="uv" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cccccc' }}
                      itemStyle={{ color: '#000000' }}
                      formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, 'Score']}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>                <p
                  className="absolute inset-0 flex items-center justify-center text-5xl font-bold"
                  style={{ color: COLORS[vastuAnalysisResult.overall_verdict] }}
                >
                  {vastuAnalysisResult.overall_percentage.toFixed(0)}%
                </p>
              </div>
              <p className="text-lg text-gray-600 mt-2">
                Status: <span className="font-bold" style={getVerdictTextColor(vastuAnalysisResult.overall_verdict)}>
                  {vastuAnalysisResult.overall_verdict}
                </span>
              </p>
              <p className="text-sm text-gray-500">Total Score: {vastuAnalysisResult.total_score}</p>
            </div>
          )}

          {reportSections.objectDistribution && vastuAnalysisResult.analyzed_objects.length > 0 && (
            <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Object Status Distribution</h2>
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
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cccccc' }}
                    itemStyle={{ color: '#000000' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {zoneGraphData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {reportSections.boundaryDistribution && (
              <ZoneBarChart
                data={zoneGraphData}
                chartType="boundary"
                title="Directional Boundary Distribution"
              />
            )}
            {reportSections.areaDistribution && (
              <ZoneBarChart
                data={zoneGraphData}
                chartType="area"
                title="Zone Area Distribution"
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 mb-8">
          {reportSections.devta32 && vastuAnalysisResult.devta_areas_32 && vastuAnalysisResult.devta_areas_32.length > 0 && (
            <DevtaBarChart
              data={vastuAnalysisResult.devta_areas_32}
              title="Outer 32 Devta Area Distribution (%)"
              color="#3b82f6"
            />
          )}
          {reportSections.devta45 && vastuAnalysisResult.devta_areas_45 && vastuAnalysisResult.devta_areas_45.length > 0 && (
            <DevtaBarChart
              data={vastuAnalysisResult.devta_areas_45}
              title="Complete 45 Devta Area Distribution (%)"
              color="#10b981"
            />
          )}
        </div>

        {reportSections.floorPlan && vastuAnalysisResult.analyzed_objects.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg page-break-before-detailed-report">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Floor Plan Overview</h2>
            <div className="flex justify-center">
              <div className="w-[500px] h-[500px]">
                <FloorPlanCanvas
                  isStatic={true}
                  floorPlanImage={project.floor_plan_path || null}
                  boundary={project.boundary_normalized || []}
                  placedObjects={(project.placed_objects || []).map(obj => {
                    const analysis = vastuAnalysisResult.analyzed_objects.find(ao => ao.object_id === obj.id);
                    return {
                      ...obj,
                      highlight: analysis ? analysis.verdict : null,
                    }
                  })}
                  objectSvgMap={new Proxy({
                    "Stove": "/objects/stove.svg",
                    "Toilet": "/objects/toilet.svg",
                    "Bed": "/objects/bed.svg",
                    "Wardrobe": "/objects/wardrobe.svg",
                    "Sofa": "/objects/sofa.svg",
                    "Pooja": "/objects/pooja.png",
                    "Staircase": "/objects/stairs.svg",
                    "Dining Room": "/objects/dining.svg",
                    "Overhead Tank": "/objects/overheadtank.png",
                    "Underground Tank": "/objects/undergroundtank.png",
                    "Kitchen": "/objects/stove.svg",
                  }, {
                    get: (target: Record<string, string>, prop: string | symbol) => {
                      if (typeof prop === 'string') {
                        if (target[prop]) return target[prop];
                        const titleCase = prop.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                        if (target[titleCase]) return target[titleCase];
                      }
                      return "/objects/generic.svg";
                    }
                  })}
                  northDirection={project.north_direction || 0}
                  onMoveObject={() => { }}
                  onResizeObject={() => { }}
                  onRotateObject={() => { }}
                  onDeleteObject={() => { }}
                  scale={null}
                  wallLengths={[]}
                  setReferenceWallIndex={() => { }}
                  referenceWallIndex={null}
                  wallColors={[]}
                  zone16Regions={vastuAnalysisResult.zones16}
                  highlightedZones={highlightedZones}
                  onObjectClick={handleObjectClick}
                />
              </div>
            </div>
          </div>
        )}

        {solution && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold mb-4">Suggested Solution</h3>
              <p>{solution}</p>
              <button
                onClick={() => setSolution(null)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}


        {reportSections.detailedReport && vastuAnalysisResult.analyzed_objects.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg page-break-before-detailed-report">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Detailed Object Report</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Object Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devta</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {obj.grade && (
                          <span
                            className="px-2 inline-flex text-xs leading-5 font-bold rounded-full text-white"
                            style={{
                              backgroundColor: obj.grade === "B" ? "green" : obj.grade === "C" ? "orange" : "red",
                            }}
                          >
                            {obj.grade}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" style={{ ...getVerdictColor(obj.verdict), ...getVerdictTextColor(obj.verdict) }}>
                          {obj.verdict}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={{ whiteSpace: "normal" }}>{obj.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}