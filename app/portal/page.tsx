"use client";

import React from "react";
import AuthGuard from "../../components/AuthGuard"; // Adjust path as necessary
import Link from "next/link";

export default function AstrologerPortalPage() {
  // Placeholder data for astrologer sessions
  const sessions = [
    { id: "s1", projectId: "1", clientName: "John Doe", status: "Pending Review", date: "2024-03-01" },
    { id: "s2", projectId: "2", clientName: "Jane Smith", status: "Completed", date: "2024-02-20" },
    { id: "s3", projectId: "3", clientName: "Bob Johnson", status: "In Progress", date: "2024-02-10" },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <h1 className="text-4xl font-bold mb-8">Astrologer Portal</h1>

        <div className="bg-white p-8 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Pending Review Sessions</h2>
          <ul className="space-y-4">
            {sessions.map((session) => (
              <li key={session.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg shadow-sm">
                <div>
                  <h3 className="text-lg font-medium">Client: {session.clientName} (Project ID: {session.projectId})</h3>
                  <p className="text-sm text-gray-600">Status: {session.status} | Date: {session.date}</p>
                </div>
                <Link href={`/portal/sessions/${session.id}`}>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700">
                    Review
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AuthGuard>
  );
}
