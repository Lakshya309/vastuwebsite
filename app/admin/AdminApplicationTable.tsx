"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Clock, User, Calendar, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Application {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles: {
    email: string;
  };
}

export default function AdminApplicationTable() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await fetch("/api/admin/applications/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: id }),
      });

      if (res.ok) {
        setApplications((prev) => prev.filter((app) => app.id !== id));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to approve application");
      }
    } catch (err) {
      console.error("Error approving application:", err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="p-20 text-center">
      <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
      <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Retrieving Applications...</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        {applications.length === 0 ? (
          <div className="p-32 text-center">
            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="text-primary/20" size={32} />
            </div>
            <p className="text-primary font-cormorant font-bold italic text-xl">Quiet Channel.</p>
            <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-2">No pending practitioner requests</p>
          </div>
        ) : (
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-primary/5 text-primary text-[10px] uppercase tracking-[0.2em] font-bold">
                <th className="px-8 py-5 border-b border-white/50 first:rounded-tl-[2rem]">Identity</th>
                <th className="px-8 py-5 border-b border-white/50">Submission</th>
                <th className="px-8 py-5 border-b border-white/50">Frequency</th>
                <th className="px-8 py-5 border-b border-white/50 last:rounded-tr-[2rem] text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              <AnimatePresence>
                {applications.map((app, idx) => (
                  <motion.tr 
                    key={app.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-white/40 transition-all group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-105">
                          {app.profiles.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary group-hover:text-teal-700 transition-colors">{app.profiles.email}</span>
                          <span className="text-[9px] text-gray-400 font-mono tracking-tighter uppercase">{app.user_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-light italic">
                        <Calendar size={14} className="text-teal-500/50" />
                        {format(new Date(app.created_at), "PPP")}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                         <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Spectral Audit</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={processingId !== null}
                          className="p-3 bg-white text-teal-600 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm active:scale-90 disabled:opacity-50 border border-white"
                          title="Authorize Entry"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          className="p-3 bg-white text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90 disabled:opacity-50 border border-white"
                          title="Deny Access"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

