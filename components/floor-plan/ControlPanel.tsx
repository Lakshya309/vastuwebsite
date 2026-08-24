// components/floor-plan/ControlPanel.tsx
"use client";
import React from "react";
import { DevtaRegion, PlacedObject, Point, Wall } from "@/lib/floorPlanInterfaces";
import { isPointInPolygon } from "@/lib/gridUtils";
import { ObjectPalette } from "./ObjectPalette";
import { problemZoneMapping } from "@/lib/problemZoneMapping";
import { Video, Upload, RotateCcw, RotateCw, Compass, Lock, Crown, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { PlanTier } from "@/lib/planConfig";

interface ControlPanelProps {
  projectId: string;
  projectName?: string;
  error: string | null;
  loading: boolean;
  isPremium: boolean;

  showGrid: {
    devta45: boolean;
    zone16: boolean;
    zone8: boolean;
    marma: boolean;
    shaktiChakra: boolean;
  };
  setShowGrid: React.Dispatch<
    React.SetStateAction<{
      devta45: boolean;
      zone16: boolean;
      zone8: boolean;
      marma: boolean;
      shaktiChakra: boolean;
    }>
  >;

  gridType: "81" | "64";
  onGridTypeChange: (type: "81" | "64") => void;

  liveNorthDirection: number;
  setLiveNorthDirection: (deg: number) => void;

  selectedFile: File | null;
  handleImageUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
  handleReupload: () => void;

  handleStartDrawingBoundary: () => void;
  handleFinishDrawingBoundary: () => void;
  handleResetBoundary: () => void;
  handleUndoLastPoint: () => void;

  selectedObjectType: string;
  setSelectedObjectType: (type: string) => void;

  handleResetObjects?: () => void;
  handleSaveChanges?: () => void;
  handleSaveObjects?: () => void;
  selectedObject?: PlacedObject | null;
  handleDeleteObject?: (id: string) => void;

  plotWidth?: number | null;
  plotHeight?: number | null;
  plotSideFront?: number | null;
  plotSideBack?: number | null;
  plotSideLeft?: number | null;
  plotSideRight?: number | null;
  plotDiagonal?: number | null;
  setProject?: any;
  plotAngle?: number;
  setPlotAngle?: any;

  placedObjects: PlacedObject[];
  devtaRegions: DevtaRegion[];
  zone16Regions: any[];
  zone8Regions: any[];

  drawingMode?: "boundary" | "objects" | "select" | "wall" | "measure" | null;
  setDrawingMode: (mode: "boundary" | "objects" | "select" | "wall" | "measure" | null) => void;
  boundary?: any;
  setBoundary?: any;
  analysisMode?: any;
  setAnalysisMode?: any;
  isAnalyzing: boolean;
  analysisStale: boolean;
  handleAddObject: (objectType: string) => void;
  shaktiChakraSize: number;
  setShaktiChakraSize: (size: number) => void;
  shaktiChakraType?: "complete" | "zones";
  setShaktiChakraType?: (type: "complete" | "zones") => void;

  // New props for scaling
  scale: number | null;
  setScale: (scale: number | null) => void;
  wallLengths: number[];
  setWallLengths: (lengths: number[]) => void;
  referenceWallIndex: number | null;
  setReferenceWallIndex: (index: number | null) => void;
  referenceWallLength: number | null;
  setReferenceWallLength: (length: number | null) => void;
  referenceWallUnit: "feet" | "meters" | "inches";
  setReferenceWallUnit: (unit: "feet" | "meters" | "inches") => void;
  wallColors: (string | null)[];
  setWallColors: React.Dispatch<React.SetStateAction<(string | null)[]>>;
  videoUrl?: string | null;
  setVideoUrl?: (url: string | null) => void;
  selectedProblem: string | null;
  setSelectedProblem: (problem: string | null) => void;
  setHighlightedZones: (zones: string[]) => void;

  // Manual mode support
  isManualMode?: boolean;

  // Wall props
  walls?: Wall[];
  onAddWall?: (wall: Wall) => void;
  onUpdateWall?: (wall: Wall) => void;
  onDeleteWall?: (id: string) => void;
  selectedWall?: Wall | null;
  onSelectWall?: (wall: Wall | null) => void;
  canvasRotation?: number;
  setCanvasRotation?: (rotation: number | ((prev: number) => number)) => void;
  propertyType?: string;
  commercialType?: string;
  onPropertyTypeChange?: (propertyType: string, commercialType?: string) => void;
  /** Tier-based plan for the current user */
  userPlan?: PlanTier;
  /** Whether the boundary has been saved and locked */
  boundaryLocked?: boolean;
}

const PremiumBadge = () => (
  <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-400 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-amber-500 animate-pulse">
    <Crown size={8} />
    Premium
  </span>
);

export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  // Define unit conversions (e.g., to meters as base)
  const UNIT_CONVERSIONS = {
    feet: 0.3048,   // 1 foot = 0.3048 meters
    meters: 1,      // 1 meter = 1 meter
    inches: 0.0254, // 1 inch = 0.0254 meters
  };

  const handleCalculateScale = () => {
    if (
      props.referenceWallIndex === null ||
      !props.boundary ||
      props.boundary.length < 2 ||
      props.referenceWallLength === null ||
      props.referenceWallLength <= 0
    ) {
      props.setScale(null);
      props.setWallLengths([]);
      return;
    }

    const canvasWidth = 800; // Assuming a fixed canvas width for calculation
    const canvasHeight = 600; // Assuming a fixed canvas height for calculation

    const p1 = props.boundary[props.referenceWallIndex];
    const p2 = props.boundary[(props.referenceWallIndex + 1) % props.boundary.length];

    const pixelLength = Math.sqrt(
      Math.pow((p2.x - p1.x) * canvasWidth, 2) +
      Math.pow((p2.y - p1.y) * canvasHeight, 2)
    );

    if (pixelLength > 0 && props.referenceWallLength > 0) {
      const realLengthInMeters =
        props.referenceWallLength * UNIT_CONVERSIONS[props.referenceWallUnit];
      const newScale = realLengthInMeters / pixelLength;
      props.setScale(newScale);

      const newWallLengths = props.boundary.map((_: any, i: number) => {
        const point1 = props.boundary[i];
        const point2 = props.boundary[(i + 1) % props.boundary.length];
        const lengthInPixels = Math.sqrt(
          Math.pow((point2.x - point1.x) * canvasWidth, 2) +
          Math.pow((point2.y - point1.y) * canvasHeight, 2)
        );
        return (lengthInPixels * newScale) / UNIT_CONVERSIONS[props.referenceWallUnit];
      });
      props.setWallLengths(newWallLengths);

      // NO LONGER SYNCING dimension boxes in the UI for upload mode as per request
      /*
      if (props.boundary.length === 4) {
        props.setProject && props.setProject((prev: any) => ({
          ...prev,
          plot_width: newWallLengths[0],
          plot_height: newWallLengths[1]
        }));
      }
      */
    } else {
      props.setScale(null);
      props.setWallLengths([]);
    }
  };

  // Scale is now calculated explicitly via a button click.

  return (
    <div
      className="glass h-full border-l border-white/50 flex flex-col w-full max-w-[calc(100vw-40px)] md:w-96 shadow-2xl backdrop-blur-3xl relative z-20"
    >
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
        <div className="space-y-10"
        >
          {/* Section: View Controls */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="mb-8 p-4 bg-white/50 rounded-2xl border border-white shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Compass size={12} className="text-primary" />
              View Orientation
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => props.setCanvasRotation && props.setCanvasRotation(prev => (prev - 90 + 360) % 360)}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-gray-50 text-primary border border-gray-200 rounded-xl transition-all hover:scale-[1.02] shadow-sm group"
              >
                <RotateCcw size={16} className="group-hover:-rotate-45 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Rotate Left</span>
              </button>
              <button
                onClick={() => props.setCanvasRotation && props.setCanvasRotation(prev => (prev + 90) % 360)}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-gray-50 text-primary border border-gray-200 rounded-xl transition-all hover:scale-[1.02] shadow-sm group"
              >
                <RotateCw size={16} className="group-hover:rotate-45 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Rotate Right</span>
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <span className="text-[9px] font-medium text-gray-400 italic">Current View: {props.canvasRotation || 0}°</span>
            </div>
          </motion.div>

          {/* Section 1: Upload */}
          {!props.isManualMode && (
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <h3 className="text-xl font-cormorant font-bold italic text-primary mb-4 flex items-center gap-2">
                <span className="text-xs font-sans not-italic bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center">1</span>
                Upload Floor Plan
              </h3>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={props.handleImageUpload}
                  className="block w-full text-[10px] text-gray-400 font-bold uppercase tracking-widest file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer transition-all"
                />
              </div>
              {props.selectedFile && (
                <button
                  onClick={props.handleReupload}
                  className="w-full mt-4 py-3 bg-white/50 hover:bg-white text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white shadow-sm transition-all"
                >
                  Upload New Image
                </button>
              )}
            </motion.div>
          )}

          {/* Section 2: Boundary */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="pt-2">
            <h3 id="tutorial-boundary" className="text-xl font-cormorant font-bold italic text-primary mb-4 flex items-center gap-2">
              <span className="text-xs font-sans not-italic bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center">2</span>
              Draw Your Plot
            </h3>

            {/* ── Boundary Locked Banner ── */}
            {props.boundaryLocked ? (
              <div className="flex flex-col items-center gap-3 py-5 px-4 bg-emerald-50 border border-emerald-200 rounded-2xl mb-3">
                <ShieldCheck size={22} className="text-emerald-500" />
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest text-center leading-relaxed">
                  Boundary Saved &amp; Locked
                </p>
                <p className="text-[9px] text-emerald-600 text-center leading-relaxed">
                  Your plot boundary has been saved and cannot be changed. Objects can still be placed and moved.
                </p>
              </div>
            ) : (
              <>
                {props.isManualMode ? (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">
                    Your plot dimensions have been set. You can still draw a custom boundary if needed.
                  </p>
                ) : (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">
                    Click on the image to mark the corners of your plot.
                  </p>
                )}
                <button
                  onClick={props.handleStartDrawingBoundary}
                  disabled={props.drawingMode === "boundary"}
                  className="w-full mb-3 py-4 bg-primary text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {props.drawingMode === "boundary" ? "Drawing..." : "Start Drawing"}
                </button>
                {props.drawingMode === "boundary" && (
                  <button
                    onClick={props.handleFinishDrawingBoundary}
                    disabled={(props.boundary?.length || 0) < 3}
                    className="w-full mb-3 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20 disabled:opacity-50 hover:scale-[1.02] transition-all"
                  >
                    Finish Drawing
                  </button>
                )}
                <div className="flex gap-3 mb-3">
                  <button
                    onClick={props.handleUndoLastPoint}
                    className="w-full py-3 bg-white/50 hover:bg-white text-gray-500 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-white shadow-sm transition-all"
                  >
                    Undo
                  </button>
                  <button
                    onClick={props.handleResetBoundary}
                    className="w-full py-3 bg-rose-50/50 hover:bg-rose-50 text-rose-500 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-rose-100 shadow-sm transition-all"
                  >
                    Clear All
                  </button>
                </div>
              </>
            )}

            {props.isManualMode && (
              <div className="mt-6 p-6 glass rounded-2xl border border-white space-y-4">
                <h4 className="font-cormorant font-bold italic text-primary text-lg">Plot Dimensions ({props.referenceWallUnit})</h4>

                {(!props.plotSideFront && !props.plotSideBack) ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Width</label>
                        <input
                          type="number"
                          value={props.plotWidth || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            props.setProject && props.setProject((prev: any) => ({ ...prev, plot_width: val }));
                          }}
                          className="w-full p-2 bg-white/50 border border-white rounded-lg text-xs font-bold text-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Length</label>
                        <input
                          type="number"
                          value={props.plotHeight || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            props.setProject && props.setProject((prev: any) => ({ ...prev, plot_height: val }));
                          }}
                          className="w-full p-2 bg-white/50 border border-white rounded-lg text-xs font-bold text-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Angle</label>
                        <input
                          type="number"
                          value={props.plotAngle || 90}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 90;
                            props.setPlotAngle && props.setPlotAngle(val);
                          }}
                          className="w-full p-2 bg-white/50 border border-white rounded-lg text-xs font-bold text-primary focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => props.setProject && props.setProject((prev: any) => ({ ...prev, plot_side_front: prev.plot_width, plot_side_back: prev.plot_width, plot_side_left: prev.plot_height, plot_side_right: prev.plot_height, plot_diagonal: Math.sqrt(prev.plot_width ** 2 + prev.plot_height ** 2) }))}
                      className="text-[9px] font-bold text-primary hover:underline italic uppercase tracking-widest"
                    >
                      Use Different Sides
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {['Front', 'Back', 'Left', 'Right'].map((side) => (
                        <div key={side}>
                          <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1">{side}</label>
                          <input
                            type="number"
                            value={(props as any)[`plotSide${side}`] || ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              props.setProject && props.setProject((prev: any) => ({ ...prev, [`plot_side_${side.toLowerCase()}`]: val }));
                            }}
                            className="w-full p-2 bg-white/50 border border-white rounded-lg text-xs font-bold text-primary focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Diagonal</label>
                      <input
                        type="number"
                        value={props.plotDiagonal || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          props.setProject && props.setProject((prev: any) => ({ ...prev, plot_diagonal: val }));
                        }}
                        className="w-full p-2 bg-white/50 border border-white rounded-lg text-xs font-bold text-primary focus:outline-none"
                        placeholder="Optional"
                      />
                    </div>
                    <button
                      onClick={() => props.setProject && props.setProject((prev: any) => ({ ...prev, plot_side_front: null, plot_side_back: null, plot_side_left: null, plot_side_right: null, plot_diagonal: null }))}
                      className="text-[9px] font-bold text-rose-500 hover:underline italic uppercase tracking-widest"
                    >
                      Back to Rectangle
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Section 2b: Internal Walls */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="pt-2 border-t border-white/30">
            <h3 className="text-xl font-cormorant font-bold italic text-primary mb-4 flex items-center gap-2">
              <span className="text-xs font-sans not-italic bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center">2b</span>
              Interior Walls
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">
              Draw walls inside your plot to show room divisions.
            </p>
            <button
              onClick={() => {
                if (!props.isPremium) return;
                props.setDrawingMode(props.drawingMode === "wall" ? null : "wall")
              }}
              className={`w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-2 ${props.drawingMode === "wall"
                ? "bg-amber-600 text-white shadow-amber-900/20"
                : "bg-white/50 text-gray-600 border border-white hover:bg-white shadow-sm"
                } ${!props.isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {!props.isPremium && <PremiumBadge />}
              {props.drawingMode === "wall" ? "Drawing Wall..." : "Draw Wall"}
            </button>

            {props.selectedWall && (
              <div className="mt-6 p-6 glass rounded-2xl border border-amber-200/50 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-cormorant font-bold italic text-amber-800 text-lg">Edit Wall</h4>
                  <button
                    onClick={() => props.onDeleteWall && props.onDeleteWall(props.selectedWall!.id)}
                    className="text-rose-500 hover:text-rose-700 text-[10px] font-bold uppercase tracking-widest"
                  >
                    Delete
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">Wall Color</label>
                  <input
                    type="color"
                    value={props.selectedWall.color}
                    onChange={(e) => props.onUpdateWall && props.onUpdateWall({ ...props.selectedWall!, color: e.target.value })}
                    className="w-full h-10 cursor-pointer rounded-xl border-0 bg-transparent"
                  />
                </div>
                {props.selectedWall.length && (
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-widest italic">
                    Length: {props.selectedWall.length.toFixed(2)} {props.referenceWallUnit}
                  </div>
                )}
                <button
                  onClick={() => props.onSelectWall && props.onSelectWall(null)}
                  className="w-full py-2 bg-amber-100/50 hover:bg-amber-100 text-amber-800 rounded-xl text-[9px] font-bold uppercase tracking-widest"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>

          {/* Section 3: North */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="pt-2 border-t border-white/30">
            <h3 className="text-xl font-cormorant font-bold italic text-primary mb-4 flex items-center gap-2">
              <span className="text-xs font-sans not-italic bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center">3</span>
              North Direction
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">
              Set which way your plot faces using a compass.
            </p>
            <div id="tutorial-north" className="px-2">
              <input
                type="range"
                min="0"
                max="360"
                value={props.liveNorthDirection}
                onChange={(e) =>
                  props.setLiveNorthDirection(parseInt(e.target.value))
                }
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="text-center text-4xl font-cormorant font-bold italic text-primary mt-6 tracking-tighter">
                {props.liveNorthDirection}°
              </div>
              <p className="text-center text-[8px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 italic">Rotation</p>
            </div>
          </motion.div>

          {/* Section 4: Scale */}
          {props.boundary && props.boundary.length > 2 && (
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="pt-2 border-t border-white/30">
              <h3 id="tutorial-dimensions" className="text-xl font-cormorant font-bold italic text-primary mb-4 flex items-center gap-2">
                <span className="text-xs font-sans not-italic bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center">4</span>
                Set Plot Size
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">
                Enter your plot dimensions to get accurate measurements.
              </p>
              {props.referenceWallIndex !== null ? (
                <div className="glass p-6 rounded-2xl border border-white space-y-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary italic">
                    Selected: <span className="text-teal-600">Side {props.referenceWallIndex + 1}</span>
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Actual Length</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={props.referenceWallLength ?? ""}
                        onChange={(e) => props.setReferenceWallLength(parseFloat(e.target.value) || null)}
                        className="w-full p-3 bg-white/50 border border-white rounded-xl text-sm font-bold text-primary focus:outline-none placeholder:text-gray-300"
                        placeholder="Enter length..."
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Unit</label>
                      <select
                        value={props.referenceWallUnit}
                        onChange={(e) => props.setReferenceWallUnit(e.target.value as any)}
                        className="w-full p-3 bg-white/50 border border-white rounded-xl text-xs font-bold text-primary focus:outline-none"
                      >
                        <option value="meters">Meters</option>
                        <option value="feet">Feet</option>
                        <option value="inches">Inches</option>
                      </select>
                    </div>
                    <button
                      onClick={() => props.isPremium && handleCalculateScale()}
                      disabled={!props.isPremium}
                      className="w-full py-4 bg-primary text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {!props.isPremium && <PremiumBadge />}
                      Apply Size
                    </button>
                    {props.scale && (
                      <div className="text-center p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="text-[9px] font-bold text-primary uppercase tracking-widest leading-normal">
                          Scale:<br />
                          <span className="text-xs">1px = {(props.scale / (UNIT_CONVERSIONS[props.referenceWallUnit] || 1)).toFixed(4)} {props.referenceWallUnit}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-white/30 border-2 border-dashed border-white rounded-2xl text-center">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic leading-relaxed">
                    Click on a plot edge on the canvas to select it.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Finalize Analysis */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="pt-2">
            <button
              onClick={() => props.handleSaveChanges && props.handleSaveChanges()}
              disabled={props.boundary.length < 3}
              className="w-full py-5 bg-gradient-to-r from-primary to-teal-700 text-white rounded-[2rem] text-xs font-bold uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 disabled:opacity-50 hover:scale-[1.03] active:scale-95 transition-all duration-500"
            >
              Analyze Vastu
            </button>
          </motion.div>

          {/* Energy Grids Container */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="pt-8 border-t border-white/30 space-y-8">
            <h3 id="tutorial-layers" className="text-2xl font-cormorant font-bold italic text-primary leading-none">Energy Grids</h3>

            <div className="glass p-4 rounded-2xl border border-white">
              <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Grid Type</label>
              <div className="relative">
                <select
                  disabled={!props.isPremium}
                  value={props.gridType}
                  onChange={(e) => props.onGridTypeChange(e.target.value as any)}
                  className="w-full p-3 bg-white/50 border border-white rounded-xl text-xs font-bold text-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="81">81 Grid (Detailed)</option>
                  <option value="64">64 Grid (Standard)</option>
                </select>
                {!props.isPremium && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <PremiumBadge />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3">
              {[
                { id: 'devta45', label: '45 Energy Zones', sub: 'Shows energy distribution', color: 'bg-primary' },
                { id: 'zone16', label: '16 Zones', sub: 'Main area divisions', color: 'bg-teal-500' },
                { id: 'zone8', label: '8 Directions', sub: 'Cardinal directions', color: 'bg-emerald-500' },
                { id: 'marma', label: 'Energy Points', sub: 'Important energy spots', color: 'bg-rose-500' },
                { id: 'shaktiChakra', label: 'Energy Wheel', sub: 'Elemental energy wheel', color: 'bg-amber-500' },
              ].map((grid) => (
                <label key={grid.id} className="relative group flex items-center p-4 glass border border-white rounded-2xl cursor-pointer hover:border-primary/30 transition-all">
                  <input
                    type="checkbox"
                    disabled={!props.isPremium && (grid.id === 'devta45' || grid.id === 'marma' || grid.id === 'shaktiChakra')}
                    checked={(props.showGrid as any)[grid.id]}
                    onChange={(e) => {
                      if (!props.isPremium && (grid.id === 'devta45' || grid.id === 'marma' || grid.id === 'shaktiChakra')) return;
                      props.setShowGrid((p: any) => ({
                        ...p,
                        [grid.id]: e.target.checked,
                        ...(grid.id === 'devta45' && e.target.checked ? { zone16: false, zone8: false } : {}),
                        ...(grid.id === 'zone16' && e.target.checked ? { devta45: false, zone8: false } : {}),
                        ...(grid.id === 'zone8' && e.target.checked ? { devta45: false, zone16: false } : {}),
                      }))
                    }
                    }
                    className="w-5 h-5 rounded-lg border-2 border-primary/20 text-primary focus:ring-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="block text-[10px] font-bold text-primary uppercase tracking-widest">{grid.label}</span>
                      {!props.isPremium && (grid.id === 'devta45' || grid.id === 'marma' || grid.id === 'shaktiChakra') && (
                        <div className="scale-75 origin-right">
                          <PremiumBadge />
                        </div>
                      )}
                    </div>
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-tighter italic">{grid.sub}</span>
                  </div>
                  {(props.showGrid as any)[grid.id] && (
                    <motion.div layoutId="grid-active" className={`absolute left-0 w-1 h-8 rounded-full ${grid.color}`} />
                  )}
                </label>
              ))}
            </div>

            {props.showGrid.shaktiChakra && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pl-4 pt-2 space-y-6"
              >
                <div>
                  <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-3">Display Type</label>
                  <div className="flex gap-6">
                    {['complete', 'zones'].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${(props.shaktiChakraType === type || (!props.shaktiChakraType && type === 'complete'))
                            ? 'border-primary'
                            : 'border-gray-200 group-hover:border-primary/30'
                          }`}>
                          {(props.shaktiChakraType === type || (!props.shaktiChakraType && type === 'complete')) && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <input
                          type="radio"
                          className="hidden"
                          name="shaktiChakraType"
                          checked={props.shaktiChakraType === type || (!props.shaktiChakraType && type === 'complete')}
                          onChange={() => props.setShaktiChakraType?.(type as any)}
                        />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-primary transition-colors">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">Size</label>
                    <span className="text-[10px] font-bold text-primary italic">{(props.shaktiChakraSize * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={props.shaktiChakraSize}
                    onChange={(e) => props.setShaktiChakraSize(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Analysis Status */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="pt-8 border-t border-white/30">
            <h3 className="text-xl font-cormorant font-bold italic text-primary mb-4 flex items-center gap-2">Analysis Status</h3>
            <div className="flex items-center justify-between glass p-4 rounded-xl border border-white">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Status</span>
              {props.analysisStale ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Needs Update</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Ready</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Measuring Tools */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="pt-8 border-t border-white/30 space-y-4">
            <h3 className="text-xl font-cormorant font-bold italic text-primary">Measure Distance</h3>
            <button
              onClick={() => {
                if (!props.isPremium) return;
                props.setDrawingMode(props.drawingMode === "measure" ? null : "measure")
              }}
              className={`w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-2 ${props.drawingMode === "measure"
                ? "bg-purple-600 text-white shadow-purple-900/20"
                : "bg-white/50 text-gray-600 border border-white hover:bg-white shadow-sm"
                } ${!props.isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {!props.isPremium && <PremiumBadge />}
              {props.drawingMode === "measure" ? "Stop Measuring" : "Measure Distance"}
            </button>
            {props.drawingMode === "measure" && (
              <p className="text-[9px] text-purple-600 font-bold uppercase tracking-widest italic text-center px-4 leading-relaxed">
                Click two points on the plot to measure the distance.
              </p>
            )}
          </motion.div>

          {/* Problem Zones */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="pt-8 border-t border-white/30 space-y-4">
            <h3 className="text-xl font-cormorant font-bold italic text-primary">Problem Areas</h3>
            <div className="glass p-2 rounded-2xl border border-white relative">
              <select
                disabled={!props.isPremium}
                value={props.selectedProblem || ""}
                onChange={(e) => {
                  const problem = e.target.value;
                  props.setSelectedProblem(problem);
                  if (problem && problemZoneMapping[problem]) {
                    props.setHighlightedZones(problemZoneMapping[problem]);
                    props.setShowGrid((p: any) => ({ ...p, zone16: true, devta45: false, zone8: false }));
                  } else {
                    props.setHighlightedZones([]);
                  }
                }}
                className="w-full p-3 bg-white/50 border border-white rounded-xl text-xs font-bold text-primary italic focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select a Problem...</option>
                {Object.keys(problemZoneMapping).map((problem) => (
                  <option key={problem} value={problem}>{problem}</option>
                ))}
              </select>
              {!props.isPremium && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <PremiumBadge />
                </div>
              )}
            </div>
          </motion.div>

          {/* Objects Palette */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="pt-8 border-t border-white/30">
            <h3 id="tutorial-objects" className="text-2xl font-cormorant font-bold italic text-primary mb-6">Room Items</h3>
            <div className="glass p-6 rounded-[2rem] border border-white shadow-inner">
              <ObjectPalette
                onAddObject={props.handleAddObject}
                userPlan={props.userPlan ?? (props.isPremium ? "basic" : "free")}
                isPremium={props.isPremium}
                propertyType={props.propertyType}
                commercialType={props.commercialType}
                onPropertyTypeChange={props.onPropertyTypeChange}
              />
            </div>
          </motion.div>

          {/* Final Actions */}
          <div className="pt-12 pb-20">
            <button
              id="tutorial-analyze"
              onClick={() => props.handleSaveObjects && props.handleSaveObjects()}
              className="group relative w-full py-6 bg-primary text-white rounded-[2.5rem] text-sm font-bold uppercase tracking-[0.4em] shadow-2xl shadow-primary/40 hover:scale-[1.03] transition-all duration-700 overflow-hidden flex items-center justify-center gap-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {!props.isPremium && <PremiumBadge />}
              Generate Report →
            </button>
            <p className="text-center text-[8px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-4 italic">Save your analysis and view results</p>
          </div>
        </div>
      </div>
    </div>
  );
};