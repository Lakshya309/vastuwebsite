"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import AuthGuard from "../../../../components/AuthGuard";
import Link from "next/link";
import { useAuthStore } from "../../../../lib/store/authStore";
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
import { Point } from "../../../../lib/coordinates";
import { ObjectAnalysisResult, IncorrectPoint } from "../../../../lib/vastu/objectAnalysis";

interface Project {
  id: string;
  name: string;
}

interface PlacedObject {
  id: string;
  object_type: string;
  vastu_status: "good" | "neutral" | "bad";
  devta_zone?: string;
  analysis_result?: ObjectAnalysisResult;
}

const COLORS = {
  good: "#10B981", // Green
  neutral: "#F59E0B", // Amber
  bad: "#EF4444", // Red
};

export default function ReportPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, idToken } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectAndObjects = async () => {
      if (!user || !projectId || !idToken) return;
      setLoading(true);
      try {
        const [projectResponse, objectsResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch(`/api/projects/${projectId}/objects`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        ]);

        if (!projectResponse.ok) throw new Error("Failed to fetch project data.");
        if (!objectsResponse.ok) throw new Error("Failed to fetch objects.");

        const projectData = await projectResponse.json();
        const objectsData = await objectsResponse.json();

        setProject(projectData.project);
        setPlacedObjects(objectsData.objects);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectAndObjects();
  }, [user, projectId, idToken]);

  const overallScore = (() => {
    if (placedObjects.length === 0) return 0;
    const goodObjects = placedObjects.filter(
      (obj) => obj.analysis_result && obj.analysis_result.incorrectPoints.length === 0
    ).length;
    return (goodObjects / placedObjects.length) * 100;
  })();

  const dataForPie = [
    { name: "Good", value: placedObjects.filter((obj) => obj.analysis_result && obj.analysis_result.incorrectPoints.length === 0).length },
    { name: "Bad", value: placedObjects.filter((obj) => obj.analysis_result && obj.analysis_result.incorrectPoints.length > 0).length },
  ];

  const radialData = [
    {
      name: "Vastu Score",
      uv: overallScore,
      fill: overallScore > 75 ? COLORS.good : overallScore > 40 ? COLORS.neutral : COLORS.bad,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading Report...</p>
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100 text-gray-900 p-8">
        <h1 className="text-4xl font-bold mb-4">
          Vastu Analysis Report for {project?.name}
        </h1>
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <Link href={`/projects/${projectId}`}>Overview</Link>
            <Link href={`/projects/${projectId}/floor-plan`}>Floor Plan</Link>
            <Link href={`/projects/${projectId}/analysis`}>Analysis</Link>
            <Link href={`/projects/${projectId}/report`}>Report</Link>
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Overall Score */}
          <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-4">Overall Vastu Score</h2>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart
                innerRadius="90%"
                outerRadius="70%"
                barSize={20}
                data={radialData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background
                  clockWise
                  dataKey="uv"
                />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  wrapperStyle={{ top: "50%", right: 0, transform: "translate(0, -50%)" }}
                />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
             <p className="text-5xl font-bold" style={{color: radialData[0].fill}}>{overallScore.toFixed(0)}%</p>
             <p className="text-lg text-gray-600">Compliance</p>
          </div>

          {/* Object Status Distribution */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Object Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataForPie}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {dataForPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Object Report */}
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Detailed Object Report</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Object Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Devta Zone (Centroid)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incorrect Placements
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {placedObjects.map((obj) => (
                  <tr key={obj.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {obj.object_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {obj.analysis_result?.devtaName || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {obj.analysis_result && obj.analysis_result.incorrectPoints.length > 0 ? (
                        <ul className="list-disc list-inside text-red-600">
                          {obj.analysis_result.incorrectPoints.map((ip, index) => (
                            <li key={index}>{ip.devtaName}</li>
                          ))}
                        </ul>
                      ) : (
                        "None"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                        style={{
                          backgroundColor: `${obj.analysis_result && obj.analysis_result.incorrectPoints.length > 0 ? COLORS.bad : COLORS.good}20`,
                          color: obj.analysis_result && obj.analysis_result.incorrectPoints.length > 0 ? COLORS.bad : COLORS.good,
                        }}
                      >
                        {obj.analysis_result && obj.analysis_result.incorrectPoints.length > 0 ? "Bad" : "Good"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
