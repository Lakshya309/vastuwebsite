"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  LayoutGrid,
  Pencil,
  Sparkles,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  created_at: string;
  status: string;
  description: string | null;
}

export default function ProjectOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        setProject(data.project);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleCompleteProject = async () => {
    if (!project) return;
    setCompleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!response.ok) throw new Error("Failed to complete project");
      const updatedProject = await response.json();
      setProject(updatedProject.project);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-primary font-medium tracking-widest uppercase text-[10px]">
            Loading project…
          </p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass p-12 rounded-[2.5rem] text-center max-w-md border border-red-100">
          <p className="text-red-500 font-medium italic mb-6">
            {error || "Project not found."}
          </p>
          <Link
            href="/projects"
            className="text-primary text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 justify-center"
          >
            <ArrowLeft size={14} /> Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = project.status === "completed";
  const createdDate = new Date(project.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 lg:px-24 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none organic-gradient opacity-60" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* ── Back Link ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase hover:text-primary transition-colors mb-12 group"
          >
            <ArrowLeft
              size={14}
              className="group-hover:-translate-x-1 transition-transform"
            />
            All Projects
          </Link>
        </motion.div>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              {/* Status pill */}
              <div className="inline-flex items-center gap-1.5 mb-4">
                {isCompleted ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold tracking-widest uppercase border border-emerald-100">
                    <CheckCircle2 size={11} /> Completed
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[9px] font-bold tracking-widest uppercase border border-teal-100">
                    <Clock size={11} /> Active
                  </span>
                )}
              </div>

              <h1 className="text-5xl md:text-7xl font-cormorant font-bold italic text-primary leading-tight">
                {project.name}
              </h1>

              <div className="flex items-center gap-2 mt-4 text-xs text-gray-400 font-light">
                <Calendar size={13} className="text-teal-500/60" />
                <span>Created {createdDate}</span>
              </div>
            </div>

            {/* Mark complete button */}
            {!isCompleted && (
              <button
                onClick={handleCompleteProject}
                disabled={completing}
                className="flex items-center gap-2 px-6 py-3 glass border border-emerald-100 text-emerald-600 hover:bg-emerald-50/60 rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all disabled:opacity-50 self-start md:self-auto"
              >
                <CheckCircle2 size={14} />
                {completing ? "Updating…" : "Mark Complete"}
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Info Cards ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        >
          {/* Description card */}
          <div className="md:col-span-2 glass p-8 rounded-[2rem] border border-white shadow-xl shadow-black/[0.02] flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[9px] font-bold tracking-widest text-gray-400 uppercase mb-1">
              <FileText size={12} className="text-teal-500/60" />
              Description
            </div>
            <p className="text-gray-600 font-light leading-relaxed text-sm">
              {project.description || (
                <span className="italic text-gray-300">
                  No description provided for this project.
                </span>
              )}
            </p>
          </div>

          {/* Quick stats card */}
          <div className="glass p-8 rounded-[2rem] border border-white shadow-xl shadow-black/[0.02] flex flex-col justify-between gap-6">
            <div className="flex items-center gap-2 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
              <Sparkles size={12} className="text-teal-500/60" />
              Project Info
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-bold tracking-widest text-gray-300 uppercase mb-1">
                  Status
                </p>
                <p className="text-sm font-semibold text-primary capitalize">
                  {project.status}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold tracking-widest text-gray-300 uppercase mb-1">
                  Project ID
                </p>
                <p className="text-xs text-gray-400 font-mono truncate">
                  {project.id}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Primary CTA: Open Floor Plan ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link href={`/projects/${projectId}/floor-plan`}>
            <div className="group relative overflow-hidden glass border border-white hover:border-teal-200 rounded-[2.5rem] p-10 md:p-14 shadow-xl shadow-black/[0.02] cursor-pointer transition-all hover:shadow-2xl hover:shadow-primary/5">
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />

              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-white transition-all group-hover:scale-110 flex-shrink-0">
                    <Compass size={30} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase mb-2">
                      Vastu Analysis
                    </p>
                    <h2 className="text-3xl md:text-4xl font-cormorant font-bold italic text-primary group-hover:text-teal-700 transition-colors">
                      Open Floor Plan
                    </h2>
                    <p className="text-gray-500 font-light text-sm mt-2 max-w-sm leading-relaxed">
                      Analyse spatial harmony across 16 Vastu zones — upload
                      your floor plan and receive a detailed reading.
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 px-10 py-5 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 group-hover:scale-105 transition-all text-[10px] tracking-widest uppercase flex items-center gap-3">
                  <LayoutGrid size={16} />
                  Analyse Now
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
