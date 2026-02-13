"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const [projectName, setProjectName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [reportFor, setReportFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          creator_name: creatorName,
          report_for: reportFor,
        }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create project");
      }

      router.push("/projects");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">
          Create New Project
        </h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="w-full p-3 border rounded-lg mb-4"
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
          <input
            type="text"
            className="w-full p-3 border rounded-lg mb-4"
            placeholder="Creator's name"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            required
          />
          <input
            type="text"
            className="w-full p-3 border rounded-lg mb-4"
            placeholder="Report for"
            value={reportFor}
            onChange={(e) => setReportFor(e.target.value)}
            required
          />

          {error && <p className="text-red-500 mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
