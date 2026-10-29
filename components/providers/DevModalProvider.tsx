// components/providers/DevModalProvider.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Construction, X, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type ModalType = "info" | "warning" | "error" | "success";

// 👇 Added secondaryAction type
type SecondaryAction = {
  label: string;
  onClick: () => void;
};

type DevModalContextType = {
  openModal: (titleOrFeature?: string, message?: string, type?: ModalType, secondaryAction?: SecondaryAction) => void;
  closeModal: () => void;
};

const DevModalContext = createContext<DevModalContextType | undefined>(undefined);

export function DevModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("Under Construction");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ModalType>("info");
  const [secondaryAction, setSecondaryAction] = useState<SecondaryAction | null>(null); // 👈 New state

  const openModal = (titleOrFeature?: string, customMessage?: string, modalType?: ModalType, action?: SecondaryAction) => {
    if (customMessage) {
      setTitle(titleOrFeature || "Notice");
      setMessage(customMessage);
      setType(modalType || "info");
      setSecondaryAction(action || null); // 👈 Set the secondary action
    } else {
      setTitle("Under Construction");
      setMessage(`The "${titleOrFeature || 'This'}" feature is currently in development. We are working hard to make it available soon!`);
      setType("info");
      setSecondaryAction(null);
    }
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const renderIcon = () => {
    switch (type) {
      case "warning": return <AlertTriangle className="text-amber-500" size={32} />;
      case "error": return <XCircle className="text-red-500" size={32} />;
      case "success": return <CheckCircle className="text-green-500" size={32} />;
      default: return <Construction className="text-lime-600 dark:text-lime-400" size={32} />;
    }
  };

  const iconBg = {
    warning: "bg-amber-100 dark:bg-amber-900/30",
    error: "bg-red-100 dark:bg-red-900/30",
    success: "bg-green-100 dark:bg-green-900/30",
    info: "bg-lime-100 dark:bg-lime-900/30",
  }[type];

  return (
    <DevModalContext.Provider value={{ openModal, closeModal }}>
      {children}

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

              <div className={`w-16 h-16 mx-auto ${iconBg} rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
                {renderIcon()}
              </div>

              <h2 className="text-2xl font-extrabold text-lime-950 dark:text-[#ecfdf5] mb-2">
                {title}
              </h2>
              <p className="text-lime-800/70 dark:text-lime-200/60 font-medium mb-8">
                {message}
              </p>

              {/* 👇 UPDATED BUTTON FOOTER 👇 */}
              <div className="flex gap-3">
                {secondaryAction && (
                  <button
                    onClick={() => {
                      closeModal();
                      secondaryAction.onClick();
                    }}
                    className="flex-1 h-12 bg-gray-200 hover:bg-gray-300 dark:bg-[#121A14] dark:hover:bg-[#1a261d] text-lime-950 dark:text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98]"
                  >
                    {secondaryAction.label}
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className={`${secondaryAction ? 'flex-1' : 'w-full'} h-12 bg-lime-600 cursor-pointer hover:bg-lime-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-lime-600/20 transition-all active:scale-[0.98]`}
                >
                  Click to return
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DevModalContext.Provider>
  );
}

export function useDevModal() {
  const context = useContext(DevModalContext);
  if (!context) {
    throw new Error("useDevModal must be used within a DevModalProvider");
  }
  return context;
}