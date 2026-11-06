// components/ui/SideNavigation.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { 
  ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, 
  ArrowLeft, ArrowRight, Rabbit, Snail, AlignVerticalSpaceAround, 
  Settings2, X, GripVertical
} from "lucide-react";

type ScrollMode = "gentle" | "swift" | "section";
type Side = "left" | "right";

export default function SideNavigation() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [showModePrompt, setShowModePrompt] = useState(false);
  const [scrollMode, setScrollMode] = useState<ScrollMode>("swift");
  const [side, setSide] = useState<Side>("right");
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // 👇 LOAD SAVED POSITION ON MOUNT
  useEffect(() => {
    setMounted(true);
    const savedSide = localStorage.getItem("sideNav_side") as Side | null;
    const savedMode = localStorage.getItem("sideNav_mode") as ScrollMode | null;
    const savedY = localStorage.getItem("sideNav_y");
    
    if (savedSide) setSide(savedSide);
    if (savedMode) setScrollMode(savedMode);
    
    if (savedY) {
      const yVal = Number(savedY);
      if (!isNaN(yVal)) {
        setTimeout(() => y.set(yVal), 50);
      }
    }
  }, [y]);

  // 👇 ROBUST SCROLL DETECTION (Checks both Window and nested containers)
  useEffect(() => {
    if (!mounted) return;
    
    const handleScroll = (e: Event) => {
      // 1. Check window scroll
      const windowScroll = window.scrollY || document.documentElement.scrollTop;
      
      // 2. Check the target of the scroll event (e.g., your <main> tag)
      const target = e.target as HTMLElement;
      const targetScroll = target ? target.scrollTop : 0;
      
      const currentScroll = Math.max(windowScroll, targetScroll);

      // Show if scrolled past 150px
      if (currentScroll > 150) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      // Show the mode prompt when they start scrolling
      setShowModePrompt(true);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => setShowModePrompt(false), 3000);
    };

    // Listen to both window and captured scroll events
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("scroll", handleScroll, true); // 👈 `true` catches scrolls inside <main>

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll, true);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [mounted]);

  // 👇 HANDLE DRAG END (Snap to nearest edge & save)
  const handleDragEnd = () => {
    setIsDragging(false);
    if (!navRef.current) return;
    
    const rect = navRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const viewportWidth = window.innerWidth;
    const newSide: Side = centerX < viewportWidth / 2 ? "left" : "right";
    
    localStorage.setItem("sideNav_y", y.get().toString());
    localStorage.setItem("sideNav_side", newSide);
    
    x.set(0);
    setSide(newSide);
  };

  // 👇 SCROLL ACTIONS (Also check for nested <main>)
  const scrollUp = () => {
    const amount = scrollMode === "gentle" ? 100 : scrollMode === "swift" ? 600 : window.innerHeight * 0.9;
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
      mainEl.scrollBy({ top: -amount, behavior: "smooth" });
    } else {
      window.scrollBy({ top: -amount, behavior: "smooth" });
    }
  };

  const scrollDown = () => {
    const amount = scrollMode === "gentle" ? 100 : scrollMode === "swift" ? 600 : window.innerHeight * 0.9;
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
      mainEl.scrollBy({ top: amount, behavior: "smooth" });
    } else {
      window.scrollBy({ top: amount, behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToBottom = () => {
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
      mainEl.scrollTo({ top: mainEl.scrollHeight, behavior: "smooth" });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  const handleModeSelect = (mode: ScrollMode) => {
    setScrollMode(mode);
    localStorage.setItem("sideNav_mode", mode);
    setShowModePrompt(false);
  };

  if (!mounted) return null;

  const tooltipSide = side === "right" ? "right-full mr-3" : "left-full ml-3";
  const sidePosition = side === "right" ? "right-2 sm:right-4" : "left-2 sm:left-4";

  return (
    <>
      <div 
        ref={constraintsRef} 
        className="fixed inset-4 pointer-events-none z-[998]" 
        aria-hidden="true" 
      />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={navRef}
            data-side-nav
            drag
            dragMomentum={false}
            dragElastic={0.1}
            dragConstraints={constraintsRef}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={{ x, y }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            whileDrag={{ scale: 1.05 }}
            className={`fixed top-1/2 -translate-y-1/2 z-[999] flex flex-col items-end gap-3 font-sans touch-none ${sidePosition}`}
          >
            
            <AnimatePresence>
              {showModePrompt && (
                <motion.div
                  initial={{ opacity: 0, x: side === "right" ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: side === "right" ? 20 : -20 }}
                  className={`absolute ${tooltipSide} top-0 w-64 p-4 bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/20 rounded-2xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]`}
                >
                  <button 
                    onClick={() => setShowModePrompt(false)}
                    className="absolute top-2 right-2 text-lime-800/50 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <h4 className="text-xs font-bold text-lime-950 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Settings2 size={14} className="text-lime-500" /> Scroll Speed
                  </h4>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleModeSelect("gentle")}
                      className={`flex items-center gap-3 p-2 rounded-xl border text-left transition-all ${scrollMode === 'gentle' ? 'bg-lime-500/10 border-lime-500 text-lime-700 dark:text-lime-300' : 'border-lime-500/20 text-lime-800/70 dark:text-lime-200/50 hover:bg-lime-500/5'}`}
                    >
                      <Snail size={16} /> <span className="text-xs font-bold">Gently (100px)</span>
                    </button>
                    <button 
                      onClick={() => handleModeSelect("swift")}
                      className={`flex items-center gap-3 p-2 rounded-xl border text-left transition-all ${scrollMode === 'swift' ? 'bg-lime-500/10 border-lime-500 text-lime-700 dark:text-lime-300' : 'border-lime-500/20 text-lime-800/70 dark:text-lime-200/50 hover:bg-lime-500/5'}`}
                    >
                      <Rabbit size={16} /> <span className="text-xs font-bold">Swiftly (600px)</span>
                    </button>
                    <button 
                      onClick={() => handleModeSelect("section")}
                      className={`flex items-center gap-3 p-2 rounded-xl border text-left transition-all ${scrollMode === 'section' ? 'bg-lime-500/10 border-lime-500 text-lime-700 dark:text-lime-300' : 'border-lime-500/20 text-lime-800/70 dark:text-lime-200/50 hover:bg-lime-500/5'}`}
                    >
                      <AlignVerticalSpaceAround size={16} /> <span className="text-xs font-bold">By Section (90vh)</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`flex flex-col bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border rounded-2xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden transition-shadow ${isDragging ? 'border-lime-500 shadow-[0_0_20px_rgba(132,204,22,0.4)]' : 'border-lime-500/30 dark:border-lime-500/20'}`}>
              
              <div className={`flex justify-center py-1 text-lime-600/40 hover:text-lime-600 cursor-grab active:cursor-grabbing transition-colors ${isDragging ? 'text-lime-600' : ''}`}>
                <GripVertical size={14} />
              </div>

              <div className="flex flex-col border-b border-lime-500/10 p-1.5 gap-1">
                <button onClick={() => router.back()} className="p-2 rounded-xl text-lime-700 dark:text-lime-300 hover:bg-lime-500/20 transition-colors" title="Go Back">
                  <ArrowLeft size={18} />
                </button>
                <button onClick={() => router.forward()} className="p-2 rounded-xl text-lime-700 dark:text-lime-300 hover:bg-lime-500/20 transition-colors" title="Go Forward">
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="flex flex-col border-b border-lime-500/10 p-1.5 gap-1">
                <button onClick={scrollToTop} className="p-2 rounded-xl text-lime-700 dark:text-lime-300 hover:bg-lime-500/20 transition-colors" title="Scroll to Top">
                  <ChevronsUp size={18} />
                </button>
                <button onClick={scrollToBottom} className="p-2 rounded-xl text-lime-700 dark:text-lime-300 hover:bg-lime-500/20 transition-colors" title="Scroll to End">
                  <ChevronsDown size={18} />
                </button>
              </div>

              <div className="flex flex-col p-1.5 gap-1">
                <button onClick={scrollUp} className="p-2 rounded-xl text-lime-950 dark:text-white bg-lime-500/10 hover:bg-lime-500/30 transition-colors shadow-sm" title="Scroll Up">
                  <ChevronUp size={20} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => setShowModePrompt(!showModePrompt)} 
                  className={`p-1.5 rounded-xl flex justify-center transition-colors ${showModePrompt ? 'bg-lime-600 text-white' : 'text-lime-600 dark:text-lime-400 hover:bg-lime-500/10'}`}
                  title="Change Scroll Mode"
                >
                  <Settings2 size={14} />
                </button>
                <button onClick={scrollDown} className="p-2 rounded-xl text-lime-950 dark:text-white bg-lime-500/10 hover:bg-lime-500/30 transition-colors shadow-sm" title="Scroll Down">
                  <ChevronDown size={20} strokeWidth={2.5} />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}