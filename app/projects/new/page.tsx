"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../../../components/AuthGuard"; // Adjust path as necessary
import { useAuthStore } from "../../../lib/store/authStore"; // Import the auth store
import { auth } from "../../../lib/firebase"; // Import firebase auth instance

export default function NewProjectPage() {
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuthStore(); // Get user from auth store

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError("User not authenticated.");
      setLoading(false);
      router.push("/login"); // Redirect to login if user is somehow missing
      return;
    }

    try {
      const idToken = await user.getIdToken(); // Get Firebase ID token

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`, // Send ID token
        },
        body: JSON.stringify({ name: projectName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create project");
      }

      const data = await response.json();
      console.log("Project created successfully:", data.project);
      router.push("/projects"); // Redirect to the projects list
    } catch (err: any) {
      console.error("Error creating project:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6">Create New Project</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                id="projectName"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Client House - John Doe"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}