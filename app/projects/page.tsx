"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { motion, AnimatePresence } from "framer-motion";
import { History, LayoutGrid, Plus, Trash2, Calendar, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Project {
  id: string;
  name: string;
  created_at: string;
  status?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { user } = useAuth();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/projects");

      if (response.status === 401) {
        setProjects([]);
        router.push("/");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch projects");
      }

      const data = await response.json();
      setProjects(data.projects);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleDeleteProject = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/projects/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete project");
      }

      setProjects((prev) => prev.filter((p) => p.id !== deletingId));
      setIsConfirmingDelete(false);
      setDeletingId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    fetchProjects();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        fetchProjects();
      } else if (event === "SIGNED_OUT") {
        setProjects([]);
        router.push("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchProjects, supabase.auth, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary font-medium tracking-widest uppercase text-[10px]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-6 lg:px-24 pb-20 relative overflow-hidden">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none organic-gradient opacity-60" />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isConfirmingDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl border border-white"
            >
              <h2 className="text-3xl font-cormorant font-bold italic text-red-600 mb-6">Irreversible Action</h2>
              <p className="text-gray-600 mb-8 font-light leading-relaxed">
                This will permantly dissolve the project and all its cosmic data. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setIsConfirmingDelete(false);
                    setDeletingId(null);
                  }}
                  className="flex-1 px-6 py-4 glass rounded-xl text-gray-600 font-bold tracking-widest text-[10px] hover:bg-white/60 transition-all uppercase"
                >
                  Preserve
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="flex-1 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold tracking-widest text-[10px] uppercase shadow-lg shadow-red-200"
                >
                  Dissolve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div>
            <h1 className="text-5xl md:text-7xl font-cormorant font-bold italic text-primary leading-tight">Your Labs.</h1>
            <p className="text-gray-500 mt-4 flex items-center gap-2 font-light">
              <History size={16} className="text-teal-500" />
              Documenting architectural harmony across 16 zones.
            </p>
          </div>
          <Link href="/projects/new">
            <button className="px-10 py-5 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-all text-[10px] tracking-widest uppercase flex items-center gap-3">
              <Plus size={16} /> New Environment
            </button>
          </Link>
        </div>

        {error ? (
           <div className="glass p-12 text-center rounded-[3rem] border-red-100 bg-red-50/10">
             <p className="text-red-600 font-medium italic">{error}</p>
           </div>
        ) : projects.length === 0 ? (
          <div className="text-center p-32 glass rounded-[3rem] border border-gray-200 bg-white/20">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-10">
              <LayoutGrid size={32} className="text-primary/30" />
            </div>
            <h3 className="text-2xl font-cormorant font-bold italic text-primary mb-4">No active environments found.</h3>
            <p className="text-gray-500 max-w-sm mx-auto font-light leading-relaxed mb-10">
              Commence your first Vastu analysis to begin organizing your spatial data.
            </p>
             <Link href="/projects/new">
              <button className="px-8 py-4 glass text-primary font-bold rounded-xl hover:bg-white transition-all text-[10px] tracking-widest uppercase">
                Initialize Project
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {projects.map((project, idx) => (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative"
              >
                <div className="glass p-10 rounded-[2.5rem] shadow-xl shadow-black/[0.02] border border-white hover:border-teal-200 transition-all h-full flex flex-col justify-between">
                  <Link href={`/projects/${project.id}`}>
                    <div className="cursor-pointer">
                       <div className="flex justify-between items-start mb-10">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-white transition-all group-hover:scale-110">
                          <LayoutGrid size={24} />
                        </div>
                        <div className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[9px] font-bold tracking-widest uppercase border border-teal-100">
                          {project.status || 'Active'}
                        </div>
                      </div>
                      <h2 className="text-3xl font-cormorant font-bold italic text-primary mb-4 truncate group-hover:text-teal-700 transition-colors">
                        {project.name}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-light mb-8">
                        <Calendar size={14} className="text-teal-500/50" />
                        <span>Analyzed: {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                    <Link href={`/projects/${project.id}`} className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-primary uppercase group/link">
                      Open Lab <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeletingId(project.id);
                        setIsConfirmingDelete(true);
                      }}
                      className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Dissolve Project"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

