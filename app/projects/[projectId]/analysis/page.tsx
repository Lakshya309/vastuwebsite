"use client";

import React from "react";
import { useParams } from "next/navigation";
import AuthGuard from "../../../../components/AuthGuard"; // Adjust path as necessary
import Link from "next/link";

export default function AnalysisPage() {
  const params = useParams();
  const projectId = params.projectId;

  // Placeholder for analysis data
  const analysisResults = [
    { item: "Diya", direction: "North-East", confidence: "82%" },
    { item: "Idol", direction: "East", confidence: "76%" },
    { item: "Kitchen", direction: "South-East", confidence: "90%" },
    { item: "Bedroom", direction: "South-West", confidence: "88%" },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <h1 className="text-4xl font-bold mb-4">Project: {projectId} - Analysis</h1>

        {/* Tabs for Overview, Floor Plan, Analysis, Report */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <Link href={`/projects/${projectId}`} className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Overview
            </Link>
            <Link href={`/projects/${projectId}/floor-plan`} className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Floor Plan
            </Link>
            <Link href={`/projects/${projectId}/analysis`} className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Analysis
            </Link>
            <Link href={`/projects/${projectId}/report`} className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Report
            </Link>
          </nav>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">AI Analysis Results</h2>
          <div className="space-y-4">
            {analysisResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-lg font-medium">{result.item}</span>
                  <span className="text-sm text-gray-600">Detected Direction: {result.direction}</span>
                </div>
                <span className="text-indigo-600 font-semibold">{result.confidence}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-gray-600 italic">
            *AI hints are non-final and subject to human astrologer review.
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}
