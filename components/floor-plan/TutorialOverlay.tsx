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
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            updateHighlight();
            setIsVisible(true);
        }, 500);

        window.addEventListener("resize", updateHighlight);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", updateHighlight);
        };
    }, [updateHighlight]);

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

            {/* Tooltip Content */}
            <div
                className="absolute bg-white p-6 rounded-xl shadow-2xl pointer-events-auto w-80 transition-all duration-300 ease-in-out border border-blue-100"
                style={getTooltipStyle()}
            >
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
                        Step {currentStep + 1} of {steps.length}
                    </span>
                    <button
                        onClick={onSkip}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Skip
                    </button>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {step.content}
                </p>
                <div className="flex justify-between items-center">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className={`text-sm font-medium ${currentStep === 0 ? "text-gray-300" : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        Previous
                    </button>
                    <button
                        onClick={nextStep}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95"
                    >
                        {currentStep === steps.length - 1 ? "Get Started" : "Next Step"}
                    </button>
                </div>

                {/* Arrow pointer */}
                {step.position !== "center" && (
                    <div
                        className={`absolute w-3 h-3 bg-white rotate-45 border-blue-100 ${step.position === "bottom" ? "top-[-6px] left-1/2 -translate-x-1/2 border-t border-l" :
                                step.position === "top" ? "bottom-[-6px] left-1/2 -translate-x-1/2 border-b border-r" :
                                    step.position === "left" ? "right-[-6px] top-1/2 -translate-y-1/2 border-t border-r" :
                                        "left-[-6px] top-1/2 -translate-y-1/2 border-b border-l"
                            }`}
                    />
                )}
            </div>
        </div>
    );
};
