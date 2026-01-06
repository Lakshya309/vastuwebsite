"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import AuthGuard from "../../../../components/AuthGuard"; // Adjust path as necessary
import Link from "next/link";

export default function FloorPlanPage() {
  const params = useParams();
  const projectId = params.projectId;
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFloorPlanImage(e.target.result as string);
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <h1 className="text-4xl font-bold mb-4">Project: {projectId} - Floor Plan</h1>

        {/* Tabs for Overview, Floor Plan, Analysis, Report */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <Link href={`/projects/${projectId}`} className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              Overview
            </Link>
            <Link href={`/projects/${projectId}/floor-plan`} className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
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

        <div className="bg-white p-8 rounded-2xl shadow-sm">
          {/* Canvas (image + overlay) */}
          <div className="w-full h-96 border-2 border-dashed border-gray-300 flex items-center justify-center mb-6 overflow-hidden">
            {floorPlanImage ? (
              <img src={floorPlanImage} alt="Floor Plan" className="max-w-full max-h-full object-contain" />
            ) : (
              <p className="text-gray-500">Upload a floor plan image</p>
            )}
          </div>

          {/* Controls: Upload | Rotate | Reset */}
          <div className="flex space-x-4">
            <label htmlFor="floorPlanUpload" className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 cursor-pointer">
              Upload
            </label>
            <input
              id="floorPlanUpload"
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">Rotate</button>
            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg shadow-sm hover:bg-red-50">Reset</button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
