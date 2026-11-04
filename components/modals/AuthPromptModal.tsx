"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, LogOut, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AuthPromptModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-[#f4fbf5] dark:bg-[#121A14] rounded-3xl p-6 shadow-2xl border border-lime-500/20 text-center"
          >
            <button onClick={onClose} className="cursor-pointer absolute top-4 right-4 text-lime-600 hover:text-lime-800 transition-colors">
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 mx-auto bg-lime-100 dark:bg-lime-900/50 rounded-full flex items-center justify-center mb-4">
              <LogOut className="text-lime-600 dark:text-lime-400" size={32} />
            </div>
            
            <h2 className="text-xl font-bold text-lime-950 dark:text-white mb-2">Ready to trade for real?</h2>
            <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mb-6 font-medium">
              You&apos;ve reached the demo limit. Create an account or log in to continue trading and unlock full features.
            </p>
            
            <div className="space-y-3">
              <Button onClick={() => { window.location.href = "/login"; }} className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2">
                <LogIn size={18} /> Log In
              </Button>
              <Button onClick={() => { window.location.href = "/login"; }} variant="secondary" className="w-full border-lime-500/30 bg-white/50 dark:bg-black/30 text-lime-950 dark:text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2">
                <UserPlus size={18} /> Sign Up
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}