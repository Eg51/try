// components/ui/TourGuide.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useTour } from "@/components/providers/TourProvider";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TourGuide() {
  const { steps, isTourOpen, closeTour } = useTour();
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [windowHeight, setWindowHeight] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isTourOpen) setCurrentStep(0);
  }, [isTourOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setWindowHeight(window.innerHeight);
        setWindowWidth(window.innerWidth);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    if (!isTourOpen || steps.length === 0) return;

    const updateRect = () => {
      const el = document.getElementById(steps[currentStep].id);
      
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        
        setTimeout(() => {
          const newRect = el.getBoundingClientRect();
          if (newRect.width > 0 && newRect.height > 0) {
            setRect(newRect);
          }
        }, 400);
      } else {
        setRect(null);
      }
    };

    updateRect();

    const observer = new MutationObserver(updateRect);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [isTourOpen, currentStep, steps]);

  if (!mounted || !isTourOpen || steps.length === 0) return null;

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else closeTour();
  };
  
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // 👇 BULLETPROOF POSITIONING FOR ALL DEVICES 👇
  const getTooltipStyle = () => {
    if (!rect) return { opacity: 0 };
    
    const isMobile = windowWidth < 640;
    const padding = 16;
    const tooltipHeight = 200; // Estimated max height
    const tooltipWidth = 288; // w-72

    if (isMobile) {
      const isTopHalf = rect.top < windowHeight / 2;
      
      if (!isTopHalf) {
        // Element is in bottom half -> Tooltip goes to TOP
        return { 
          position: 'fixed' as const, 
          top: '80px', 
          bottom: 'auto', 
          left: padding, 
          right: padding, 
          width: 'auto' 
        };
      }
      
      // Element is in top half -> Tooltip goes to BOTTOM
      return { 
        position: 'fixed' as const, 
        bottom: '90px', 
        top: 'auto', 
        left: padding, 
        right: padding, 
        width: 'auto' 
      };
    }

    // DESKTOP & TABLET LOGIC
    const spaceBelow = windowHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let topPos = rect.bottom + 20; // Default: below the element

    // If there's not enough space below, try placing it above
    if (spaceBelow < tooltipHeight + 20) {
      if (spaceAbove > tooltipHeight + 20) {
        topPos = rect.top - tooltipHeight - 20;
      } else {
        // If neither fits, center it vertically
        topPos = windowHeight / 2 - tooltipHeight / 2;
      }
    }

    // Keep it horizontally within bounds
    const leftPos = Math.max(20, Math.min(rect.left - 20, windowWidth - tooltipWidth - 20));
    
    // Keep it vertically within bounds
    topPos = Math.max(20, Math.min(topPos, windowHeight - tooltipHeight - 20));

    return { 
      position: 'fixed' as const, 
      top: `${topPos}px`, 
      left: `${leftPos}px` 
    };
  };

  return createPortal(
    <AnimatePresence>
      {rect && (
        <>
          <motion.div
            animate={{ 
              top: rect.top - 8, 
              left: rect.left - 8, 
              width: rect.width + 16, 
              height: rect.height + 16 
            }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed z-[10000] rounded-xl pointer-events-none"
            style={{
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.7), 0 0 0 2px #84cc16",
              borderRadius: "12px",
            }}
          />

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[10005] w-full sm:w-72 max-h-[70vh] overflow-y-auto bg-white dark:bg-[#121A14] p-4 rounded-xl shadow-2xl border border-lime-500/30 pointer-events-auto"
            style={getTooltipStyle()}
          >
            <h4 className="font-bold text-lime-950 dark:text-lime-100 mb-1">{steps[currentStep].title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{steps[currentStep].text}</p>
            
            <div className="flex justify-between items-center mt-auto">
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
    </AnimatePresence>,
    document.body
  );
}
// // components/ui/TourGuide.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useTour } from "@/components/providers/TourProvider";
// import { Button } from "@/components/ui/Button";
// import { ChevronLeft, ChevronRight } from "lucide-react";

// export default function TourGuide() {
//   const { steps, isTourOpen, closeTour } = useTour();
//   const [currentStep, setCurrentStep] = useState(0);
//   const [rect, setRect] = useState<DOMRect | null>(null);
//   const [windowHeight, setWindowHeight] = useState(0);

//   // Reset when tour opens
//   useEffect(() => {
//     if (isTourOpen) setCurrentStep(0);
//   }, [isTourOpen]);

//   // Track window height
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       setWindowHeight(window.innerHeight);
//       const handleResize = () => setWindowHeight(window.innerHeight);
//       window.addEventListener("resize", handleResize);
//       return () => window.removeEventListener("resize", handleResize);
//     }
//   }, []);

//   // Find element and track position
//   useEffect(() => {
//     if (!isTourOpen || steps.length === 0) return;

//     const updateRect = () => {
//       const el = document.getElementById(steps[currentStep].id);
      
//       if (el) {
//         el.scrollIntoView({ behavior: "smooth", block: "center" });
        
//         setTimeout(() => {
//           const newRect = el.getBoundingClientRect();
//           if (newRect.width > 0 && newRect.height > 0) {
//             setRect(newRect);
//           }
//         }, 400);
//       } else {
//         setRect(null);
//       }
//     };

//     updateRect();

//     const observer = new MutationObserver(updateRect);
//     observer.observe(document.body, { childList: true, subtree: true });
//     window.addEventListener("resize", updateRect);

//     return () => {
//       observer.disconnect();
//       window.removeEventListener("resize", updateRect);
//     };
//   }, [isTourOpen, currentStep, steps]);

//   if (!isTourOpen || steps.length === 0) return null;

//   const nextStep = () => {
//     if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
//     else closeTour();
//   };
  
//   const prevStep = () => {
//     if (currentStep > 0) setCurrentStep(currentStep - 1);
//   };

//   // 👇 BULLETPROOF MOBILE POSITIONING
//   const getTooltipStyle = () => {
//     if (!rect) return { opacity: 0 };
    
//     const isMobile = window.innerWidth < 640;
    
//     if (isMobile) {
//       // If the element is in the top half, put tooltip at the BOTTOM of the screen
//       const isTopHalf = rect.top < windowHeight / 2;
      
//       if (isTopHalf) {
//         return { 
//           position: 'fixed' as const, 
//           bottom: '90px', // Lifted up to avoid browser UI and dev tools
//           top: 'auto', 
//           left: '16px', 
//           right: '16px', 
//           width: 'auto' 
//         };
//       }
      
//       // If the element is in the bottom half, put tooltip at the TOP of the screen
//       return { 
//         position: 'fixed' as const, 
//         top: '90px', // Pushed down to clear the floating header
//         bottom: 'auto', 
//         left: '16px', 
//         right: '16px', 
//         width: 'auto' 
//       };
//     }

//     // Desktop positioning
//     const isBottomHalf = rect.top > windowHeight / 2;
//     const leftPos = Math.max(16, Math.min(rect.left - 20, window.innerWidth - 320));
//     return { 
//       position: 'fixed' as const, 
//       top: isBottomHalf ? rect.top - 160 : rect.bottom + 20, 
//       left: leftPos 
//     };
//   };

//   return (
//     <AnimatePresence>
//       {rect && (
//         <>
//           {/* SPOTLIGHT */}
//           <motion.div
//             animate={{ 
//               top: rect.top - 8, 
//               left: rect.left - 8, 
//               width: rect.width + 16, 
//               height: rect.height + 16 
//             }}
//             transition={{ type: "spring", stiffness: 200, damping: 25 }}
//             className="fixed z-[10000] rounded-xl pointer-events-none"
//             style={{
//               boxShadow: "0 0 0 9999px rgba(0,0,0,0.7), 0 0 0 2px #84cc16",
//               borderRadius: "12px",
//             }}
//           />

//           {/* TOOLTIP */}
//           <motion.div
//             key={currentStep}
//             initial={{ opacity: 0, scale: 0.95 }} 
//             animate={{ opacity: 1, scale: 1 }} 
//             exit={{ opacity: 0, scale: 0.95 }}
//             className="fixed z-[10005] w-full sm:w-72 max-h-[70vh] overflow-y-auto bg-white dark:bg-[#121A14] p-4 rounded-xl shadow-2xl border border-lime-500/30 pointer-events-auto"
//             style={getTooltipStyle()}
//           >
//             <h4 className="font-bold text-lime-950 dark:text-lime-100 mb-1">{steps[currentStep].title}</h4>
//             <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{steps[currentStep].text}</p>
            
//             <div className="flex justify-between items-center mt-auto">
//               <button onClick={closeTour} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Skip</button>
//               <div className="flex gap-2">
//                 <Button onClick={prevStep} disabled={currentStep === 0} variant="secondary" className="h-8 px-2 text-xs border-lime-500/30 bg-white/50 dark:bg-[#0B120D] text-lime-950 dark:text-white">
//                   <ChevronLeft size={14} /> Prev
//                 </Button>
//                 <Button onClick={nextStep} className="h-8 px-3 text-xs bg-lime-600 hover:bg-lime-700 text-white">
//                   {currentStep === steps.length - 1 ? "Finish" : "Next"} <ChevronRight size={14} />
//                 </Button>
//               </div>
//             </div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// }
// // components/ui/TourGuide.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useTour } from "@/components/providers/TourProvider";
// import { Button } from "@/components/ui/Button";
// import { ChevronLeft, ChevronRight } from "lucide-react";

// export default function TourGuide() {
//   const { steps, isTourOpen, closeTour } = useTour();
//   const [currentStep, setCurrentStep] = useState(0);
//   const [rect, setRect] = useState<DOMRect | null>(null);
//   const [windowHeight, setWindowHeight] = useState(0);

//   // Reset when tour opens
//   useEffect(() => {
//     if (isTourOpen) setCurrentStep(0);
//   }, [isTourOpen]);

//   // Track window height for responsive positioning
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       setWindowHeight(window.innerHeight);
//       const handleResize = () => setWindowHeight(window.innerHeight);
//       window.addEventListener("resize", handleResize);
//       return () => window.removeEventListener("resize", handleResize);
//     }
//   }, []);

//   // Find element, scroll into view, and track position
//   useEffect(() => {
//     if (!isTourOpen || steps.length === 0) return;

//     const updateRect = () => {
//       const el = document.getElementById(steps[currentStep].id);
//       if (el) {
//         // 1. Scroll element to center of screen so it's never cut off
//         el.scrollIntoView({ behavior: "smooth", block: "center" });
        
//         // 2. Wait for scroll to finish, then measure
//         setTimeout(() => {
//           setRect(el.getBoundingClientRect());
//         }, 300);
//       } else {
//         setRect(null);
//       }
//     };

//     const timer = setTimeout(updateRect, 300); 
//     window.addEventListener("resize", updateRect);

//     return () => {
//       clearTimeout(timer);
//       window.removeEventListener("resize", updateRect);
//     };
//   }, [isTourOpen, currentStep, steps]);

//   if (!isTourOpen || steps.length === 0) return null;

//   const nextStep = () => {
//     if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
//     else closeTour();
//   };
//   const prevStep = () => {
//     if (currentStep > 0) setCurrentStep(currentStep - 1);
//   };

//   // 👇 DYNAMIC TOOLTIP POSITIONING (Prevents being hidden at the bottom)
//   const getTooltipStyle = () => {
//     if (!rect) return { opacity: 0 };
    
//     const isMobile = window.innerWidth < 640;
//     const padding = 16;

//     if (isMobile) {
//       const isBottomHalf = rect.top > windowHeight / 2;
      
//       // If element is in the bottom half, put tooltip ABOVE it
//       if (isBottomHalf) {
//         return { 
//           position: 'fixed' as const, 
//           top: 'auto', 
//           bottom: windowHeight - rect.top + 16, 
//           left: padding, 
//           right: padding, 
//           width: 'auto' 
//         };
//       }
      
//       // Otherwise put it BELOW
//       return { 
//         position: 'fixed' as const, 
//         top: rect.bottom + 16, 
//         bottom: 'auto', 
//         left: padding, 
//         right: padding, 
//         width: 'auto' 
//       };
//     }

//     // Desktop positioning
//     const isBottomHalf = rect.top > windowHeight / 2;
//     const leftPos = Math.max(16, Math.min(rect.left - 20, window.innerWidth - 320));
//     return { 
//       position: 'fixed' as const, 
//       top: isBottomHalf ? rect.top - 160 : rect.bottom + 20, 
//       left: leftPos 
//     };
//   };

//   return (
//     <AnimatePresence>
//       {rect && (
//         <>
//           {/* 👇 BOX-SHADOW SPOTLIGHT (No clip-path, no blur) 👇 */}
//           <motion.div
//             animate={{ 
//               top: rect.top - 8, 
//               left: rect.left - 8, 
//               width: rect.width + 16, 
//               height: rect.height + 16 
//             }}
//             transition={{ type: "spring", stiffness: 200, damping: 25 }}
//             className="fixed z-[200] rounded-xl pointer-events-none"
//             style={{
//               // The massive shadow creates the dark overlay everywhere EXCEPT the box
//               boxShadow: "0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 2px #84cc16",
//               borderRadius: "12px",
//             }}
//           />

//           {/* Tooltip */}
//           <motion.div
//             key={currentStep}
//             initial={{ opacity: 0, scale: 0.95 }} 
//             animate={{ opacity: 1, scale: 1 }} 
//             exit={{ opacity: 0, scale: 0.95 }}
//             className="fixed z-[220] w-full sm:w-72 max-h-[80vh] overflow-y-auto bg-white dark:bg-[#121A14] p-4 rounded-xl shadow-2xl border border-lime-500/30 pointer-events-auto"
//             style={getTooltipStyle()}
//           >
//             <h4 className="font-bold text-lime-950 dark:text-lime-100 mb-1">{steps[currentStep].title}</h4>
//             <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{steps[currentStep].text}</p>
            
//             <div className="flex justify-between items-center mt-auto">
//               <button onClick={closeTour} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Skip</button>
//               <div className="flex gap-2">
//                 <Button onClick={prevStep} disabled={currentStep === 0} variant="secondary" className="h-8 px-2 text-xs border-lime-500/30 bg-white/50 dark:bg-[#0B120D] text-lime-950 dark:text-white">
//                   <ChevronLeft size={14} /> Prev
//                 </Button>
//                 <Button onClick={nextStep} className="h-8 px-3 text-xs bg-lime-600 hover:bg-lime-700 text-white">
//                   {currentStep === steps.length - 1 ? "Finish" : "Next"} <ChevronRight size={14} />
//                 </Button>
//               </div>
//             </div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// }




// // components/ui/TourGuide.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useTour } from "@/components/providers/TourProvider";
// import { Button } from "@/components/ui/Button";
// import { ChevronLeft, ChevronRight } from "lucide-react";

// export default function TourGuide() {
//   const { steps, isTourOpen, closeTour } = useTour();
//   const [currentStep, setCurrentStep] = useState(0);
//   const [rect, setRect] = useState<DOMRect | null>(null);

//   // Reset when tour opens
//   useEffect(() => {
//     if (isTourOpen) setCurrentStep(0);
//   }, [isTourOpen]);

//   // Find element and track position
//   useEffect(() => {
//     if (!isTourOpen || steps.length === 0) return;

//     const updateRect = () => {
//       const el = document.getElementById(steps[currentStep].id);
//       if (el) {
//         setRect(el.getBoundingClientRect());
//       } else {
//         setRect(null);
//       }
//     };

//     const timer = setTimeout(updateRect, 300); // Wait for DOM
//     window.addEventListener("resize", updateRect);
//     window.addEventListener("scroll", updateRect);

//     return () => {
//       clearTimeout(timer);
//       window.removeEventListener("resize", updateRect);
//       window.removeEventListener("scroll", updateRect);
//     };
//   }, [isTourOpen, currentStep, steps]);

//   if (!isTourOpen || steps.length === 0) return null;

//   const nextStep = () => {
//     if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
//     else closeTour();
//   };
//   const prevStep = () => {
//     if (currentStep > 0) setCurrentStep(currentStep - 1);
//   };

//   const getTooltipStyle = () => {
//     if (!rect) return { opacity: 0 };
//     if (typeof window !== 'undefined' && window.innerWidth < 640) {
//       return { position: 'fixed' as const, bottom: '24px', left: '16px', right: '16px', width: 'auto', top: 'auto' };
//     }
//     const isBottomHalf = rect.top > window.innerHeight / 2;
//     const leftPos = Math.max(16, Math.min(rect.left - 20, window.innerWidth - 320));
//     return { position: 'fixed' as const, top: isBottomHalf ? rect.top - 160 : rect.bottom + 20, left: leftPos };
//   };

//   return (
//     <AnimatePresence>
//       {rect && (
//         <>
//           {/* Overlay with cutout */}
//           <motion.div 
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[200] bg-black/60 pointer-events-none"
//             style={{
//               backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
//               clipPath: `polygon(0% 0%, 0% 100%, ${rect.left - 12}px 100%, ${rect.left - 12}px ${rect.top - 12}px, ${rect.right + 12}px ${rect.top - 12}px, ${rect.right + 12}px ${rect.bottom + 12}px, ${rect.left - 12}px ${rect.bottom + 12}px, ${rect.left - 12}px 100%, 100% 100%, 100% 0%)`
//             }}
//           />
          
//           {/* Highlight Border */}
//           <motion.div
//             animate={{ 
//               top: rect.top - 12, left: rect.left - 12, 
//               width: rect.width + 24, height: rect.height + 24 
//             }}
//             transition={{ type: "spring", stiffness: 200, damping: 25 }}
//             className="fixed z-[210] rounded-xl border-2 border-lime-500 pointer-events-none"
//           />

//           {/* Tooltip */}
//           <motion.div
//             key={currentStep}
//             initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//             className="fixed z-[220] w-full sm:w-72 bg-white dark:bg-[#121A14] p-4 rounded-xl shadow-2xl border border-lime-500/30 pointer-events-auto"
//             style={getTooltipStyle()}
//           >
//             <h4 className="font-bold text-lime-950 dark:text-lime-100 mb-1">{steps[currentStep].title}</h4>
//             <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{steps[currentStep].text}</p>
            
//             <div className="flex justify-between items-center">
//               <button onClick={closeTour} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Skip</button>
//               <div className="flex gap-2">
//                 <Button onClick={prevStep} disabled={currentStep === 0} variant="secondary" className="h-8 px-2 text-xs border-lime-500/30 bg-white/50 dark:bg-[#0B120D] text-lime-950 dark:text-white">
//                   <ChevronLeft size={14} /> Prev
//                 </Button>
//                 <Button onClick={nextStep} className="h-8 px-3 text-xs bg-lime-600 hover:bg-lime-700 text-white">
//                   {currentStep === steps.length - 1 ? "Finish" : "Next"} <ChevronRight size={14} />
//                 </Button>
//               </div>
//             </div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// }