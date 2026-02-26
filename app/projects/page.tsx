"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
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
  }, []);

  const handleDeleteProject = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/projects/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete project");
      }

      setProjects((prev) => prev.filter((p) => p.id !== deletingId));
      setIsConfirmingDelete(false);
      setDeletingId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        fetchProjects();
      }
    });

    fetchProjects();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProjects, supabase.auth]);

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
      {/* Delete Confirmation Modal */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Warning: Instant Deletion</h2>
            <p className="text-gray-600 mb-6">
              This action will <strong>permanently delete</strong> the project and all its associated data, including analysis reports and objects. This cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsConfirmingDelete(false);
                  setDeletingId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Delete Instantly
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Your Projects</h1>
        <Link href="/projects/new">
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg transition-transform hover:scale-105">
            + New Project
          </button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center text-gray-600 p-12 bg-white rounded-2xl border border-dashed border-gray-300">
          No projects found. Create your first project to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="group relative bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100">
              <Link href={`/projects/${project.id}`}>
                <div className="cursor-pointer">
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-indigo-600 transition-colors">{project.name}</h2>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeletingId(project.id);
                  setIsConfirmingDelete(true);
                }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                title="Delete Project"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
