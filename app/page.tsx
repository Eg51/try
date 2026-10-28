// "use client";

// import "./globals.css";
// import Link from "next/link";
// import { containerVariants, itemVariants } from "@/lib/animations";
// import dynamic from "next/dynamic";
// import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
// import { useTheme } from "next-themes";
// import { useEffect, useState } from "react";
// import { ArrowRight, Sun, Moon, Menu, X, Fingerprint, Mail, Lock, User, Sparkles, ShieldCheck } from "lucide-react";
// import { Logo } from "@/components/ui/Logo";

// // --- LAZY LOADED SECTIONS ---
// const LoadingSkeleton = () => <div className="h-96 w-full animate-pulse bg-lime-500/5 rounded-3xl my-12 max-w-6xl mx-auto" />;

// const MarketsSection = dynamic(() => import("@/components/sections/MarketsSection"), { loading: LoadingSkeleton });
// const TerminalSection = dynamic(() => import("@/components/sections/TerminalSection"), { loading: LoadingSkeleton });
// const GlobalStatsSection = dynamic(() => import("@/components/sections/GlobalStatsSection"), { loading: LoadingSkeleton });
// const FeatureGrid = dynamic(() => import("@/components/sections/FeatureGrid"), { loading: LoadingSkeleton });
// const FooterSection = dynamic(() => import("@/components/sections/FooterSection"), { loading: LoadingSkeleton });

// // Local Watermarks
// const WATERMARK_SYMBOLS = [
//   "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿",
//   "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ"
// ];

// // const MarqueeRow = ({ direction, speed, symbols }: { direction: 'left' | 'right', speed: number, symbols: string[] }) => {
// //   return (
// //     <div className="flex overflow-hidden w-full relative py-1 md:py-2 pointer-events-none">
// //       <m.div className="flex gap-6 md:gap-12 whitespace-nowrap w-max" animate={{ x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'] }} transition={{ repeat: Infinity, ease: 'linear', duration: speed }}>
// //         {[...symbols, ...symbols].map((symbol, i) => (
// //           <m.div 
// //             key={i} 
// //             className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-lime-900/20 dark:text-lime-600/30 select-none grayscale opacity-30" 
// //             animate={{ y: [0, -15, 0, 15, 0], rotate: [0, 10, 0, -10, 0] }} 
// //             transition={{ repeat: Infinity, duration: 5 + (i % 4), ease: 'easeInOut', delay: i * 0.2 }}
// //           >
// //             {symbol}
// //           </m.div>
// //         ))}
// //       </m.div>
// //     </div>
// //   );
// // };
// const MarqueeRow = ({ direction, speed, symbols }: { direction: 'left' | 'right', speed: number, symbols: string[] }) => {
//   return (
//     <div className="flex overflow-hidden w-full relative py-1 md:py-2 pointer-events-none">
//       {/* The row now uses CSS classes instead of Framer Motion */}
//       <div 
//         className={`flex gap-6 md:gap-12 whitespace-nowrap w-max ${direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}`}
//         style={{ animationDuration: `${speed}s` }}
//       >
//         {[...symbols, ...symbols].map((symbol, i) => (
//           // We removed the <m.div> and its `animate` prop entirely. 
//           // It's now a simple static <div>. Much faster.
//           <div 
//             key={i} 
//             className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-lime-900/20 dark:text-lime-600/30 select-none grayscale opacity-30"
//           >
//             {symbol}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
// export default function LandingPage() {
//   const { theme, setTheme } = useTheme();
//   const [mounted, setMounted] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
//   // Modal State
//   const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
//   const [modalMode, setModalMode] = useState<"login" | "signup">("login");

//   useEffect(() => setMounted(true), []);
//   if (!mounted) return null;

//   return (
//     <LazyMotion features={domAnimation}>
//       <div className="flex-1 w-full flex flex-col font-sans bg-[#f0fdf4] dark:bg-[#050806] relative transition-colors duration-300 overflow-hidden">
        
//         {/* BACKGROUND WATERMARKS */}
//         <div className="absolute inset-0 w-full overflow-hidden pointer-events-none select-none z-0 flex flex-col justify-around">
//           {Array.from({ length: 30 }).map((_, i) => (
//             <MarqueeRow key={i} direction={i % 2 === 0 ? "left" : "right"} speed={40 + (i % 5) * 15} symbols={i % 3 === 0 ? [...WATERMARK_SYMBOLS].reverse() : WATERMARK_SYMBOLS} />
//           ))}
//           <div className="absolute inset-0 z-10 bg-[#f0fdf4] dark:bg-[#050806] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]"></div>
//         </div>

//         {/* Background Aurora Glows */}
//         <div className="absolute top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
//         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

//         {/* NAVIGATION */}
//         <nav className="fixed top-0 w-full border-b border-lime-500/20 dark:border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md z-50">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
//             <Logo />
//             <div className="hidden md:flex items-center gap-8">
//               <a href="#markets" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600">Markets</a>
//               <a href="#features" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600">Features</a>
//               <a href="#how-it-works" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600">How it Works</a>
//             </div>
//             <div className="flex items-center gap-2 sm:gap-4">
//               <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-white/40 dark:bg-black/40 border border-lime-500/20 text-lime-800 dark:text-lime-200">
//                 {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
//               </button>
//               <button onClick={() => { setModalMode("login"); setIsAuthModalOpen(true); }} className="hidden sm:block text-sm font-semibold text-lime-800 dark:text-lime-200">Sign In</button>
//               <button onClick={() => { setModalMode("signup"); setIsAuthModalOpen(true); }} className="hidden sm:block bg-lime-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-lime-600/20">Get Started</button>
//               <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-full bg-white/40 dark:bg-black/40 border border-lime-500/20 text-lime-800 dark:text-lime-200">
//                 {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
//               </button>
//             </div>
//           </div>
//         </nav>

//         {/* HERO SECTION */}
//         <main className="relative z-20 pt-32 sm:pt-40 pb-20 px-4 sm:px-6 flex-grow">
//           <m.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto text-center space-y-8 relative">
//             <m.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-lime-950 dark:text-[#ecfdf5]">
//               Trade everything. <br />
//               <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-lime-700 dark:from-lime-400 dark:to-lime-600">Zero limits.</span>
//             </m.h1>
            
//             <m.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-lime-800/80 dark:text-lime-200/60 max-w-2xl mx-auto">
//               The world's first highly gamified commodity and crypto exchange. Start with local goods, earn XP, and unlock institutional-grade Crypto, Meme Coins, and Forex.
//             </m.p>

//             <m.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
//               <button onClick={() => { setModalMode("signup"); setIsAuthModalOpen(true); }} className="flex items-center justify-center gap-2 bg-lime-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-lime-700 shadow-xl shadow-lime-600/20">Start Trading <ArrowRight size={20} /></button>
//               <a href="#markets" className="flex items-center justify-center px-8 py-4 rounded-xl text-lg font-bold border-2 border-lime-500/30 text-lime-950 dark:text-[#ecfdf5] hover:bg-white/50">Explore Markets</a>
//             </m.div>
//           </m.div>

//           {/* DYNAMIC SECTIONS */}
//           <MarketsSection />
//           <TerminalSection />
//           <GlobalStatsSection />
//           <FeatureGrid />
//         </main>

//         <FooterSection />
//       </div>

//       {/* THE DETAILED ANIMATED AUTH MODAL */}
//       <AnimatePresence>
//         {isAuthModalOpen && (
//           <>
//             {/* 1. Backdrop */}
//             <m.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               onClick={() => setIsAuthModalOpen(false)}
//               className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
//             />

//             {/* 2. The Animated Container */}
//             <m.div
//               initial={{ y: "100%", opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               exit={{ y: "100%", opacity: 0 }}
//               transition={{ type: "spring", damping: 25, stiffness: 200 }}
//               className="fixed bottom-0 sm:bottom-auto sm:top-1/2 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[110] w-full sm:w-[440px] bg-[#f4fbf5] dark:bg-[#0a0f0b] sm:rounded-3xl rounded-t-3xl border border-lime-500/20 dark:border-lime-500/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto"
//             >
//               {/* Header */}
//               <div className="sticky top-0 z-20 flex items-center justify-between p-6 pb-4 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-md border-b border-lime-500/10">
//                 <Logo iconOnly />
//                 <button onClick={() => setIsAuthModalOpen(false)} className="p-2 rounded-full bg-lime-100 dark:bg-white/5 text-lime-700 dark:text-lime-300 hover:bg-lime-200 dark:hover:bg-white/10 transition-colors">
//                   <X size={20} />
//                 </button>
//               </div>

//               <div className="p-6 pt-4">
//                 {/* Trust Badges */}
//                 <div className="flex items-center justify-center gap-4 mb-6">
//                   <div className="flex items-center gap-1.5 text-xs font-bold text-lime-700/60 dark:text-lime-300/60">
//                     <ShieldCheck size={14} className="text-lime-500" /> Bank-Grade Security
//                   </div>
//                   <div className="flex items-center gap-1.5 text-xs font-bold text-lime-700/60 dark:text-lime-300/60">
//                     <Sparkles size={14} className="text-amber-500" /> Trusted by 50k+
//                   </div>
//                 </div>

//                 {/* Title & Subtitle */}
//                 <div className="text-center mb-6">
//                   <h2 className="text-2xl font-extrabold text-lime-950 dark:text-white mb-1">
//                     {modalMode === "login" ? "Welcome Back" : "Create Account"}
//                   </h2>
//                   <p className="text-sm text-lime-800/70 dark:text-lime-200/60 font-medium">
//                     {modalMode === "login" ? "Enter your details to access your dashboard." : "Join the premier gamified exchange."}
//                   </p>
//                 </div>

//                 {/* Mode Toggle */}
//                 <div className="flex p-1 mb-6 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner relative">
//                   <m.div 
//                     className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#121A14] rounded-full shadow-md" 
//                     animate={{ x: modalMode === "login" ? 0 : "100%" }} 
//                     transition={{ type: "spring", stiffness: 300, damping: 30 }} 
//                   />
//                   <button 
//                     onClick={() => setModalMode("login")} 
//                     className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${modalMode === "login" ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}
//                   >
//                     Log In
//                   </button>
//                   <button 
//                     onClick={() => setModalMode("signup")} 
//                     className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${modalMode === "signup" ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}
//                   >
//                     Sign Up
//                   </button>
//                 </div>

//                 {/* Social Auth Buttons */}
//                 <div className="grid grid-cols-2 gap-3 mb-6">
//                   <button className="flex items-center justify-center gap-2 bg-white dark:bg-[#121A14] border border-lime-500/30 hover:bg-lime-50 dark:hover:bg-white/5 text-lime-950 dark:text-white font-semibold rounded-xl h-11 transition-all">
//                     <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
//                     Google
//                   </button>
//                   <button className="flex items-center justify-center gap-2 bg-white dark:bg-[#121A14] border border-lime-500/30 hover:bg-lime-50 dark:hover:bg-white/5 text-lime-950 dark:text-white font-semibold rounded-xl h-11 transition-all">
//                     <Fingerprint size={18} className="text-lime-600 dark:text-lime-400" />
//                     Passkey
//                   </button>
//                 </div>

//                 <div className="relative flex items-center mb-6">
//                   <div className="flex-grow border-t border-lime-500/20"></div>
//                   <span className="flex-shrink-0 mx-4 text-lime-700/60 dark:text-lime-300/60 text-[10px] font-bold uppercase tracking-wider">Or continue with email</span>
//                   <div className="flex-grow border-t border-lime-500/20"></div>
//                 </div>

//                 {/* Email Form */}
//                 <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
//                   {modalMode === "signup" && (
//                     <div>
//                       <label className="block text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase mb-1.5 ml-1">Full Name</label>
//                       <div className="relative">
//                         <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50" />
//                         <input type="text" placeholder="John Doe" className="w-full bg-white/60 dark:bg-black/30 border border-lime-500/30 dark:border-lime-500/20 rounded-xl pl-10 pr-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors" />
//                       </div>
//                     </div>
//                   )}
                  
//                   <div>
//                     <label className="block text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase mb-1.5 ml-1">Email Address</label>
//                     <div className="relative">
//                       <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50" />
//                       <input type="email" placeholder="you@example.com" className="w-full bg-white/60 dark:bg-black/30 border border-lime-500/30 dark:border-lime-500/20 rounded-xl pl-10 pr-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors" />
//                     </div>
//                   </div>

//                   <div>
//                     <div className="flex justify-between items-center mb-1.5 ml-1">
//                       <label className="block text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Password</label>
//                       {modalMode === "login" && (
//                         <a href="#" className="text-[10px] font-bold text-lime-600 dark:text-lime-400 hover:underline">Forgot?</a>
//                       )}
//                     </div>
//                     <div className="relative">
//                       <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50" />
//                       <input type="password" placeholder="••••••••" className="w-full bg-white/60 dark:bg-black/30 border border-lime-500/30 dark:border-lime-500/20 rounded-xl pl-10 pr-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors" />
//                     </div>
//                   </div>

//                   <button type="submit" className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-lime-600/20 transition-all mt-6">
//                     {modalMode === "login" ? "Log In" : "Create Account"}
//                   </button>
//                 </form>

//                 {/* Demo Link */}
//                 <div className="mt-6 text-center">
//                   <p className="text-xs text-lime-800/60 dark:text-lime-200/50">
//                     Just exploring?{" "}
//                     <Link href="/demo" className="font-bold text-lime-600 dark:text-lime-400 hover:underline">
//                       Try the Demo
//                     </Link>
//                   </p>
//                 </div>
//               </div>
//             </m.div>
//           </>
//         )}
//       </AnimatePresence>
//     </LazyMotion>
//   );
// }

"use client";

import "./globals.css";
import Link from "next/link";
import { containerVariants, itemVariants } from "@/lib/animations";
import dynamic from "next/dynamic";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ArrowRight, Sun, Moon, Menu, X, LogIn, UserPlus, Lock, Zap, Globe, LineChart, TrendingUp, Fingerprint, Mail, User, Sparkles, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

// --- LAZY LOADED SECTIONS ---
const LoadingSkeleton = () => <div className="h-96 w-full animate-pulse bg-lime-500/5 rounded-3xl my-12 max-w-6xl mx-auto" />;

const MarketsSection = dynamic(() => import("@/components/sections/MarketsSection"), { loading: LoadingSkeleton });
const TerminalSection = dynamic(() => import("@/components/sections/TerminalSection"), { loading: LoadingSkeleton });
const GlobalStatsSection = dynamic(() => import("@/components/sections/GlobalStatsSection"), { loading: LoadingSkeleton });
const FeatureGrid = dynamic(() => import("@/components/sections/FeatureGrid"), { loading: LoadingSkeleton });
const FooterSection = dynamic(() => import("@/components/sections/FooterSection"), { loading: LoadingSkeleton });

// Local Watermarks
const WATERMARK_SYMBOLS = [
  "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿",
  "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ"
];

const MarqueeRow = ({ direction, speed, symbols }: { direction: 'left' | 'right', speed: number, symbols: string[] }) => {
  return (
    <div className="flex overflow-hidden w-full relative py-1 md:py-2 pointer-events-none">
      <div 
        className={`flex gap-6 md:gap-12 whitespace-nowrap w-max ${direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {[...symbols, ...symbols].map((symbol, i) => (
          <div 
            key={i} 
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-lime-900/20 dark:text-lime-600/30 select-none grayscale opacity-30"
          >
            {symbol}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Menu & Modal States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "signup">("login");

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
              <button onClick={() => { setModalMode("login"); setIsAuthModalOpen(true); }} className="hidden sm:block text-sm font-semibold text-lime-800 dark:text-lime-200">Sign In</button>
              <button onClick={() => { setModalMode("signup"); setIsAuthModalOpen(true); }} className="hidden sm:block bg-lime-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-lime-600/20">Get Started</button>
              
              {/* HAMBURGER TRIGGER */}
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-full bg-white/40 dark:bg-black/40 border border-lime-500/20 text-lime-800 dark:text-lime-200">
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* RESTORED MOBILE MENU */}
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
                    <button 
                      onClick={() => { setIsMobileMenuOpen(false); setModalMode("signup"); setIsAuthModalOpen(true); }} 
                      className="flex items-center justify-center gap-2 w-full bg-lime-600 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-lime-600/30 active:scale-95 transition-transform"
                    >
                      Sign In <ArrowRight size={18} />
                    </button>
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
              <button onClick={() => { setModalMode("signup"); setIsAuthModalOpen(true); }} className="flex items-center justify-center gap-2 bg-lime-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-lime-700 shadow-xl shadow-lime-600/20">Start Trading <ArrowRight size={20} /></button>
              <a href="#markets" className="flex items-center justify-center px-8 py-4 rounded-xl text-lg font-bold border-2 border-lime-500/30 text-lime-950 dark:text-[#ecfdf5] hover:bg-white/50">Explore Markets</a>
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

      {/* THE DETAILED ANIMATED AUTH MODAL */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <>
            {/* 1. Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />

            {/* 2. The Animated Container */}
            <m.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 sm:bottom-auto sm:top-1/2 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[110] w-full sm:w-[440px] bg-[#f4fbf5] dark:bg-[#0a0f0b] sm:rounded-3xl rounded-t-3xl border border-lime-500/20 dark:border-lime-500/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 z-20 flex items-center justify-between p-6 pb-4 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-md border-b border-lime-500/10">
                <Logo iconOnly />
                <button onClick={() => setIsAuthModalOpen(false)} className="p-2 rounded-full bg-lime-100 dark:bg-white/5 text-lime-700 dark:text-lime-300 hover:bg-lime-200 dark:hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 pt-4">
                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-lime-700/60 dark:text-lime-300/60">
                    <ShieldCheck size={14} className="text-lime-500" /> Bank-Grade Security
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-lime-700/60 dark:text-lime-300/60">
                    <Sparkles size={14} className="text-amber-500" /> Trusted by 50k+
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-extrabold text-lime-950 dark:text-white mb-1">
                    {modalMode === "login" ? "Welcome Back" : "Create Account"}
                  </h2>
                  <p className="text-sm text-lime-800/70 dark:text-lime-200/60 font-medium">
                    {modalMode === "login" ? "Enter your details to access your dashboard." : "Join the premier gamified exchange."}
                  </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex p-1 mb-6 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner relative">
                  <m.div 
                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#121A14] rounded-full shadow-md" 
                    animate={{ x: modalMode === "login" ? 0 : "100%" }} 
                    transition={{ type: "spring", stiffness: 300, damping: 30 }} 
                  />
                  <button 
                    onClick={() => setModalMode("login")} 
                    className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${modalMode === "login" ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => setModalMode("signup")} 
                    className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${modalMode === "signup" ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Social Auth Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button className="flex items-center justify-center gap-2 bg-white dark:bg-[#121A14] border border-lime-500/30 hover:bg-lime-50 dark:hover:bg-white/5 text-lime-950 dark:text-white font-semibold rounded-xl h-11 transition-all">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-white dark:bg-[#121A14] border border-lime-500/30 hover:bg-lime-50 dark:hover:bg-white/5 text-lime-950 dark:text-white font-semibold rounded-xl h-11 transition-all">
                    <Fingerprint size={18} className="text-lime-600 dark:text-lime-400" />
                    Passkey
                  </button>
                </div>

                <div className="relative flex items-center mb-6">
                  <div className="flex-grow border-t border-lime-500/20"></div>
                  <span className="flex-shrink-0 mx-4 text-lime-700/60 dark:text-lime-300/60 text-[10px] font-bold uppercase tracking-wider">Or continue with email</span>
                  <div className="flex-grow border-t border-lime-500/20"></div>
                </div>

                {/* Email Form */}
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  {modalMode === "signup" && (
                    <div>
                      <label className="block text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase mb-1.5 ml-1">Full Name</label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50" />
                        <input type="text" placeholder="John Doe" className="w-full bg-white/60 dark:bg-black/30 border border-lime-500/30 dark:border-lime-500/20 rounded-xl pl-10 pr-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors" />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase mb-1.5 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50" />
                      <input type="email" placeholder="you@example.com" className="w-full bg-white/60 dark:bg-black/30 border border-lime-500/30 dark:border-lime-500/20 rounded-xl pl-10 pr-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5 ml-1">
                      <label className="block text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Password</label>
                      {modalMode === "login" && (
                        <a href="#" className="text-[10px] font-bold text-lime-600 dark:text-lime-400 hover:underline">Forgot?</a>
                      )}
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50" />
                      <input type="password" placeholder="••••••••" className="w-full bg-white/60 dark:bg-black/30 border border-lime-500/30 dark:border-lime-500/20 rounded-xl pl-10 pr-4 py-3 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors" />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-lime-600/20 transition-all mt-6">
                    {modalMode === "login" ? "Log In" : "Create Account"}
                  </button>
                </form>

                {/* Demo Link */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-lime-800/60 dark:text-lime-200/50">
                    Just exploring?{" "}
                    <Link href="/demo" className="font-bold text-lime-600 dark:text-lime-400 hover:underline">
                      Try the Demo
                    </Link>
                  </p>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}


// "use client";

// import "./globals.css";
// import Link from "next/link";
// import { containerVariants, itemVariants } from "@/lib/animations";
// import dynamic from "next/dynamic";
// import { LazyMotion, domAnimation, m } from "framer-motion";
// import { useTheme } from "next-themes";
// import { useEffect, useState } from "react";
// import { ArrowRight, Sun, Moon, Menu, X } from "lucide-react";
// import { Logo } from "@/components/ui/Logo";
// // export const instant = false;
// // --- LAZY LOADED SECTIONS ---
// const LoadingSkeleton = () => <div className="h-96 w-full animate-pulse bg-lime-500/5 rounded-3xl my-12 max-w-6xl mx-auto" />;

// const MarketsSection = dynamic(() => import("@/components/sections/MarketsSection"), { loading: LoadingSkeleton });
// const TerminalSection = dynamic(() => import("@/components/sections/TerminalSection"), { loading: LoadingSkeleton });
// const GlobalStatsSection = dynamic(() => import("@/components/sections/GlobalStatsSection"), { loading: LoadingSkeleton });
// const FeatureGrid = dynamic(() => import("@/components/sections/FeatureGrid"), { loading: LoadingSkeleton });
// const FooterSection = dynamic(() => import("@/components/sections/FooterSection"), { loading: LoadingSkeleton });

// // Local Watermarks (Cannot export from page.tsx)
// const WATERMARK_SYMBOLS = [
//   // ==============================
//   // 1. GLOBAL FIAT
//   // ==============================
//   "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$", "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "₤", "₦", "₱", "₲", "₵", "₡", "₸",

//   // ==============================
//   // 2. CRYPTO & WEB3
//   // ==============================
//   "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦",

//   // ==============================
//   // 3. MEME COINS & COMMUNITY
//   // ==============================
//   "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎", "🙌", "🔥", "🚀", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵", "💴", "💶", "💷", "🪙"
// ];

// const MarqueeRow = ({ direction, speed, symbols }: { direction: 'left' | 'right', speed: number, symbols: string[] }) => {
//   return (
//     <div className="flex overflow-hidden w-full relative py-1 md:py-2 pointer-events-none">
//       <m.div className="flex gap-6 md:gap-12 whitespace-nowrap w-max" animate={{ x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'] }} transition={{ repeat: Infinity, ease: 'linear', duration: speed }}>
//         {[...symbols, ...symbols].map((symbol, i) => (
//           <m.div 
//             key={i} 
//             className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-lime-900/20 dark:text-lime-600/30 select-none grayscale opacity-30" 
//             animate={{ y: [0, -15, 0, 15, 0], rotate: [0, 10, 0, -10, 0] }} 
//             transition={{ repeat: Infinity, duration: 5 + (i % 4), ease: 'easeInOut', delay: i * 0.2 }}
//           >
//             {symbol}
//           </m.div>
//         ))}
//       </m.div>
//     </div>
//   );
// };

// export default function LandingPage() {
//   const { theme, setTheme } = useTheme();
//   const [mounted, setMounted] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   useEffect(() => setMounted(true), []);
//   if (!mounted) return null;

//   return (
//     <LazyMotion features={domAnimation}>
//       <div className="flex-1 w-full flex flex-col font-sans bg-[#f0fdf4] dark:bg-[#050806] relative transition-colors duration-300 overflow-hidden">
        
//         {/* BACKGROUND WATERMARKS */}
//         <div className="absolute inset-0 w-full overflow-hidden pointer-events-none select-none z-0 flex flex-col justify-around">
//           {Array.from({ length: 30 }).map((_, i) => (
//             <MarqueeRow key={i} direction={i % 2 === 0 ? "left" : "right"} speed={40 + (i % 5) * 15} symbols={i % 3 === 0 ? [...WATERMARK_SYMBOLS].reverse() : WATERMARK_SYMBOLS} />
//           ))}
//           <div className="absolute inset-0 z-10 bg-[#f0fdf4] dark:bg-[#050806] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]"></div>
//         </div>

//         {/* Background Aurora Glows */}
//         <div className="absolute top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
//         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

//         {/* NAVIGATION */}
//         <nav className="fixed top-0 w-full border-b border-lime-500/20 dark:border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md z-50">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
//             <Logo />
//             <div className="hidden md:flex items-center gap-8">
//               <a href="#markets" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600">Markets</a>
//               <a href="#features" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600">Features</a>
//               <a href="#how-it-works" className="text-sm font-semibold text-lime-800 dark:text-lime-200 hover:text-lime-600">How it Works</a>
//             </div>
//             <div className="flex items-center gap-2 sm:gap-4">
//               <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-white/40 dark:bg-black/40 border border-lime-500/20 text-lime-800 dark:text-lime-200">
//                 {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
//               </button>
//               <Link href="/login" className="hidden sm:block text-sm font-semibold text-lime-800 dark:text-lime-200">Sign In</Link>
//               <Link href="/login" className="hidden sm:block bg-lime-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold">Get Started</Link>
//               <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-full bg-white/40 dark:bg-black/40 border border-lime-500/20 text-lime-800 dark:text-lime-200">
//                 {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
//               </button>
//             </div>
//           </div>
//         </nav>

//         {/* HERO SECTION */}
//         <main className="relative z-20 pt-32 sm:pt-40 pb-20 px-4 sm:px-6 flex-grow">
//           <m.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto text-center space-y-8 relative">
//             <m.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-lime-950 dark:text-[#ecfdf5]">
//               Trade everything. <br />
//               <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-lime-700 dark:from-lime-400 dark:to-lime-600">Zero limits.</span>
//             </m.h1>
            
//             <m.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-lime-800/80 dark:text-lime-200/60 max-w-2xl mx-auto">
//               The world's first highly gamified commodity and crypto exchange. Start with local goods, earn XP, and unlock institutional-grade Crypto, Meme Coins, and Forex.
//             </m.p>

//             <m.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
//               <Link href="/login" className="flex items-center justify-center gap-2 bg-lime-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-lime-700">Start Trading <ArrowRight size={20} /></Link>
//               <a href="#markets" className="flex items-center justify-center px-8 py-4 rounded-xl text-lg font-bold border-2 border-lime-500/30 text-lime-950 dark:text-[#ecfdf5]">Explore Markets</a>
//             </m.div>
//           </m.div>

//           {/* DYNAMIC SECTIONS */}
//           <MarketsSection />
//           <TerminalSection />
//           <GlobalStatsSection />
//           <FeatureGrid />
//         </main>

//         <FooterSection />
//       </div>
//     </LazyMotion>
//   );
// }
