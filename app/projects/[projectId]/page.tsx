"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import AuthGuard from "../../../components/AuthGuard"; // Adjust path as necessary
import Link from "next/link";

export default function ProjectOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId;

  // Placeholder data for the project (in a real app, fetch from API)
  const project = {
    id: projectId,
    name: `Project ${projectId}`,
    created: "2024-01-01",
    status: "In Progress",
    description: "Detailed description of the project goes here. This could include client notes, specific requirements, and other relevant information.",
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <h1 className="text-4xl font-bold mb-4">Project: {project.name}</h1>
        <p className="text-gray-600 mb-8">ID: {project.id}</p>

        {/* Tabs for Overview, Floor Plan, Analysis, Report */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <Link href={`/projects/${projectId}`} className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Overview
            </Link>
            <Link href={`/projects/${projectId}/floor-plan`} className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Floor Plan
            </Link>
            <Link href={`/projects/${projectId}/analysis`} className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Analysis
            </Link>
            <Link href={`/projects/${projectId}/report`} className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Report
            </Link>
          </nav>
        </div>

        {/* Overview Content */}
        <div className="bg-white p-8 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Project Details</h2>
          <p className="mb-2"><strong>Created:</strong> {project.created}</p>
          <p className="mb-2"><strong>Status:</strong> {project.status}</p>
          <p className="mb-2"><strong>Description:</strong> {project.description}</p>
          {/* Add more project details here */}
        </div>
      </div>
    </AuthGuard>
  );
}
