"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
type Toast = { id: string; title: string; message?: string; type: ToastType };

const ToastContext = createContext<{
  toast: (title: string, message?: string, type?: ToastType) => void;
} | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((title: string, message?: string, type: ToastType = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`pointer-events-auto p-4 rounded-xl border shadow-lg backdrop-blur-xl flex items-start gap-3 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 ${
                t.type === "success" ? "border-lime-500/50" : t.type === "error" ? "border-red-500/50" : "border-cyan-500/50"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {t.type === "success" && <CheckCircle2 className="text-lime-500" size={18} />}
                {t.type === "error" && <XCircle className="text-red-500" size={18} />}
                {t.type === "info" && <Info className="text-cyan-500" size={18} />}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-lime-950 dark:text-white">{t.title}</h4>
                {t.message && <p className="text-xs text-lime-800/70 dark:text-lime-200/60 mt-0.5">{t.message}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}