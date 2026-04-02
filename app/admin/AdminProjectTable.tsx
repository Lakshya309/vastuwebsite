// app/admin/AdminProjectTable.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { LayoutGrid, Mail, Calendar, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectData {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
  profiles: {
    email: string | null;
  } | null;
}

interface AdminProjectTableProps {
  projects: ProjectData[];
}

export default function AdminProjectTable({ projects }: AdminProjectTableProps) {
  if (!projects || projects.length === 0) {
    return (
      <div className="p-32 text-center">
        <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <LayoutGrid className="text-primary/20" size={32} />
        </div>
        <p className="text-primary font-cormorant font-bold italic text-xl">Void Canvas.</p>
        <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-2">No projects recorded in this stream</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-primary/5 text-primary text-[10px] uppercase tracking-[0.2em] font-bold">
              <th className="px-8 py-5 border-b border-white/50 first:rounded-tl-[2rem]">Project Flow</th>
              <th className="px-8 py-5 border-b border-white/50">Origin (Owner)</th>
              <th className="px-8 py-5 border-b border-white/50">Inception</th>
              <th className="px-8 py-5 border-b border-white/50 last:rounded-tr-[2rem] text-right">Protocol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {projects.map((project, idx) => (
              <motion.tr 
                key={project.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="hover:bg-white/40 transition-all group"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-50 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-110">
                       <LayoutGrid size={20} />
                    </div>
                    <span className="text-sm font-bold text-primary truncate max-w-[200px] group-hover:text-teal-700 transition-colors">
                      {project.name}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2 text-xs text-gray-500 font-light italic">
                    <Mail size={14} className="text-teal-500/50" />
                    {project.profiles?.email || 'Unknown Entity'}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-light tracking-wide">
                    <Calendar size={14} className="text-teal-500/50" />
                    {format(new Date(project.created_at), 'PPP')}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <Link href={`/projects/${project.id}/floor-plan`}>
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary border border-white rounded-xl shadow-sm text-[9px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95">
                      Oversee <ExternalLink size={12} />
                    </button>
                  </Link>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

