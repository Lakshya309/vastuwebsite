"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const [projectName, setProjectName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [reportFor, setReportFor] = useState("");
  const [plotType, setPlotType] = useState<"upload" | "manual">("upload");
  const [plotWidth, setPlotWidth] = useState("");
  const [plotHeight, setPlotHeight] = useState("");
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
          plot_width: plotType === "manual" ? parseFloat(plotWidth) : null,
          plot_height: plotType === "manual" ? parseFloat(plotHeight) : null,
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
          <div className="space-y-4">
            <input
              type="text"
              className="w-full p-3 border rounded-lg"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
            <input
              type="text"
              className="w-full p-3 border rounded-lg"
              placeholder="Creator's name"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              required
            />
            <input
              type="text"
              className="w-full p-3 border rounded-lg"
              placeholder="Report for"
              value={reportFor}
              onChange={(e) => setReportFor(e.target.value)}
              required
            />

            <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setPlotType("upload")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  plotType === "upload"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Upload Map
              </button>
              <button
                type="button"
                onClick={() => setPlotType("manual")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  plotType === "manual"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Manual Plot
              </button>
            </div>

            {plotType === "manual" && (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="any"
                  className="w-full p-3 border rounded-lg"
                  placeholder="Width (ft)"
                  value={plotWidth}
                  onChange={(e) => setPlotWidth(e.target.value)}
                  required
                />
                <input
                  type="number"
                  step="any"
                  className="w-full p-3 border rounded-lg"
                  placeholder="Height (ft)"
                  value={plotHeight}
                  onChange={(e) => setPlotHeight(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {error && <p className="text-red-500 my-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg mt-6"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
