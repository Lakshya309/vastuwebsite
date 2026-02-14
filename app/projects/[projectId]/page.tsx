"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  created_at: string;
  status: string;
  description: string | null;
}

export default function ProjectOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        setProject(data.project);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleCompleteProject = async () => {
    if (!project) return;
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!response.ok) {
        throw new Error("Failed to complete project");
      }
      const updatedProject = await response.json();
      setProject(updatedProject.project);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  if (!project) {
    return <div className="p-8">Project not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <h1 className="text-4xl font-bold mb-4">Project: {project.name}</h1>
      <p className="text-gray-600 mb-8">ID: {project.id}</p>

      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link href={`/projects/${projectId}`} className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Overview
          </Link>
          <Link href={`/projects/${projectId}/floor-plan`} className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Floor Plan
          </Link>
          <Link href={`/projects/${projectId}/report`} className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Report
          </Link>
        </nav>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Project Details</h2>
          {project.status !== 'completed' && (
            <button
              onClick={handleCompleteProject}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Complete Project
            </button>
          )}
        </div>
        <p className="mb-2"><strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}</p>
        <p className="mb-2"><strong>Status:</strong> {project.status}</p>
        <p className="mb-2"><strong>Description:</strong> {project.description || 'N/A'}</p>
      </div>
    </div>
  );
}
