// components/ui/TourGuide.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "@/components/providers/TourProvider";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TourGuide() {
  const { steps, isTourOpen, closeTour } = useTour();
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Reset when tour opens
  useEffect(() => {
    if (isTourOpen) setCurrentStep(0);
  }, [isTourOpen]);

  // Find element and track position
  useEffect(() => {
    if (!isTourOpen || steps.length === 0) return;

    const updateRect = () => {
      const el = document.getElementById(steps[currentStep].id);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };

    const timer = setTimeout(updateRect, 300); // Wait for DOM
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [isTourOpen, currentStep, steps]);

  if (!isTourOpen || steps.length === 0) return null;

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else closeTour();
  };
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const getTooltipStyle = () => {
    if (!rect) return { opacity: 0 };
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return { position: 'fixed' as const, bottom: '24px', left: '16px', right: '16px', width: 'auto', top: 'auto' };
    }
    const isBottomHalf = rect.top > window.innerHeight / 2;
    const leftPos = Math.max(16, Math.min(rect.left - 20, window.innerWidth - 320));
    return { position: 'fixed' as const, top: isBottomHalf ? rect.top - 160 : rect.bottom + 20, left: leftPos };
  };

  return (
    <AnimatePresence>
      {rect && (
        <>
          {/* Overlay with cutout */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 pointer-events-none"
            style={{
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              clipPath: `polygon(0% 0%, 0% 100%, ${rect.left - 12}px 100%, ${rect.left - 12}px ${rect.top - 12}px, ${rect.right + 12}px ${rect.top - 12}px, ${rect.right + 12}px ${rect.bottom + 12}px, ${rect.left - 12}px ${rect.bottom + 12}px, ${rect.left - 12}px 100%, 100% 100%, 100% 0%)`
            }}
          />
          
          {/* Highlight Border */}
          <motion.div
            animate={{ 
              top: rect.top - 12, left: rect.left - 12, 
              width: rect.width + 24, height: rect.height + 24 
            }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed z-[210] rounded-xl border-2 border-lime-500 pointer-events-none"
          />

          {/* Tooltip */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[220] w-full sm:w-72 bg-white dark:bg-[#121A14] p-4 rounded-xl shadow-2xl border border-lime-500/30 pointer-events-auto"
            style={getTooltipStyle()}
          >
            <h4 className="font-bold text-lime-950 dark:text-lime-100 mb-1">{steps[currentStep].title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{steps[currentStep].text}</p>
            
            <div className="flex justify-between items-center">
              <button onClick={closeTour} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Skip</button>
              <div className="flex gap-2">
                <Button onClick={prevStep} disabled={currentStep === 0} variant="secondary" className="h-8 px-2 text-xs border-lime-500/30 bg-white/50 dark:bg-[#0B120D] text-lime-950 dark:text-white">
                  <ChevronLeft size={14} /> Prev
                </Button>
                <Button onClick={nextStep} className="h-8 px-3 text-xs bg-lime-600 hover:bg-lime-700 text-white">
                  {currentStep === steps.length - 1 ? "Finish" : "Next"} <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}