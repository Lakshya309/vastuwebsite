"use client";
import { motion } from 'framer-motion'; // For the "10k style" animations

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-emerald-500/30 font-sans">
      {/* Subtle Grid Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <main className="relative z-10 container mx-auto px-6 py-20">
        
        {/* HERO SECTION */}
        <section className="text-center mb-32 pt-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 mb-6 border border-emerald-500/30 rounded-full bg-emerald-500/5 text-emerald-400 text-sm font-medium tracking-wide"
          >
            Precision 45 Devta Mandala Analysis
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
            Architectural Harmony <br/> Meets Sacred Science.
          </h1>
          
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            The first MVP-ready Vastu engine that dynamically maps Marma points onto irregular layouts. 
            Transform your floor plan with instant Devta-zone insights.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all transform hover:-translate-y-1">
              Start New Project
            </button>
            <button className="px-8 py-4 bg-slate-800/50 backdrop-blur-md border border-slate-700 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">
              View Sample Analysis
            </button>
          </div>
        </section>

        {/* USE-CASE CENTRIC MODELS: USER vs ASTROLOGER */}
        <section className="grid md:grid-cols-2 gap-8 mb-32">
          {/* For the Homeowner/User */}
          <div className="group p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-6 border border-emerald-500/20">
              <span className="text-emerald-400 font-bold">01</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">For Homeowners</h3>
            <p className="text-slate-400 mb-6">
              Perfect for a single-property deep dive. Map your furniture, check for Marma conflicts, and receive a high-fidelity PDF report.
            </p>
            <div className="flex items-center text-emerald-400 font-medium">
              Pay-as-you-go Credits • One Credit per Analysis
            </div>
          </div>

          {/* For the Astrologer */}
          <div className="group p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-6 border border-indigo-500/20">
              <span className="text-indigo-400 font-bold">02</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">For Professionals</h3>
            <p className="text-slate-400 mb-6">
              A high-speed tool for your consultancy. Handle unlimited clients, manage complex "L" and "U" shaped plans, and generate reports instantly.
            </p>
            <div className="flex items-center text-indigo-400 font-medium">
              Time-Based Access • Unlimited Analysis
            </div>
          </div>
        </section>

        {/* FEATURE HIGHLIGHT: REAL-TIME ENGINE */}
        <section className="bg-white/5 border border-white/10 rounded-[2rem] p-12 mb-32 overflow-hidden relative">
          <div className="grid md:grid-cols-2 items-center gap-12">
            <div>
              <h2 className="text-4xl font-bold mb-6">Dynamic Marma Mapping</h2>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span>Real-time Devta zone detection for irregular plots.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span>Instant alerts for furniture placement on sensitive Marma points.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span>Secure data persistence via Supabase Row-Level Security.</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              {/* Visual Placeholder for the Canvas System */}
              <div className="aspect-square bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-2xl rotate-3 flex items-center justify-center">
                 <p className="text-slate-500 italic">[ Interactive Canvas Preview ]</p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}