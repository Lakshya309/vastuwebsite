"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { feasibleDiagonalInterval } from "@/lib/plotGeometry";

export default function NewProjectPage() {
  const [projectName, setProjectName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [reportFor, setReportFor] = useState("");
  const [plotType, setPlotType] = useState<"upload" | "manual">("upload");
  const [isIrregular, setIsIrregular] = useState(false);
  const [plotWidth, setPlotWidth] = useState("");
  const [plotHeight, setPlotHeight] = useState("");
  const [sideFront, setSideFront] = useState("");
  const [sideBack, setSideBack] = useState("");
  const [sideLeft, setSideLeft] = useState("");
  const [sideRight, setSideRight] = useState("");
  const [diagonal, setDiagonal] = useState("");
  const [astrologerCode, setAstrologerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyType, setPropertyType] = useState<"residential" | "commercial">("residential");
  const [commercialType, setCommercialType] = useState<string>("general");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Client-side validation for irregular plots
      if (plotType === "manual" && isIrregular) {
        const a = parseFloat(sideFront);
        const b = parseFloat(sideBack);
        const c = parseFloat(sideLeft);
        const d = parseFloat(sideRight);
        const e = diagonal ? parseFloat(diagonal) : null;

        if (!a || !b || !c || !d || a <= 0 || b <= 0 || c <= 0 || d <= 0) {
          throw new Error("All four sides must be positive numbers");
        }

        const interval = feasibleDiagonalInterval(a, b, c, d);
        if (!interval) {
          throw new Error(
            "Invalid plot: these four sides cannot form a quadrilateral. Adjust the side lengths."
          );
        }
        if (e) {
          if (e <= interval.min || e >= interval.max) {
            throw new Error(
              `Invalid diagonal: must be strictly between ${interval.min.toFixed(2)} and ${interval.max.toFixed(2)} (FL–BR diagonal).`
            );
          }
        }
      }

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
          plot_side_front: plotType === "manual" && isIrregular ? parseFloat(sideFront) : null,
          plot_side_back: plotType === "manual" && isIrregular ? parseFloat(sideBack) : null,
          plot_side_left: plotType === "manual" && isIrregular ? parseFloat(sideLeft) : null,
          plot_side_right: plotType === "manual" && isIrregular ? parseFloat(sideRight) : null,
          plot_diagonal: plotType === "manual" && isIrregular && diagonal ? parseFloat(diagonal) : null,
          expert_code: astrologerCode || null,
          metadata: {
            property_type: propertyType,
            commercial_type: propertyType === "commercial" ? commercialType : undefined
          }
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
            
            {/* Property Type Selector */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Property Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPropertyType("residential")}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                    propertyType === "residential"
                      ? "border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/10 shadow-sm scale-[1.02]"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <span className="text-2xl mb-1">🏠</span>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Residential</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyType("commercial")}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                    propertyType === "commercial"
                      ? "border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/10 shadow-md scale-[1.02]"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <span className="text-2xl mb-1">🏢</span>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Commercial</span>
                </button>
              </div>
            </div>

            {propertyType === "commercial" && (
              <div className="pt-2 space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Commercial Subtype
                </label>
                <select
                  value={commercialType}
                  onChange={(e) => setCommercialType(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="general">General Commercial</option>
                  <option value="commercial_kitchen">Commercial Kitchen</option>
                  <option value="factory">Factory / Manufacturing</option>
                  <option value="shop">Retail Shop</option>
                  <option value="office">Office / Corporate</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="food">Food Business (Restaurant/Café)</option>
                </select>
              </div>
            )}

            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Connect with Expert</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono placeholder:font-sans"
                placeholder="EXPERT-CODE-123 (Optional)"
                value={astrologerCode}
                onChange={(e) => setAstrologerCode(e.target.value.toUpperCase())}
              />
              <p className="text-[10px] text-gray-400 mt-2 ml-1 italic">
                *Entering an expert code will automatically share this project with your consultant.
              </p>
            </div>

            <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setPlotType("upload")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${plotType === "upload"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Upload Map
              </button>
              <button
                type="button"
                onClick={() => setPlotType("manual")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${plotType === "manual"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Manual Plot
              </button>
            </div>

            {plotType === "manual" && (
              <div className="space-y-4">
                <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setIsIrregular(false)}
                    className={`flex-1 py-1 px-2 text-xs font-medium rounded-md transition-colors ${!isIrregular
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Regular (Sq/Rect)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsIrregular(true)}
                    className={`flex-1 py-1 px-2 text-xs font-medium rounded-md transition-colors ${isIrregular
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Irregular (4 Sides)
                  </button>
                </div>

                {!isIrregular ? (
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="any"
                      className="w-full p-3 border rounded-lg"
                      placeholder="Length (ft)"
                      value={plotHeight}
                      onChange={(e) => setPlotHeight(e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      step="any"
                      className="w-full p-3 border rounded-lg"
                      placeholder="Breadth (ft)"
                      value={plotWidth}
                      onChange={(e) => setPlotWidth(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="any"
                        className="w-full p-2 border rounded-lg text-sm"
                        placeholder="Front Side (ft)"
                        value={sideFront}
                        onChange={(e) => setSideFront(e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        className="w-full p-2 border rounded-lg text-sm"
                        placeholder="Back Side (ft)"
                        value={sideBack}
                        onChange={(e) => setSideBack(e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        className="w-full p-2 border rounded-lg text-sm"
                        placeholder="Left Side (ft)"
                        value={sideLeft}
                        onChange={(e) => setSideLeft(e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        className="w-full p-2 border rounded-lg text-sm"
                        placeholder="Right Side (ft)"
                        value={sideRight}
                        onChange={(e) => setSideRight(e.target.value)}
                        required
                      />
                    </div>
                    <input
                      type="number"
                      step="any"
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholder="Diagonal (FL to BR) (Optional)"
                      value={diagonal}
                      onChange={(e) => setDiagonal(e.target.value)}
                    />
                  </div>
                )}
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
