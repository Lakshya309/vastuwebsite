"use client";

import React from "react";
import { useParams } from "next/navigation";
import AuthGuard from "../../../../components/AuthGuard"; // Adjust path as necessary
import Link from "next/link";

export default function ReportPage() {
  const params = useParams();
  const projectId = params.projectId;

  // Placeholder for report data
  const reportData = {
    summary: "The Vastu analysis for this property indicates a generally harmonious energy flow with minor adjustments recommended for optimal prosperity and well-being.",
    warnings: [
      "Kitchen in North-East direction may cause financial instability.",
      "Main entrance facing South could lead to stress and disputes.",
    ],
    remedies: [
      "Place a Vastu pyramid in the North-East corner of the kitchen.",
      "Hang a red curtain or place a barrier at the South-facing entrance.",
      "Introduce specific plants in certain directions to balance energies.",
    ],
    charts: "Placeholder for Vastu charts and diagrams.",
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <h1 className="text-4xl font-bold mb-4">Project: {projectId} - Report</h1>

        {/* Tabs for Overview, Floor Plan, Analysis, Report */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <Link href={`/projects/${projectId}`} className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Overview
            </Link>
            <Link href={`/projects/${projectId}/floor-plan`} className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Floor Plan
            </Link>
            <Link href={`/projects/${projectId}/analysis`} className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Analysis
            </Link>
            <Link href={`/projects/${projectId}/report`} className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Report
            </Link>
          </nav>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Final Vastu Report</h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Summary</h3>
            <p className="text-gray-700">{reportData.summary}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Warnings / Areas of Concern</h3>
            <ul className="list-disc list-inside space-y-1 text-red-700">
              {reportData.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Recommended Remedies</h3>
            <ul className="list-disc list-inside space-y-1 text-emerald-700">
              {reportData.remedies.map((remedy, index) => (
                <li key={index}>{remedy}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Charts and Diagrams</h3>
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg text-gray-500">
              {reportData.charts} (Visuals to be implemented later)
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
