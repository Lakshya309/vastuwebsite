"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden font-inter selection:bg-teal-100">
      
      {/* V1 ORGANIC BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none grid-overlay">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-peach-gold opacity-30 blur-[150px] rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, -40, 0], y: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-navy opacity-10 blur-[150px] rounded-full" 
        />
      </div>

      <main className="relative z-10 pt-32 pb-20">
        
        {/* V1 HERO SECTION */}
        <section className="px-6 lg:px-24 mb-32">
          <div className="max-w-5xl mx-auto text-center">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="inline-block px-4 py-2 mb-10 glass rounded-full text-sm font-medium tracking-wide text-primary"
            >
              Precision Engineering Meets Ancient Wisdom
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl md:text-8xl lg:text-9xl mb-10 font-cormorant italic tracking-tight text-primary leading-[0.85]"
            >
              The Architecture <br />
              <span className="font-normal not-italic">of the Soul.</span>
            </motion.h1>

            <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4, duration: 0.8 }}
               className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-16 leading-relaxed font-light"
            >
              Harmonize your living space through the world's most advanced Vastu intelligence platform. 
              Bridging the gap between sacred orientation and modern design.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row justify-center gap-6"
            >
              <Link href="/projects">
                <button className="px-10 py-5 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                  START NEW PROJECT
                </button>
              </Link>
              <button className="px-10 py-5 glass text-primary font-bold rounded-xl hover:bg-white/60 transition-all border border-primary/10">
                VIEW SAMPLE ANALYSIS
              </button>
            </motion.div>
          </div>
        </section>

        {/* V1 FEATURE REVEAL (CARDS) */}
        <section className="px-6 lg:px-24 mb-40">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
            
            {/* CARD 1 */}
            <motion.div 
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -50 }}
              viewport={{ once: true }}
              className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 overflow-hidden border border-gray-100"
            >
              <div className="aspect-video relative bg-gray-50 overflow-hidden group">
                <Image
                  src="/media/plot1.png"
                  alt="Vastu Analysis Plot"
                  fill
                  className="object-contain p-12 transition-transform duration-1000 group-hover:scale-110"
                />
              </div>
              <div className="p-12">
                <h3 className="text-3xl font-cormorant font-bold mb-6 text-primary italic">Astrological Precision.</h3>
                <p className="text-gray-500 font-light leading-relaxed mb-8">
                  Our system computes Marma point intersections with irregular layouts, providing actionable insights with unparalleled accuracy.
                </p>
                <div className="w-12 h-1 bg-accent-gold rounded-full" />
              </div>
            </motion.div>

            {/* CARD 2 */}
            <motion.div 
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 50 }}
              viewport={{ once: true }}
              className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 overflow-hidden border border-gray-100 mt-12 md:mt-24"
            >
              <div className="aspect-video relative bg-gray-50 overflow-hidden group">
                <Image
                  src="/media/reportsnippet.png"
                  alt="Harmony Score"
                  fill
                  className="object-contain p-12 transition-transform duration-1000 group-hover:scale-110"
                />
              </div>
              <div className="p-12">
                <h3 className="text-3xl font-cormorant font-bold mb-6 text-primary italic">Systemic Analysis.</h3>
                <p className="text-gray-500 font-light leading-relaxed mb-8">
                  Evaluate energy flow across 16 cardinal zones. Get instant harmony scores and detailed mitigation reports.
                </p>
                <div className="w-12 h-1 bg-accent-gold rounded-full" />
              </div>
            </motion.div>

          </div>
        </section>

        {/* V1 SACRED SECTION */}
        <section className="px-6 lg:px-24 mb-40 bg-white/30 backdrop-blur-sm py-32 border-y border-white/50 relative">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
            
            <div className="relative">
              <div className="aspect-square relative glass rounded-[4rem] p-16 shadow-inner">
                <Image
                  src="/media/detailedreport.png"
                  alt="Technical Vastu Report"
                  fill
                  className="object-cover rounded-[3rem]"
                />
              </div>
              {/* Floating accent */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-10 -right-10 w-32 h-32 bg-accent-gold/20 blur-3xl rounded-full" 
              />
            </div>

            <div>
              <h2 className="text-5xl md:text-7xl font-cormorant italic font-bold mb-10 text-primary leading-tight">
                Modernity <br />
                <span className="not-italic font-normal">Aligned.</span>
              </h2>
              <p className="text-xl text-gray-600 mb-12 font-light leading-relaxed">
                Translate ancient wisdom into the language of modern architecture. 
                Our platform provides the tools for architects and individuals to create spaces that breathe and thrive.
              </p>
              
              <ul className="space-y-6">
                {["Proprietary Alignment Algorithm", "Real-time Zone Detection", "Professional Consultant Portal"].map((item, i) => (
                  <li key={i} className="flex gap-4 items-center">
                    <div className="w-6 h-[1px] bg-accent-gold" />
                    <span className="text-gray-700 font-medium tracking-wide uppercase text-xs">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* V1 DYNAMIC CANVAS */}
        <section className="px-6 lg:px-24 mb-40">
          <div className="max-w-7xl mx-auto glass rounded-[3rem] p-12 md:p-24 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
            
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div>
                <h2 className="text-4xl md:text-6xl font-cormorant italic font-bold mb-8 text-primary">The Canvas Hub.</h2>
                <div className="space-y-8">
                  <p className="text-gray-600 text-lg font-light leading-relaxed">
                    Our dynamic canvas engine allows for real-time furniture placement and Vastu compliance checking. 
                    Immediate feedback on your most critical architectural decisions.
                  </p>
                  <Link href="/projects" className="inline-flex items-center gap-4 text-primary font-bold tracking-widest text-sm group">
                    EXPLORE THE ENGINE 
                    <span className="w-8 h-[1px] bg-primary group-hover:w-12 transition-all" />
                  </Link>
                </div>
              </div>
              <div className="relative aspect-square bg-gray-50 rounded-3xl p-4 shadow-xl border border-white">
                <Image
                  src="/media/canvas preview.png"
                  alt="Dynamic Canvas Engine"
                  fill
                  className="object-cover rounded-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* V1 CORE SYSTEMS GRID */}
        <section className="px-6 lg:px-24 mb-32">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
               <h2 className="text-4xl md:text-6xl font-cormorant italic font-bold text-primary mb-6">Expert Systems.</h2>
               <div className="w-24 h-1 bg-accent-gold mx-auto" />
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                { title: "Vastu Engine", desc: "Advanced compliance scoring through sacred logic." },
                { title: "Interactive Hub", desc: "Simulate placements in real-time architectural space." },
                { title: "Smart Reports", desc: "Generate professional dossiers on space harmony." }
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-primary group-hover:text-white transition-all text-primary">
                    <span className="text-xl font-bold">{i+1}</span>
                  </div>
                  <h3 className="text-2xl font-cormorant font-bold mb-4 italic text-primary">{item.title}</h3>
                  <p className="text-gray-500 font-light leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* V1 FOOTER */}
      <footer className="relative z-10 py-20 px-6 lg:px-24 border-t border-gray-100 bg-white/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <Image
            src="/media/mangalamlogo.png"
            alt="Manglam Vastu Logo"
            width={160}
            height={54}
            className="opacity-80 contrast-125"
          />
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <p className="text-gray-400 text-sm tracking-widest uppercase font-medium">
              © 2026 Mangalam Vastu — Excellence in Sacred Design.
            </p>
            <div className="flex items-center gap-6 text-xs">
              <Link href="/contact" className="text-gray-400 hover:text-primary transition-colors font-medium">
                Contact
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/terms" className="text-gray-400 hover:text-primary transition-colors font-medium">
                Terms
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/privacy" className="text-gray-400 hover:text-primary transition-colors font-medium">
                Privacy
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/refund" className="text-gray-400 hover:text-primary transition-colors font-medium">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
