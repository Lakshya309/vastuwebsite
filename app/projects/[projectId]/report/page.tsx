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
    good: "border-green-500",
    neutral: "border-gray-500",
    warning: "border-yellow-500",
    critical: "border-red-500",
};

export default function ReportPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { user, idToken, loading: authLoading } = useAuthStore();
    const { supabase, loading: supabaseLoading } = useSupabase();

    const [project, setProject] = useState<Project | null>(null);
    const [findings, setFindings] = useState<AnalysisFinding[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReportData = async () => {
            if (!user || !projectId || authLoading || supabaseLoading || !idToken) return;
            setLoading(true);
            try {
                const response = await fetch(`/api/projects/${projectId}?include_analysis=true`, {
                    headers: { Authorization: `Bearer ${idToken}` },
                });
                if (!response.ok) throw new Error("Failed to fetch report data.");
                
                const data = await response.json();
                
                // Only show the report if the analysis has been reviewed
                if (data.project.analysis && data.project.analysis.status === 'reviewed') {
                    setProject(data.project);
                    const analysisItems = data.project.analysis.analysis_items.map((item: any) => ({
                        type: item.object,
                        zone: item.direction,
                    }));
                    const vastuFindings = analyzeVastu(analysisItems);
                    setFindings(vastuFindings);
                } else {
                    setProject(null); // Clear project if analysis is not reviewed
                }

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [user, projectId, authLoading, supabaseLoading, idToken]);

    if (loading || authLoading || supabaseLoading) return <div className="p-8">Loading report...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
                <h1 className="text-4xl font-bold mb-4">Vastu Report for: {project?.name || '...'}</h1>
                {/* Tabs */}
                <div className="border-b border-gray-200 mb-8">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <Link href={`/projects/${projectId}`} /*...*/ >Overview</Link>
                    <Link href={`/projects/${projectId}/floor-plan`} /*...*/ >Floor Plan</Link>
                    <Link href={`/projects/${projectId}/analysis`} /*...*/ >Analysis</Link>
                    <Link href={`/projects/${projectId}/report`} className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Report</Link>
                  </nav>
                </div>

                {!project ? (
                    <div className="text-center bg-white p-12 rounded-xl shadow-sm">
                        <h2 className="text-2xl font-semibold mb-4">Report Not Available</h2>
                        <p className="text-gray-600">The analysis for this project has not been reviewed and approved by an astrologer yet.</p>
                    </div>
                ) : (
                    <div className="bg-white p-12 rounded-2xl shadow-lg">
                        <div className="mb-12">
                            <h2 className="text-3xl font-bold text-center mb-2">Final Vastu Assessment</h2>
                            <p className="text-center text-gray-600">Based on the approved analysis</p>
                        </div>
                        
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-2xl font-semibold mb-4 border-b-2 pb-2">Key Findings</h3>
                                <div className="space-y-4">
                                {findings.map((finding, index) => (
                                    <div key={index} className={`p-4 rounded-lg border-l-4 ${severityColors[finding.severity]}`}>
                                        <p className="font-semibold">{finding.objectType} in {finding.zone} - <span className="capitalize">{finding.severity}</span></p>
                                        <p>{finding.message}</p>
                                    </div>
                                ))}
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-2xl font-semibold mb-4 border-b-2 pb-2">Astrologer's Remedies</h3>
                                <div className="bg-blue-50 p-6 rounded-lg text-blue-800">
                                    <p className="font-semibold">Remedy suggestions will be provided here by the astrologer.</p>
                                    <p>This section is a placeholder for manual entry by the astrologer in a future version.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthGuard>
    );
}