"use client";

import { useState } from "react";
import { Menu, Hexagon } from "lucide-react";
import TradingSidePanel from "./TradingSidePanel";
import ChartSidePanel from "./ChartSidePanel";
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
      <div className="relative z-10 w-full max-w-[1600px] h-[95vh] rounded-3xl border border-lime-500/20 dark:border-lime-500/10 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden bg-[#f4fbf5]/80 dark:bg-[#050806]/80 backdrop-blur-md">
        
        {/* FLOATING TRIGGER BUTTONS INSIDE THE TERMINAL */}
        <div className="absolute top-4 left-4 z-50 group">
          <button 
            onClick={() => setIsLeftPanelOpen(true)}
            className="w-10 h-10 rounded-xl bg-white/80 dark:bg-[#121A14]/90 backdrop-blur-md border border-lime-500/20 flex items-center justify-center text-lime-950 dark:text-white shadow-lg hover:bg-lime-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Menu size={20} />
          </button>
          <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 px-3 py-1.5 bg-lime-950 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Open Trade
          </div>
        </div>

        <div className="absolute top-4 right-4 z-50 group">
          <button 
            onClick={() => setIsRightPanelOpen(true)}
            className="w-10 h-10 rounded-xl bg-white/80 dark:bg-[#121A14]/90 backdrop-blur-md border border-lime-500/20 flex items-center justify-center text-cyan-500 shadow-lg hover:bg-cyan-500/20 transition-all hover:scale-105 hover:rotate-180 active:scale-95 duration-500"
          >
            <Hexagon size={20} />
          </button>
          <div className="absolute top-1/2 -translate-y-1/2 right-full mr-3 px-3 py-1.5 bg-lime-950 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            View Chart
          </div>
        </div>

        <TradingTerminal 
          coin={coin} 
          positions={positions} 
          onClosePosition={handleClosePosition}
        />
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