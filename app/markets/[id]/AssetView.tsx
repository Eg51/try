"use client";

import { useState } from "react";
import { Menu, Hexagon } from "lucide-react";
import TradingSidePanel from "./TradingSidePanel";
import ChartSidePanel from "./ChartSidePanel";
import { Flame } from "lucide-react";
import TradingTerminal from "@/components/features/TradingTerminal"; 

export type Quote = {
  id: string;
  symbol: string;
  name: string;
  rate: number;
  category: "fiat" | "crypto" | "memes";
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  pattern: { name: string; bias: "bullish" | "bearish" | "neutral" };
};

export type Position = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  lots: number;
  entry: number;
  current: number;
  sl?: number;
  tp?: number;
  pnl: number;
  status: "open" | "closed";
};

const WATERMARK_SYMBOLS = [
  // ==============================
  // 1. GLOBAL FIAT
  // ==============================
  "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$", "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "₤", "₦", "₱", "₲", "₵", "₡", "₸",

  // ==============================
  // 2. CRYPTO & WEB3
  // ==============================
  "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦",

  // ==============================
  // 3. MEME COINS & COMMUNITY
  // ==============================
  "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎", "🙌", "🔥", "🚀", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵", "💴", "💶", "💷", "🪙"
];

export default function AssetView({ 
  coin, initialIsFavorited, isLoggedIn, availableQuotes 
}: { 
  coin: any, initialIsFavorited: boolean, isLoggedIn: boolean, availableQuotes: Quote[] 
}) {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  
  const [quoteCurrency, setQuoteCurrency] = useState<Quote>(
    availableQuotes?.find(q => q.id === 'usd') || availableQuotes?.[0] || { id: 'usd', symbol: '$', name: 'USD', rate: 1, category: 'fiat' }
  );

  const [positions, setPositions] = useState<Position[]>([]);

  const handlePlaceOrder = (side: "buy" | "sell", lots: number, entry: number, sl?: number, tp?: number) => {
    const newPos: Position = {
      id: Date.now().toString(),
      symbol: coin.symbol.toUpperCase(),
      side,
      lots,
      entry,
      current: entry,
      sl,
      tp,
      pnl: 0,
      status: "open"
    };
    setPositions(prev => [newPos, ...prev]);
  };

  const handleClosePosition = (id: string) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, status: "closed" } : p));
  };

  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans transition-colors duration-300 flex flex-col items-center justify-center p-2 sm:p-4">
      
      {/* BACKGROUND WATERMARKS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-8 p-4 place-items-center opacity-10 dark:opacity-5">
        {Array.from({ length: 48 }).map((_, i) => {
          const symbol = WATERMARK_SYMBOLS[i % WATERMARK_SYMBOLS.length];
          return (
            <span key={i} className="text-4xl md:text-6xl font-bold text-lime-900 dark:text-lime-100"
                  style={{ transform: `rotate(${(i * 15) % 60 - 30}deg)` }}>
              {symbol}
            </span>
          );
        })}
      </div>

          {/* FULL SCREEN TERMINAL WITH WATERMARK BACKGROUND */}
      <div className="relative z-10 w-full max-w-[1600px] h-[95vh] rounded-3xl border border-lime-500/20 dark:border-lime-500/10 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden bg-[#f4fbf5]/80 dark:bg-[#050806]/80 backdrop-blur-md flex flex-col">
        
        {/* DEMO MODE BANNER */}
        <div className="h-8 shrink-0 bg-lime-600 text-white text-[10px] sm:text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-md z-50">
          <Flame className="text-amber-500" size={14} /> DEMO MODE - No real funds are at risk
        </div>

        {/* THE UNIFIED TOP ACTION BAR */}
        <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-lime-500/10 bg-white/50 dark:bg-[#121A14]/60 backdrop-blur-md z-50">
          <button 
            onClick={() => setIsLeftPanelOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-lime-800 dark:text-lime-200 hover:bg-lime-500/10 transition-all active:scale-95"
          >
            <Menu size={18} /> Open Trade
          </button>
          <div className="text-xs font-bold text-lime-600/60 dark:text-lime-400/40 uppercase tracking-widest font-mono hidden sm:block">
            {coin.name} / {quoteCurrency.name}
          </div>
          <button 
            onClick={() => setIsRightPanelOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition-all active:scale-95 group"
          >
            <Hexagon size={18} className="group-hover:rotate-180 transition-transform duration-500" /> View Chart
          </button>
        </div>

        {/* THE TERMINAL */}
        <div className="flex-1 relative overflow-hidden">
          <TradingTerminal 
            coin={coin} 
            positions={positions} 
            onClosePosition={handleClosePosition}
            // ADDED: This connects the terminal's Buy/Sell buttons to the trading logic
            onPlaceTrade={(side) => {
              const currentPrice = coin.current_price;
              handlePlaceOrder(side, 1, currentPrice);
            }}
          />
        </div>
      </div>

      {/* RENDER SIDE PANELS (Overlays) */}
      <TradingSidePanel 
        isOpen={isLeftPanelOpen} 
        onClose={() => setIsLeftPanelOpen(false)} 
        coin={coin} 
        quoteCurrency={quoteCurrency} 
        positions={positions}
        onPlaceOrder={handlePlaceOrder}
      />
      
      <ChartSidePanel 
        isOpen={isRightPanelOpen} 
        onClose={() => setIsRightPanelOpen(false)} 
        coin={coin} 
        quoteCurrency={quoteCurrency}
        setQuoteCurrency={setQuoteCurrency}
        availableQuotes={availableQuotes}
        initialIsFavorited={initialIsFavorited}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}