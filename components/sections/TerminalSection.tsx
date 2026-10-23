"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Percent } from "lucide-react";

export default function TerminalSection() {
  const [activeTab, setActiveTab] = useState('Spot');
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const tabs = ['Markets', 'Spot', 'Futures', 'Earn', 'Wallet'];

  useEffect(() => {
    if (isAutoPlayPaused) return;
    const interval = setInterval(() => {
      setActiveTab((current) => {
        const currentIndex = tabs.indexOf(current);
        const nextIndex = (currentIndex + 1) % tabs.length;
        return tabs[nextIndex];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlayPaused, tabs]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsAutoPlayPaused(true);
    setTimeout(() => setIsAutoPlayPaused(false), 10000);
  };

  return (
    <m.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto mt-24 sm:mt-32 relative z-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight mb-4">Your personal command center</h2>
        <p className="text-base text-lime-800/70 dark:text-lime-200/60 font-medium max-w-2xl mx-auto">
          Experience lightning-fast execution, deep liquidity, and advanced charting tools in a beautifully crafted interface.
        </p>
      </div>

      <div className="relative rounded-3xl overflow-hidden border border-lime-500/20 dark:border-lime-500/10 bg-white/60 dark:bg-[#0a0f0b]/80 backdrop-blur-xl shadow-2xl flex flex-col">
        {/* Terminal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-lime-500/10 bg-white/40 dark:bg-black/40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lime-950 dark:text-white">BTC/USD</span>
              <span className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-0.5 rounded">+2.74%</span>
            </div>
            <div className="hidden sm:flex gap-4 text-xs font-mono text-lime-800/60 dark:text-lime-200/50">
              <span>High: $1,531.80</span>
              <span>Low: $1,461.20</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-600 text-black text-xs font-bold transition-colors">Buy</button>
            <button className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors">Sell</button>
          </div>
        </div>

        <div className="flex h-[350px] sm:h-[450px]">
          {/* Slider Sidebar Tabs */}
          <div className="hidden md:flex flex-col w-48 border-r border-lime-500/10 bg-white/20 dark:bg-black/20 p-4 space-y-2">
            {tabs.map((item) => (
              <button 
                key={item} 
                onClick={() => handleTabClick(item)}
                className={`text-sm font-semibold flex items-center gap-2 p-3 rounded-xl transition-all duration-300 ${activeTab === item ? 'text-lime-600 dark:text-lime-400 bg-lime-500/10 shadow-sm border border-lime-500/20' : 'text-lime-800/50 dark:text-lime-200/40 hover:bg-lime-500/5'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${activeTab === item ? 'bg-lime-500' : 'bg-transparent'}`}></div>
                {item}
              </button>
            ))}
          </div>

          {/* Slider Content Area */}
          <div className="flex-1 relative overflow-hidden flex flex-col bg-[#f4fbf5] dark:bg-[#0a0f0b]">
            <div className="px-6 pt-4 flex items-center justify-between border-b border-lime-500/10 pb-2">
              <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider">{activeTab} View</h3>
              <div className="flex items-center gap-2">
                {isAutoPlayPaused ? (
                  <span className="text-[10px] text-lime-600 dark:text-lime-400 font-mono uppercase">Paused</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] text-lime-800/50 dark:text-lime-200/40 font-mono uppercase">
                    Auto-playing <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 relative">
              <AnimatePresence mode="wait">
                <m.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0 p-6 flex flex-col"
                >
                  {activeTab === 'Spot' && (
                    <div className="flex-1 relative flex flex-col">
                      <div className="absolute right-0 top-0 bottom-8 flex flex-col justify-between text-[10px] font-mono text-lime-800/40 dark:text-lime-200/30">
                        <span>$1600</span><span>$1550</span><span>$1500</span><span>$1450</span><span>$1400</span>
                      </div>
                      <div className="flex-1 flex items-end justify-around pb-4 pr-10 gap-1 sm:gap-2">
                        {[
                          { h: 'h-20', b: 'bg-red-500', y: 'mb-10' }, { h: 'h-32', b: 'bg-green-500', y: 'mb-5' },
                          { h: 'h-24', b: 'bg-red-500', y: 'mb-12' }, { h: 'h-40', b: 'bg-green-500', y: 'mb-2' },
                          { h: 'h-28', b: 'bg-green-500', y: 'mb-8' }, { h: 'h-16', b: 'bg-red-500', y: 'mb-16' },
                          { h: 'h-48', b: 'bg-green-500', y: 'mb-0' }, { h: 'h-24', b: 'bg-red-500', y: 'mb-10' },
                          { h: 'h-36', b: 'bg-green-500', y: 'mb-4' }, { h: 'h-20', b: 'bg-red-500', y: 'mb-14' },
                          { h: 'h-28', b: 'bg-green-500', y: 'mb-8' }, { h: 'h-44', b: 'bg-green-500', y: 'mb-2' },
                        ].map((candle, i) => (
                          <div key={i} className={`relative w-2 sm:w-4 flex flex-col items-center justify-between ${candle.y}`}>
                            <div className={`w-px h-6 ${candle.b} opacity-50`}></div>
                            <div className={`w-full ${candle.h} ${candle.b} rounded-sm opacity-80`}></div>
                            <div className={`w-px h-6 ${candle.b} opacity-50`}></div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-lime-800/40 dark:text-lime-200/30 pr-10 border-t border-lime-500/10 pt-2">
                        <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Markets' && (
                    <div className="flex-1 flex flex-col justify-center gap-4">
                      {['BTC / USD', 'ETH / USD', 'SOL / USD'].map((pair, i) => (
                         <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-lime-500/20 bg-lime-500/5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-lime-500/20 flex items-center justify-center text-lime-600 font-bold text-xs">{pair.split(' ')[0]}</div>
                              <span className="font-bold text-lime-950 dark:text-white text-sm">{pair}</span>
                            </div>
                            <div className="flex gap-6 text-sm font-mono">
                               <span className="text-lime-950 dark:text-white">$64,230</span>
                               <span className="text-green-500">+2.4%</span>
                            </div>
                         </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'Futures' && (
                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                      <div className="p-4 rounded-xl border border-lime-500/20 bg-lime-500/5 w-full max-w-sm">
                        <span className="text-sm text-lime-800/60 dark:text-lime-200/60 block mb-2">Leverage</span>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lime-950 dark:text-white">Long 10x</span>
                          <input type="range" className="w-32 accent-lime-500" />
                          <span className="font-bold text-lime-950 dark:text-white">Short 10x</span>
                        </div>
                      </div>
                      <p className="text-sm text-lime-800/60 dark:text-lime-200/50">Advanced derivatives trading coming soon.</p>
                    </div>
                  )}

                  {activeTab === 'Earn' && (
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                       <div className="w-16 h-16 rounded-full bg-lime-500/20 flex items-center justify-center mb-4 text-lime-600">
                         <Percent size={32} />
                       </div>
                       <h4 className="text-lg font-bold text-lime-950 dark:text-white mb-2">Stake & Earn</h4>
                       <p className="text-sm text-lime-800/60 dark:text-lime-200/50 max-w-xs">Stake your crypto assets to earn up to 12% APY. Unlock staking by reaching Tier 2.</p>
                    </div>
                  )}

                  {activeTab === 'Wallet' && (
                    <div className="flex-1 flex flex-col justify-center space-y-4">
                      <div className="p-4 rounded-xl border border-lime-500/20 bg-lime-500/5 flex justify-between items-center">
                        <div>
                          <span className="text-xs text-lime-800/50 uppercase block">Total Balance</span>
                          <span className="text-2xl font-bold font-mono text-lime-950 dark:text-white">$14,230.50</span>
                        </div>
                        <button className="bg-lime-500 text-black px-4 py-2 rounded-lg text-xs font-bold">Deposit</button>
                      </div>
                      <div className="text-xs text-lime-800/60 dark:text-lime-200/50 text-center">Secure wallet powered by double-entry ledger.</div>
                    </div>
                  )}
                </m.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
}