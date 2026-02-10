"use client";
import { motion } from 'framer-motion'; // For the "10k style" animations
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 text-gray-900 selection:bg-blue-200 font-sans">
      {/* Subtle Grid Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ backgroundImage: `radial-gradient(#d1d5db 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <main className="relative z-10 container mx-auto px-6 py-20">
        
        {/* HERO SECTION - Updated */}
        <section className="text-center mb-16 pt-10"> {/* Reduced bottom margin */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 mb-6 border border-blue-400/30 rounded-full bg-blue-50/50 text-blue-600 text-sm font-medium tracking-wide"
          >
            Precision Mandala Analysis
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-gray-900 to-gray-500 bg-clip-text text-transparent">
            Architectural Harmony <br/> Meets Sacred Science.
          </h1>
          
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed">
            The first MVP-ready Vastu engine that dynamically maps Marma points onto irregular layouts. 
            Transform your floor plan with instant insights.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16"> {/* Added bottom margin */}
            <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-300/50 transition-all transform hover:-translate-y-1">
              <Link href={"/projects"}>Start New Project</Link>
            </button>
            <button className="px-8 py-4 bg-white/70 backdrop-blur-md border border-gray-300 hover:bg-gray-100 text-gray-800 rounded-xl font-bold transition-all shadow-md">
              View Sample Analysis
            </button>
          </div>

          {/* New Section: Image Placeholders (Map Plot & Report) */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            <div className="bg-gray-100 border border-gray-300 rounded-2xl p-6 flex items-center justify-center aspect-video shadow-lg">
              <p className="text-gray-500 italic text-lg">[ Dynamic Map Plot Preview ]</p>
            </div>
            <div className="bg-gray-100 border border-gray-300 rounded-2xl p-6 flex items-center justify-center aspect-video shadow-lg">
              <p className="text-gray-500 italic text-lg">[ High-Fidelity PDF Report Snippet ]</p>
            </div>
          </div>

          {/* New Section: Astrology Experience */}
          <div className="max-w-3xl mx-auto mb-16 text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Decades of Astrological Expertise.</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Our advanced Vastu engine is built upon years of deep astrological research and practical experience, 
              translating ancient wisdom into precise, actionable insights for modern architecture.
            </p>
          </div>

          {/* New Section: Intricate Analysis System */}
          <div className="grid md:grid-cols-2 items-center gap-12 max-w-6xl mx-auto">
            <div className="text-left">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Intricate Analysis System.</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Beyond conventional Vastu, our platform employs a proprietary algorithm to analyze hundreds of data points, 
                from land topography to object placements, generating a comprehensive score that reflects the true energetic harmony of your space.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                  <span>Proprietary algorithms based on ancient texts.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                  <span>Multi-factor scoring system for precise insights.</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-100 border border-gray-300 rounded-2xl p-6 flex items-center justify-center aspect-square shadow-lg">
              <p className="text-gray-500 italic text-lg">[ System Flowchart / Detailed Analysis Screenshot ]</p>
            </div>
          </div>
        </section>

        {/* USE-CASE CENTRIC MODELS: USER vs ASTROLOGER */}
        <section className="grid md:grid-cols-2 gap-8 mb-32">
          {/* For the Homeowner/User */}
          <div className="group p-8 rounded-3xl bg-white border border-gray-200 hover:border-blue-400 transition-all shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 border border-blue-200">
              <span className="text-blue-600 font-bold">01</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">For Homeowners</h3>
            <p className="text-gray-700 mb-6">
              Perfect for a single-property deep dive. Map your furniture, check for Marma conflicts, and receive a high-fidelity PDF report.
            </p>
            <div className="flex items-center text-blue-600 font-medium">
              Pay-as-you-go Credits • One Credit per Analysis
            </div>
          </div>

          {/* For the Astrologer */}
          <div className="group p-8 rounded-3xl bg-white border border-gray-200 hover:border-purple-400 transition-all shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6 border border-purple-200">
              <span className="text-purple-600 font-bold">02</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">For Professionals</h3>
            <p className="text-gray-700 mb-6">
              A high-speed tool for your consultancy. Handle unlimited clients, manage complex "L" and "U" shaped plans, and generate reports instantly.
            </p>
            <div className="flex items-center text-purple-600 font-medium">
              Time-Based Access • Unlimited Analysis
            </div>
          </div>
        </section>

        {/* FEATURE HIGHLIGHT: REAL-TIME ENGINE */}
        <section className="bg-gray-50 border border-gray-200 rounded-[2rem] p-12 mb-32 overflow-hidden relative shadow-inner">
          <div className="grid md:grid-cols-2 items-center gap-12">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">Dynamic Marma Mapping</h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                  <span>Real-time zone detection for irregular plots.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                  <span>Instant alerts for furniture placement on sensitive Marma points.</span>
                </li>
                </ul>
            </div>
            <div className="relative">
              {/* Visual Placeholder for the Canvas System */}
              <div className="aspect-square bg-gray-200 rounded-2xl border border-gray-300 p-4 shadow-2xl rotate-3 flex items-center justify-center">
                 <p className="text-gray-500 italic">[ Interactive Canvas Preview ]</p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}