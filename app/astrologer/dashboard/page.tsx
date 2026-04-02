"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  History, 
  Video, 
  User as UserIcon, 
  ChevronRight, 
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Copy,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  id: string;
  name: string;
  created_at: string;
  video_path: string | null;
  status: string;
  profiles: {
    email: string;
  };
  map_plots_map_plots_project_idToprojects: {
    storage_path: string;
  }[];
}

export default function AstrologerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [astrologer, setAstrologer] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/astrologer/projects");
      if (!res.ok) throw new Error("Failed to fetch assigned projects");
      const data = await res.json();
      setProjects(data.projects);
      setAstrologer(data.astrologer);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.profiles.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary font-medium tracking-widest uppercase text-[10px]">Syncing Astral Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-6 lg:px-24 pb-20 relative overflow-hidden">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none organic-gradient opacity-60" />

      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* V1 HEADER AREA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
             <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full text-[9px] font-bold tracking-widest text-primary uppercase mb-4"
            >
              <Sparkles size={12} className="animate-pulse" />
              Expert Practitioner Portal
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-cormorant font-bold italic text-primary leading-tight">Expert Hub.</h1>
            <p className="text-gray-500 mt-4 flex items-center gap-2 font-light">
              <History size={16} className="text-teal-500" />
              Manage and analyze assigned architectural projects.
            </p>
          </div>

          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Filter by name or client..."
              className="w-full pl-12 pr-4 py-4 glass rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 border border-white/50 transition-all text-sm font-light italic"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Unique Code Section - Premium V1 Glass */}
        {astrologer?.unique_code && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[3rem] p-10 mb-16 border border-white relative overflow-hidden group shadow-2xl shadow-black/5"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="max-w-md">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">Internal Identifier</h2>
                <h3 className="text-4xl font-cormorant font-bold italic text-primary mb-4">The Practitioner Key.</h3>
                <p className="text-gray-500 font-light leading-relaxed mb-8">
                  Share this unique sequence with your clients. Projects linked with this key will synchronize effortlessly to your workspace.
                </p>
                
                <div className="inline-flex items-center gap-4 glass px-8 py-4 rounded-2xl border border-teal-100 shadow-inner group/code">
                  <span className="text-3xl font-bold tracking-widest text-primary leading-none">{astrologer.unique_code}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(astrologer.unique_code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-3 hover:bg-primary hover:text-white rounded-xl transition-all active:scale-95 text-primary"
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex bg-white/40 backdrop-blur-md p-8 rounded-[2rem] border border-white items-center gap-6 shadow-xl shadow-black/5">
                <div className="w-20 h-20 bg-primary text-white rounded-2xl flex items-center justify-center font-bold text-3xl shadow-lg shadow-primary/20">
                  {projects.length}
                </div>
                <div className="flex flex-col">
                  <span className="text-primary font-bold italic text-xl font-cormorant">Active Streams</span>
                  <span className="text-gray-400 text-[9px] uppercase tracking-widest font-medium">Automatic Synchronization</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="glass p-8 text-center rounded-3xl border-red-100 bg-red-50/10 mb-10">
            <p className="text-red-600 font-medium italic">{error}</p>
          </div>
        )}

        {/* Projects Display - V1 Glass Cards */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="glass rounded-[3rem] p-32 text-center border border-gray-100 bg-white/20">
            <div className="bg-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10">
              <Search size={40} className="text-primary/20" />
            </div>
            <h3 className="text-3xl font-cormorant font-bold italic text-primary mb-4">Quiet Constellation.</h3>
            <p className="text-gray-500 max-w-sm mx-auto font-light leading-relaxed">
              No linked projects detected. Clients who utilize your practitioner key will appear in this frequency.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}/floor-plan`} className="group block h-full">
      <div className="glass p-10 rounded-[2.5rem] shadow-xl shadow-black/[0.02] border border-white hover:border-teal-200 transition-all h-full flex flex-col justify-between relative overflow-hidden">
        
        {/* Accent backgrounds */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-colors" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-110">
               <LayoutGrid size={28} />
            </div>
            
            <div className="flex gap-2">
              {project.video_path && (
                <div className="bg-teal-500 p-2.5 rounded-xl text-white shadow-lg shadow-teal-100" title="Audio-Visual Data Available">
                  <Video size={16} />
                </div>
              )}
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold tracking-widest uppercase border ${
                project.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'
              }`}>
                {project.status}
              </div>
            </div>
          </div>

          <h3 className="text-3xl font-cormorant font-bold text-primary italic mb-4 truncate group-hover:text-teal-700 transition-colors">
            {project.name}
          </h3>
          
          <div className="space-y-3 mb-10">
            <div className="flex items-center gap-3 text-sm text-gray-500 font-light">
              <UserIcon size={14} className="text-teal-500/50" />
              <span className="truncate">{project.profiles.email}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-400 font-light tracking-wide italic">
              <Clock size={14} className="text-teal-500/50" />
              <span>Registered: {format(new Date(project.created_at), 'PPP')}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-gray-50 flex items-center justify-between">
          <div className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase flex items-center gap-3 group/link">
            Launch Analysis <ExternalLink size={14} className="group-hover/link:translate-x-1 transition-transform" />
          </div>
          <ChevronRight className="text-gray-200 group-hover:text-primary transition-colors transform group-hover:translate-x-2" size={24} />
        </div>
      </div>
    </Link>
  );
}

