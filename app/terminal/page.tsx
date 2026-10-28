"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Menu, TrendingUp, Shield, Zap, Hexagon } from "lucide-react";
import TradingSidePanel from "@/app/markets/[id]/TradingSidePanel";

// Dynamically import the 3D chart to prevent SSR hydration errors
const Three3DChart = dynamic(() => import("@/app/Three3DChart"), { 
  ssr: false, 
  loading: () => <div className="w-full h-full flex items-center justify-center text-2xs font-mono text-gray-400">Loading 3D Terminal...</div> 
});

export default function Dashboard() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  
  // Toggle Theme
  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors ${isDark ? 'bg-[#0a0c10] text-[#e6e8eb]' : 'bg-[#f8f9fb] text-[#0a0d14]'}`}>
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0c10]/88 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-yellow-500/10 ring-1 ring-yellow-500/20">
              <TrendingUp size={18} className="text-yellow-500" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">QUANTIX</div>
              <div className="text-[10px] font-mono text-gray-500">COMMODITY EXCHANGE</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-blue-500 grid place-items-center text-xs font-bold text-black shadow-lg">2</div>
              <div className="w-32">
                <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                  <span>Trader</span>
                  <span>240 / 600 XP</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 w-[40%] rounded-full shadow-[0_0_10px_rgba(240,180,41,0.5)]"></div>
                </div>
              </div>
            </div>

            {/* THE COLORFUL REACT ICON TO TRIGGER THE SIDE PANEL */}
            <button 
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-95 group"
            >
              <Hexagon size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              Terminal
            </button>

            <button onClick={() => setIsDark(!isDark)} className="w-8 h-8 rounded-md border border-white/10 grid place-items-center hover:bg-white/5 transition-colors">
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      {/* TICKER */}
      <div className="border-b border-white/10 bg-[#0e1116] overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-4 h-9 flex items-center text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-gray-500 mr-4 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>LIVE
          </span>
          <div className="flex-1 overflow-hidden whitespace-nowrap text-gray-300">
            <span className="inline-block animate-[marquee_20s_linear_infinite]">
              Charcoal ₦42.50 <span className="text-green-500">+2.3%</span> • Bitterleaf ₦18.20 <span className="text-red-500">-1.1%</span> • Scrap iron ₦285.00 <span className="text-green-500">+0.4%</span>
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        
        {/* GAMIFY STRIP */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 p-4 rounded-xl border border-white/10 bg-[#0e1116] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-blue-500 grid place-items-center text-lg font-bold text-black shadow-lg">2</div>
              <div>
                <div className="text-sm font-bold text-white">Trader</div>
                <div className="text-xs font-mono text-gray-400">240 XP · 400 to next level</div>
              </div>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <div className="text-[10px] font-mono text-gray-500 uppercase">Tasks</div>
                <div className="text-sm font-mono font-bold text-white">4/12</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-gray-500 uppercase">Orders</div>
                <div className="text-sm font-mono font-bold text-yellow-500">18</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-white/10 bg-gradient-to-r from-yellow-500/10 to-transparent relative overflow-hidden flex flex-col justify-center">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-yellow-500 uppercase tracking-wider">Next Task</span>
              <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">DAILY</span>
            </div>
            <div className="text-sm font-bold text-white mb-2">Trade 3 different pairs</div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-yellow-500 w-1/3"></div>
            </div>
            <div className="text-[10px] font-mono text-gray-400 flex justify-between">
              <span>1 / 3</span>
              <span className="text-yellow-500">+100 XP</span>
            </div>
          </div>
        </section>

        {/* 3D TERMINAL */}
        <section className="relative h-[600px] rounded-xl border border-white/10 bg-[#0e1116] overflow-hidden">
          {/* WRAPPING IN SUSPENSE FIXES THE PRERENDER ERROR */}
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-sm">Loading 3D...</div>}>
            <Three3DChart />
          </Suspense>
        </section>

      </main>

      {/* THE TRADING SIDE PANEL COMPONENT */}
      <TradingSidePanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        coin={{
            id: "bitcoin",
            symbol: "btc",
            name: "Bitcoin",
            current_price: 64230.00,
            price_change_percentage_24h: 2.4
        }}
        quoteCurrency={{
            id: "usd",
            symbol: "$",
            name: "USD",
            rate: 1,
            category: "fiat"
        }}
        positions={[]}
        onPlaceOrder={() => {}}
      />
    </div>
  );
}