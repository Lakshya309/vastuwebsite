// app/admin/AstrologerKeyGenerator.tsx
'use client';

import React, { useState } from 'react';
import { Key, Copy, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AstrologerKeyGenerator() {
  const [duration, setDuration] = useState(30);
  const [generatedKey, setGeneratedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerateKey = async () => {
    setLoading(true);
    setError('');
    setGeneratedKey('');

    try {
      const response = await fetch('/api/admin/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_days: duration }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate key');
      }

      setGeneratedKey(data.key);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass p-10 rounded-[2.5rem] border border-white shadow-xl shadow-black/[0.02] relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center text-primary">
            <Key size={24} />
          </div>
          <div>
            <h3 className="text-xl font-cormorant font-bold italic text-primary">Access Provisioning</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Generate Temporary Practitioner Tokens</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1">
            <label htmlFor="duration" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Temporal Validity (Days)
            </label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="w-full px-6 py-4 bg-white/50 border border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-light italic"
              min="1"
            />
          </div>
          <button
            onClick={handleGenerateKey}
            disabled={loading}
            className="px-10 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all text-[10px] tracking-widest uppercase disabled:bg-gray-300 flex items-center gap-3"
          >
            {loading ? 'Encrypting...' : <><Sparkles size={16} /> Forge Token</>}
          </button>
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="mt-6 text-xs text-red-600 font-medium italic"
          >
            {error}
          </motion.p>
        )}

        {generatedKey && (
          <div className="mt-10 pt-10 border-t border-gray-100/50">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Generated Credentials:
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-grow px-8 py-4 glass border border-teal-100 rounded-xl font-mono text-primary text-lg tracking-wider font-bold shadow-inner">
                {generatedKey}
              </div>
              <button
                onClick={handleCopyToClipboard}
                className="p-4 bg-white border border-gray-100 text-primary hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm active:scale-90"
                title="Copy to terminal"
              >
                {copied ? <CheckCircle2 size={24} className="text-green-500" /> : <Copy size={24} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

