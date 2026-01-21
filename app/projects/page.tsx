"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  created_at: string;
  status?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch projects");
        }

        const data = await response.json();
        setProjects(data.projects);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Projects...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Your Projects</h1>
        <Link href="/projects/new">
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg">
            + New Project
          </button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center text-gray-600 p-12 bg-white rounded-2xl">
          No projects found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md">
                <h2 className="text-xl font-semibold">{project.name}</h2>
                <p className="text-sm text-gray-600">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
