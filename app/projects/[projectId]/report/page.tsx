"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import Link from "next/link";
import { useProjectStore } from "../../../../lib/store/projectStore"; // Import the project store
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart,
  RadialBar, Legend, Tooltip,
} from "recharts";
import { Point } from "../../../../lib/coordinates";
import {
  analyzeObjectPlacement,
  ObjectAnalysisResult,
} from "../../../../lib/vastu/objectAnalysis";
import { generate45Devtas } from "../../../../lib/vastu/devtaAnalysis";
import { generateMarmaPoints } from "../../../../lib/vastu/marmaAnalysis";

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
}

// --- CONSTANTS ---
const COLORS = {
  good: "#10B981", // Green
  bad: "#EF4444", // Red
};

// --- COMPONENT ---
export default function ReportPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { liveNorthDirection, setLiveNorthDirection } = useProjectStore();

  // --- STATE ---
  
  // Data from DB
  const [project, setProject] = useState<Project | null>(null);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  
  // Derived/Computed State
  const [reportAnalyses, setReportAnalyses] = useState<Record<string, ObjectAnalysisResult>>({});

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchProjectAndObjects = async () => {
      if (  !projectId) return;
      setLoading(true);
      try {
        const [projectResponse, objectsResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}`, {
          }),
          fetch(`/api/projects/${projectId}/objects`, {
          }),
        ]);

        if (!projectResponse.ok) throw new Error("Failed to fetch project data.");
        if (!objectsResponse.ok) throw new Error("Failed to fetch objects.");

        const projectData = await projectResponse.json();
        const objectsData = await objectsResponse.json();

        setProject(projectData.project);
        setPlacedObjects(objectsData.objects);

        // Initialize liveNorthDirection from saved value if it hasn't been set
        if (projectData.project.north_direction !== null) {
            setLiveNorthDirection(projectData.project.north_direction);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectAndObjects();
  }, [ projectId, setLiveNorthDirection]);

  // --- REAL-TIME ANALYSIS ENGINE (for Report) ---
  useEffect(() => {
    if (!project || !project.boundary_normalized || project.boundary_normalized.length < 3) return;

    const { boundary_normalized } = project;
    const devtaRegions = generate45Devtas(boundary_normalized, liveNorthDirection) || [];
    const marmaPoints = generateMarmaPoints(boundary_normalized, liveNorthDirection);

    const newAnalyses: Record<string, ObjectAnalysisResult> = {};
    for (const obj of placedObjects) {
      newAnalyses[obj.id] = analyzeObjectPlacement(
        obj.boundary_normalized,
        obj.object_type,
        devtaRegions,
        marmaPoints,
        boundary_normalized,
        liveNorthDirection,
      );
    }
    setReportAnalyses(newAnalyses);

  }, [project, placedObjects, liveNorthDirection]);


  // --- DERIVED DATA FOR CHARTS ---
  const analysisValues = Object.values(reportAnalyses);
  const goodObjectsCount = analysisValues.filter(a => a.incorrectPoints.length === 0).length;
  const badObjectsCount = analysisValues.length - goodObjectsCount;
  
  const overallScore = analysisValues.length > 0 ? (goodObjectsCount / analysisValues.length) * 100 : 0;

  const dataForPie = [
    { name: "Good", value: goodObjectsCount },
    { name: "Bad", value: badObjectsCount },
  ];

  const radialData = [{
    name: "Vastu Score",
    uv: overallScore,
    fill: overallScore > 75 ? COLORS.good : overallScore > 40 ? "#F59E0B" : COLORS.bad,
  }];

  // --- RENDER LOGIC ---
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading Report...</p></div>;
  }
  if (error) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-red-500">Error: {error}</p></div>;
  }

  return (
      <div className="min-h-screen bg-gray-100 text-gray-900 p-8">
        <h1 className="text-4xl font-bold mb-4">Vastu Analysis Report for {project?.name}</h1>
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <Link href={`/projects/${projectId}`}>Overview</Link>
            <Link href={`/projects/${projectId}/floor-plan`}>Floor Plan</Link>
            <Link href={`/projects/${projectId}/report`}>Report</Link>
          </nav>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-4">Overall Vastu Score</h2>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart innerRadius="90%" outerRadius="70%" barSize={20} data={radialData} startAngle={180} endAngle={0}>
                <RadialBar background  dataKey="uv" />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-5xl font-bold" style={{ color: radialData[0].fill }}>{overallScore.toFixed(0)}%</p>
            <p className="text-lg text-gray-600">Compliance</p>
          </div>
          <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Object Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={dataForPie} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {dataForPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Detailed Object Report</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Object Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devta Zone (Centroid)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incorrect Placements</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {placedObjects.map((obj) => {
                  const analysis = reportAnalyses[obj.id];
                  if (!analysis) return null; // Don't render if analysis isn't ready
                  const isBad = analysis.incorrectPoints.length > 0;
                  return (
                    <tr key={obj.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{obj.object_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{analysis.devtaName || "N/A"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {isBad ? (
                          <ul className="list-disc list-inside text-red-600">
                            {analysis.incorrectPoints.map((ip, index) => <li key={index}>{ip.devtaName}</li>)}
                          </ul>
                        ) : "None"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" style={{ backgroundColor: `${isBad ? COLORS.bad : COLORS.good}20`, color: isBad ? COLORS.bad : COLORS.good }}>
                          {isBad ? "Bad" : "Good"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
