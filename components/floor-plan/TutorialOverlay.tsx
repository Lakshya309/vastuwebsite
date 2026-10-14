"use client";

import React, { useState, useEffect, useCallback } from "react";

export interface TutorialStep {
    targetId: string;
    title: string;
    content: string;
    position: "top" | "bottom" | "left" | "right" | "center";
}

interface TutorialOverlayProps {
    steps: TutorialStep[];
    onComplete: () => void;
    onSkip: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
    steps,
    onComplete,
    onSkip,
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const [isVisible, setIsVisible] = useState(false);

    const updateHighlight = useCallback(() => {
        const step = steps[currentStep];
        if (step.targetId === "viewport" || step.position === "center") {
            setCoords({ top: 0, left: 0, width: 0, height: 0 });
            return;
        }

        const element = document.getElementById(step.targetId);
        if (element) {
            const rect = element.getBoundingClientRect();
            setCoords({
                top: rect.top - 5,
                left: rect.left - 5,
                width: rect.width + 10,
                height: rect.height + 10,
            });
        }
    }, [currentStep, steps]);

    useEffect(() => {
        // Scroll target into view when step changes
        const step = steps[currentStep];
        if (step.targetId !== "viewport" && step.position !== "center") {
            const element = document.getElementById(step.targetId);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }

        // Small delay to ensure DOM is ready/scrolled
        const timer = setTimeout(() => {
            updateHighlight();
            setIsVisible(true);
        }, 500);

        // Update highlight on scroll and resize
        window.addEventListener("resize", updateHighlight);
        window.addEventListener("scroll", updateHighlight, true); 
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", updateHighlight);
            window.removeEventListener("scroll", updateHighlight, true);
        };
    }, [updateHighlight, currentStep, steps]);

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const step = steps[currentStep];

    // Calculate tooltip position
    const getTooltipStyle = (): React.CSSProperties => {
        if (step.position === "center") {
            return {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
            };
        }

        const gap = 20;
        if (step.position === "bottom") {
            return {
                top: coords.top + coords.height + gap,
                left: coords.left + coords.width / 2,
                transform: "translateX(-50%)",
            };
        }
        if (step.position === "top") {
            return {
                top: coords.top - gap,
                left: coords.left + coords.width / 2,
                transform: "translate(-50%, -100%)",
            };
        }
        if (step.position === "left") {
            return {
                top: coords.top + coords.height / 2,
                left: coords.left - gap,
                transform: "translate(-100%, -50%)",
            };
        }
        if (step.position === "right") {
            return {
                top: coords.top + coords.height / 2,
                left: coords.left + coords.width + gap,
                transform: "translate(0, -50%)",
            };
        }
        return {};
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
            {/* Backdrop with SVG Mask for Cutout */}
            <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                <defs>
                    <mask id="tutorial-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {coords.width > 0 && (
                            <rect
                                x={coords.left}
                                y={coords.top}
                                width={coords.width}
                                height={coords.height}
                                rx="8"
                                fill="black"
                                className="transition-all duration-300 ease-in-out"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.7)"
                    mask="url(#tutorial-mask)"
                    onClick={onSkip}
                />
            </svg>

            {/* Glowing Focus Ring around target */}
            {coords.width > 0 && (
                <div
                    className="absolute pointer-events-none rounded-xl border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse transition-all duration-300 ease-in-out"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        height: coords.height,
                    }}
                />
            )}

            {/* Tooltip Content */}
            <div
                className="absolute bg-white/98 backdrop-blur-xl p-6 rounded-2xl shadow-2xl pointer-events-auto w-84 max-w-[92vw] transition-all duration-300 ease-in-out border border-blue-200/80 z-[110]"
                style={getTooltipStyle()}
            >
                {/* Step Header & Progress */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                            Step {currentStep + 1} of {steps.length}
                        </span>
                    </div>
                    <button
                        onClick={onSkip}
                        className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium px-1"
                    >
                        Skip Tour
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-4">
                    <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>

                <h3 className="text-lg font-bold mb-2 text-slate-900 tracking-tight">{step.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-6">
                    {step.content}
                </p>

                <div className="flex justify-between items-center">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className={`text-xs font-semibold px-2 py-1 transition-colors ${
                            currentStep === 0 ? "text-gray-300 cursor-not-allowed" : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Back
                    </button>
                    <button
                        onClick={nextStep}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-200 hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                    >
                        <span>{currentStep === steps.length - 1 ? "Finish Tour" : "Next"}</span>
                        <span>→</span>
                    </button>
                </div>

                {/* Arrow pointer */}
                {step.position !== "center" && (
                    <div
                        className={`absolute w-3 h-3 bg-white rotate-45 border-blue-200/80 ${
                            step.position === "bottom"
                                ? "top-[-6px] left-1/2 -translate-x-1/2 border-t border-l"
                                : step.position === "top"
                                ? "bottom-[-6px] left-1/2 -translate-x-1/2 border-b border-r"
                                : step.position === "left"
                                ? "right-[-6px] top-1/2 -translate-y-1/2 border-t border-r"
                                : "left-[-6px] top-1/2 -translate-y-1/2 border-b border-l"
                        }`}
                    />
                )}
            </div>
        </div>
    );
};
