"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, TrendingUp, ShieldCheck, ArrowLeft, Wallet, PlayCircle, ArrowDownRight, Flame, X, LogOut, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

const WATERMARK_SYMBOLS = [
  "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$", "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "лв", "din", "ден", "L", "Q", "B/.", "₡", "₲", "Gs", "S/.", "Bs.", "$U", "RD$", "J$", "TT$", "Bds$", "EC$", "FJ$", "WS$", "T$", "VT", "K", "T", "₭", "₮", "៛", "₫", "Rp", "RM", "S$", "฿",
  "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦", "✕", "✖", "☰", "⛓", "🔗", "🌐", "⚙️", "🧩", "🧮", "📈", "📉", "⚖️", "🛡️", "🔑", "🗝️", "🧊", "🔥", "💧", "🌪️", "🌍", "🪐", "☄️", "🛰️",
  "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎", "🙌", "🔥", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵", "💴", "💶", "💷", "🍌", "🍕", "🍻", "🍼", "🧠", "👽", "🤖", "👻", "💀", "🤡", "🐂", "🐻", "🦍", "🐕‍🦺", "🦴", "🥩", "🍗", "🧀", "🌮", "🍔", "🍟", "🥑"
];

const mockMarkets = [
  { symbol: 'BTC/USD', name: 'Bitcoin', price: 64230.00, change: '+2.4%', up: true },
  { symbol: 'ETH/USD', name: 'Ethereum', price: 3450.00, change: '-1.2%', up: false },
  { symbol: 'CHR-NGN', name: 'Charcoal', price: 42.50, change: '+0.8%', up: true },
  { symbol: 'SLR-NGN', name: 'Solar Panels', price: 18500.00, change: '+5.1%', up: true },
];

export default function DemoPage() {
  // MOVED STATE INSIDE THE COMPONENT
  const [showExitModal, setShowExitModal] = useState(false);
  
  const [usdBalance, setUsdBalance] = useState(4250000.00);
  const [btcBalance, setBtcBalance] = useState(0.045);
  const [isTrading, setIsTrading] = useState(false);

  // Generate watermarks exactly like the login page
  const watermarks = useMemo(() => {
    return WATERMARK_SYMBOLS.flatMap((symbol, i) => {
      return Array.from({ length: 5 }).map((_, j) => ({
        symbol,
        rotation: ((i * 13 + j * 7) % 60) - 30,
        top: `${((i * 17 + j * 23) % 100)}%`,
        left: `${((i * 29 + j * 11) % 100)}%`,
        scale: 1 + ((i + j) % 3) * 0.4
      }));
    });
  }, []);

  const handleTrade = (type: 'buy' | 'sell') => {
    setIsTrading(true);
    setTimeout(() => {
      if (type === 'buy') {
        setBtcBalance(prev => prev + 0.001);
        setUsdBalance(prev => prev - 64230.00 * 0.001);
      } else {
        setBtcBalance(prev => Math.max(0, prev - 0.001));
        setUsdBalance(prev => prev + 64230.00 * 0.001);
      }
      setIsTrading(false);
    }, 800);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);
  };

  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans pb-12 transition-colors duration-300">
      
      {/* BACKGROUND WATERMARKS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {watermarks.map((wm, idx) => (
          <span key={idx} className="absolute text-5xl md:text-7xl font-bold text-lime-900/[0.04] dark:text-lime-100/[0.02]"
            style={{ transform: `rotate(${wm.rotation}deg) scale(${wm.scale})`, top: wm.top, left: wm.left }}>
            {wm.symbol}
          </span>
        ))}
      </div>

      {/* AURORA GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Demo Banner */}
      <div className="relative z-50 bg-lime-600 text-white text-center py-2 text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md">
        <Flame className="text-amber-500" size={16} /> DEMO MODE - No real funds are at risk
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-lime-950 dark:text-[#ecfdf5]">Sandbox Dashboard</h1>
            <p className="text-lime-800/70 dark:text-lime-200/50 mt-1 font-medium">Explore the terminal and test your strategies.</p>
          </div>
          
          {/* REMOVED <Link> WRAPPER SO IT ONLY OPENS THE MODAL */}
          <Button 
            onClick={() => setShowExitModal(true)} 
            variant="secondary" 
            className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-white/40 dark:bg-[#121A14]/60 hover:bg-white/60 dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl flex items-center gap-2 h-11 px-5 backdrop-blur-md shadow-sm"
          >
            <ArrowLeft size={16} /> Live account
          </Button>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            className="md:col-span-2 relative overflow-hidden rounded-3xl bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 p-8 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-lime-400/20 blur-3xl rounded-full pointer-events-none"></div>
            <div className="relative z-10">
              <p className="text-lime-800/70 dark:text-lime-200/50 text-sm font-medium mb-2 flex items-center gap-2">
                <Wallet size={18} /> Total Demo Portfolio (NGN)
              </p>
              <h2 className="text-5xl font-extrabold tracking-tight font-mono text-lime-950 dark:text-[#ecfdf5] mb-6">
                {formatCurrency(usdBalance + (btcBalance * 64230 * 1500))}
              </h2>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/50 dark:bg-[#050806]/50 rounded-xl p-3 px-5 border border-lime-500/20">
                  <p className="text-xs text-lime-700/60 dark:text-lime-300/60 uppercase tracking-wider font-bold mb-1">USD Balance</p>
                  <p className="font-mono text-xl text-lime-950 dark:text-white font-bold">${usdBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white/50 dark:bg-[#050806]/50 rounded-xl p-3 px-5 border border-lime-500/20">
                  <p className="text-xs text-lime-700/60 dark:text-lime-300/60 uppercase tracking-wider font-bold mb-1">BTC Balance</p>
                  <p className="font-mono text-xl text-lime-950 dark:text-white font-bold">₿ {btcBalance.toFixed(4)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tier Progress */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} 
            className="rounded-3xl bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 p-6 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(132,204,22,0.15)]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lime-950 dark:text-[#ecfdf5]">Demo Tier</h3>
                <ShieldCheck className="text-lime-600 dark:text-lime-400" size={24} />
              </div>
              <div className="text-4xl font-extrabold text-lime-600 dark:text-lime-400 font-mono mb-1">Tier 2</div>
              <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mb-6 font-medium">Unlocked: Crypto & Commodities</p>
            </div>
            <div>
              <div className="w-full bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-3 shadow-inner">
                <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
              </div>
              <p className="text-xs text-lime-800/60 dark:text-lime-200/50 text-center font-bold">Earn 300 XP to unlock Forex</p>
            </div>
          </motion.div>
        </div>

        {/* Terminal & Markets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Trading Terminal */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} 
            className="lg:col-span-2 rounded-3xl bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 overflow-hidden shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] flex flex-col"
          >
            <div className="border-b border-lime-500/10 p-4 flex items-center justify-between bg-white/40 dark:bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">₿</div>
                <span className="font-bold text-lime-950 dark:text-[#ecfdf5] text-lg">BTC / USD</span>
                <span className="text-xs font-mono text-green-600 bg-green-500/10 px-2 py-1 rounded font-bold">+2.74%</span>
              </div>
              <div className="text-sm font-mono text-lime-800/60 dark:text-lime-200/50 font-medium">
                Last Price: <span className="text-lime-950 dark:text-white font-bold">$64,230.00</span>
              </div>
            </div>

            {/* Terminal Chart Background */}
            <div className="flex-1 min-h-[320px] relative bg-[#f0fdf4] dark:bg-[#050806] flex items-center justify-center p-6 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#181c25_1px,transparent_1px),linear-gradient(to_bottom,#181c25_1px,transparent_1px)] bg-[size:4rem_4rem]">
               
               {/* Glassmorphic Trading Modal */}
               <div className="text-center bg-white/80 dark:bg-[#121A14]/80 backdrop-blur-xl border border-lime-500/30 p-8 rounded-3xl shadow-2xl max-w-sm w-full">
                 <PlayCircle size={48} className="mx-auto text-lime-500 mb-4 drop-shadow-md" />
                 <h3 className="font-bold text-xl text-lime-950 dark:text-[#ecfdf5] mb-2">Order Execution</h3>
                 <p className="text-sm text-lime-800/70 dark:text-lime-200/60 mb-8 font-medium">Test the market with fake funds.</p>
                 <div className="flex gap-4">
                   <Button onClick={() => handleTrade('buy')} disabled={isTrading} className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-6 rounded-xl flex-1 text-lg shadow-lg shadow-green-500/20 transition-all hover:scale-105 active:scale-95">
                     {isTrading ? "..." : "BUY"}
                   </Button>
                   <Button onClick={() => handleTrade('sell')} disabled={isTrading} className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-6 rounded-xl flex-1 text-lg shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95">
                     {isTrading ? "..." : "SELL"}
                   </Button>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* Market Watch */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} 
            className="rounded-3xl bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 p-6 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] flex flex-col"
          >
            <h3 className="font-bold text-lg text-lime-950 dark:text-[#ecfdf5] mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-lime-500" /> Market Watch
            </h3>
            <div className="space-y-2 flex-1">
              {mockMarkets.map((market) => (
                <div key={market.symbol} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/60 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-lime-500/20 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center font-bold text-xs text-lime-600 dark:text-lime-400 group-hover:bg-lime-200 transition-colors">
                      {market.symbol.split('/')[0].substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-lime-950 dark:text-[#ecfdf5]">{market.symbol}</div>
                      <div className="text-[10px] text-lime-800/60 dark:text-lime-200/50 font-medium">{market.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-lime-950 dark:text-white font-bold">{market.price.toLocaleString()}</div>
                    <div className={`text-xs font-bold flex items-center justify-end ${market.up ? 'text-green-500' : 'text-red-500'}`}>
                      {market.up ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                      {market.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => { window.location.href = "/markets"; }} className="w-full mt-4 bg-white/50 dark:bg-[#050806]/50 hover:bg-white dark:hover:bg-[#121A14] text-lime-800 dark:text-lime-200 font-bold rounded-xl h-10 border border-lime-500/30 dark:border-lime-500/20 transition-all shadow-sm">
              View All Markets
            </Button>
          </motion.div>

        </div>
      </div>

      {/* EXIT DEMO MODAL */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#f4fbf5] dark:bg-[#121A14] rounded-3xl p-6 shadow-2xl border border-lime-500/20 text-center"
            >
              <button onClick={() => setShowExitModal(false)} className="cursor-pointer absolute top-4 right-4 text-lime-600 hover:text-lime-800 transition-colors">
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 mx-auto bg-lime-100 dark:bg-lime-900/50 rounded-full flex items-center justify-center mb-4">
                <LogOut className="text-lime-600 dark:text-lime-400" size={32} />
              </div>
              
              <h2 className="text-xl font-bold text-lime-950 dark:text-white mb-2">Ready to trade for real?</h2>
              <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mb-6 font-medium">
                Create an account or log in to start your journey with us.
              </p>
              
              <div className="space-y-3">
                <Button onClick={() => { window.location.href = "/login"; }} className="w-full bg-lime-600 cursor-pointer hover:bg-lime-700 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2">
                  <LogIn size={18} /> Log In
                </Button>
                <Button onClick={() => { window.location.href = "/login"; }} variant="secondary" className="cursor-pointer w-full border-lime-500/30 bg-white/50 dark:bg-black/30 text-lime-950 dark:text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2">
                  <UserPlus size={18} /> Sign Up
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}