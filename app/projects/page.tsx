"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "../../components/AuthGuard"; // Adjust path as necessary
import { useAuthStore } from "../../lib/store/authStore"; // Import the auth store
import { auth } from "../../lib/firebase"; // Import firebase auth instance

interface Project {
  id: string;
  name: string;
  created: string; // This should ideally be a Date or ISO string
  status: string;
}

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user || authLoading) {
        setLoading(false);
        return; // Wait for auth to load or user to be available
      }

      setLoading(true);
      setError(null);
      try {
        const idToken = await user.getIdToken(); // Get Firebase ID token

        const response = await fetch("/api/projects", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`, // Send ID token
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch projects");
        }

        const data = await response.json();
        // Assuming the API returns projects with 'created' as a string
        setProjects(data.projects.map((p: any) => ({
          ...p,
          created: new Date(p.createdAt).toLocaleDateString(), // Format date for display
        })));
      } catch (err: any) {
        console.error("Error fetching projects:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, authLoading]); // Re-run when user or authLoading changes

  if (loading || authLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8 flex justify-center items-center">
          Loading Projects...
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
          <p className="text-red-500 text-center">{error}</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Your Projects</h1>
          <Link href="/projects/new">
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300">
              + New Project
            </button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center text-gray-600 p-12 bg-white rounded-2xl shadow-sm">
            <p className="text-lg mb-4">No projects found. Start by creating a new one!</p>
            <Link href="/projects/new">
              <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300">
                Create New Project
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Link href={`/projects/${project.id}`} key={project.id}>
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer">
                  <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                  <p className="text-gray-600 text-sm mb-2">Created: {project.created}</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === "Completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : project.status === "In Progress"
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {project.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
