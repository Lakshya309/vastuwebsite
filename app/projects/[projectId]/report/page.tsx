"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { OBJECT_ICONS } from "../../../../lib/objectIcons";

import { useProjectStore } from "../../../../lib/store/projectStore";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
  Tooltip,
} from "recharts";

import { Point, PlacedObject } from "../../../../lib/floorPlanInterfaces";
import { calculateBoundaryDistribution } from "../../../utils/calculateBoundaryDistribution";
import { calculateAreaDistribution } from "../../../utils/calculateAreaDistribution";
import { ZoneBarChart } from "../../../../components/ZoneBarChart";
import { DevtaBarChart } from "../../../../components/DevtaBarChart";
import { FloorPlanCanvas } from "../../../../components/floor-plan/FloorPlanCanvas";
import { motion, AnimatePresence } from "framer-motion";
import { Download, LayoutDashboard, FileText, ChevronRight, Share2, Printer } from "lucide-react";
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

// --- INTERFACES ---

interface Project {
  id: string;
  name: string;
  creator_name?: string;
  report_for?: string;
  floor_plan_path?: string | null;
  boundary_normalized: Point[] | null;
  north_direction: number | null;
  placed_objects: PlacedObject[] | null;
}

interface AnalyzedObjectResult {
  object_id: string;
  object_type: string;
  devta_region: string | null;
  zone16_direction: string | null;
  score_impact: number;
  grade?: string | null;
  verdict: "EXCELLENT" | "GOOD" | "BAD" | "CRITICAL";
  message: string;
}

interface DevtaArea {
  name: string;
  area: number;
  percentage: number;
}

interface VastuAnalysisResult {
  analyzed_objects: AnalyzedObjectResult[];
  total_score: number;
  overall_percentage: number;
  overall_verdict: "EXCELLENT" | "GOOD" | "BAD" | "CRITICAL";
  devta_areas_32: DevtaArea[];
  devta_areas_45: DevtaArea[];
  zone_areas_16: DevtaArea[];
  zone_boundary_16: DevtaArea[];
  zones16: any[];
  zones8?: any[];
  devtas45?: any[];
  analysis_id?: string;
  plot_centroid?: Point | null;
}

const ZONES_DEFINITION = [
  { zone: 'NNE', startAngle: 11.25, endAngle: 33.75 },
  { zone: 'NE', startAngle: 33.75, endAngle: 56.25 },
  { zone: 'ENE', startAngle: 56.25, endAngle: 78.75 },
  { zone: 'E', startAngle: 78.75, endAngle: 101.25 },
  { zone: 'ESE', startAngle: 101.25, endAngle: 123.75 },
  { zone: 'SE', startAngle: 123.75, endAngle: 146.25 },
  { zone: 'SSE', startAngle: 146.25, endAngle: 168.75 },
  { zone: 'S', startAngle: 168.75, endAngle: 191.25 },
  { zone: 'SSW', startAngle: 191.25, endAngle: 213.75 },
  { zone: 'SW', startAngle: 213.75, endAngle: 236.25 },
  { zone: 'WSW', startAngle: 236.25, endAngle: 258.75 },
  { zone: 'W', startAngle: 258.75, endAngle: 281.25 },
  { zone: 'WNW', startAngle: 281.25, endAngle: 303.75 },
  { zone: 'NW', startAngle: 303.75, endAngle: 326.25 },
  { zone: 'NNW', startAngle: 326.25, endAngle: 348.75 },
  { zone: 'N', startAngle: 348.75, endAngle: 11.25 },
];

const COLORS = {
  EXCELLENT: "#10B981", // Emerald
  GOOD: "#34D399",      // Teal
  BAD: "#F59E0B",       // Gold/Amber
  CRITICAL: "#EF4444",  // Rose
};

const getVerdictTextColor = (verdict: string) => {
  switch (verdict) {
    case "EXCELLENT": return "text-emerald-700";
    case "GOOD": return "text-teal-700";
    case "BAD": return "text-amber-700";
    case "CRITICAL": return "text-rose-700";
    default: return "text-gray-600";
  }
};

const getVerdictBgColor = (verdict: string) => {
  switch (verdict) {
    case "EXCELLENT": return "bg-emerald-50";
    case "GOOD": return "bg-teal-50";
    case "BAD": return "bg-amber-50";
    case "CRITICAL": return "bg-rose-50";
    default: return "bg-gray-50";
  }
};

export default function ReportPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { setLiveNorthDirection } = useProjectStore();
  const reportContentRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [vastuAnalysisResult, setVastuAnalysisResult] = useState<VastuAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoneGraphData, setZoneGraphData] = useState<any[]>([]);
  const [highlightedZones, setHighlightedZones] = useState<string[]>([]);
  const [printing, setPrinting] = useState(false);
  const [reportSections, setReportSections] = useState({
    overallCompliance: true,
    objectDistribution: true,
    boundaryDistribution: true,
    areaDistribution: true,
    devta32: true,
    devta45: true,
    floorPlan: true,
    detailedReport: true,
  });

  const [solution, setSolution] = useState<string | null>(null);

  const handleObjectClick = (object: PlacedObject) => {
    const analysis = vastuAnalysisResult?.analyzed_objects.find(ao => ao.object_id === object.id);
    if (analysis && analysis.message) {
      setSolution(analysis.message);
    } else {
      setSolution("No specific solution found.");
    }
  };

  const handleSectionChange = (section: keyof typeof reportSections) => {
    setReportSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleExportPdf = async () => {
    const element = reportContentRef.current;
    if (!element) return;

    setPrinting(true);
    // Loading is already set by the component's state watcher for 'printing' or 'loading'
    
    try {
      // Extended wait for all charts and canvases to stabilize
      await new Promise(resolve => setTimeout(resolve, 3000));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const captureOptions = {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      };

      // Define page sections
      const sections = [
        { ids: ['report-section-overview', 'report-section-pulse'] },
        { ids: ['report-section-energy'] },
        { ids: ['report-section-devtas'] },
        { ids: ['report-section-table'] },
        { ids: ['report-section-canvas-8'] },
        { ids: ['report-section-canvas-16'] },
        { ids: ['report-section-canvas-45'] },
      ];

      let pageStarted = false;

      for (let i = 0; i < sections.length; i++) {
        const { ids } = sections[i];
        
        // Filter out IDs that don't exist in DOM (e.g. disabled via toggle)
        const visibleIds = ids.filter(id => document.getElementById(id));
        if (visibleIds.length === 0) continue;

        if (pageStarted) {
          pdf.addPage();
        }
        pageStarted = true;
        
        let currentY = 15; // Starting top margin

        for (const id of visibleIds) {
          const sectionEl = document.getElementById(id);
          if (!sectionEl) continue;

          const canvas = await html2canvas(sectionEl, captureOptions);
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const imgProps = pdf.getImageProperties(imgData);
          
          // Calculate dimensions to fit width while preserving aspect ratio
          const displayWidth = pdfWidth - 20; // 10mm margins on each side
          const displayHeight = (imgProps.height * displayWidth) / imgProps.width;

          pdf.addImage(imgData, 'JPEG', 10, currentY, displayWidth, displayHeight, undefined, 'FAST');
          currentY += displayHeight + 10; // 10mm gap between sections on same page
        }
      }

      pdf.save(`Vastu_Report_${project?.name || "Analysis"}.pdf`);
    } catch (error: any) {
      console.error("Professional PDF generation ritual failed:", error);
      alert("Enhanced generation failed. Using system print instead.");
      window.print();
    } finally {
      setPrinting(false);
    }
  };

  useEffect(() => {
    const fetchReportData = async () => {
      if (!projectId) return;
      const urlParams = new URLSearchParams(window.location.search);
      const analysisId = urlParams.get("analysisId");

      if (!analysisId) {
        setError("Analysis ID is missing from the URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const analysisResponse = await fetch(`/api/analysis/full-report?analysisId=${analysisId}`);
        const vastuData: VastuAnalysisResult = await analysisResponse.json();
        vastuData.analysis_id = analysisId; // Manually attach for PDF generation
        setVastuAnalysisResult(vastuData);

        const badZones = vastuData.analyzed_objects
          .filter(obj => obj.verdict === 'BAD' || obj.verdict === 'CRITICAL')
          .map(obj => obj.zone16_direction)
          .filter((zone): zone is string => zone !== null);
        setHighlightedZones([...new Set(badZones)]);

        const projectResponse = await fetch(`/api/projects/${projectId}`);
        const projectData = await projectResponse.json();
        setProject(projectData.project);

        if (projectData.project.north_direction !== null) {
          setLiveNorthDirection(projectData.project.north_direction);
        }

        const mergedData = ZONES_DEFINITION.map(zDef => {
          const areaData = vastuData.zone_areas_16.find(a => a.name === zDef.zone);
          const boundaryData = vastuData.zone_boundary_16.find(b => b.name === zDef.zone);
          return {
            zone: zDef.zone,
            boundaryPercent: boundaryData ? boundaryData.percentage : 0,
            areaPercent: areaData ? areaData.percentage : 0,
          };
        });
        setZoneGraphData(mergedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [projectId]);

  if (loading && !vastuAnalysisResult) {
    return (
      <div className="min-h-screen organic-gradient flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !project || !vastuAnalysisResult) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-8">
        <div className="glass p-8 rounded-3xl border border-rose-200 text-center">
          <h2 className="text-2xl font-cormorant font-bold text-rose-700 mb-4 italic">Spectral Error</h2>
          <p className="text-gray-600 mb-6">{error || "Project data unavailable."}</p>
          <Link href={`/projects/${projectId}/floor-plan`} className="px-6 py-3 bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg">Return to Sanctum</Link>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  return (
    <div className="min-h-screen organic-gradient pt-32 md:pt-40 p-4 md:p-12 relative overflow-hidden flex flex-col items-center">
      {/* Professional PDF Generation Loading State */}
      {(loading || printing) && (
        <div className="fixed inset-0 z-[500] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-32 h-32 bg-primary/10 rounded-[3rem] border border-primary/20 flex items-center justify-center mb-8"
          >
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </motion.div>
          <h2 className="text-3xl font-cormorant font-bold italic text-primary mb-2">Architecting Your Spectral Report</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] animate-pulse">
            Aligning Sacred Geometry • Please Wait
          </p>
        </div>
      )}
      {/* PDF Generation CSS Override */}
      {printing && (
        <style dangerouslySetInnerHTML={{
          __html: `
          * {
            animation: none !important;
            transition: none !important;
            color-scheme: light !important;
          }
          /* Eliminate modern color functions that crash html2canvas */
          .glass {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border-color: rgba(0, 0, 0, 0.1) !important;
            box-shadow: none !important;
          }
          /* Fix text colors */
          .text-primary { color: #13547a !important; }
          .text-gray-400, .text-gray-500 { color: #6b7280 !important; }
          /* Reset backgrounds */
          .organic-gradient { background: #ffffff !important; }
          /* Ensure charts are visible */
          .recharts-cartesian-grid-horizontal line,
          .recharts-cartesian-grid-vertical line {
            stroke: #e5e7eb !important;
          }
        `}} />
      )}

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-teal-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

      {/* Navigation Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-[1400px] mb-12 flex flex-col md:flex-row justify-between items-center gap-6 no-print relative z-10"
      >
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="glass p-3 rounded-2xl border border-white hover:bg-white transition-all">
            <LayoutDashboard size={20} className="text-primary" />
          </Link>
          <div>
            <h1 className="text-4xl md:text-5xl font-cormorant font-bold italic text-primary tracking-tight">Spectral Manifest</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-1 ml-1">Vastu Analysis Record • {project.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleExportPdf}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.03] transition-all disabled:opacity-50"
          >
            <Download size={14} />
            {loading ? "Generating..." : "Export PDF"}
          </button>
          <div className="glass px-4 py-2 rounded-2xl border border-white hidden md:flex items-center gap-6">
            <Link href={`/projects/${projectId}/floor-plan`} className="text-[10px] font-bold text-gray-400 hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-2">
              Studio <ChevronRight size={12} />
            </Link>
            <span className="text-primary text-[10px] font-bold uppercase tracking-widest border-b border-primary pb-0.5">Final Report</span>
          </div>
        </div>
      </motion.div>

      {/* Report Customization (Dashboard Style) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-[1400px] mb-12 flex flex-wrap gap-3 no-print"
      >
        {Object.keys(reportSections).map(key => (
          <button
            key={key}
            onClick={() => handleSectionChange(key as keyof typeof reportSections)}
            className={`px-4 py-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${reportSections[key as keyof typeof reportSections]
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
              : "glass text-gray-400 border-white hover:border-primary/30"
              }`}
          >
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}
      </motion.div>

      {/* MAIN REPORT AREA */}
      <motion.div
        ref={reportContentRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[1400px] space-y-12 relative z-10"
      >
        {/* PDF-ONLY COVER PAGE */}
        {printing && (
          <div className="mb-12">
            <div className="bg-slate-900 p-20 rounded-[4rem] text-center min-h-[260mm] flex flex-col justify-center items-center border-[12px] border-teal-500/20">
              <h1 className="text-8xl font-cormorant font-bold text-white mb-10 tracking-tighter uppercase">Mangalam Vastu</h1>
              <div className="h-2 w-48 bg-teal-500 mb-16 mx-auto" />
              <h2 className="text-4xl font-cormorant italic text-teal-400 mb-24">Spectral Alignment & Macro-Symmetry Report</h2>

              <div className="space-y-6">
                <p className="text-white text-6xl font-bold uppercase tracking-widest">{project?.name || "Project Report"}</p>
                <p className="text-slate-400 text-lg tracking-[0.5em] uppercase">Private Consultation Document</p>
              </div>

              <div className="mt-40 pt-40 border-t border-slate-800 w-full max-w-2xl">
                <div className="flex justify-between text-slate-500 text-sm uppercase font-bold tracking-widest">
                  <span>Ref: #{vastuAnalysisResult?.analysis_id?.slice(0, 8)}</span>
                  <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cinematic Header Card */}
        <motion.div id="report-section-overview" variants={itemVariants} className="glass p-16 rounded-[4rem] border border-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 relative z-10">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary font-cormorant font-bold italic text-3xl border border-primary/20">
                MV
              </div>
              <div>
                <h2 className="text-5xl font-cormorant font-bold italic text-primary leading-tight">Manglam Vastu</h2>
                <p className="text-lg text-gray-500 font-bold uppercase tracking-[0.2em] italic">Vedic Architecture & Sacred Science</p>
              </div>
            </div>
            <div className="md:text-right space-y-6">
              <div className="inline-block px-6 py-2 bg-primary/5 rounded-full border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.4em] italic mb-4">
                Analysis Identification: {projectId.slice(0, 8)}
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Spectral Subject</p>
                <p className="text-6xl font-cormorant font-bold italic text-primary leading-none">{project.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-8 md:gap-12 mt-8">
                <div>
                  <p className="text-gray-400 text-[8px] font-bold uppercase tracking-widest mb-1">Steward</p>
                  <p className="text-sm font-bold text-gray-700">{project.report_for || "Valued Client"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[8px] font-bold uppercase tracking-widest mb-1">Vastu Expert</p>
                  <p className="text-sm font-bold text-gray-700">{project.creator_name || "Yogesh Keshwani"}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-12 border-t border-white/50 flex justify-between items-center">
            <div className="flex gap-4">
              <Share2 size={16} className="text-gray-300" />
              <Printer size={16} className="text-gray-300" />
              <FileText size={16} className="text-gray-300" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] italic">
              Concluded on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </motion.div>

        {/* Global Pulse (Overall Compliance & Pie) */}
        <div id="report-section-pulse" className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {reportSections.overallCompliance && (
            <motion.div variants={itemVariants} className="lg:col-span-12 glass p-16 rounded-[4rem] border border-white flex flex-col items-center text-center shadow-2xl">
              <h3 className="text-5xl font-cormorant font-bold italic text-primary mb-12 underline underline-offset-8 decoration-primary/10 tracking-tight">Manifestation Score</h3>
              {!printing ? (
                <div className="relative w-80 h-80 mb-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="85%"
                      outerRadius="75%"
                      barSize={32}
                      data={[{ name: "Vastu Score", uv: vastuAnalysisResult.overall_percentage, fill: COLORS[vastuAnalysisResult.overall_verdict] }]}
                      startAngle={90}
                      endAngle={90 - (360 * vastuAnalysisResult.overall_percentage / 100)}
                    >
                      <RadialBar cornerRadius={20} background={{ fill: 'rgba(0,0,0,0.03)' }} dataKey="uv" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[100px] font-cormorant font-bold italic text-primary leading-none -mt-4">
                      {vastuAnalysisResult.overall_percentage.toFixed(0)}<span className="text-4xl text-primary/40">%</span>
                    </p>
                    <p className="text-lg font-bold text-gray-400 uppercase tracking-[0.3em] mt-6">{vastuAnalysisResult.total_score} Total Points</p>
                  </div>
                </div>
              ) : (
                <div className="w-full flex-1 flex flex-col items-center justify-center mb-8 bg-slate-50 border border-slate-200 p-12 rounded-[2rem]">
                  <div className="text-[120px] font-cormorant font-bold text-primary leading-none">{vastuAnalysisResult.overall_percentage.toFixed(0)}%</div>
                  <div className="w-full max-w-md mt-10 bg-gray-200 h-6 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${vastuAnalysisResult.overall_percentage}%`}} />
                  </div>
                  <p className="mt-6 text-[14px] font-bold text-gray-500 uppercase tracking-widest">{vastuAnalysisResult.total_score} Total Points Found</p>
                </div>
              )}
              <div className={`px-12 py-4 rounded-3xl border text-lg font-bold uppercase tracking-[0.3em] relative overflow-hidden group ${getVerdictBgColor(vastuAnalysisResult.overall_verdict)} border-white transition-all shadow-lg`}>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className={`relative z-10 ${getVerdictTextColor(vastuAnalysisResult.overall_verdict)}`}>
                  Spectral Alignment: {vastuAnalysisResult.overall_verdict}
                </span>
              </div>
            </motion.div>
          )}

          {reportSections.objectDistribution && (
            <motion.div variants={itemVariants} className="lg:col-span-12 glass p-16 rounded-[4rem] border border-white shadow-2xl">
              <h3 className="text-5xl font-cormorant font-bold italic text-primary mb-12 px-4 tracking-tight">Component Resonance</h3>
              {!printing ? (
                <div className="h-96 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          vastuAnalysisResult.analyzed_objects.reduce((acc, obj) => {
                            acc[obj.verdict] = (acc[obj.verdict] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={110}
                        outerRadius={140}
                        paddingAngle={10}
                        dataKey="value"
                        isAnimationActive={true}
                      >
                        {Object.keys(
                          vastuAnalysisResult.analyzed_objects.reduce((acc, obj) => {
                            acc[obj.verdict] = (acc[obj.verdict] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map((verdict, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[verdict as keyof typeof COLORS]} className="stroke-[6] stroke-white" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '30px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }} />
                      <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ paddingTop: '30px', textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.3em' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-4">
                    <p className="text-[80px] font-cormorant font-bold italic text-primary leading-none">
                      {vastuAnalysisResult.analyzed_objects.length}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-2">Total Manifested Elements</p>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-8 mt-4 p-12 bg-slate-50 border border-slate-200 rounded-[2rem]">
                  {Object.entries(
                      vastuAnalysisResult.analyzed_objects.reduce((acc, obj) => {
                        acc[obj.verdict] = (acc[obj.verdict] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([verdict, count]) => {
                      const total = vastuAnalysisResult.analyzed_objects.length;
                      const pct = (count / total) * 100;
                      return (
                        <div key={verdict} className="w-full">
                          <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-primary tracking-widest uppercase">{verdict}</span>
                            <span className="text-gray-600">{count} Objects ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                             <div className="h-full" style={{ width: `${pct}%`, backgroundColor: COLORS[verdict as keyof typeof COLORS] }} />
                          </div>
                        </div>
                      )
                  })}
                </div>
              )}
              <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-8 italic leading-relaxed">
                Distribution of objects across the spectral spectrum of Vastu compliance.
              </p>
            </motion.div>
          )}
        </div>

        {/* Energy Charts (Boundary & Area) */}
        {zoneGraphData.length > 0 && (
          <div id="report-section-energy" className="grid grid-cols-1 gap-12">
            {reportSections.boundaryDistribution && (
              <motion.div variants={itemVariants} className="glass p-12 md:p-16 rounded-[4rem] border border-white shadow-2xl">
                <ZoneBarChart data={zoneGraphData} chartType="boundary" title="Perimeter Dispersion" isAnimationActive={!printing} />
              </motion.div>
            )}
            {reportSections.areaDistribution && (
              <motion.div variants={itemVariants} className="glass p-12 md:p-16 rounded-[4rem] border border-white shadow-2xl">
                <ZoneBarChart data={zoneGraphData} chartType="area" title="Spatial Volume Intensity" isAnimationActive={!printing} />
              </motion.div>
            )}
          </div>
        )}

        {/* Devta Distribution */}
        <div id="report-section-devtas" className="grid grid-cols-1 gap-12">
          {reportSections.devta32 && vastuAnalysisResult.devta_areas_32 && (
            <motion.div variants={itemVariants} className="glass p-12 md:p-16 rounded-[4rem] border border-white shadow-2xl">
              <DevtaBarChart data={vastuAnalysisResult.devta_areas_32} title="Symmetry of the 32 Outer Deities (%)" color="#3b82f6" isAnimationActive={!printing} />
            </motion.div>
          )}
          {reportSections.devta45 && vastuAnalysisResult.devta_areas_45 && (
            <motion.div variants={itemVariants} className="glass p-12 md:p-16 rounded-[4rem] border border-white shadow-2xl">
              <DevtaBarChart data={vastuAnalysisResult.devta_areas_45} title="Harmonic Balance of the 45 Celestial Masters (%)" color="#10b981" isAnimationActive={!printing} />
            </motion.div>
          )}
        </div>

        {/* Detailed Register (Table) */}
        {reportSections.detailedReport && (
          <motion.div id="report-section-table" variants={itemVariants} className="glass rounded-[4rem] border border-white overflow-hidden">
            <div className="p-12 border-b border-white/50 bg-white/10">
              <h3 className="text-5xl font-cormorant font-bold italic text-primary tracking-tight">Universal Component Register</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-4">Comprehensive audit of all manifested elements within the geometry.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary/[0.02]">
                  <tr>
                    {['Manifestation', 'Celestial Zone', 'Deity Region', 'Impact', 'Grade', 'Verdict'].map((h) => (
                      <th key={h} className="px-10 py-6 text-left text-xs font-bold text-primary uppercase tracking-[0.2em] italic border-b border-white/50">{h}</th>
                    ))}
                    <th className="px-10 py-6 text-left text-xs font-bold text-primary uppercase tracking-[0.2em] italic border-b border-white/50">Guidance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/30">
                  {vastuAnalysisResult.analyzed_objects.map((obj) => (
                    <tr key={obj.object_id} className="hover:bg-white/40 transition-colors group">
                      <td className="px-10 py-10 whitespace-nowrap text-sm font-bold text-gray-700">{obj.object_type}</td>
                      <td className="px-10 py-10 whitespace-nowrap text-xs font-bold text-primary uppercase tracking-widest">{obj.zone16_direction || "Void"}</td>
                      <td className="px-10 py-10 whitespace-nowrap text-xs font-bold text-primary uppercase tracking-widest">{obj.devta_region || "Void"}</td>
                      <td className="px-10 py-10 whitespace-nowrap text-sm font-bold text-gray-500 italic">{obj.score_impact > 0 ? `+${obj.score_impact}` : obj.score_impact}</td>
                      <td className="px-8 py-8 whitespace-nowrap text-xs">
                        {obj.grade && (
                          <span className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs ${obj.grade === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            obj.grade === 'B' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                              'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                            {obj.grade}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-8 whitespace-nowrap">
                        <span className={`px-4 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-widest border border-white ${getVerdictTextColor(obj.verdict)} ${getVerdictBgColor(obj.verdict)} shadow-inner`}>
                          {obj.verdict}
                        </span>
                      </td>
                      <td className="px-10 py-10 text-sm font-medium text-gray-400 group-hover:text-gray-600 leading-relaxed max-w-xs">{obj.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Floor Plan Visualization (Moved to bottom) */}
        {reportSections.floorPlan && (project.floor_plan_path || (project.boundary_normalized && project.boundary_normalized.length > 0)) && (
          <motion.div id="report-section-geometry" variants={itemVariants} className="glass p-8 md:p-12 rounded-[3.5rem] border border-white">
            <h3 className="text-4xl font-cormorant font-bold italic text-primary text-center mb-12 tracking-tight">Spectral Geometry Overview</h3>
            <div className="flex flex-col gap-16 items-center w-full">
              
              {/* 8 Zones */}
              <div id="report-section-canvas-8" className="flex flex-col items-center gap-6 w-full">
                <h4 className="font-bold text-xl text-gray-500 uppercase tracking-[0.3em] glass px-12 py-5 rounded-full shadow-lg italic">8 Basic Zones</h4>
                <div className="w-full relative glass rounded-[4rem] shadow-2xl overflow-hidden p-6 md:p-12 mx-auto border border-white min-h-[600px] flex items-center justify-center bg-white/50">
                  <FloorPlanCanvas
                    isStatic={true}
                    floorPlanImage={project.floor_plan_path || null}
                    boundary={project.boundary_normalized || []}
                    placedObjects={[]}
                    objectSvgMap={{}}
                    northDirection={project.north_direction || 0}
                    onMoveObject={() => { }}
                    onResizeObject={() => { }}
                    onRotateObject={() => { }}
                    onDeleteObject={() => { }}
                    scale={null}
                    wallLengths={[]}
                    setReferenceWallIndex={() => { }}
                    referenceWallIndex={null}
                    wallColors={[]}
                    zone8Regions={vastuAnalysisResult.zones8}
                    highlightedZones={[]}
                    onObjectClick={() => {}}
                    plotCentroid={vastuAnalysisResult.plot_centroid}
                  />
                </div>
              </div>

              {/* 16 Zones - Central Emphasis */}
              <div id="report-section-canvas-16" className="flex flex-col items-center gap-6 w-full relative">
                <h4 className="font-bold text-3xl text-primary uppercase tracking-[0.4em] glass px-16 py-6 rounded-full shadow-2xl shadow-primary/10 italic">16 Maha Vastu Zones</h4>
                <div className="w-full relative glass rounded-[5rem] shadow-[0_50px_100px_-15px_rgba(0,0,0,0.2)] overflow-hidden p-6 md:p-16 mx-auto z-20 border border-white min-h-[800px] flex items-center justify-center bg-white/50">
                  <FloorPlanCanvas
                    isStatic={true}
                    floorPlanImage={project.floor_plan_path || null}
                    boundary={project.boundary_normalized || []}
                    placedObjects={(project.placed_objects || []).map(obj => {
                      const analysis = vastuAnalysisResult.analyzed_objects.find(ao => ao.object_id === obj.id);
                      return {
                        ...obj,
                        highlight: analysis ? analysis.verdict : null,
                      }
                    })}
                    objectSvgMap={new Proxy(OBJECT_ICONS, {
                      get: (target: Record<string, string>, prop: string | symbol) => {
                        if (typeof prop === 'string') {
                          if (target[prop]) return target[prop];
                          const titleCase = prop.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                          if (target[titleCase]) return target[titleCase];
                        }
                        return "/objects/generic.svg";
                      }
                    })}
                    northDirection={project.north_direction || 0}
                    onMoveObject={() => { }}
                    onResizeObject={() => { }}
                    onRotateObject={() => { }}
                    onDeleteObject={() => { }}
                    scale={null}
                    wallLengths={[]}
                    setReferenceWallIndex={() => { }}
                    referenceWallIndex={null}
                    wallColors={[]}
                    zone16Regions={vastuAnalysisResult.zones16}
                    highlightedZones={highlightedZones}
                    onObjectClick={handleObjectClick}
                    plotCentroid={vastuAnalysisResult.plot_centroid}
                  />
                </div>
              </div>

              {/* 45 Devtas */}
              <div id="report-section-canvas-45" className="flex flex-col items-center gap-6 w-full">
                <h4 className="font-bold text-xl text-gray-500 uppercase tracking-[0.3em] glass px-12 py-5 rounded-full shadow-lg italic">45 Cosmic Masters</h4>
                <div className="w-full relative glass rounded-[4rem] shadow-2xl overflow-hidden p-6 md:p-12 mx-auto border border-white min-h-[600px] flex items-center justify-center bg-white/50">
                  <FloorPlanCanvas
                    isStatic={true}
                    floorPlanImage={project.floor_plan_path || null}
                    boundary={project.boundary_normalized || []}
                    placedObjects={[]}
                    objectSvgMap={{}}
                    northDirection={project.north_direction || 0}
                    onMoveObject={() => { }}
                    onResizeObject={() => { }}
                    onRotateObject={() => { }}
                    onDeleteObject={() => { }}
                    scale={null}
                    wallLengths={[]}
                    setReferenceWallIndex={() => { }}
                    referenceWallIndex={null}
                    wallColors={[]}
                    devtaRegions={vastuAnalysisResult.devtas45}
                    highlightedZones={[]}
                    onObjectClick={() => {}}
                    plotCentroid={vastuAnalysisResult.plot_centroid}
                  />
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Solution Overlay (Spectral) */}
      <AnimatePresence>
        {solution && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-[100] p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass max-w-lg w-full p-10 rounded-[3rem] border border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] text-center relative"
            >
              <button
                onClick={() => setSolution(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full glass border border-white flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
              >
                ✕
              </button>
              <h3 className="text-3xl font-cormorant font-bold italic text-primary mb-6">Spectral Guidance</h3>
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-8" />
              <p className="text-gray-600 font-medium leading-loose mb-10 italic">
                "{solution}"
              </p>
              <button
                onClick={() => setSolution(null)}
                className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                Absorb Guidance →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          html, body {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            font-size: 9pt !important;
          }
          
          .no-print { display: none !important; }
          .organic-gradient { background: #fff !important; }
          
          .glass { 
            background: #fff !important; 
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            border-radius: 6px !important;
          }
          
          .min-h-screen { 
            min-height: auto !important;
            padding: 8px !important;
          }
          .max-w-7xl { 
            max-width: 100% !important;
            padding: 8px !important;
          }
          
          h1 { font-size: 16pt !important; color: #13547a !important; }
          h2 { font-size: 12pt !important; color: #13547a !important; }
          h3 { font-size: 10pt !important; color: #13547a !important; }
          h1, h2, h3 { page-break-after: avoid; }
          
          p, span, td, th, li { color: #000 !important; }
          .text-gray-400, .text-gray-500 { color: #444 !important; }
          .text-primary { color: #13547a !important; }
          
          .absolute { display: none !important; }
          
          .recharts-wrapper { 
            display: block !important;
            width: 100% !important;
            height: auto !important;
          }
          .recharts-responsive-container {
            width: 100% !important;
            height: 160px !important;
          }
          .recharts-text { fill: #000 !important; }
          .recharts-cartesian-axis-tick-value { fill: #333 !important; }
          .recharts-legend-item-text { color: #000 !important; }
          
          .text-7xl { font-size: 28pt !important; }
          .text-2xl { font-size: 10pt !important; }
          
          .overflow-x-auto { overflow: visible !important; }
          table { page-break-inside: auto; width: 100% !important; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          td, th { padding: 2px 4px !important; }
          
          .glass { page-break-inside: avoid; }
          
          .grid { page-break-inside: avoid; }
          .space-y-12 > * { margin-bottom: 6pt !important; }
          
          .w-\\[80vw\\].max-w-\\[600px\\] {
            width: 100% !important;
            max-width: 140mm !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}