// app/admin/AdminUserTable.tsx
'use client';

import React, { useState } from 'react';
import { Edit2, Shield, Coins, Calendar, X, Check, Activity, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserData {
  id: string;
  email: string | null;
  role: string;
  credits: number;
  valid_from: string | null;
  valid_to: string | null;
}

interface AdminUserTableProps {
  users: UserData[];
}

export default function AdminUserTable({ users: initialUsers }: AdminUserTableProps) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [validFrom, setValidFrom] = useState<string>('');
  const [validTo, setValidTo] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEditClick = (user: UserData) => {
    setEditingUserId(user.id);
    setNewRole(user.role);
    setCreditAmount(0);
    setValidFrom(user.valid_from ? new Date(user.valid_from).toISOString().split('T')[0] : '');
    setValidTo(user.valid_to ? new Date(user.valid_to).toISOString().split('T')[0] : '');
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setMessage(null);
  };

  const callAdminApi = async (action: string, body: any) => {
    setMessage(null);
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Spectral sync failure');

      setMessage({ type: 'success', text: data.message });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Unknown astral error' });
    }
  };

  return (
    <div className="overflow-x-auto">
      {message && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 mx-8 mt-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-center border ${
            message.type === 'success' 
            ? 'bg-teal-50/50 text-teal-700 border-teal-100 shadow-lg shadow-teal-100/20' 
            : 'bg-red-50/50 text-red-700 border-red-100 shadow-lg shadow-red-100/20'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
             <Activity size={14} className={message.type === 'success' ? 'animate-pulse' : ''} />
             {message.text}
          </div>
        </motion.div>
      )}
      
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className="bg-primary/5 text-primary text-[10px] uppercase tracking-[0.2em] font-bold">
            <th className="px-8 py-6 border-b border-white/50 first:rounded-tl-[2rem]">Universal Identity</th>
            <th className="px-8 py-6 border-b border-white/50">Spectral Role</th>
            <th className="px-8 py-6 border-b border-white/50">Stored Essence</th>
            <th className="px-8 py-6 border-b border-white/50 last:rounded-tr-[2rem] text-right">Action Protocol</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          <AnimatePresence mode="popLayout">
            {users.map((user, idx) => (
              <React.Fragment key={user.id}>
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`hover:bg-white/40 transition-all group ${editingUserId === user.id ? 'bg-primary/[0.03]' : ''}`}
                >
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-110">
                        {user.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary group-hover:text-teal-700 transition-colors">
                          {user.email || 'Anonymous Consciousness'}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono tracking-tighter uppercase mt-0.5">UID: {user.id.substring(0, 12)}...</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full animate-pulse shadow-sm ${
                         user.role === 'admin' ? 'bg-purple-500 shadow-purple-200' : 
                         user.role === 'astrologer' ? 'bg-teal-500 shadow-teal-200' : 
                         'bg-primary/40 shadow-blue-200'
                       }`} />
                       <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">
                         {user.role}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gold-50/50 rounded-lg border border-gold-100/50 text-gold-600">
                        <Coins size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-cormorant font-bold italic text-primary">{user.credits} Units</span>
                        <span className="text-[8px] text-gray-400 uppercase tracking-widest font-bold">Essence Pool</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="p-3.5 bg-white text-primary rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90 border border-white group-hover:shadow-lg group-hover:shadow-primary/10"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </motion.tr>
                
                {editingUserId === user.id && (
                  <motion.tr 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-primary/[0.03]"
                  >
                    <td colSpan={4} className="p-10">
                      <div className="glass p-10 rounded-[3rem] border border-white shadow-2xl relative overflow-hidden group/editor">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                        
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
                          {/* Role Editor */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                               <Shield size={14} className="text-primary" />
                               <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Temporal Frequency</label>
                            </div>
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="w-full px-5 py-4 bg-white/50 border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm italic"
                            >
                              <option value="user">Standard Consciousness</option>
                              <option value="astrologer">Vedic Practitioner</option>
                              <option value="admin">System Overseer</option>
                            </select>
                            <button
                              onClick={() => callAdminApi('updateRole', { userId: user.id, newRole })}
                              className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                              Calibrate Frequency
                            </button>
                          </div>

                          {/* Credits Adjuster */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                               <Sparkles size={14} className="text-gold-500" />
                               <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Essence Injection</label>
                            </div>
                            <input
                              type="number"
                              value={creditAmount}
                              onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                              className="w-full px-5 py-4 bg-white/50 border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm italic"
                            />
                            <button
                              onClick={() => callAdminApi('adjustCredits', { userId: user.id, amount: creditAmount })}
                              className="w-full py-4 bg-teal-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-teal-100 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                              Transmit Essence
                            </button>
                          </div>

                          {/* Astrologer Access Dates */}
                          {newRole === 'astrologer' && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-2">
                                 <Calendar size={14} className="text-primary" />
                                 <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Temporal Validity</label>
                              </div>
                              <div className="flex gap-3">
                                <input
                                  type="date"
                                  value={validFrom}
                                  onChange={(e) => setValidFrom(e.target.value)}
                                  className="w-full px-4 py-4 bg-white/50 border border-white rounded-2xl text-[10px] italic"
                                />
                                <input
                                  type="date"
                                  value={validTo}
                                  onChange={(e) => setValidTo(e.target.value)}
                                  className="w-full px-4 py-4 bg-white/50 border border-white rounded-2xl text-[10px] italic"
                                />
                              </div>
                              <button
                                onClick={() => callAdminApi('updateAstrologerAccess', { userId: user.id, validFrom: validFrom + 'T00:00:00Z', validTo: validTo + 'T23:59:59Z' })}
                                className="w-full py-4 bg-gold-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-gold-100 hover:scale-[1.02] active:scale-95 transition-all"
                              >
                                Fix Horizon
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-10 pt-8 border-t border-white/50 flex justify-end">
                           <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-red-500 transition-all active:scale-95"
                          >
                            <X size={16} /> Terminate Protocol
                          </button>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}