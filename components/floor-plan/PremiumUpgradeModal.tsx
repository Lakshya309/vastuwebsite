"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Crown, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: React.ReactNode;
}

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({ 
  isOpen, 
  onClose,
  title = "Unlock Detailed Vastu Report",
  message
}) => {
  const router = useRouter();

  const defaultMessage = (
    <p className="text-sm text-gray-600 leading-relaxed mb-8 font-medium italic">
      Based on the objects you've placed, Vastu insights and scores are calculated. 
      <span className="block mt-2 text-rose-500 font-bold uppercase tracking-widest text-[10px]">
        1 Warning and 1 Critical Dosha Found.
      </span>
      To see the full detailed report and professional remedies, upgrade to Premium.
    </p>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white overflow-hidden rounded-[2.5rem] border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] p-8 md:p-12 text-center"
          >
            {/* Decorative background element */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-teal-400 to-primary" />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>

            {/* Header Icon */}
            <div className="flex justify-center mb-6 pt-4">
              <div className="relative">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Crown size={40} className="text-primary animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 bg-amber-400 p-1.5 rounded-full shadow-lg border-2 border-white">
                  <Lock size={12} className="text-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <h2 className="text-3xl font-cormorant font-bold italic text-primary mb-4">
              {title}
            </h2>
            
            <div className="mb-8">
              {message || defaultMessage}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => router.push("/pricing")}
                className="group relative w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3"
              >
                Buy Premium Credit
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={onClose}
                className="w-full py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-400 uppercase tracking-[0.2em] hover:bg-gray-100 transition-all"
              >
                Maybe Later
              </button>
            </div>

            {/* Micro-text */}
            <p className="mt-6 text-[9px] text-gray-400 uppercase tracking-widest italic">
              One credit per project • Unlimited edits included
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
