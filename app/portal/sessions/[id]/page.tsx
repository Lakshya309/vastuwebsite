"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function AstrologerSessionPage() {
  const params = useParams();
  const sessionId = params.id;

  // Placeholder data for a specific session
  const session = {
    id: sessionId,
    projectId: "proj123",
    clientName: "John Doe",
    status: "Pending Review",
    analysisSummary: "AI suggests a good flow but flags kitchen placement.",
    comments: "",
    floorPlanUrl: "/public/file.svg", // Placeholder for a floor plan image
  };

  return (
      <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <h1 className="text-4xl font-bold mb-4">Review Session: {sessionId}</h1>
        <p className="text-gray-600 mb-8">Client: {session.clientName} (Project ID: {session.projectId})</p>

        <div className="bg-white p-8 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Session Details</h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Current Status</h3>
            <p className="text-gray-700">{session.status}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">AI Analysis Summary</h3>
            <p className="text-gray-700">{session.analysisSummary}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Floor Plan</h3>
            <div className="w-full h-96 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {session.floorPlanUrl ? (
                <img src={session.floorPlanUrl} alt="Floor Plan" className="max-w-full max-h-full object-contain" />
              ) : (
                <p className="text-gray-500">No floor plan available</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Astrologer's Comments</h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              rows={6}
              placeholder="Add your expert insights and recommendations here..."
              defaultValue={session.comments}
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4">
            <button className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
              Save Draft
            </button>
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700">
              Submit Review
            </button>
          </div>
        </div>
      </div>
  );
}
