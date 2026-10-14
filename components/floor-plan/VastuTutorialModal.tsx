"use client";

import React, { useState } from "react";
import {
  X,
  Compass,
  Ruler,
  Layers,
  Smartphone,
  Video,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Play,
  ArrowRight,
  ShieldCheck,
  Building,
  Target,
  Maximize2,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface VastuTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInteractiveTour?: () => void;
}

type TutorialTab = "getting-started" | "walls" | "devtas" | "mobile" | "remedies";

export const VastuTutorialModal: React.FC<VastuTutorialModalProps> = ({
  isOpen,
  onClose,
  onStartInteractiveTour,
}) => {
  const [activeTab, setActiveTab] = useState<TutorialTab>("getting-started");

  if (!isOpen) return null;

  const tabs: { id: TutorialTab; label: string; icon: React.ReactNode }[] = [
    { id: "getting-started", label: "Getting Started", icon: <Building className="w-4 h-4" /> },
    { id: "walls", label: "Walls & Distances", icon: <Ruler className="w-4 h-4" /> },
    { id: "devtas", label: "45 Devtas & Grids", icon: <Layers className="w-4 h-4" /> },
    { id: "mobile", label: "Mobile Sync & Videos", icon: <Smartphone className="w-4 h-4" /> },
    { id: "remedies", label: "Analysis & Remedies", icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Vastu Studio Guide & Tutorials
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Interactive
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Master floor plan calibration, 45 Devta grids, and mobile video sync.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onStartInteractiveTour && (
              <button
                onClick={() => {
                  onClose();
                  onStartInteractiveTour();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Live Tour</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-50 border-b border-gray-200 overflow-x-auto scrollbar-thin shrink-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-gray-200/70 hover:text-slate-900"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Getting Started */}
          {activeTab === "getting-started" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-3 shadow-md">
                    1
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">Draw Your Plot Boundary</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Click <strong>Draw Your Plot</strong> in the right panel. Click the canvas to place corner points for Rectangular, L-Shaped, or Irregular plots, then double-click or click the first point to close.
                  </p>
                </div>

                <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm mb-3 shadow-md">
                    2
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">Align True North</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Use the <strong>North Slider</strong> to match the exact compass heading from your site inspection or compass reading. All 45 Devtas and 16 Zones rotate automatically.
                  </p>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-3 shadow-md">
                    3
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">Upload CAD / Image Plan</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Drag and drop your architectural blueprint or architectural floor plan JPG/PNG. The image will sit directly under the canvas for tracing and zoning.
                  </p>
                </div>
              </div>

              {/* Supported Shapes Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Handling L-Shaped & Irregular Plots
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Vastu Studio features an advanced spatial geometry engine that computes concentric ring cuts for L-shaped and irregular plots. Devta zones never spill into exterior cutout spaces.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 font-semibold text-slate-700">
                    📐 Square Plots (64 / 81 Pada)
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 font-semibold text-slate-700">
                    🏛️ Rectangular Plots (True Grid)
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 font-semibold text-slate-700">
                    ⚡ L-Shaped Plots (Clipped Angular)
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 font-semibold text-slate-700">
                    🌐 Multi-Corner Irregular Plots
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Walls & Distances */}
          {activeTab === "walls" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-blue-600" />
                  Interactive Wall Segments & Scale Calibration
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Every wall segment on your plot has a distinct color identifier. Tapping any wall segment highlights it with a radiant glowing border and shows its exact length both on the canvas and in the <strong>Wall Info Bar</strong> below.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    Wall Segment Highlighting
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Click any boundary edge directly on the canvas, or click a wall chip in the <strong>Wall Info Bar</strong> at the bottom. The chosen segment lights up with high-contrast anchor dots and its distance pill.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="w-3 h-3 rounded-full bg-emerald-600" />
                    Set Scale Reference
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    To calibrate real-world feet or meters, select a wall, click <strong>Reference</strong> in the bottom bar, and type its known measurement (e.g. 40 ft). All other walls and devta zones update proportionally.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    Clean De-Cluttered Distance Modes
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Use the floating toolbar in the top-left of the canvas to choose:
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li><strong>Simple:</strong> Cleanest view, showing only outer boundary wall lengths.</li>
                    <li><strong>Focus:</strong> Shows distance pill only for the currently tapped zone or wall.</li>
                    <li><strong>All:</strong> Displays intelligent, non-overlapping pills for all major zones.</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="w-3 h-3 rounded-full bg-purple-600" />
                    Dark / Light High-Contrast Badges
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Toggle the <strong>Dark / Light</strong> badge button in the canvas toolbar. In Dark mode, distance badges use deep slate backgrounds that stand out cleanly over light architectural drawings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 45 Devtas & Grids */}
          {activeTab === "devtas" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-5">
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Vastu Mandala Layers & Energy Grids
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Vastu Studio maps the ancient Vedic 45 Devta energy fields with mathematical precision according to Mayamatam and Vishwakarma Prakash scriptures.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Brahmasthan (Center Energy Zone)</h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Occupies the central 1/9th of an 81-pada grid or 1/16th of a 64-pada grid. Must remain open, uncluttered, and free of heavy structural loads, toilets, or pillars.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Middle Devtas (Inner Ring)</h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Includes Bhudhar (North), Aaryak (East), Vivasvan (South), and Mitra (West) alongside the diagonal energies of Aap, Savitra, Indra, and Rudra.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">32 Outer Perimeter Devtas</h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Arranged along the outer boundary wall to govern entrance gates, doors, windows, and exterior openings. Tapping any devta opens its deity card and remedies.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">16 MahaVastu Directional Zones & Shakti Chakra</h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Toggle the <strong>16 Zones</strong> layer to evaluate elemental zones: Water (North), Wood/Air (East), Fire (South-East), Earth (South-West), and Space/Metal (West).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Mobile Sync & Videos */}
          {activeTab === "mobile" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-5">
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-teal-600" />
                  VastuBuddy Mobile App Integration
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Record on-site walkthrough videos and map room objects using the VastuBuddy Android mobile app. Everything syncs directly with the web workspace in real time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-4.5 space-y-2.5">
                  <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                    <Video className="w-4 h-4" />
                    Room-Wise Walkthrough Videos
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Click <strong>Open Video</strong> in the top header. When room videos exist, use the <strong>Room Video Strip</strong> to switch instantly between the Full Property walkthrough and individual rooms (Master Bedroom, Kitchen, Living Room).
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-4.5 space-y-2.5">
                  <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                    <Smartphone className="w-4 h-4" />
                    1-Click Auto Room Creation
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Open the <strong>Mobile Map</strong> panel and click <strong>Apply to Canvas</strong>. The system will automatically convert all synced mobile rooms into full room boundaries, perimeter walls, and interior items on your canvas.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-sm text-teal-300">Have the VastuBuddy APK installed?</h5>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Log in with the same account on mobile, tap "Sync Web", and your survey appears here automatically.
                  </p>
                </div>
                <div className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20">
                  Ready to Sync
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Analysis & Remedies */}
          {activeTab === "remedies" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5">
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Vastu Scoring, Audit Reports & Non-Demolition Remedies
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Analyze object placements in seconds to detect energy imbalances and apply practical Vedic & MahaVastu remedies without structural demolition.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Favorable Zones
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Placing Kitchen in SE (Agni) or Master Bedroom in SW (Nairuti) provides positive energy boosts.
                  </p>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1">
                  <span className="font-bold text-rose-800 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Defect Detection
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Toilets or septic tanks in NE (Ishanya) drain clarity, health, and prosperity.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-1">
                  <span className="font-bold text-blue-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Vedic Remedies
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Apply colored energy tapes, copper/brass strips, or mirror remedies to neutralize imbalances.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">Download Full Vastu Audit Report</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Click "Run Full Analysis" in the control panel to generate a certified report with devta scores.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Got It
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500 font-medium">
            Need hands-on guidance? Start the live on-screen spotlight tour anytime.
          </span>
          <div className="flex items-center gap-2">
            {onStartInteractiveTour && (
              <button
                onClick={() => {
                  onClose();
                  onStartInteractiveTour();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch Interactive Tour</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-slate-700 font-bold text-xs rounded-xl border border-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
