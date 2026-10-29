"use client";

import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { TrendingUp, Activity, ArrowUpRight, Flame } from "lucide-react";
import { useState, useEffect } from "react";

const trendingAssets = [
  { name: 'Bitcoin', symbol: 'BTC', price: '$67,430', change: '+7.3%', color: 'from-orange-400 to-orange-600', initial: 'B' },
  { name: 'Solana', symbol: 'SOL', price: '$145.20', change: '+18.4%', color: 'from-purple-500 to-indigo-500', initial: 'S' },
  { name: 'Ethereum', symbol: 'ETH', price: '$3,450', change: '+5.2%', color: 'from-blue-400 to-indigo-400', initial: 'E' },
  { name: 'Doge', symbol: 'DOGE', price: '$0.15', change: '+12.4%', color: 'from-yellow-400 to-yellow-600', initial: 'D' },
  { name: 'Shiba Inu', symbol: 'SHIB', price: '$0.000025', change: '+8.1%', color: 'from-red-500 to-orange-500', initial: 'S' },
  { name: 'Pepe', symbol: 'PEPE', price: '$0.000008', change: '+22.5%', color: 'from-green-500 to-green-700', initial: 'P' },
  { name: 'US Dollar', symbol: 'USD', price: '₦1,450', change: '+0.1%', color: 'from-green-600 to-emerald-600', initial: '$' },
  { name: 'Euro', symbol: 'EUR', price: '₦1,560', change: '+0.2%', color: 'from-blue-600 to-blue-800', initial: '€' },
  { name: 'British Pound', symbol: 'GBP', price: '₦1,820', change: '+0.4%', color: 'from-indigo-600 to-purple-800', initial: '£' },
  { name: 'Japanese Yen', symbol: 'JPY', price: '₦9.50', change: '+0.1%', color: 'from-red-600 to-red-800', initial: '¥' },
];

export default function MarketsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingAssets.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const marketTable = (
    <div className="relative bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 px-2">
        <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider">Asset</span>
        <div className="flex gap-8 text-right">
          <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider w-20">Price</span>
          <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider w-16">Change</span>
        </div>
      </div>
      
      <div className="space-y-2 flex-1">
        {[
          { name: 'Bitcoin', symbol: 'BTC', price: '$6,750', change: '+7.3%', up: true, color: 'bg-orange-500' },
          { name: 'US Dollar', symbol: 'USD', price: '₦1,450', change: '+0.1%', up: true, color: 'bg-green-600' },
          { name: 'Euro', symbol: 'EUR', price: '₦1,560', change: '-0.2%', up: false, color: 'bg-blue-600' },
          { name: 'British Pound', symbol: 'GBP', price: '₦1,820', change: '+0.4%', up: true, color: 'bg-indigo-500' },
          { name: 'Japanese Yen', symbol: 'JPY', price: '₦9.50', change: '-0.1%', up: false, color: 'bg-red-500' },
        ].map((asset, i) => (
          <div key={asset.symbol} className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${i === 1 ? 'bg-lime-500/10 dark:bg-lime-500/10 border border-lime-500/20' : 'hover:bg-lime-500/5'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${asset.color}`}>{asset.symbol.charAt(0)}</div>
              <div>
                <div className="text-sm font-bold text-lime-950 dark:text-white">{asset.symbol}</div>
                <div className="text-xs text-lime-800/60 dark:text-lime-200/50">{asset.name}</div>
              </div>
            </div>
            <div className="flex gap-8 text-right">
              <span className="text-sm font-bold text-lime-950 dark:text-white w-20">{asset.price}</span>
              <span className={`text-sm font-bold w-16 flex items-center justify-end gap-1 ${asset.up ? 'text-green-500' : 'text-red-500'}`}>
                {asset.up ? <TrendingUp size={14}/> : <TrendingUp size={14} className="rotate-180"/>}
                {asset.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const portfolioCard = (
    <div className="relative bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex flex-col justify-between overflow-hidden h-[220px]">
      <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-lime-400/20 blur-[60px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} /> Portfolio
          </span>
          <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md flex items-center gap-1">
            <ArrowUpRight size={12} /> +14.5%
          </span>
        </div>
        <div className="text-3xl font-extrabold text-lime-950 dark:text-white mb-1">
          $14,230<span className="text-lime-800/50 dark:text-lime-200/50 text-xl">.50</span>
        </div>
        <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Total balance across all assets</p>
      </div>

      <div className="relative h-16 w-full mt-4">
        <svg viewBox="-2 -2 104 44" className="w-full h-full preserve-3d" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#84cc16" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,35 Q10,30 20,32 T40,20 T60,25 Q70,10 80,5 T100,10 L100,40 L0,40 Z" fill="url(#chartGradient)" />
          <m.path 
            d="M0,35 Q10,30 20,32 T40,20 T60,25 Q70,10 80,5 T100,10" 
            fill="none" stroke="#84cc16" strokeWidth="2"
            initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      </div>
    </div>
  );

  const marketPulseCard = (
    <div className="relative bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex-1 flex flex-col justify-center min-h-[160px] overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
          <Flame size={14} className="text-orange-500" /> Market Pulse
        </span>
        <span className="text-[10px] font-mono text-lime-600 dark:text-lime-400 bg-lime-500/10 px-2 py-0.5 rounded animate-pulse">LIVE</span>
      </div>

      <div className="relative h-[60px] w-full">
        <AnimatePresence mode="wait">
          <m.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${trendingAssets[currentIndex].color} flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0`}>
              {trendingAssets[currentIndex].initial}
            </div>
            
            <div className="flex-1 overflow-hidden">
              <div className="text-lg font-bold text-lime-950 dark:text-white leading-tight truncate">
                {trendingAssets[currentIndex].name}
              </div>
              <div className="text-xs text-lime-800/60 dark:text-lime-200/50 font-mono truncate">
                {trendingAssets[currentIndex].symbol} / USD
              </div>
            </div>
            
            <div className="text-right shrink-0">
              <div className="text-lg font-bold text-lime-950 dark:text-white font-mono">
                {trendingAssets[currentIndex].price}
              </div>
              <div className="text-xs font-bold text-green-500 flex items-center justify-end gap-1">
                <TrendingUp size={12} /> {trendingAssets[currentIndex].change}
              </div>
            </div>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <m.div 
      initial={{ opacity: 0, y: 40 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, margin: "-100px" }} 
      transition={{ duration: 0.6 }} 
      id="markets" 
      className="max-w-6xl mx-auto mt-24 sm:mt-32 px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-6 lg:gap-24 gap-y-12 items-start lg:items-stretch relative z-20"
    >
      
      {/* 1. TEXT AND DESKTOP CARDS (Left Column on Desktop) */}
      <div className="order-1 md:col-start-1 md:row-start-1 lg:col-start-1 lg:row-start-1 lg:row-span-2 flex flex-col gap-12 w-full">
        {/* Text Container - Centered on Mobile, Left-Aligned on Tablet/Desktop */}
        <div className="text-center md:text-left flex flex-col items-center md:items-start">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight mb-6 leading-tight relative z-20">
            Grow your profit and <br className="hidden sm:block"/> track your investments
          </h2>
          <p className="text-base text-lime-800/70 dark:text-lime-200/60 font-medium leading-relaxed mb-8 max-w-md relative z-20 mx-auto md:mx-0">
            Use advanced analytical tools. Clear TradingView charts let you track current and historical profit investments seamlessly across crypto and global fiat currencies.
          </p>
          <Link href="/login" className="md:hidden lg:inline-flex relative z-20 items-center justify-center px-6 py-3 rounded-xl bg-lime-600 text-white font-bold hover:bg-lime-700 transition-colors shadow-lg shadow-lime-600/20 w-fit mx-auto md:mx-0">
            Start Learning
          </Link>
        </div>

        {/* Desktop Cards (Hidden on Mobile/Tablet) */}
        <div className="hidden lg:flex flex-col gap-6 w-full h-full justify-between">
          {portfolioCard}
          {marketPulseCard}
        </div>
      </div>

      {/* 2. GLOBE (Tablet & Desktop - Top Right) */}
      <div className="hidden md:flex order-2 md:col-start-2 md:row-start-1 lg:col-start-2 lg:row-start-1 justify-center md:justify-end w-full">
        <div className="flex flex-col items-center justify-center p-8 bg-lime-500/5 rounded-[2.5rem] border border-lime-500/10 w-full max-w-sm">
          <m.div 
            animate={{ y: [0, -8, 0] }} 
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white/40 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/30 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] flex items-center justify-center z-10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-20 h-20 sm:w-24 sm:h-24 text-lime-600 dark:text-lime-400 drop-shadow-[0_0_12px_rgba(132,204,22,0.8)]">
              <circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" />
              <m.circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} />
              <m.circle cx="16" cy="8" r="1" fill="currentColor" stroke="none" animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.5 }} />
              <m.circle cx="7" cy="15" r="1" fill="currentColor" stroke="none" animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }} />
            </svg>
          </m.div>
          <Link href="/login" className="mt-8 inline-flex items-center justify-center px-8 py-3 rounded-xl bg-lime-600 text-white font-bold hover:bg-lime-700 transition-colors shadow-lg shadow-lime-600/20 w-full text-center">
            Start Learning
          </Link>
        </div>
      </div>

      {/* 3. TABLE (Mobile: Bottom, Tablet: Bottom Left, Desktop: Bottom Right) */}
      <div className="order-3 md:col-start-1 md:row-start-2 lg:col-start-2 lg:row-start-2 w-full lg:h-full">
        {marketTable}
      </div>

      {/* 4. CARDS (Mobile: Bottom, Tablet: Bottom Right. Hidden on Desktop because they are in Col 1) */}
      <div className="order-4 md:col-start-2 md:row-start-2 flex lg:hidden flex-col gap-6 w-full">
        {portfolioCard}
        {marketPulseCard}
      </div>

    </m.div>
  );
}