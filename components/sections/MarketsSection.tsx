"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { TrendingUp } from "lucide-react";

export default function MarketsSection() {
  return (
    <m.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} id="markets" className="max-w-6xl mx-auto mt-24 sm:mt-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-20">
            {/* Left Column: Text and Globe */}
      <div className="relative">
        
        {/* FLOATING GLASSMORPHIC GLOBE */}
        <m.div 
          animate={{ y: [0, -8, 0] }} 
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute -top-16 right-0 lg:-right-12 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/40 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/30 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] flex items-center justify-center z-10 pointer-events-none"
        >
          {/* Custom Glowing Globe SVG */}
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-24 h-24 sm:w-14 sm:h-14 text-lime-600 dark:text-lime-400 drop-shadow-[0_0_12px_rgba(132,204,22,0.8)]"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <path d="M2 12h20" />
            {/* Animated glowing nodes */}
            <m.circle 
              cx="12" cy="12" r="1.5" 
              fill="currentColor" stroke="none"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} 
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <m.circle 
              cx="16" cy="8" r="1" 
              fill="currentColor" stroke="none"
              animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }} 
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.5 }}
            />
            <m.circle 
              cx="7" cy="15" r="1" 
              fill="currentColor" stroke="none"
              animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }} 
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }}
            />
          </svg>
        </m.div>

        {/* Text Content */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight mb-6 leading-tight relative z-20">
          Grow your profit and <br className="hidden sm:block"/> track your investments
        </h2>
        <p className="text-base text-lime-800/70 dark:text-lime-200/60 font-medium leading-relaxed mb-8 max-w-md relative z-20">
          Use advanced analytical tools. Clear TradingView charts let you track current and historical profit investments seamlessly across crypto and global fiat currencies.
        </p>
        <Link href="/login" className="relative z-20 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-lime-600 text-white font-bold hover:bg-lime-700 transition-colors shadow-lg shadow-lime-600/20">
          Start Learning
        </Link>
      </div>
      
      <div className="relative">
         <div className="absolute inset-0 bg-lime-400/20 blur-[80px] rounded-full"></div>
        <div className="relative bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6 px-2">
            <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider">Asset</span>
            <div className="flex gap-8 text-right">
              <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider w-20">Price</span>
              <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider w-16">Change</span>
            </div>
          </div>
          
          <div className="space-y-2">
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
      </div>
    </m.div>
  );
}