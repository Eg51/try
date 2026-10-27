"use client";

import "./globals.css";
import Link from "next/link";
import dynamic from "next/dynamic";
import { LazyMotion, domAnimation, m, AnimatePresence, Variants, useInView } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation"; 
import { ArrowRight, Zap, TrendingUp, Sun, Moon, Fingerprint, Menu, X, Globe, Users, LineChart, ArrowUpRight, Wallet, Landmark, Layers, Percent } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useDevModal } from "@/components/providers/DevModalProvider";

// --- LAZY LOADED SECTIONS ---
// These will only download when they are needed, speeding up initial load.
const LoadingSkeleton = () => <div className="h-96 w-full animate-pulse bg-lime-500/5 rounded-3xl my-12 max-w-6xl mx-auto" />;

const MarketsSection = dynamic(() => import("@/components/sections/MarketsSection"), { loading: LoadingSkeleton });
const TerminalSection = dynamic(() => import("@/components/sections/TerminalSection"), { loading: LoadingSkeleton });
const GlobalStatsSection = dynamic(() => import("@/components/sections/GlobalStatsSection"), { loading: LoadingSkeleton });
const FeatureGrid = dynamic(() => import("@/components/sections/FeatureGrid"), { loading: LoadingSkeleton });
const FooterSection = dynamic(() => import("@/components/sections/FooterSection"), { loading: LoadingSkeleton });

// --- SHARED EXPORTED COMPONENTS ---
export const WATERMARK_SYMBOLS = ["$", "€", "£", "¥", "₦", "₹", "₿", "Ξ", "Ð", "Ł", "₮", "₳", "₱", "₩", "₪"];

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export const AnimatedCounter = ({ value, duration = 2 }: { value: string, duration?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState("0");

  const match = value.match(/^([^\d]*)([\d.]+)(.*)$/);
  const prefix = match ? match[1] : "";
  const numericString = match ? match[2] : "0";
  const suffix = match ? match[3] : value;

  const target = parseFloat(numericString);
  const isDecimal = numericString.includes('.');

  useEffect(() => {
    if (isInView) {
      let startTime: number | null = null;
      const animateCount = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = easeOut * target;
        setDisplayValue(isDecimal ? current.toFixed(1) : Math.floor(current).toString());
        if (progress < 1) requestAnimationFrame(animateCount);
      };
      requestAnimationFrame(animateCount);
    }
  }, [isInView, target, duration, isDecimal]);

  return <span ref={ref}>{prefix}{displayValue}{suffix}</span>;
};

const MarqueeRow = ({ direction, speed, symbols }: { direction: 'left' | 'right', speed: number, symbols: string[] }) => {
  return (
    <div className="flex overflow-hidden w-full relative py-1 md:py-2 pointer-events-none">
      <m.div className="flex gap-6 md:gap-12 whitespace-nowrap w-max" animate={{ x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'] }} transition={{ repeat: Infinity, ease: 'linear', duration: speed }}>
        {[...symbols, ...symbols].map((symbol, i) => (
          <m.div key={i} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-lime-900/20 dark:text-lime-600/30 select-none" animate={{ y: [0, -15, 0, 15, 0], rotate: [0, 10, 0, -10, 0] }} transition={{ repeat: Infinity, duration: 5 + (i % 4), ease: 'easeInOut', delay: i * 0.2 }}>
            {symbol}
          </m.div>
        ))}
      </m.div>
    </div>
  );
};

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    // LazyMotion drastically reduces the initial bundle size by only loading `domAnimation` features.
    <LazyMotion features={domAnimation}>
      <div className="flex-1 w-full flex flex-col font-sans bg-[#f0fdf4] dark:bg-[#050806] relative transition-colors duration-300 overflow-hidden">
        
        {/* BACKGROUND WATERMARKS */}
        <div className="absolute inset-0 w-full overflow-hidden pointer-events-none select-none z-0 flex flex-col justify-around">
          {Array.from({ length: 15 }).map((_, i) => (
            <MarqueeRow key={i} direction={i % 2 === 0 ? "left" : "right"} speed={40 + (i % 5) * 15} symbols={i % 3 === 0 ? [...WATERMARK_SYMBOLS].reverse() : WATERMARK_SYMBOLS} />
          ))}
          <div className="absolute inset-0 z-10 bg-[#f0fdf4] dark:bg-[#050806] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]"></div>
        </div>

        {/* Background Aurora Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

        {/* Navigation */}
        <nav className="fixed top-0 w-full border-b border-lime-500/20 dark:border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md z-50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
            <Logo />
            <div className="hidden md:flex items-center gap-8">
              <a href="#markets" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Markets</a>
              <a href="#features" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">How it Works</a>
              <a href="#rewards" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Rewards</a>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-white/40 dark:bg-black/40 border border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-white/60 dark:hover:bg-black/60 transition-all shadow-sm backdrop-blur-md cursor-pointer">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link href="/login" className="hidden sm:block text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Sign In</Link>
              <Link href="/login" className="hidden sm:block bg-lime-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/20">Get Started</Link>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-full bg-white/40 dark:bg-black/40 border border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-white/60 dark:hover:bg-black/60 transition-all shadow-sm backdrop-blur-md cursor-pointer">
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
            <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                {/* 1. Full Screen Blurred Backdrop */}
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                 className="fixed min-h-screen inset-0 z-40 bg-[#f0fdf4]/95 dark:bg-[#050806]/95 backdrop-blur-[200px] md:hidden"
                />

                {/* 2. The "Recent Apps" Style Menu Container */}
                <m.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed top-24 right-4 left-4 z-[70] md:hidden flex flex-col gap-3"
                >
                  {/* Individual Floating Menu Cards */}
                  {[
                    { label: "Markets", href: "#markets", icon: <LineChart size={20} /> },
                    { label: "Features", href: "#features", icon: <Zap size={20} /> },
                    { label: "How it Works", href: "#how-it-works", icon: <Globe size={20} /> },
                    { label: "Rewards", href: "#rewards", icon: <TrendingUp size={20} /> },
                  ].map((item, i) => (
                    <m.a
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 dark:bg-[#121A14]/80 backdrop-blur-2xl border border-lime-500/20 shadow-xl text-lime-950 dark:text-white font-semibold active:scale-95 transition-transform"
                    >
                      <div className="w-10 h-10 rounded-full bg-lime-100 dark:bg-lime-900/50 flex items-center justify-center text-lime-600 dark:text-lime-400 shadow-inner">
                        {item.icon}
                      </div>
                      {item.label}
                    </m.a>
                  ))}
                  
                  <m.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 20 }} 
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    className="mt-2"
                  >
                    <Link 
                      href="/login" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="flex items-center justify-center gap-2 w-full bg-lime-600 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-lime-600/30 active:scale-95 transition-transform"
                    >
                      Sign In <ArrowRight size={18} />
                    </Link>
                  </m.div>
                </m.div>
              </>
            )}
          </AnimatePresence>
          {/* <AnimatePresence>
            {isMobileMenuOpen && (
              <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-lime-500/10 bg-white/90 dark:bg-[#121A14]/95 backdrop-blur-xl overflow-hidden">
                <div className="flex flex-col p-4 space-y-4">
                  <a href="#markets" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-lime-800 dark:text-lime-200 p-2 rounded-lg hover:bg-lime-100 dark:hover:bg-black/40">Markets</a>
                  <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-lime-800 dark:text-lime-200 p-2 rounded-lg hover:bg-lime-100 dark:hover:bg-black/40">Features</a>
                  <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-lime-800 dark:text-lime-200 p-2 rounded-lg hover:bg-lime-100 dark:hover:bg-black/40">How it Works</a>
                  <a href="#rewards" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-lime-800 dark:text-lime-200 p-2 rounded-lg hover:bg-lime-100 dark:hover:bg-black/40">Rewards</a>
                  <hr className="border-lime-500/10" />
                  <Link href="/login" className="text-sm font-semibold text-lime-800 dark:text-lime-200 p-2 rounded-lg hover:bg-lime-100 dark:hover:bg-black/40">Sign In</Link>
                  <Link href="/login" className="bg-lime-600 text-center text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/20">Get Started</Link>
                </div>
              </m.div>
            )}
          </AnimatePresence> */}
        </nav>

        {/* Hero Section (Above the Fold - Stays immediate) */}
        <main className="relative z-20 pt-32 sm:pt-40 pb-20 px-4 sm:px-6 flex-grow">
          <m.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 relative">
            {/* Floating Cards */}
            <m.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="hidden lg:flex absolute -left-32 top-20 flex-col p-4 rounded-2xl bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 shadow-lg w-48 z-30">
              <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-lime-950 dark:text-white">Increase in Trade</span></div>
              <div className="text-2xl font-extrabold text-lime-600 dark:text-lime-400 mb-1 flex items-center gap-1">+75% <ArrowUpRight size={16} /></div>
              <span className="text-[10px] text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider font-bold">Sell option</span>
            </m.div>
            <m.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="hidden lg:flex absolute -right-32 bottom-32 flex-col p-4 rounded-2xl bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 shadow-lg w-48 z-30">
              <span className="text-[10px] font-bold text-lime-600 dark:text-lime-400 uppercase tracking-wider mb-1">Est. 24h Revenue</span>
              <div className="text-xl font-extrabold text-lime-950 dark:text-white font-mono">0.055 ETH</div>
              <div className="text-sm font-bold text-lime-800/60 dark:text-lime-200/60">($1275)</div>
            </m.div>

            <m.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-lime-950 dark:text-[#ecfdf5] leading-[1.1] drop-shadow-sm dark:drop-shadow-[0_0_20px_rgba(5,8,6,1)]">
              Trade everything. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-lime-700 dark:from-lime-400 dark:to-lime-600">Zero limits.</span>
            </m.h1>
            
            <m.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-lime-800/80 dark:text-lime-200/60 max-w-2xl mx-auto leading-relaxed font-medium px-2 sm:px-0">
              The world's first highly gamified commodity and crypto exchange. 
              Start with local goods like Charcoal and Bitterleaf, earn XP by completing tasks, 
              and seamlessly unlock institutional-grade Crypto, Meme Coins, and Forex trading.
            </m.p>

            <m.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
              <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-lime-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-lime-700 transition-all hover:scale-105 shadow-lg shadow-lime-600/20">Start Trading <ArrowRight size={20} /></Link>
              <a href="#markets" className="w-full sm:w-auto flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold border-2 border-lime-500/30 dark:border-lime-500/20 text-lime-950 dark:text-[#ecfdf5] hover:bg-white/50 dark:hover:bg-[#121A14]/50 backdrop-blur-sm transition-colors">Explore Markets</a>
            </m.div>

            <m.div variants={containerVariants} className="pt-10 sm:pt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto">
              <m.div variants={itemVariants} className="flex flex-col items-center p-4 bg-white/30 dark:bg-[#121A14]/30 backdrop-blur-sm rounded-2xl border border-lime-500/10 shadow-sm">
                <span className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5] font-mono"><AnimatedCounter value="₦4.2B+" /></span>
                <span className="text-xs sm:text-sm font-semibold text-lime-700/60 dark:text-lime-300/60 mt-1">Total Volume</span>
              </m.div>
              <m.div variants={itemVariants} className="flex flex-col items-center p-4 bg-white/30 dark:bg-[#121A14]/30 backdrop-blur-sm rounded-2xl border border-lime-500/10 shadow-sm">
                <span className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5] font-mono"><AnimatedCounter value="50k+" /></span>
                <span className="text-xs sm:text-sm font-semibold text-lime-700/60 dark:text-lime-300/60 mt-1">Active Traders</span>
              </m.div>
              <m.div variants={itemVariants} className="flex flex-col items-center p-4 bg-white/30 dark:bg-[#121A14]/30 backdrop-blur-sm rounded-2xl border border-lime-500/10 shadow-sm">
                <span className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5] font-mono"><AnimatedCounter value="99.9%" /></span>
                <span className="text-xs sm:text-sm font-semibold text-lime-700/60 dark:text-lime-300/60 mt-1">Uptime</span>
              </m.div>
            </m.div>
          </m.div>

          {/* LAZY LOADED SECTIONS START HERE */}
          <MarketsSection />
          <TerminalSection />
          <GlobalStatsSection />
          <FeatureGrid />
        </main>
<button onClick={() => { throw new Error("Testing the error boundary!") }}>
  Break the app
</button>
        <FooterSection />
      </div>
    </LazyMotion>
  );
}
// "use client";
// import "./globals.css";
// import Link from "next/link";
// import { motion, AnimatePresence, Variants, useInView } from "framer-motion";
// import { useTheme } from "next-themes";
// import { useEffect, useState, useRef } from "react";
// import { useRouter } from "next/navigation"; 
// import { ArrowRight, Zap, TrendingUp, Sun, Moon, Fingerprint, Menu, X, Globe, Users, LineChart, ArrowUpRight, Wallet, Landmark, Layers, Percent } from "lucide-react";
// import { Logo } from "@/components/ui/Logo";
// import { useDevModal } from "@/components/providers/DevModalProvider";

// const WATERMARK_SYMBOLS = ["$", "€", "£", "¥", "₦", "₹", "₿", "Ξ", "Ð", "Ł", "₮", "₳", "₱", "₩", "₪"];

// // --- ANIMATION VARIANTS ---
// const containerVariants: Variants = {
//   hidden: { opacity: 0 },
//   visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
// };

// const itemVariants: Variants = {
//   hidden: { opacity: 0, y: 30 },
//   visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
// };

// const cardHoverVariants: Variants = {
//   initial: { y: 0, scale: 1 },
//   hover: { y: -8, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } }
// };

// const slideVariants: Variants = {
//   enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
//   center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
//   exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }),
// };

// // --- ANIMATED COUNTER COMPONENT ---
// const AnimatedCounter = ({ value, duration = 2 }: { value: string, duration?: number }) => {
//   const ref = useRef(null);
//   const isInView = useInView(ref, { once: true, margin: "-50px" });
//   const [displayValue, setDisplayValue] = useState("0");

//   const match = value.match(/^([^\d]*)([\d.]+)(.*)$/);
//   const prefix = match ? match[1] : "";
//   const numericString = match ? match[2] : "0";
//   const suffix = match ? match[3] : value;

//   const target = parseFloat(numericString);
//   const isDecimal = numericString.includes('.');

//   useEffect(() => {
//     if (isInView) {
//       let startTime: number | null = null;
//       const animateCount = (timestamp: number) => {
//         if (!startTime) startTime = timestamp;
//         const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
//         const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
//         const current = easeOut * target;
//         setDisplayValue(isDecimal ? current.toFixed(1) : Math.floor(current).toString());
//         if (progress < 1) requestAnimationFrame(animateCount);
//       };
//       requestAnimationFrame(animateCount);
//     }
//   }, [isInView, target, duration, isDecimal]);

//   return <span ref={ref}>{prefix}{displayValue}{suffix}</span>;
// };

// // Custom Marquee Component
// const MarqueeRow = ({ direction, speed, symbols }: { direction: 'left' | 'right', speed: number, symbols: string[] }) => {
//   return (
//     <div className="flex overflow-hidden w-full relative py-1 md:py-2 pointer-events-none">
//       <motion.div className="flex gap-6 md:gap-12 whitespace-nowrap w-max" animate={{ x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'] }} transition={{ repeat: Infinity, ease: 'linear', duration: speed }}>
//         {[...symbols, ...symbols].map((symbol, i) => (
//           <motion.div key={i} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-lime-900/20 dark:text-lime-600/30 select-none" animate={{ y: [0, -15, 0, 15, 0], rotate: [0, 10, 0, -10, 0] }} transition={{ repeat: Infinity, duration: 5 + (i % 4), ease: 'easeInOut', delay: i * 0.2 }}>
//             {symbol}
//           </motion.div>
//         ))}
//       </motion.div>
//     </div>
//   );
// };

// const SocialIcon = ({ name, size = 18 }: { name: string, size?: number }) => {
//   const baseClass = "text-lime-800/60 dark:text-lime-200/40 hover:text-lime-600 dark:hover:text-lime-400 transition-colors duration-300";
//   switch(name) {
//     case 'facebook': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
//     case 'instagram': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
//     case 'youtube': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>;
//     case 'twitter': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>;
//     case 'linkedin': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
//     default: return null;
//   }
// };

// const PaymentIcon = ({ name }: { name: string }) => {
//   const baseClass = "h-6 md:h-7 w-auto text-lime-800/60 dark:text-lime-200/40 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors duration-300";
//   switch (name) {
//     case 'Visa': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M9.112 7.935h2.376l-1.584 9.13H7.528l1.584-9.13zm5.633 0h-1.992c-.456 0-.8.128-1.04.384-.232.256-.368.608-.368 1.088 0 .48.152.848.456 1.072l1.256.88c.384.272.576.568.576.88 0 .448-.32.688-.96.688-.672 0-1.488-.232-2.448-.688v1.768c.76.32 1.624.488 2.584.488 1.048 0 1.872-.256 2.464-.752.592-.504.896-1.168.896-2.008 0-.48-.144-.856-.432-1.144-.28-.288-.792-.64-1.52-.992l-.56-.352c-.232-.144-.352-.312-.352-.504 0-.28.224-.44.672-.44.552 0 1.232.176 2.04.528V7.935zm3.92 0h-1.84c-.448 0-.776.12-.984.36-.208.24-.352.576-.352.992 0 .448.152.784.44 1.024l.808.592c.352.256.528.512.528.768 0 .336-.256.512-.76.512-.56 0-1.224-.208-1.992-.624v1.552c.72.288 1.504.432 2.352.432 1.048 0 1.872-.256 2.464-.752.592-.496.896-1.168.896-2.024 0-.496-.152-.872-.44-1.152-.288-.28-.792-.632-1.512-.984l-.456-.288c-.224-.144-.336-.304-.336-.496 0-.256.208-.408.624-.408.528 0 1.152.168 1.888.512V7.935zm-15.336.304l-3.328 8.68h2.496l.632-1.76h2.992l.376 1.76h2.216L5.625 8.239H3.329zm.848 2.592l.912 4.144H2.681l1.496-4.144z"/></svg>;
//     case 'Mastercard': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M16.24 8.5h-8.48A5.23 5.23 0 0 0 6 12.5c0 2.7 1.96 4.96 4.56 5.5h2.88c2.6-.54 4.56-2.8 4.56-5.5 0-2.7-1.96-4.96-4.56-5.5H16.24z"/></svg>;
//     case 'PayPal': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.274-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>;
//     case 'Bitcoin': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M14.647 10.702c.34-1.94-1.228-2.868-3.066-3.426l.716-2.87-1.688-.42-.7 2.804c-.442-.11-1.01-.257-1.582-.406l.714-2.866-1.686-.42-.727 2.912c-.426-.104-.863-.207-1.297-.317L3.626 4.935l-.454 1.82s1.24.296 1.215.315c.678.168.8.653.782.995l-1.556 6.24c-.074.183-.252.457-.648.353-.063-.015-1.212-.302-1.212-.302l-.87 1.92 4.31 1.074c.46.114.906.228 1.347.336l-.728 2.914 1.685.42.72-2.882c.55.148 1.09.286 1.568.408l-.722 2.89 1.686.42.73-2.924c2.382.45 4.156.27 4.912-1.88.608-1.73-.03-2.727-1.27-3.378.905-.208 1.587-.804 1.87-2.034zm-3.53 4.558c-.428 1.725-3.344.792-4.29.558l.76-3.058c.947.236 3.98.705 3.53 2.5zm.435-4.587c-.39 1.57-2.82.772-3.607.577l.686-2.754c.785.195 3.32.557 2.92 2.177z"/></svg>;
//     case 'Ethereum': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L4.32 12.453l7.68 4.523 7.68-4.523L12 0zm0 22.85l-7.68-10.397L12 24l7.68-11.547-7.68 10.397z"/></svg>;
//     case 'Western Union': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h20v12H2V6zm3 2l2 8h2l2-8H9l-1 5-1-5H5zm7 0v8h2V8h-2zm4 0l2 8h2l2-8h-2l-1 5-1-5h-2z"/></svg>;
//     case 'Bank Transfer': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v2h20V7L12 2zM4 11v6h3v-6H4zm6 0v6h4v-6h-4zm7 0v6h3v-6h-3zM2 19v2h20v-2H2z"/></svg>;
//     case 'Cash': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8zM7 10h2v4H7zm8 0h2v4h-2zm-4 0h2v4h-2z"/></svg>;
//     case 'Wire Transfer': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>;
//     default: return null;
//   }
// };

// export default function LandingPage() {
//   const { theme, setTheme } = useTheme();
//   const { openModal } = useDevModal();
//   const router = useRouter(); 
//   const [mounted, setMounted] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
//   // Terminal Auto-Play State
//   const [activeTab, setActiveTab] = useState('Spot');
//   const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
//   const tabs = ['Markets', 'Spot', 'Futures', 'Earn', 'Wallet'];

//   useEffect(() => setMounted(true), []);

//   // Auto-Play Logic
//   useEffect(() => {
//     if (isAutoPlayPaused) return;
//     const interval = setInterval(() => {
//       setActiveTab((current) => {
//         const currentIndex = tabs.indexOf(current);
//         const nextIndex = (currentIndex + 1) % tabs.length;
//         return tabs[nextIndex];
//       });
//     }, 4000); // Changes every 4 seconds
//     return () => clearInterval(interval);
//   }, [isAutoPlayPaused, tabs]);

//   // Handle manual tab clicks (pause auto-play temporarily)
//   const handleTabClick = (tab: string) => {
//     setActiveTab(tab);
//     setIsAutoPlayPaused(true);
//     // Resume auto-play after 10 seconds of inactivity
//     setTimeout(() => setIsAutoPlayPaused(false), 10000);
//   };

//   if (!mounted) return null;

//   const paymentMethods = [
//     'Visa', 'Mastercard', 'PayPal', 'Bitcoin', 'Ethereum', 
//     'Western Union', 'Bank Transfer', 'Cash', 'Wire Transfer'
//   ];

//   return (
//     <div className="flex-1 w-full flex flex-col font-sans bg-[#f0fdf4] dark:bg-[#050806] relative transition-colors duration-300 overflow-hidden">
      
//       {/* BACKGROUND WATERMARKS */}
//       <div className="absolute inset-0 w-full overflow-hidden pointer-events-none select-none z-0 flex flex-col justify-around">
//         {Array.from({ length: 15 }).map((_, i) => (
//           <MarqueeRow key={i} direction={i % 2 === 0 ? "left" : "right"} speed={40 + (i % 5) * 15} symbols={i % 3 === 0 ? [...WATERMARK_SYMBOLS].reverse() : WATERMARK_SYMBOLS} />
//         ))}
//         <div className="absolute inset-0 z-10 bg-[#f0fdf4] dark:bg-[#050806] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]"></div>
//       </div>

//       {/* Background Aurora Glows */}
//       <div className="absolute top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
//       <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

//       {/* Navigation */}
//       <nav className="fixed top-0 w-full border-b border-lime-500/20 dark:border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md z-50 transition-colors duration-300">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          
//           <Logo />
          
//           <div className="hidden md:flex items-center gap-8">
//             <a href="#markets" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Markets</a>
//             <a href="#features" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Features</a>
//             <a href="#how-it-works" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">How it Works</a>
//             <a href="#rewards" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Rewards</a>
//           </div>

//           <div className="flex items-center gap-2 sm:gap-4">
//             <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-white/40 dark:bg-black/40 border border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-white/60 dark:hover:bg-black/60 transition-all shadow-sm backdrop-blur-md cursor-pointer">
//               {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
//             </button>
            
//             <Link href="/login" className="hidden sm:block text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Sign In</Link>
//             <Link href="/login" className="hidden sm:block bg-lime-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/20">Get Started</Link>

//             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-full bg-white/40 dark:bg-black/40 border border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-white/60 dark:hover:bg-black/60 transition-all shadow-sm backdrop-blur-md cursor-pointer">
//               {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
//             </button>
//           </div>
//         </div>

//         <AnimatePresence>
//           {isMobileMenuOpen && (
//             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-lime-500/10 bg-white/90 dark:bg-[#121A14]/95 backdrop-blur-xl overflow-hidden">
//               <div className="flex flex-col p-4 space-y-4">
//                 <a href="#markets" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-lime-800 dark:text-lime-200 p-2 rounded-lg hover:bg-lime-100 dark:hover:bg-black/40">Markets</a>
//                 <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-lime-800 dark:text-lime-200 p-2 rounded-lg hover:bg-lime-100 dark:hover:bg-black/40">Features</a>
//                 <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-lime-800 dark:text-lime-200 p-2 rounded-lg hover:bg-lime-100 dark:hover:bg-black/40">How it Works</a>
//                 <a href="#rewards" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold text-lime-800 dark:text-lime-200 p-2 rounded-lg hover:bg-lime-100 dark:hover:bg-black/40">Rewards</a>
//                 <hr className="border-lime-500/10" />
//                 <Link href="/login" className="text-sm font-semibold text-lime-800 dark:text-lime-200 p-2 rounded-lg hover:bg-lime-100 dark:hover:bg-black/40">Sign In</Link>
//                 <Link href="/login" className="bg-lime-600 text-center text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/20">Get Started</Link>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </nav>

//       {/* Hero Section */}
//       <main className="relative z-20 pt-32 sm:pt-40 pb-20 px-4 sm:px-6 flex-grow">
//         <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 relative">
          
//           <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="hidden lg:flex absolute -left-32 top-20 flex-col p-4 rounded-2xl bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 shadow-lg w-48 z-30">
//             <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-lime-950 dark:text-white">Increase in Trade</span></div>
//             <div className="text-2xl font-extrabold text-lime-600 dark:text-lime-400 mb-1 flex items-center gap-1">+75% <ArrowUpRight size={16} /></div>
//             <span className="text-[10px] text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider font-bold">Sell option</span>
//           </motion.div>

//           <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="hidden lg:flex absolute -right-32 bottom-32 flex-col p-4 rounded-2xl bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 shadow-lg w-48 z-30">
//             <span className="text-[10px] font-bold text-lime-600 dark:text-lime-400 uppercase tracking-wider mb-1">Est. 24h Revenue</span>
//             <div className="text-xl font-extrabold text-lime-950 dark:text-white font-mono">0.055 ETH</div>
//             <div className="text-sm font-bold text-lime-800/60 dark:text-lime-200/60">($1275)</div>
//           </motion.div>

//           <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-lime-950 dark:text-[#ecfdf5] leading-[1.1] drop-shadow-sm dark:drop-shadow-[0_0_20px_rgba(5,8,6,1)]">
//             Trade everything. <br />
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-lime-700 dark:from-lime-400 dark:to-lime-600">Zero limits.</span>
//           </motion.h1>
          
//           <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-lime-800/80 dark:text-lime-200/60 max-w-2xl mx-auto leading-relaxed font-medium px-2 sm:px-0">
//             The world's first highly gamified commodity and crypto exchange. 
//             Start with local goods like Charcoal and Bitterleaf, earn XP by completing tasks, 
//             and seamlessly unlock institutional-grade Crypto, Meme Coins, and Forex trading.
//           </motion.p>

//           <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
//             <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-lime-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-lime-700 transition-all hover:scale-105 shadow-lg shadow-lime-600/20">Start Trading <ArrowRight size={20} /></Link>
//             <a href="#markets" className="w-full sm:w-auto flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold border-2 border-lime-500/30 dark:border-lime-500/20 text-lime-950 dark:text-[#ecfdf5] hover:bg-white/50 dark:hover:bg-[#121A14]/50 backdrop-blur-sm transition-colors">Explore Markets</a>
//           </motion.div>

//           <motion.div variants={containerVariants} className="pt-10 sm:pt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto">
//             <motion.div variants={itemVariants} className="flex flex-col items-center p-4 bg-white/30 dark:bg-[#121A14]/30 backdrop-blur-sm rounded-2xl border border-lime-500/10 shadow-sm">
//               <span className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5] font-mono"><AnimatedCounter value="₦4.2B+" /></span>
//               <span className="text-xs sm:text-sm font-semibold text-lime-700/60 dark:text-lime-300/60 mt-1">Total Volume</span>
//             </motion.div>
//             <motion.div variants={itemVariants} className="flex flex-col items-center p-4 bg-white/30 dark:bg-[#121A14]/30 backdrop-blur-sm rounded-2xl border border-lime-500/10 shadow-sm">
//               <span className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5] font-mono"><AnimatedCounter value="50k+" /></span>
//               <span className="text-xs sm:text-sm font-semibold text-lime-700/60 dark:text-lime-300/60 mt-1">Active Traders</span>
//             </motion.div>
//             <motion.div variants={itemVariants} className="flex flex-col items-center p-4 bg-white/30 dark:bg-[#121A14]/30 backdrop-blur-sm rounded-2xl border border-lime-500/10 shadow-sm">
//               <span className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5] font-mono"><AnimatedCounter value="99.9%" /></span>
//               <span className="text-xs sm:text-sm font-semibold text-lime-700/60 dark:text-lime-300/60 mt-1">Uptime</span>
//             </motion.div>
//           </motion.div>
//         </motion.div>

//         {/* Grow Your Profit Section */}
//         <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} id="markets" className="max-w-6xl mx-auto mt-24 sm:mt-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
//           <div>
//             <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight mb-6 leading-tight">
//               Grow your profit and <br className="hidden sm:block"/> track your investments
//             </h2>
//             <p className="text-base text-lime-800/70 dark:text-lime-200/60 font-medium leading-relaxed mb-8 max-w-md">
//               Use advanced analytical tools. Clear TradingView charts let you track current and historical profit investments seamlessly across crypto and global fiat currencies.
//             </p>
//             <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-lime-600 text-white font-bold hover:bg-lime-700 transition-colors shadow-lg shadow-lime-600/20">Start Learning</Link>
//           </div>
          
//           <div className="relative">
//              <div className="absolute inset-0 bg-lime-400/20 blur-[80px] rounded-full"></div>
//             <div className="relative bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl">
//               <div className="flex justify-between items-center mb-6 px-2">
//                 <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider">Asset</span>
//                 <div className="flex gap-8 text-right">
//                   <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider w-20">Price</span>
//                   <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider w-16">Change</span>
//                 </div>
//               </div>
              
//               <div className="space-y-2">
//                 {[
//                   { name: 'Bitcoin', symbol: 'BTC', price: '$6,750', change: '+7.3%', up: true, color: 'bg-orange-500' },
//                   { name: 'US Dollar', symbol: 'USD', price: '₦1,450', change: '+0.1%', up: true, color: 'bg-green-600' },
//                   { name: 'Euro', symbol: 'EUR', price: '₦1,560', change: '-0.2%', up: false, color: 'bg-blue-600' },
//                   { name: 'British Pound', symbol: 'GBP', price: '₦1,820', change: '+0.4%', up: true, color: 'bg-indigo-500' },
//                   { name: 'Japanese Yen', symbol: 'JPY', price: '₦9.50', change: '-0.1%', up: false, color: 'bg-red-500' },
//                 ].map((asset, i) => (
//                   <div key={asset.symbol} className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${i === 1 ? 'bg-lime-500/10 dark:bg-lime-500/10 border border-lime-500/20' : 'hover:bg-lime-500/5'}`}>
//                     <div className="flex items-center gap-3">
//                       <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${asset.color}`}>{asset.symbol.charAt(0)}</div>
//                       <div>
//                         <div className="text-sm font-bold text-lime-950 dark:text-white">{asset.symbol}</div>
//                         <div className="text-xs text-lime-800/60 dark:text-lime-200/50">{asset.name}</div>
//                       </div>
//                     </div>
//                     <div className="flex gap-8 text-right">
//                       <span className="text-sm font-bold text-lime-950 dark:text-white w-20">{asset.price}</span>
//                       <span className={`text-sm font-bold w-16 flex items-center justify-end gap-1 ${asset.up ? 'text-green-500' : 'text-red-500'}`}>
//                         {asset.up ? <TrendingUp size={14}/> : <TrendingUp size={14} className="rotate-180"/>}
//                         {asset.change}
//                       </span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </motion.div>
//               {/* TERMINAL PREVIEW WITH CAROUSEL SLIDER */}
//         <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto mt-24 sm:mt-32">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl sm:text-4xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight mb-4">Your personal command center</h2>
//             <p className="text-base text-lime-800/70 dark:text-lime-200/60 font-medium max-w-2xl mx-auto">
//               Experience lightning-fast execution, deep liquidity, and advanced charting tools in a beautifully crafted interface.
//             </p>
//           </div>

//           <div className="relative rounded-3xl overflow-hidden border border-lime-500/20 dark:border-lime-500/10 bg-white/60 dark:bg-[#0a0f0b]/80 backdrop-blur-xl shadow-2xl flex flex-col">
//             {/* Terminal Top Bar */}
//             <div className="flex items-center justify-between px-4 py-3 border-b border-lime-500/10 bg-white/40 dark:bg-black/40">
//               <div className="flex items-center gap-4">
//                 <div className="flex items-center gap-2">
//                   <span className="font-bold text-lime-950 dark:text-white">BTC/USD</span>
//                   <span className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-0.5 rounded">+2.74%</span>
//                 </div>
//                 <div className="hidden sm:flex gap-4 text-xs font-mono text-lime-800/60 dark:text-lime-200/50">
//                   <span>High: $1,531.80</span>
//                   <span>Low: $1,461.20</span>
//                 </div>
//               </div>
//               <div className="flex gap-2">
//                 <button className="px-4 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-600 text-black text-xs font-bold transition-colors">Buy</button>
//                 <button className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors">Sell</button>
//               </div>
//             </div>

//             <div className="flex h-[350px] sm:h-[450px]">
//               {/* Slider Sidebar Tabs */}
//               <div className="hidden md:flex flex-col w-48 border-r border-lime-500/10 bg-white/20 dark:bg-black/20 p-4 space-y-2">
//                 {tabs.map((item) => (
//                   <button 
//                     key={item} 
//                     onClick={() => handleTabClick(item)}
//                     className={`text-sm font-semibold flex items-center gap-2 p-3 rounded-xl transition-all duration-300 ${activeTab === item ? 'text-lime-600 dark:text-lime-400 bg-lime-500/10 shadow-sm border border-lime-500/20' : 'text-lime-800/50 dark:text-lime-200/40 hover:bg-lime-500/5'}`}
//                   >
//                     <div className={`w-1.5 h-1.5 rounded-full transition-colors ${activeTab === item ? 'bg-lime-500' : 'bg-transparent'}`}></div>
//                     {item}
//                   </button>
//                 ))}
//               </div>

//               {/* Slider Content Area */}
//               <div className="flex-1 relative overflow-hidden flex flex-col bg-[#f4fbf5] dark:bg-[#0a0f0b]">
                
//                 {/* Text Indicator */}
//                 <div className="px-6 pt-4 flex items-center justify-between border-b border-lime-500/10 pb-2">
//                   <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider">{activeTab} View</h3>
//                   <div className="flex items-center gap-2">
//                     {isAutoPlayPaused ? (
//                       <span className="text-[10px] text-lime-600 dark:text-lime-400 font-mono uppercase">Paused</span>
//                     ) : (
//                       <span className="flex items-center gap-1.5 text-[10px] text-lime-800/50 dark:text-lime-200/40 font-mono uppercase">
//                         Auto-playing <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></span>
//                       </span>
//                     )}
//                   </div>
//                 </div>

//                 {/* Animated Slider Viewport */}
//                 <div className="flex-1 relative">
//                   <AnimatePresence mode="wait">
//                     <motion.div
//                       key={activeTab}
//                       initial={{ opacity: 0, x: 20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       exit={{ opacity: 0, x: -20 }}
//                       transition={{ duration: 0.3, ease: "easeInOut" }}
//                       className="absolute inset-0 p-6 flex flex-col"
//                     >
//                       {/* Dynamic Content based on active tab */}
//                       {activeTab === 'Spot' && (
//                         <div className="flex-1 relative flex flex-col">
//                           <div className="absolute right-0 top-0 bottom-8 flex flex-col justify-between text-[10px] font-mono text-lime-800/40 dark:text-lime-200/30">
//                             <span>$1600</span><span>$1550</span><span>$1500</span><span>$1450</span><span>$1400</span>
//                           </div>
//                           <div className="flex-1 flex items-end justify-around pb-4 pr-10 gap-1 sm:gap-2">
//                             {[
//                               { h: 'h-20', b: 'bg-red-500', y: 'mb-10' }, { h: 'h-32', b: 'bg-green-500', y: 'mb-5' },
//                               { h: 'h-24', b: 'bg-red-500', y: 'mb-12' }, { h: 'h-40', b: 'bg-green-500', y: 'mb-2' },
//                               { h: 'h-28', b: 'bg-green-500', y: 'mb-8' }, { h: 'h-16', b: 'bg-red-500', y: 'mb-16' },
//                               { h: 'h-48', b: 'bg-green-500', y: 'mb-0' }, { h: 'h-24', b: 'bg-red-500', y: 'mb-10' },
//                               { h: 'h-36', b: 'bg-green-500', y: 'mb-4' }, { h: 'h-20', b: 'bg-red-500', y: 'mb-14' },
//                               { h: 'h-28', b: 'bg-green-500', y: 'mb-8' }, { h: 'h-44', b: 'bg-green-500', y: 'mb-2' },
//                             ].map((candle, i) => (
//                               <div key={i} className={`relative w-2 sm:w-4 flex flex-col items-center justify-between ${candle.y}`}>
//                                 <div className={`w-px h-6 ${candle.b} opacity-50`}></div>
//                                 <div className={`w-full ${candle.h} ${candle.b} rounded-sm opacity-80`}></div>
//                                 <div className={`w-px h-6 ${candle.b} opacity-50`}></div>
//                               </div>
//                             ))}
//                           </div>
//                           <div className="flex justify-between text-[10px] font-mono text-lime-800/40 dark:text-lime-200/30 pr-10 border-t border-lime-500/10 pt-2">
//                             <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
//                           </div>
//                         </div>
//                       )}

//                       {activeTab === 'Markets' && (
//                         <div className="flex-1 flex flex-col justify-center gap-4">
//                           {['BTC / USD', 'ETH / USD', 'SOL / USD'].map((pair, i) => (
//                              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-lime-500/20 bg-lime-500/5">
//                                 <div className="flex items-center gap-3">
//                                   <div className="w-8 h-8 rounded-full bg-lime-500/20 flex items-center justify-center text-lime-600 font-bold text-xs">{pair.split(' ')[0]}</div>
//                                   <span className="font-bold text-lime-950 dark:text-white text-sm">{pair}</span>
//                                 </div>
//                                 <div className="flex gap-6 text-sm font-mono">
//                                    <span className="text-lime-950 dark:text-white">$64,230</span>
//                                    <span className="text-green-500">+2.4%</span>
//                                 </div>
//                              </div>
//                           ))}
//                         </div>
//                       )}

//                       {activeTab === 'Futures' && (
//                         <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
//                           <div className="p-4 rounded-xl border border-lime-500/20 bg-lime-500/5 w-full max-w-sm">
//                             <span className="text-sm text-lime-800/60 dark:text-lime-200/60 block mb-2">Leverage</span>
//                             <div className="flex items-center justify-between">
//                               <span className="font-bold text-lime-950 dark:text-white">Long 10x</span>
//                               <input type="range" className="w-32 accent-lime-500" />
//                               <span className="font-bold text-lime-950 dark:text-white">Short 10x</span>
//                             </div>
//                           </div>
//                           <p className="text-sm text-lime-800/60 dark:text-lime-200/50">Advanced derivatives trading coming soon.</p>
//                         </div>
//                       )}

//                       {activeTab === 'Earn' && (
//                         <div className="flex-1 flex flex-col justify-center items-center text-center">
//                            <div className="w-16 h-16 rounded-full bg-lime-500/20 flex items-center justify-center mb-4 text-lime-600">
//                              <Percent size={32} />
//                            </div>
//                            <h4 className="text-lg font-bold text-lime-950 dark:text-white mb-2">Stake & Earn</h4>
//                            <p className="text-sm text-lime-800/60 dark:text-lime-200/50 max-w-xs">Stake your crypto assets to earn up to 12% APY. Unlock staking by reaching Tier 2.</p>
//                         </div>
//                       )}

//                       {activeTab === 'Wallet' && (
//                         <div className="flex-1 flex flex-col justify-center space-y-4">
//                           <div className="p-4 rounded-xl border border-lime-500/20 bg-lime-500/5 flex justify-between items-center">
//                             <div>
//                               <span className="text-xs text-lime-800/50 uppercase block">Total Balance</span>
//                               <span className="text-2xl font-bold font-mono text-lime-950 dark:text-white">$14,230.50</span>
//                             </div>
//                             <button className="bg-lime-500 text-black px-4 py-2 rounded-lg text-xs font-bold">Deposit</button>
//                           </div>
//                           <div className="text-xs text-lime-800/60 dark:text-lime-200/50 text-center">Secure wallet powered by double-entry ledger.</div>
//                         </div>
//                       )}
//                     </motion.div>
//                   </AnimatePresence>
//                 </div>

//               </div>
//             </div>
//           </div>
//         </motion.div>

//         {/* Global Stats Section */}
//         <motion.div 
//           variants={containerVariants} 
//           initial="hidden" 
//           whileInView="visible" 
//           viewport={{ once: true }} 
//           className="max-w-4xl mx-auto mt-24 justify-between sm:mt-32 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 place-items-center"
//         >
//           <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
//             <div className="w-14 h-14 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center mb-6 text-lime-600 dark:text-lime-400 shadow-sm border border-lime-500/10">
//               <LineChart size={28} />
//             </div>
//             <h3 className="text-4xl md:text-5xl font-extrabold text-lime-950 dark:text-white mb-2 font-mono">
//               <AnimatedCounter value="$30B" />
//             </h3>
//             <p className="text-sm md:text-base font-semibold text-lime-800/60 dark:text-lime-200/50">
//               Digital Currency Exchanged
//             </p>
//           </motion.div>
          
//           <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
//             <div className="w-14 h-14 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center mb-6 text-lime-600 dark:text-lime-400 shadow-sm border border-lime-500/10">
//               <Users size={28} />
//             </div>
//             <h3 className="text-4xl md:text-5xl font-extrabold text-lime-950 dark:text-white mb-2 font-mono">
//               <AnimatedCounter value="10M+" />
//             </h3>
//             <p className="text-sm md:text-base font-semibold text-lime-800/60 dark:text-lime-200/50">
//               Trusted Wallets Investor
//             </p>
//           </motion.div>
          
//           <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
//             <div className="w-14 h-14 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center mb-6 text-lime-600 dark:text-lime-400 shadow-sm border border-lime-500/10">
//               <Globe size={28} />
//             </div>
//             <h3 className="text-4xl md:text-5xl font-extrabold text-lime-950 dark:text-white mb-2 font-mono">
//               <AnimatedCounter value="195" />
//             </h3>
//             <p className="text-sm md:text-base font-semibold text-lime-800/60 dark:text-lime-200/50">
//               Countries Supported
//             </p>
//           </motion.div>
//         </motion.div>

//         {/* Feature Grid */}
//         <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} id="features" className="max-w-6xl mx-auto mt-24 sm:mt-32 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
//           <FeatureCard icon={<Zap className="text-lime-600 dark:text-lime-400" size={24} />} title="Gamified Progression" description="Complete daily tasks, verify your identity, and earn XP to automatically upgrade your trading tier and unlock new asset classes." bgClass="bg-lime-100 dark:bg-lime-900/30" />
//           <FeatureCard icon={<TrendingUp className="text-green-600 dark:text-green-400" size={24} />} title="Double-Entry Ledger" description="Institutional-grade financial architecture. Every single trade is cryptographically audited, balanced to zero, and instantly settled." bgClass="bg-green-100 dark:bg-green-900/30" />
//           <FeatureCard icon={<Fingerprint className="text-emerald-600 dark:text-emerald-400" size={24} />} title="Biometric Security" description="Log in seamlessly with FaceID, TouchID, or Windows Hello. Your private keys never leave your device thanks to WebAuthn." bgClass="bg-emerald-100 dark:bg-emerald-900/30" />
//         </motion.div>

//         {/* How It Works */}
//         <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} id="how-it-works" className="max-w-4xl mx-auto mt-24 sm:mt-32">
//           <motion.div variants={itemVariants} className="text-center mb-10 sm:mb-12">
//             <h2 className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5]">How It Works</h2>
//             <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 mt-2">Start trading in three simple steps.</p>
//           </motion.div>
//           <div className="space-y-4 sm:space-y-6">
//             <StepCard num="1" title="Create Your Account" desc="Sign up with Email, Google, or a Passkey. You start at Tier 1 with access to local commodities." />
//             <StepCard num="2" title="Complete Tasks & Earn XP" desc="Make your first trade, invite friends, and complete your profile to earn XP and level up your account." />
//             <StepCard num="3" title="Unlock Global Markets" desc="Reach Tier 2 to unlock Crypto and Meme coins. Reach Tier 3 to unlock Forex and institutional trading limits." />
//           </div>
//         </motion.div>

//         {/* Newsletter Banner */}
//         <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto mt-24 sm:mt-32 bg-lime-600 rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-lime-600/20">
//           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
//           <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
//           <div className="relative z-10 max-w-md text-center md:text-left">
//             <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">Start mining now</h2>
//             <p className="text-sm sm:text-base text-lime-50 font-medium">Join now with Quantix Solaris to get the latest news and start mining now.</p>
//           </div>
//           <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3">
//             <input type="email" placeholder="Enter your email" className="w-full sm:w-64 bg-transparent border-b-2 border-white/50 text-white placeholder-white/60 px-2 py-2 focus:outline-none focus:border-white transition-colors" />
//             <button className="bg-white text-lime-950 px-8 py-2.5 rounded-xl font-bold hover:bg-lime-50 transition-colors shadow-lg">Subscribe</button>
//           </div>
//         </motion.div>

//         {/* Final CTA */}
//         <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }} className="max-w-4xl mx-auto mt-24 sm:mt-32 text-center bg-lime-600/10 dark:bg-lime-900/20 border border-lime-500/30 rounded-3xl p-8 sm:p-12 backdrop-blur-md shadow-2xl">
//           <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-lime-950 dark:text-[#ecfdf5] mb-4">Ready to upgrade your trading?</h2>
//           <p className="text-sm sm:text-base text-lime-800/80 dark:text-lime-200/60 mb-6 sm:mb-8 max-w-xl mx-auto">Join thousands of traders utilizing our double-entry ledger and gamified rewards system.</p>
//           <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-lime-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/30 hover:scale-105">Create Free Account <ArrowRight size={20} /></Link>
//         </motion.div>
//       </main>

//       {/* FOOTER */}
//       <footer className="relative z-20 border-t border-lime-500/20 dark:border-lime-500/10 bg-white/40 dark:bg-[#050806]/80 backdrop-blur-xl pt-12 pb-8 mt-auto">
//         <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto px-4 sm:px-6">
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
//             <div className="space-y-4">
//               <Logo />
//               <p className="text-xs text-lime-800/70 dark:text-lime-200/50 font-medium leading-relaxed max-w-xs mb-4">The world's first highly gamified commodity and crypto exchange. Trade local goods, crypto, and forex seamlessly.</p>
//               <div className="flex gap-4">
//                 <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="facebook" /></a>
//                 <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="instagram" /></a>
//                 <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="youtube" /></a>
//                 <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="twitter" /></a>
//                 <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="linkedin" /></a>
//               </div>
//             </div>
//             <div>
//               <h4 className="text-xs font-bold text-lime-950 dark:text-[#ecfdf5] uppercase tracking-wider mb-4">Product</h4>
//               <ul className="space-y-3">
//                 <li><a href="#markets" className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Markets</a></li>
//                 <li><a href="#features" className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Features</a></li>
//                 <li><a href="#how-it-works" className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">How it Works</a></li>
//                 <li><Link href="/login" className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Launch App</Link></li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="text-xs font-bold text-lime-950 dark:text-[#ecfdf5] uppercase tracking-wider mb-4">Legal</h4>
//               <ul className="space-y-3">
//                 <li><button onClick={() => openModal("Privacy Policy")} className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors cursor-pointer text-left">Privacy Policy</button></li>
//                 <li><button onClick={() => openModal("Terms of Service")} className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors cursor-pointer text-left">Terms of Service</button></li>
//                 <li><button onClick={() => openModal("Risk Disclosure")} className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors cursor-pointer text-left">Risk Disclosure</button></li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="text-xs font-bold text-lime-950 dark:text-[#ecfdf5] uppercase tracking-wider mb-4">Accepted Payments</h4>
//               <div className="flex flex-wrap gap-4 items-center">
//                 {paymentMethods.map((method) => (
//                   <button key={method} onClick={() => router.push('/payment')} className="relative group flex items-center justify-center p-1 cursor-pointer transition-transform hover:scale-110">
//                     <PaymentIcon name={method} />
//                     <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-[#121A14] text-white text-[10px] font-mono rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-lime-500/20">{method}</span>
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//           <div className="pt-8 border-t border-lime-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
//             <p className="text-xs text-lime-800/50 dark:text-lime-200/40 font-medium">© 2026 Quantix Solaris Exchange. All rights reserved.</p>
//             <div className="flex items-center gap-4 text-xs font-medium text-lime-800/50 dark:text-lime-200/40">
//               <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></span> All Systems Operational</span>
//             </div>
//           </div>
//         </motion.div>
//       </footer>
//     </div>
//   );
// }

// function FeatureCard({ icon, title, description, bgClass }: { icon: React.ReactNode, title: string, description: string, bgClass: string }) {
//   return (
//     <motion.div variants={itemVariants} whileHover="hover" initial="initial" className="relative z-20">
//       <motion.div variants={cardHoverVariants} className="p-6 sm:p-8 h-full rounded-3xl bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 dark:border-lime-500/10 hover:border-lime-500/50 dark:hover:border-lime-500/30 transition-colors duration-300 shadow-[0_8px_32px_0_rgba(132,204,22,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] group">
//         <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 ${bgClass} transition-transform duration-300`}>
//           {icon}
//         </motion.div>
//         <h3 className="text-lg sm:text-xl font-bold text-lime-950 dark:text-[#ecfdf5] mb-2 sm:mb-3">{title}</h3>
//         <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 leading-relaxed font-medium">{description}</p>
//       </motion.div>
//     </motion.div>
//   );
// }

// function StepCard({ num, title, desc }: { num: string, title: string, desc: string }) {
//   return (
//     <motion.div variants={itemVariants} whileHover={{ x: 8 }} transition={{ type: "spring", stiffness: 300 }} className="flex items-start gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl bg-white/40 dark:bg-[#0a0f0b]/40 backdrop-blur-md border border-lime-500/10 relative z-20 cursor-default">
//       <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-lime-600 text-white font-bold text-lg sm:text-xl flex items-center justify-center shrink-0 shadow-lg shadow-lime-600/30">{num}</div>
//       <div>
//         <h4 className="text-lg sm:text-xl font-bold text-lime-950 dark:text-[#ecfdf5] mb-1 sm:mb-2">{title}</h4>
//         <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 font-medium leading-relaxed">{desc}</p>
//       </div>
//     </motion.div>
//   );
// }