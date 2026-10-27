"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f0fdf4] dark:bg-[#050806] px-4 overflow-hidden transition-colors duration-300">
      
      {/* Aurora Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative z-10 w-full max-w-md p-8 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] text-center space-y-6"
      >
        {/* Icon */}
        <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
        </div>
        
        {/* Text Content */}
        <div>
          <h2 className="text-xl font-bold text-lime-950 dark:text-white mb-2">Whoops! Something broke.</h2>
          <p className="text-sm text-lime-800/70 dark:text-lime-200/50 font-medium">
            Our servers hit a snag. Don't worry, connectivity will be restored shortly.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={() => reset()} 
            className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-lime-600/20 transition-transform active:scale-95"
          >
            Try Again
          </Button>
          <Button 
            onClick={() => window.location.href = "/dashboard"} 
            variant="secondary"
            className="w-full border-lime-500/30 dark:border-lime-500/20 bg-white/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-bold h-11 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Return to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}