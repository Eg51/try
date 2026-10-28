"use client";

import "./globals.css";
import Link from "next/link";
import { containerVariants, itemVariants } from "@/lib/animations";
import dynamic from "next/dynamic";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ArrowRight, Sun, Moon, Menu, X, Zap, Globe, LineChart, TrendingUp } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

// --- LAZY LOADED SECTIONS ---
const LoadingSkeleton = () => <div className="h-96 w-full animate-pulse bg-lime-500/5 rounded-3xl my-12 max-w-6xl mx-auto" />;

const MarketsSection = dynamic(() => import("@/components/sections/MarketsSection"), { loading: LoadingSkeleton });
const TerminalSection = dynamic(() => import("@/components/sections/TerminalSection"), { loading: LoadingSkeleton });
const GlobalStatsSection = dynamic(() => import("@/components/sections/GlobalStatsSection"), { loading: LoadingSkeleton });
const FeatureGrid = dynamic(() => import("@/components/sections/FeatureGrid"), { loading: LoadingSkeleton });
const FooterSection = dynamic(() => import("@/components/sections/FooterSection"), { loading: LoadingSkeleton });

const WATERMARK_SYMBOLS = [
  "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$", "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "₤", "₦", "₱", "₲", "₵", "₡", "₸",
  "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦",
  "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎", "🙌", "🔥", "🚀", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵", "💴", "💶", "💷", "🪙"
];

const MarqueeRow = ({ direction, speed, symbols }: { direction: 'left' | 'right', speed: number, symbols: string[] }) => {
  return (
    <div className="flex overflow-hidden w-full relative py-3 md:py-5 pointer-events-none">
      <div 
        className={`flex gap-6 md:gap-12 whitespace-nowrap w-max ${direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}`}
        style={{ animationDuration: `${speed * 1.5}s` }} // Slower marquee movement
      >
        {[...symbols, ...symbols].map((symbol, i) => {
          // Completely random gas-like drifting
          const randomY = (Math.random() - 0.5) * 50; 
          const randomX = (Math.random() - 0.5) * 30;
          const randomRotate = (Math.random() - 0.5) * 40;
          const randomDuration = 4 + Math.random() * 6; // Slower, varied motion
          const randomDelay = Math.random() * 3;

          return (
            <m.div 
              key={i} 
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-lime-900/60 dark:text-lime-500/40 select-none opacity-60"
              animate={{ 
                y: [0, randomY, 0, -randomY, 0],
                x: [0, randomX, 0, -randomX, 0],
                rotate: [0, randomRotate, 0, -randomRotate, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: randomDuration, 
                ease: "easeInOut",
                delay: randomDelay
              }}
            >
              {symbol}
            </m.div>
          );
        })}
      </div>
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

        {/* NAVIGATION */}
        <nav className="fixed top-0 w-full border-b border-lime-500/20 dark:border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
            <Logo />
            <div className="hidden md:flex items-center gap-8">
              <a href="#markets" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600">Markets</a>
              <a href="#features" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600">Features</a>
              <a href="#how-it-works" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600">How it Works</a>
              <a href="#rewards" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600">Rewards</a>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-white/40 dark:bg-black/40 border border-lime-500/20 text-lime-800 dark:text-lime-200">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <Link href="/login" className="hidden sm:block text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600">
                Sign In
              </Link>
              <Link href="/login" className="hidden sm:block bg-lime-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-lime-600/20 hover:bg-lime-700 transition-all">
                Get Started
              </Link>
              
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-full bg-white/40 dark:bg-black/40 border border-lime-500/20 text-lime-800 dark:text-lime-200">
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* MOBILE MENU */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="fixed min-h-screen inset-0 z-40 bg-[#f0fdf4]/95 dark:bg-[#050806]/95 backdrop-blur-[200px] md:hidden"
                />

                <m.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed top-24 right-4 left-4 z-[70] md:hidden flex flex-col gap-3"
                >
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
        </nav>

        {/* HERO SECTION */}
        <main className="relative z-20 pt-32 sm:pt-40 pb-20 px-4 sm:px-6 flex-grow">
          <m.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto text-center space-y-8 relative">
            <m.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-lime-950 dark:text-[#ecfdf5]">
              Trade everything. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-lime-700 dark:from-lime-400 dark:to-lime-600">Zero limits.</span>
            </m.h1>
            
            <m.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-lime-800/80 dark:text-lime-200/60 max-w-2xl mx-auto">
              The world's first highly gamified commodity and crypto exchange. Start with local goods, earn XP, and unlock institutional-grade Crypto, Meme Coins, and Forex.
            </m.p>

            <m.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="flex items-center justify-center gap-2 bg-lime-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-lime-700 shadow-xl shadow-lime-600/20">
                Start Trading <ArrowRight size={20} />
              </Link>
              <a href="#markets" className="flex items-center justify-center px-8 py-4 rounded-xl text-lg font-bold border-2 border-lime-500/30 text-lime-950 dark:text-[#ecfdf5] hover:bg-white/50">
                Explore Markets
              </a>
            </m.div>
          </m.div>

          {/* DYNAMIC SECTIONS */}
          <MarketsSection />
          <TerminalSection />
          <GlobalStatsSection />
          <FeatureGrid />
        </main>

        <FooterSection />
      </div>
    </LazyMotion>
  );
}