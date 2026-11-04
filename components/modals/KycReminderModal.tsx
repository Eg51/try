"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ArrowRight, X, Clock } from "lucide-react";
import Link from "next/link";

export default function KycReminderModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const WATERMARK_SYMBOLS = ["$", "€", "£", "¥", "₦", "₹", "₿", "Ξ", "Ð", "₩", "₪", "₫"];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/20 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Background Watermarks */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 grid grid-cols-4 gap-4 p-4 place-items-center opacity-5 dark:opacity-10">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="text-4xl md:text-6xl font-bold text-lime-900 dark:text-lime-100"
                      style={{ transform: `rotate(${(i * 15) % 60 - 30}deg)` }}>
                  {WATERMARK_SYMBOLS[i % WATERMARK_SYMBOLS.length]}
                </span>
              ))}
            </div>

            {/* Header / Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-red-500/10 text-lime-800 dark:text-lime-200 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="relative z-10 p-8 flex flex-col items-center text-center">
              
              {/* Animated Icon */}
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative"
              >
                <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                <ShieldAlert size={40} className="text-amber-500 relative z-10" />
              </motion.div>

              <h2 className="text-2xl font-extrabold text-lime-950 dark:text-white mb-3 tracking-tight">
                Identity Verification Required
              </h2>
              
              <p className="text-sm font-medium text-lime-800/70 dark:text-lime-200/60 mb-8 max-w-sm">
                Your account is currently restricted. Please complete your KYC verification to unlock full trading limits, fiat withdrawals, and premium features.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col w-full gap-3 mt-auto">
                <Link 
                  href="/dashboard/kyc" 
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-lg shadow-lime-600/20 transition-all active:scale-95"
                >
                  Verify Identity Now <ArrowRight size={18} />
                </Link>
                
                <button 
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/50 dark:bg-[#121A14] hover:bg-white dark:hover:bg-[#1a261d] border border-lime-500/20 text-lime-800 dark:text-lime-200 font-bold rounded-xl transition-all active:scale-95 text-xs"
                >
                  <Clock size={14} /> Remind me in 2 hours
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}