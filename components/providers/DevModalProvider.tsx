// components/providers/DevModalProvider.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Construction, X } from "lucide-react";

// 1. Create the Context
type DevModalContextType = {
  openModal: (featureName?: string) => void;
  closeModal: () => void;
};

const DevModalContext = createContext<DevModalContextType | undefined>(undefined);

// 2. The Provider Component
export function DevModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [feature, setFeature] = useState("This");

  const openModal = (featureName?: string) => {
    if (featureName) setFeature(featureName);
    else setFeature("This");
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  return (
    <DevModalContext.Provider value={{ openModal, closeModal }}>
      {children}

      {/* The Modal UI */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] text-center"
            >
              <button
                onClick={closeModal}
                className="absolute cursor-pointer top-4 right-4 text-lime-700/50 hover:text-lime-800 dark:text-lime-300/50 dark:hover:text-lime-200 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 mx-auto bg-lime-100 dark:bg-lime-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Construction className="text-lime-600 dark:text-lime-400" size={32} />
              </div>

              <h2 className="text-2xl font-extrabold text-lime-950 dark:text-[#ecfdf5] mb-2">
                Under Construction
              </h2>
              <p className="text-lime-800/70 dark:text-lime-200/60 font-medium mb-8">
                The <span className="font-bold text-lime-700 dark:text-lime-300">"{feature}"</span> feature is currently in development. We are working hard to make it avalable soon!
              </p>

              <button
                onClick={closeModal}
                className="w-full h-12 bg-lime-600 cursor-pointer hover:bg-lime-700 text-white font-bold text-base rounded-xl shadow-lg shadow-lime-600/20 transition-all active:scale-[0.98]"
              >
                 click to return
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DevModalContext.Provider>
  );
}

// 3. The Custom Hook to trigger it
export function useDevModal() {
  const context = useContext(DevModalContext);
  if (!context) {
    throw new Error("useDevModal must be used within a DevModalProvider");
  }
  return context;
}