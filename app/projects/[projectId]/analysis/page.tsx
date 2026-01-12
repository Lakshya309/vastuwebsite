"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import AuthGuard from "../../../../components/AuthGuard";
import Link from "next/link";
import { useAuthStore } from "../../../../lib/store/authStore";
import { analyzeVastu, AnalysisFinding } from "../../../../lib/vastuRules";
import { VastuZone } from "../../../../lib/geometry";
import { useSupabase } from "../../../../components/SupabaseProvider"; // Import useSupabase

interface AnalysisItem {
    id: string;
    object: string;
    direction: VastuZone;
    source: string;
}

interface Analysis {
    id: string;
    status: string;
    analysis_items: AnalysisItem[];
}

interface Project {
  id: string;
  name: string;
  analysis: Analysis | null;
}

const severityColors = {
    good: "text-green-600 bg-green-50",
    neutral: "text-gray-600 bg-gray-50",
    warning: "text-yellow-600 bg-yellow-50",
    critical: "text-red-600 bg-red-50",
};

export default function AnalysisPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, role, idToken, loading: authLoading } = useAuthStore();
  const { supabase, loading: supabaseLoading } = useSupabase();

  const [project, setProject] = useState<Project | null>(null);
  const [findings, setFindings] = useState<AnalysisFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (!user || !projectId || authLoading || supabaseLoading || !idToken) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}?include_analysis=true`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch analysis data.");
      
      const data = await response.json();
      setProject(data.project);

      if (data.project.analysis) {
          const analysisItems = data.project.analysis.analysis_items.map((item: any) => ({
              type: item.object,
              zone: item.direction,
          }));
          const vastuFindings = analyzeVastu(analysisItems);
          setFindings(vastuFindings);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [user, projectId, authLoading, supabaseLoading, idToken]);

  const handleApprove = async () => {
    if (!project?.analysis || !user || !idToken) return;
    try {
        const response = await fetch(`/api/analysis/${project.analysis.id}/approve`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!response.ok) throw new Error("Failed to approve analysis.");
        // Re-fetch data to show updated status
        fetchAnalysis();
    } catch (err: any) {
        setError(err.message);
    }
  };


  if (loading || authLoading || supabaseLoading) return <div className="p-8">Loading analysis...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!project) return <div className="p-8">Project not found.</div>;

  const { analysis } = project;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <h1 className="text-4xl font-bold mb-4">Project: {project.name} - Vastu Analysis</h1>
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <Link href={`/projects/${projectId}`} /*...*/ >Overview</Link>
            <Link href={`/projects/${projectId}/floor-plan`} /*...*/ >Floor Plan</Link>
            <Link href={`/projects/${projectId}/analysis`} className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Analysis</Link>
            <Link href={`/projects/${projectId}/report`} /*...*/ >Report</Link>
          </nav>
        </div>

        {!analysis ? (
            <div className="text-center bg-white p-12 rounded-xl shadow-sm">
                <h2 className="text-2xl font-semibold mb-4">No Analysis Found</h2>
                <p className="text-gray-600 mb-6">You need to place objects on the floor plan and save them to generate an analysis.</p>
                <Link href={`/projects/${projectId}/floor-plan`}>
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700">Go to Floor Plan</button>
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    {/* Findings Section */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm">
                         <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-bold">Analysis Findings</h2>
                            <span className={`capitalize px-3 py-1 rounded-full text-sm font-medium ${analysis.status === 'reviewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {analysis.status}
                            </span>
                         </div>
                         <div className="space-y-4">
                            {findings.length > 0 ? findings.map((finding, index) => (
                                <div key={index} className={`p-4 rounded-lg ${severityColors[finding.severity]}`}>
                                    <p className="font-semibold">{finding.objectType} in {finding.zone} - <span className="capitalize">{finding.severity}</span></p>
                                    <p>{finding.message}</p>
                                </div>
                            )) : <p>No specific Vastu rule matches found for the placed objects.</p>}
                         </div>
                    </div>
                </div>
                <div className="space-y-8">
                    {/* Placed Objects & Actions Section */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm">
                        <h2 className="text-2xl font-bold mb-6">Placed Objects</h2>
                        <ul className="space-y-3 mb-6">
                            {analysis.analysis_items.map(item => (
                                <li key={item.id} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-semibold">{item.object}</span>
                                    <span className="text-gray-600">{item.direction}</span>
                                </li>
                            ))}
                        </ul>
                        {(role === 'astrologer' || role === 'dev') && analysis.status === 'pending' && (
                            <button onClick={handleApprove} className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700">
                                Approve Analysis
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </AuthGuard>
  );
}