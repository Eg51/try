"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, ArrowUpRight, ArrowDownRight, SlidersHorizontal } from "lucide-react";
import type { Position, Quote } from "./AssetView";

const formatWithCommas = (value: string) => {
  if (!value) return "";
  const parts = value.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};
const stripCommas = (value: string) => value.replace(/,/g, "");

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function TradingSidePanel({ 
  isOpen, 
  onClose, 
  coin, 
  quoteCurrency,
  positions,
  onPlaceOrder
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  coin: any, 
  quoteCurrency: Quote,
  positions: Position[],
  onPlaceOrder: (side: "buy" | "sell", lots: number, entry: number, sl?: number, tp?: number) => void
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  
  const currentPrice = coin.current_price * quoteCurrency.rate;
  
  const [entry, setEntry] = useState(currentPrice.toString());
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [qty, setQty] = useState("1");

  const entryNum = parseFloat(stripCommas(entry)) || 0;
  const qtyNum = parseFloat(stripCommas(qty)) || 0;
  const notional = entryNum * qtyNum;
  const fee = notional * 0.004;
  
  const slNum = parseFloat(stripCommas(sl)) || 0;
  const tpNum = parseFloat(stripCommas(tp)) || 0;
  const risk = slNum ? Math.abs(entryNum - slNum) * qtyNum : 0;
  const reward = tpNum ? Math.abs(tpNum - entryNum) * qtyNum : 0;
  const rr = risk > 0 && reward > 0 ? (reward / risk).toFixed(2) : "—";

  const handlePlaceOrder = () => {
    onPlaceOrder(side, qtyNum, entryNum, slNum || undefined, tpNum || undefined);
    setQty("1");
    setSl("");
    setTp("");
    onClose();
  };

  // Generate a mini chart for the side panel (Deterministic, no random)
  const candles = Array.from({ length: 30 }).map((_, i) => {
    const open = currentPrice * (0.95 + i * 0.002);
    const close = open + (Math.sin(i * 0.5) * 0.01) * currentPrice;
    return { 
      open, 
      close, 
      high: Math.max(open, close) + (currentPrice * 0.001), 
      low: Math.min(open, close) - (currentPrice * 0.001), 
      up: close >= open 
    };
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 z-[110] w-full sm:w-[420px] bg-[#f0fdf4] dark:bg-[#050806] border-r border-lime-500/20 dark:border-lime-500/10 shadow-2xl flex flex-col transition-colors duration-300"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-lime-600 dark:text-lime-400" />
                <h2 className="text-sm font-bold text-lime-950 dark:text-[#ecfdf5]">Live Terminal</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-lime-100 dark:hover:bg-white/10 text-lime-700/60 dark:text-lime-200/50 transition-colors">
                <X size={18} />
              </button>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6"
            >
              
              {/* MINI CHART */}
              <motion.div 
                variants={itemVariants}
                className="rounded-3xl border border-lime-500/20 dark:border-lime-500/10 bg-white/60 dark:bg-[#0a0f0b]/80 backdrop-blur-xl p-4 shadow-sm"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-extrabold text-lime-950 dark:text-[#ecfdf5] uppercase">{coin.symbol} / {quoteCurrency.name}</span>
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className={`text-xs font-mono font-bold flex items-center gap-1 cursor-default ${coin.price_change_percentage_24h >= 0 ? 'text-green-500 bg-green-500/10 px-2 py-1 rounded-md' : 'text-red-500 bg-red-500/10 px-2 py-1 rounded-md'}`}
                  >
                    {coin.price_change_percentage_24h >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                  </motion.span>
                </div>
                
                <div className="h-32 w-full relative mt-2">
                  <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <line x1="0" y1="25" x2="300" y2="25" stroke="currentColor" className="text-lime-500/10" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="currentColor" className="text-lime-500/10" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="0" y1="75" x2="300" y2="75" stroke="currentColor" className="text-lime-500/10" strokeWidth="1" strokeDasharray="2 2" />

                    {candles.map((c, i) => {
                      const allHighs = candles.map(x => x.high);
                      const allLows = candles.map(x => x.low);
                      const maxP = Math.max(...allHighs);
                      const minP = Math.min(...allLows);
                      const range = maxP - minP || 1;

                      const yHigh = 100 - ((c.high - minP) / range) * 100;
                      const yLow = 100 - ((c.low - minP) / range) * 100;
                      const yOpen = 100 - ((c.open - minP) / range) * 100;
                      const yClose = 100 - ((c.close - minP) / range) * 100;

                      const x = i * 10 + 5;
                      const bodyTop = Math.min(yOpen, yClose);
                      const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
                      const colorClass = c.up ? "text-green-500" : "text-red-500";

                      return (
                        <g key={i} className={colorClass}>
                          <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke="currentColor" strokeWidth="1" />
                          <rect x={x - 2} y={bodyTop} width="4" height={bodyHeight} fill="currentColor" className="transition-all duration-300" />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </motion.div>

              {/* ORDER TICKET */}
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-lime-100/50 dark:bg-[#050806]/80 border border-lime-500/20 dark:border-lime-500/10 shadow-inner">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSide("buy")} className={`py-2 text-xs font-bold rounded-full transition-all ${side === "buy" ? 'bg-green-500 text-white shadow-md' : 'text-lime-700/60 dark:text-lime-400/60 hover:text-lime-950 dark:hover:text-white'}`}>BUY / LONG</motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSide("sell")} className={`py-2 text-xs font-bold rounded-full transition-all ${side === "sell" ? 'bg-red-500 text-white shadow-md' : 'text-lime-700/60 dark:text-lime-400/60 hover:text-lime-950 dark:hover:text-white'}`}>SELL / SHORT</motion.button>
                </div>

                <motion.div variants={itemVariants}>
                  <label className="block text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase mb-1.5">Entry Price ({quoteCurrency.symbol})</label>
                  <input type="text" value={formatWithCommas(entry)} onChange={(e) => setEntry(stripCommas(e.target.value))} className="w-full bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 dark:border-lime-500/10 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors shadow-sm" />
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-red-500 dark:text-red-400 uppercase mb-1.5">Stop Loss</label>
                    <input type="text" placeholder="—" value={formatWithCommas(sl)} onChange={(e) => setSl(stripCommas(e.target.value))} className="w-full bg-white/50 dark:bg-[#050806]/50 border border-red-500/30 dark:border-red-500/20 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-lime-950 dark:text-white focus:outline-none focus:border-red-500 transition-colors shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-green-500 dark:text-green-400 uppercase mb-1.5">Take Profit</label>
                    <input type="text" placeholder="—" value={formatWithCommas(tp)} onChange={(e) => setTp(stripCommas(e.target.value))} className="w-full bg-white/50 dark:bg-[#050806]/50 border border-green-500/30 dark:border-green-500/20 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-lime-950 dark:text-white focus:outline-none focus:border-green-500 transition-colors shadow-sm" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase mb-1.5">Quantity</label>
                  <input type="text" value={formatWithCommas(qty)} onChange={(e) => setQty(stripCommas(e.target.value))} className="w-full bg-white/50 dark:bg-[#050806]/50 border border-lime-500/20 dark:border-lime-500/10 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors shadow-sm" />
                </motion.div>

                <motion.div variants={itemVariants} className="bg-lime-50/50 dark:bg-black/40 border border-lime-500/20 dark:border-lime-500/10 rounded-xl p-4 space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between text-lime-800/70 dark:text-lime-200/50"><span>Notional</span><span className="text-lime-950 dark:text-white font-bold">{quoteCurrency.symbol}{formatWithCommas(notional.toFixed(2))}</span></div>
                  <div className="flex justify-between text-lime-800/70 dark:text-lime-200/50"><span>Fee (0.4%)</span><span className="text-lime-600 dark:text-lime-400 font-bold">{quoteCurrency.symbol}{formatWithCommas(fee.toFixed(2))}</span></div>
                  <div className="flex justify-between text-lime-800/70 dark:text-lime-200/50"><span>Risk</span><span className="text-red-500 font-bold">-{quoteCurrency.symbol}{formatWithCommas(risk.toFixed(2))}</span></div>
                  <div className="flex justify-between text-lime-800/70 dark:text-lime-200/50"><span>Reward</span><span className="text-green-500 font-bold">+{quoteCurrency.symbol}{formatWithCommas(reward.toFixed(2))}</span></div>
                  <div className="flex justify-between text-lime-800/70 dark:text-lime-200/50 border-t border-lime-500/10 dark:border-lime-500/10 pt-2 mt-2">
                    <span>R:R Ratio</span><span className="text-amber-500 font-bold">{rr === "—" ? "—" : `${rr}:1`}</span>
                  </div>
                </motion.div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} variants={itemVariants} onClick={handlePlaceOrder} className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide uppercase shadow-lg ${side === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20' : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'}`}>
                  Open {side === 'buy' ? 'Long' : 'Short'} Position
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}