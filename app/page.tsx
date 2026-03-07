"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 text-gray-900 selection:bg-blue-200 font-sans">
      {/* Background grid */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(#d1d5db 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <main className="relative z-10 container mx-auto px-6 py-20">

        {/* HERO */}
        <section className="text-center mb-16 pt-10">
          
          {/* LOGO */}
          <Image
            src="/media/mangalamlogo.png"
            alt="Manglam Vastu Logo"
            width={180}
            height={60}
            className="mx-auto mb-6"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 mb-6 border border-blue-400/30 rounded-full bg-blue-50/50 text-blue-600 text-sm font-medium tracking-wide"
          >
            Precision Mandala Analysis
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-gray-900 to-gray-500 bg-clip-text text-transparent">
            Architectural Harmony <br /> Meets Sacred Science.
          </h1>

          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed">
            The first MVP-ready Vastu engine that dynamically maps Marma points onto irregular layouts. 
            Transform your floor plan with instant insights.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link href="/projects">
              <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-300/50 transition-all transform hover:-translate-y-1">
                Start New Project
              </button>
            </Link>

            <button className="px-8 py-4 bg-white/70 backdrop-blur-md border border-gray-300 hover:bg-gray-100 text-gray-800 rounded-xl font-bold transition-all shadow-md">
              View Sample Analysis
            </button>
          </div>

          {/* PREVIEW IMAGES */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            
            {/* Plot */}
            <div className="relative bg-gray-100 border border-gray-300 rounded-2xl p-6 aspect-video shadow-lg">
              <Image
                src="/media/plot1.png"
                alt="Dynamic Map Plot"
                fill
                className="object-contain rounded-xl"
              />
            </div>

            {/* Report snippet */}
            <div className="relative bg-gray-100 border border-gray-300 rounded-2xl p-6 aspect-video shadow-lg">
              <Image
                src="/media/reportsnippet.png"
                alt="Report Snippet"
                fill
                className="object-contain rounded-xl"
              />
            </div>
          </div>

          {/* EXPERIENCE TEXT */}
          <div className="max-w-3xl mx-auto mb-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Decades of Astrological Expertise.</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Built on years of deep astrological research and real-world consultancy experience, 
              translating ancient Vastu wisdom into precise, actionable modern architecture insights.
            </p>
          </div>

          {/* SYSTEM SECTION */}
          <div className="grid md:grid-cols-2 items-center gap-12 max-w-6xl mx-auto">
            <div className="text-left">
              <h2 className="text-3xl font-bold mb-4">Our Intricate Analysis System.</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Our proprietary engine evaluates hundreds of data points including orientation, 
                zones, energy grids, and object placements to compute an accurate harmony score.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                  Ancient-text based algorithms
                </li>
                <li className="flex gap-3">
                  <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                  Multi-factor scoring system
                </li>
              </ul>
            </div>

            <div className="relative bg-gray-100 border border-gray-300 rounded-2xl p-6 aspect-square shadow-lg">
              <Image
                src="/media/detailedreport.png"
                alt="Detailed Analysis"
                fill
                className="object-cover rounded-xl"
              />
            </div>
          </div>
        </section>

        {/* DYNAMIC CANVAS */}
        <section className="bg-gray-50 border border-gray-200 rounded-[2rem] p-12 mb-32 shadow-inner">
          <div className="grid md:grid-cols-2 items-center gap-12">
            <div>
              <h2 className="text-4xl font-bold mb-6">Dynamic Canvas Mapping</h2>
              <ul className="space-y-4 text-gray-700">
                <li>Real-time zone detection for irregular plots</li>
                <li>Instant Marma conflict alerts</li>
              </ul>
            </div>

            <div className="relative aspect-square bg-gray-200 rounded-2xl border p-4 shadow-2xl">
              <Image
                src="/media/canvas preview.png"
                alt="Canvas Preview"
                fill
                className="object-cover rounded-xl"
              />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mb-32">
          <h2 className="text-4xl font-bold text-center mb-12">Core Features</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8 bg-white rounded-2xl shadow-lg border">
              <h3 className="text-2xl font-bold mb-4">Vastu Analysis Engine</h3>
              <p>Advanced compliance scoring using sacred Vastu principles.</p>
            </div>
            <div className="p-8 bg-white rounded-2xl shadow-lg border">
              <h3 className="text-2xl font-bold mb-4">Interactive Floor Plan</h3>
              <p>Draw layouts, place objects, get instant feedback.</p>
            </div>
            <div className="p-8 bg-white rounded-2xl shadow-lg border">
              <h3 className="text-2xl font-bold mb-4">Detailed Reporting</h3>
              <p>Generate high-fidelity PDF vastu reports instantly.</p>
            </div>
          </div>
        </section>

      </main>

      <footer className="relative z-10 py-10 text-center text-gray-600 text-sm">
        © 2021 Manglam Vastu — All Rights Reserved
      </footer>
    </div>
  );
}