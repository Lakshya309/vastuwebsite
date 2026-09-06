"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] },
  }),
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

/* ─── Marquee items ─── */
const MARQUEE_ITEMS = [
  "5,000+ Analyses",
  "AI-Powered Intelligence",
  "16 Zone Vedic System",
  "Marma Point Detection",
  "Professional Reports",
  "Real-Time Compliance",
  "Ancient Wisdom — Modern Precision",
];

/* ─── Section heading ─── */
function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3 mb-6">
      <span className="w-8 h-px bg-accent-gold" />
      <span className="text-eyebrow text-gray-400">{children}</span>
      <span className="w-8 h-px bg-accent-gold" />
    </div>
  );
}

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="relative overflow-hidden">

      {/* ═══════════════════════════════════════════════
          HERO — Full-Screen Immersive
      ═══════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-16 px-6 lg:px-24 overflow-hidden"
      >
        {/* Background Video Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-105 opacity-100 transition-opacity duration-1000"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          {/* Soft Gradient Overlay for Optimal Text Legibility & Seamless Bottom Fade */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(250,248,244,0.65) 0%, rgba(250,248,244,0.45) 50%, rgba(250,248,244,0.98) 100%)",
            }}
          />
        </div>

        {/* Ambient background layers */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <motion.div
            animate={{ scale: [1, 1.08, 1], x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full blur-[200px]"
            style={{ background: "radial-gradient(circle, rgba(212,168,83,0.18) 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], x: [0, -25, 0], y: [0, -30, 0] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 rounded-full blur-[180px]"
            style={{ background: "radial-gradient(circle, rgba(19,84,122,0.12) 0%, transparent 70%)" }}
          />
          {/* Sacred geometry faint ring */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vmin] h-[80vmin] rounded-full border border-primary/5"
            style={{ boxShadow: "inset 0 0 80px rgba(19,84,122,0.04)" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vmin] h-[60vmin] rounded-full border border-accent-gold/6" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vmin] h-[40vmin] rounded-full border border-primary/6" />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto w-full text-center"
        >
          {/* Eyebrow tag */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-3 mb-10"
          >
            <span className="w-6 h-px bg-accent-gold" />
            <span className="text-eyebrow text-gray-400 tracking-[0.22em]">
              Precision Engineering · Ancient Wisdom
            </span>
            <span className="w-6 h-px bg-accent-gold" />
          </motion.div>

          {/* Main headline — scroll-triggered character reveal via word groups */}
          <div className="mb-10 overflow-hidden">
            <motion.div
              initial="hidden"
              animate="show"
              variants={staggerContainer}
            >
              <motion.h1
                variants={fadeUp}
                custom={0}
                className="text-[clamp(3.5rem,10vw,8.5rem)] leading-[0.88] tracking-[-0.03em] mb-3"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                <span className="font-bold italic text-primary">The Architecture</span>
              </motion.h1>
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-[clamp(3.5rem,10vw,8.5rem)] leading-[0.88] tracking-[-0.03em] mb-3"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                <span className="font-light not-italic text-ink">of the Soul.</span>
              </motion.h1>
            </motion.div>
          </div>

          {/* Subline */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-14 leading-[1.7]"
            style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif", letterSpacing: "0.005em" }}
          >
            Harmonize your living space through the world's most advanced Vastu intelligence platform.
            Where sacred orientation meets modern architectural precision.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link href="/projects">
              <button
                className="group relative px-10 py-4 bg-primary text-white font-semibold rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
                style={{ letterSpacing: "0.06em", fontSize: "0.8rem", textTransform: "uppercase" }}
              >
                <span className="relative z-10">Start New Project</span>
                <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-2xl" />
              </button>
            </Link>
            <Link href="/pricing">
              <button
                className="px-10 py-4 glass text-primary font-semibold rounded-2xl border border-primary/20 hover:bg-white/70 hover:border-primary/40 hover:scale-105 active:scale-95 transition-all duration-300"
                style={{ letterSpacing: "0.06em", fontSize: "0.8rem", textTransform: "uppercase" }}
              >
                View Plans
              </button>
            </Link>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-eyebrow text-gray-300" style={{ fontSize: "0.6rem" }}>Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-px h-10 bg-gradient-to-b from-gray-300 to-transparent"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          MARQUEE — Trust signals strip
      ═══════════════════════════════════════════════ */}
      <section className="py-6 border-y border-gray-100/80 bg-white/30 overflow-hidden">
        {/* Two identical lists side-by-side — the animation moves the pair left by exactly 50%,
            so when it reaches the halfway point it seamlessly loops back to the start. */}
        <div className="flex overflow-hidden" aria-hidden="true">
          <div
            className="flex flex-shrink-0 py-2"
            style={{ animation: "marquee 28s linear infinite", willChange: "transform" }}
          >
            {MARQUEE_ITEMS.map((item, i) => (
              <span key={`a-${i}`} className="inline-flex items-center gap-6 mx-6 flex-shrink-0">
                <span
                  className="text-gray-400"
                  style={{
                    fontFamily: "var(--font-outfit), system-ui, sans-serif",
                    fontSize: "0.68rem",
                    fontWeight: 500,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item}
                </span>
                <span className="w-1 h-1 rounded-full bg-accent-gold flex-shrink-0" />
              </span>
            ))}
            {/* Duplicate — must be identical so the seam is invisible */}
            {MARQUEE_ITEMS.map((item, i) => (
              <span key={`b-${i}`} className="inline-flex items-center gap-6 mx-6 flex-shrink-0">
                <span
                  className="text-gray-400"
                  style={{
                    fontFamily: "var(--font-outfit), system-ui, sans-serif",
                    fontSize: "0.68rem",
                    fontWeight: 500,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item}
                </span>
                <span className="w-1 h-1 rounded-full bg-accent-gold flex-shrink-0" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          BENTO FEATURES — Asymmetric grid
      ═══════════════════════════════════════════════ */}
      <section className="section-pad">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp}>
              <SectionTag>Platform Capabilities</SectionTag>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-[clamp(2.5rem,6vw,5rem)] text-primary text-section"
            >
              Built for the Discerning.
            </motion.h2>
          </motion.div>

          {/* Bento grid */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Large feature card — spans 2 rows on lg */}
            <motion.div
              variants={fadeUp}
              className="lg:row-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-primary/6 border border-gray-100 overflow-hidden group flex flex-col"
            >
              {/* Fixed aspect ratio image area — no dynamic calc() */}
              <div className="relative bg-sand overflow-hidden" style={{ height: "260px" }}>
                <Image
                  src="/media/plot1.png"
                  alt="Vastu Analysis Plot"
                  fill
                  className="object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-8 flex-1">
                <span className="text-eyebrow text-accent-gold mb-3 block">Core Engine</span>
                <h3 className="text-primary mb-4 text-section" style={{ fontSize: "1.85rem" }}>
                  Astrological Precision.
                </h3>
                <p className="text-gray-500 leading-relaxed text-[14px]">
                  Our system computes Marma point intersections with irregular layouts, delivering
                  actionable insights with unparalleled accuracy across all 45 Vastu directions.
                </p>
                <div className="accent-line mt-6" />
              </div>
            </motion.div>

            {/* Report card */}
            <motion.div
              variants={fadeUp}
              custom={1}
              className="bg-white rounded-[2.5rem] shadow-xl shadow-primary/6 border border-gray-100 overflow-hidden group"
            >
              <div className="relative h-52 bg-cream overflow-hidden">
                <Image
                  src="/media/reportsnippet.png"
                  alt="Harmony Score Report"
                  fill
                  className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-8">
                <span className="text-eyebrow text-accent-gold mb-2 block">Analytics</span>
                <h3 className="text-2xl text-primary text-section mb-3" style={{ fontSize: "1.75rem" }}>
                  Systemic Analysis.
                </h3>
                <p className="text-gray-500 leading-relaxed text-[14px]">
                  Evaluate energy flow across 16 cardinal zones with instant harmony scores.
                </p>
              </div>
            </motion.div>

            {/* Feature bullets card */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="bg-primary rounded-[2.5rem] p-10 shadow-xl shadow-primary/20 text-white"
            >
              <span className="text-eyebrow text-secondary mb-4 block">Why Mangalam</span>
              <h3
                className="text-2xl font-bold mb-8 leading-tight"
                style={{
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                Ancient logic, modern output.
              </h3>
              <ul className="space-y-5">
                {[
                  "Proprietary 45-direction grid",
                  "Marma point intersection mapping",
                  "Real-time compliance feedback",
                  "Professional consultant portal",
                  "PDF-quality report export",
                ].map((feat, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4"
                  >
                    <span className="w-5 h-px bg-accent-gold flex-shrink-0" />
                    <span className="text-white/85 text-[13px] tracking-[0.04em] uppercase font-medium">
                      {feat}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Detailed report card */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="md:col-span-2 lg:col-span-1 bg-white rounded-[2.5rem] shadow-xl shadow-primary/6 border border-gray-100 overflow-hidden group"
            >
              <div className="relative h-52 bg-sand overflow-hidden">
                <Image
                  src="/media/detailedreport.png"
                  alt="Detailed Vastu Report"
                  fill
                  className="object-cover rounded-t-[2.5rem] transition-transform duration-700 group-hover:scale-102"
                />
              </div>
              <div className="p-8">
                <span className="text-eyebrow text-accent-gold mb-2 block">Output</span>
                <h3 className="text-section text-primary mb-3" style={{ fontSize: "1.75rem" }}>
                  Professional Reports.
                </h3>
                <p className="text-gray-500 leading-relaxed text-[14px]">
                  Generate PDF-quality reports with zone breakdowns, corrections, and sacred geometry overlays.
                </p>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-3 mt-6 text-primary font-semibold text-[13px] tracking-[0.06em] uppercase group"
                >
                  Try Now
                  <span className="w-8 h-px bg-primary group-hover:w-14 transition-all duration-300" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MODERNITY ALIGNED — Two-column
      ═══════════════════════════════════════════════ */}
      <section className="section-pad relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">

          {/* Left: image with floating accent */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: "-80px" }}
          >
            <div className="relative glass rounded-[3rem] p-1 shadow-2xl shadow-primary/10">
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-sand">
                <Image
                  src="/media/detailedreport.png"
                  alt="Technical Vastu Report"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            {/* Floating glow blobs */}
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-8 -right-8 w-36 h-36 rounded-full blur-3xl"
              style={{ background: "rgba(212,168,83,0.25)" }}
            />
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: -2 }}
              className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full blur-2xl"
              style={{ background: "rgba(19,84,122,0.15)" }}
            />

            {/* Floating stat chip — kept well within the card boundary */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
              viewport={{ once: true }}
              className="absolute bottom-4 right-6 glass px-4 py-2.5 rounded-2xl shadow-lg border border-white/80"
            >
              <span className="text-eyebrow text-gray-400 block mb-0.5">Analyses Completed</span>
              <span
                className="text-xl font-bold text-primary block"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif", letterSpacing: "-0.02em" }}
              >
                5,000+
              </span>
            </motion.div>
          </motion.div>

          {/* Right: text */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp}>
              <SectionTag>The Platform</SectionTag>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-[clamp(2.8rem,6vw,5rem)] text-primary mb-8 text-section"
            >
              Modernity <br />
              <span className="font-light not-italic text-ink" style={{ fontFamily: "var(--font-cormorant)", letterSpacing: "-0.02em" }}>
                Aligned.
              </span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-gray-500 mb-12 leading-[1.75] text-[16px]"
              style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
            >
              Translate ancient wisdom into the language of modern architecture.
              Our platform provides tools for architects and individuals to create
              spaces that breathe, thrive, and resonate with sacred energy.
            </motion.p>

            <motion.ul variants={staggerContainer} className="space-y-5">
              {[
                "Proprietary Alignment Algorithm",
                "Real-time Zone Detection",
                "Professional Consultant Portal",
                "Sacred Geometry Overlay",
              ].map((item, i) => (
                <motion.li
                  key={i}
                  variants={fadeUp}
                  custom={i}
                  className="flex gap-5 items-center group"
                >
                  <motion.div
                    className="w-8 h-px bg-accent-gold group-hover:w-12 transition-all duration-300"
                  />
                  <span
                    className="text-gray-600 font-medium tracking-[0.08em] uppercase"
                    style={{ fontSize: "0.7rem", fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
                  >
                    {item}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          DARK ISLAND — Canvas Hub
      ═══════════════════════════════════════════════ */}
      <section className="px-6 lg:px-24 mb-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-7xl mx-auto dark-island px-12 md:px-24 py-24 relative"
        >
          {/* Inner glow */}
          <div
            className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-40"
            style={{
              background: "radial-gradient(ellipse at 80% 30%, rgba(212,168,83,0.15) 0%, transparent 60%)",
            }}
          />

          <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-accent-gold/60" />
                <span
                  className="text-accent-gold/80"
                  style={{
                    fontFamily: "var(--font-outfit), system-ui, sans-serif",
                    fontSize: "0.68rem",
                    fontWeight: 500,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                  }}
                >
                  Interactive
                </span>
              </div>
              <h2
                className="text-[clamp(2.5rem,5vw,4.5rem)] text-white mb-6 font-bold italic leading-[0.92] tracking-[-0.03em]"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                The Canvas Hub.
              </h2>
              <p
                className="text-white/60 text-[16px] leading-[1.75] mb-10"
                style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
              >
                Our dynamic canvas engine enables real-time furniture placement and
                Vastu compliance checking. Immediate feedback on your most critical
                architectural decisions — rendered with sacred-layer precision.
              </p>
              <Link
                href="/projects"
                className="inline-flex items-center gap-4 border border-accent-gold/50 text-accent-gold hover:bg-accent-gold/10 px-7 py-3.5 rounded-2xl font-semibold transition-all duration-300 group"
                style={{
                  fontSize: "0.78rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-outfit), system-ui, sans-serif",
                }}
              >
                Explore the Engine
                <span className="w-8 h-px bg-accent-gold group-hover:w-12 transition-all duration-300" />
              </Link>
            </div>

            {/* Right: canvas screenshot with terminal chrome */}
            <div className="relative">
              <div className="bg-[#0a1520] rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50">
                {/* Terminal chrome bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#0a1520] border-b border-white/8">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <span className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span
                    className="ml-4 text-white/30"
                    style={{
                      fontFamily: "var(--font-outfit), monospace",
                      fontSize: "0.65rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    mangalam — canvas.tsx
                  </span>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src="/media/canvas preview.png"
                    alt="Dynamic Canvas Engine"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              {/* Glow behind card */}
              <div
                className="absolute -inset-4 -z-10 rounded-3xl opacity-30 blur-2xl"
                style={{ background: "radial-gradient(circle, rgba(19,84,122,0.8) 0%, transparent 70%)" }}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          EXPERT SYSTEMS — Editorial numbered cards
      ═══════════════════════════════════════════════ */}
      <section className="section-pad">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp}>
              <SectionTag>Core Systems</SectionTag>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-[clamp(2.5rem,6vw,5rem)] text-primary text-section"
            >
              Expert Systems.
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
          >
            {[
              {
                n: "01",
                title: "Vastu Engine",
                desc: "Advanced compliance scoring through 45-direction sacred logic and Marma point mapping.",
              },
              {
                n: "02",
                title: "Interactive Hub",
                desc: "Simulate placements in real-time architectural space with immediate zone feedback.",
              },
              {
                n: "03",
                title: "Smart Reports",
                desc: "Generate professional-grade dossiers with corrections, scores, and sacred geometry overlays.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="relative group border-t-2 border-primary/12 pt-10 hover:border-primary/40 transition-colors duration-300"
              >
                {/* Giant serif numeral background */}
                <span
                  className="absolute top-0 right-0 leading-none text-primary/5 font-bold select-none pointer-events-none"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "8rem",
                    lineHeight: 0.85,
                  }}
                >
                  {item.n}
                </span>

                <span className="text-eyebrow text-accent-gold mb-4 block">{item.n}</span>
                <h3
                  className="text-2xl text-primary font-bold italic mb-4 leading-tight tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-gray-500 leading-relaxed text-[14px]"
                  style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
                >
                  {item.desc}
                </p>

                <div className="accent-line mt-8 group-hover:w-20 transition-all duration-300" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA FINALE
      ═══════════════════════════════════════════════ */}
      <section className="px-6 lg:px-24 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-4xl mx-auto glass rounded-[3rem] p-16 md:p-24 text-center border border-white shadow-2xl shadow-primary/8 relative overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(212,168,83,0.08) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10">
            <SectionTag>Begin Today</SectionTag>
            <h2
              className="text-[clamp(2.5rem,5vw,4rem)] text-primary mb-6 font-bold italic leading-[0.92] tracking-[-0.03em]"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              Ready for Sacred<br />
              <span className="font-light not-italic" style={{ fontFamily: "var(--font-cormorant)" }}>
                Alignment?
              </span>
            </h2>
            <p
              className="text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed text-[16px]"
              style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
            >
              Start with 5 free credits. No credit card required.
              Instant analysis, professional results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button
                  className="px-10 py-4 bg-primary text-white rounded-2xl font-semibold shadow-xl shadow-primary/25 hover:scale-105 hover:shadow-2xl active:scale-95 transition-all duration-300"
                  style={{ letterSpacing: "0.06em", fontSize: "0.8rem", textTransform: "uppercase" }}
                >
                  Get Started Free
                </button>
              </Link>
              <Link href="/pricing">
                <button
                  className="px-10 py-4 glass text-primary rounded-2xl font-semibold border border-primary/20 hover:bg-white/60 hover:scale-105 active:scale-95 transition-all duration-300"
                  style={{ letterSpacing: "0.06em", fontSize: "0.8rem", textTransform: "uppercase" }}
                >
                  View All Plans
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

    </div>
  );
}