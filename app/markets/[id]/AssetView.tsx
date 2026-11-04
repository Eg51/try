"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Hexagon, Flame, ShieldCheck, Settings, Search, ArrowUpRight, X, ChevronDown } from "lucide-react";
import TradingSidePanel from "./TradingSidePanel";
import ChartSidePanel from "./ChartSidePanel";
import TradingTerminal from "@/components/features/TradingTerminal"; 
import { AuthPromptModal } from "@/components/modals/AuthPromptModal"; 
import SettingsModal from "@/components/SettingsModal";
import { useTour } from "@/components/providers/TourProvider"; // 👈 Imported Tour Hook

export type Quote = {
  id: string;
  symbol: string;
  name: string;
  rate: number;
  category: "fiat" | "crypto" | "memes";
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
  "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$", "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "₤", "₦", "₱", "₲", "₵", "₡", "₸",
  "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦",
  "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎", "🙌", "🔥", "🚀", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵", "💴", "💶", "💷", "🪙"
];

export default function AssetView({ 
  coin, initialIsFavorited, isLoggedIn, userTier, availableQuotes,
  initialTrades = [], currencySymbol = "$", initialCurrency = "USD", initialLanguage = "English (US)"
}: { 
  coin: any, initialIsFavorited: boolean, isLoggedIn: boolean, userTier: number, availableQuotes: Quote[],
  initialTrades?: any[], currencySymbol?: string, initialCurrency?: string, initialLanguage?: string
}) {
  const router = useRouter();
  const { setSteps } = useTour(); // 👈 Get setSteps from TourProvider
  
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasDemoTraded, setHasDemoTraded] = useState(false);

  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [selectionStep, setSelectionStep] = useState<"base" | "quote">("base");
  const [searchQuery, setSearchQuery] = useState("");

  const [quoteCurrency, setQuoteCurrency] = useState<Quote>(
    availableQuotes?.find(q => q.id === 'usd') || availableQuotes?.[0] || { id: 'usd', symbol: 'USD', name: 'US Dollar', rate: 1, category: 'fiat' }
  );

  const [positions, setPositions] = useState<Position[]>([]);

  // 👇 1. CONFIGURE TOUR STEPS
  useEffect(() => {
    setSteps([
      { id: "tour-asset-topbar", title: "Terminal Controls", text: "This is your control center. Here you can change the trading pair, open the chart, and access settings." },
      { id: "tour-asset-pair", title: "Select Pair", text: "Click here to change the base asset (e.g., Bitcoin) or the quote currency (e.g., USD)." },
      { id: "tour-asset-trade", title: "Open Trade Panel", text: "Click here to open the side panel where you can place Market and Limit orders." },
      { id: "tour-asset-chart", title: "Expand Chart", text: "Click here to open the dedicated chart analysis panel." },
      { id: "tour-asset-terminal", title: "Trading Terminal", text: "This is the live chart. You can use the tools inside to draw support and resistance lines." },
    ]);

    // Clear steps when leaving the page
    return () => setSteps([]);
  }, [setSteps]);

  useEffect(() => {
    if (!isLoggedIn) {
      const traded = localStorage.getItem("demo_has_traded");
      if (traded === "true") setHasDemoTraded(true);
    }
  }, [isLoggedIn]);

  const handlePlaceOrder = (side: "buy" | "sell", lots: number, entry: number, sl?: number, tp?: number) => {
    if (!isLoggedIn) {
      if (hasDemoTraded) {
        setShowAuthModal(true); 
        return;
      }
      localStorage.setItem("demo_has_traded", "true");
      setHasDemoTraded(true);
      setTimeout(() => setShowAuthModal(true), 1500); 
    }

    if (isLoggedIn) {
      if (userTier === 1 && coin.category === "memes") {
        alert("Tier 1 accounts cannot trade Meme coins. Please upgrade your tier.");
        return; 
      }
      if (userTier === 1 && lots > 1) {
        alert("Tier 1 maximum lot size is 1.0. Upgrade to Tier 2 for larger trades.");
        return;
      }
    }

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

  const handleLeftPanelOpen = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
    } else {
      setIsLeftPanelOpen(true);
    }
  };

  const openPairModal = (step: "base" | "quote") => {
    setSelectionStep(step);
    setSearchQuery("");
    setIsPairModalOpen(true);
  };

  const handleSelectPair = (quote: Quote) => {
    if (selectionStep === "base") {
      if (quote.category === "fiat") {
        alert("Please select a Crypto asset as the base pair.");
        return;
      }
      router.push(`/markets/${quote.id}`);
      setIsPairModalOpen(false);
    } else {
      setQuoteCurrency(quote);
      setIsPairModalOpen(false);
    }
  };

  const filteredQuotes = availableQuotes.filter(q => {
    const matchesCategory = selectionStep === "base" ? q.category !== "fiat" : true;
    const matchesSearch = q.name.toLowerCase().includes(searchQuery.toLowerCase()) || q.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans transition-colors duration-300 flex flex-col items-center justify-center p-1 sm:p-4">
      
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

      <div className="relative z-10 w-full max-w-[1600px] h-[95vh] rounded-2xl sm:rounded-3xl border border-lime-500/20 dark:border-lime-500/10 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden bg-[#f4fbf5]/80 dark:bg-[#050806]/80 backdrop-blur-md flex flex-col">
        
        {!isLoggedIn ? (
          <div className="h-8 shrink-0 bg-lime-600 text-white text-[10px] sm:text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-md z-50">
            <Flame className="text-amber-500" size={14} /> DEMO MODE - One free trade allowed
          </div>
        ) : (
          <div className="h-8 shrink-0 bg-blue-600 text-white text-[10px] sm:text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-md z-50">
            <ShieldCheck className="text-blue-200" size={14} /> LIVE TRADING - TIER {userTier} ACCOUNT
          </div>
        )}

        {/* 👇 TOP BAR WITH TOUR IDS 👇 */}
        <div id="tour-asset-topbar" className="h-12 shrink-0 flex items-center justify-between px-2 sm:px-4 border-b border-lime-500/10 bg-white/50 dark:bg-[#121A14]/60 backdrop-blur-md z-50 gap-2">
          
          <button 
            id="tour-asset-trade" // 👈 Added Tour ID
            onClick={handleLeftPanelOpen}
            className="flex items-center shrink-0 gap-1.5 px-2 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-lime-800 dark:text-lime-200 hover:bg-lime-500/10 transition-all active:scale-95"
          >
            <Menu size={16} className="sm:w-[18px] sm:h-[18px]" /> 
            <span className="hidden sm:inline">Open Trade</span>
            <span className="inline sm:hidden">Trade</span>
          </button>

          <div id="tour-asset-pair" className="flex-1 flex items-center justify-center min-w-0 px-1 sm:px-4"> {/* 👈 Added Tour ID */}
            <button 
              onClick={() => openPairModal("base")}
              className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-lime-600 dark:text-lime-400 uppercase tracking-widest font-mono hover:text-lime-700 dark:hover:text-lime-300 transition-colors truncate max-w-[45%]"
            >
              {coin.symbol}
              <ChevronDown size={10} className="shrink-0" />
            </button>
            <span className="text-lime-600/30 dark:text-lime-400/30 mx-1.5">/</span>
            <button 
              onClick={() => openPairModal("quote")}
              className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-lime-600 dark:text-lime-400 uppercase tracking-widest font-mono hover:text-lime-700 dark:hover:text-lime-300 transition-colors truncate max-w-[45%]"
            >
              {quoteCurrency.symbol}
              <ChevronDown size={10} className="shrink-0" />
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={() => setShowSettings(true)} 
              className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:bg-gray-500/10 transition-all active:scale-95"
            >
              <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button 
              id="tour-asset-chart" // 👈 Added Tour ID
              onClick={() => setIsRightPanelOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition-all active:scale-95 group"
            >
              <Hexagon size={16} className="sm:w-[18px] sm:h-[18px] group-hover:rotate-180 transition-transform duration-500" /> 
              <span className="hidden sm:inline">Chart</span>
            </button>
          </div>
        </div>

        <div id="tour-asset-terminal" className="flex-1 relative overflow-hidden"> {/* 👈 Added Tour ID */}
          <TradingTerminal 
            coin={coin} 
            quoteAssetSymbol={quoteCurrency.symbol}
            positions={positions} 
            onClosePosition={handleClosePosition}
            initialTrades={initialTrades}
            currencySymbol={currencySymbol}
            availableQuotes={availableQuotes}
          />
        </div>
      </div>

      <TradingSidePanel 
        isOpen={isLeftPanelOpen} onClose={() => setIsLeftPanelOpen(false)} 
        coin={coin} quoteCurrency={quoteCurrency} positions={positions}
        onPlaceOrder={handlePlaceOrder} isLoggedIn={isLoggedIn}
        onRequireAuth={() => setShowAuthModal(true)}
      />
      
      <ChartSidePanel 
        isOpen={isRightPanelOpen} onClose={() => setIsRightPanelOpen(false)} 
        coin={coin} quoteCurrency={quoteCurrency} setQuoteCurrency={setQuoteCurrency}
        availableQuotes={availableQuotes} initialIsFavorited={initialIsFavorited}
        isLoggedIn={isLoggedIn} onRequireAuth={() => setShowAuthModal(true)}
      />

      <AuthPromptModal 
        isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} 
      />

      <SettingsModal 
        isOpen={showSettings} onClose={() => setShowSettings(false)} 
        initialCurrency={initialCurrency} initialLanguage={initialLanguage}
      />

      <AnimatePresence>
        {isPairModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/40 dark:bg-[#121A14]/60">
                <h2 className="text-lg font-bold text-lime-950 dark:text-white">
                  Select {selectionStep === "base" ? "Base Asset" : "Quote Asset"}
                </h2>
                <button onClick={() => setIsPairModalOpen(false)} className="p-1.5 rounded-lg hover:bg-lime-500/10 text-lime-600 dark:text-lime-400 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50 dark:text-lime-400/50" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search assets..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-full py-2 pl-9 pr-4 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredQuotes.map((quote) => (
                  <button 
                    key={quote.id} 
                    onClick={() => handleSelectPair(quote)}
                    className="w-full p-3 rounded-2xl border flex items-center justify-between transition-colors border-lime-500/20 dark:border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 hover:bg-white/80 dark:hover:bg-[#121A14]/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black shadow-sm bg-lime-500 text-white">
                        {quote.symbol.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-sm text-lime-950 dark:text-white uppercase">{quote.symbol}</div>
                        <div className="text-xs text-lime-800/60 dark:text-lime-200/50">{quote.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-lime-950 dark:text-white">
                        {quote.category === "fiat" ? `${(1 / quote.rate).toFixed(2)}` : `$${(1 / quote.rate).toFixed(2)}`}
                      </div>
                      <div className="text-[10px] font-bold text-green-500 flex items-center justify-end">
                        <ArrowUpRight size={10} className="mr-1"/> +2.4%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { Menu, Hexagon, Flame, ShieldCheck, Settings, Search, ArrowUpRight, X, ChevronDown } from "lucide-react";
// import TradingSidePanel from "./TradingSidePanel";
// import ChartSidePanel from "./ChartSidePanel";
// import TradingTerminal from "@/components/features/TradingTerminal"; 
// import { AuthPromptModal } from "@/components/modals/AuthPromptModal"; 
// import SettingsModal from "@/components/SettingsModal";

// export type Quote = {
//   id: string;
//   symbol: string;
//   name: string;
//   rate: number;
//   category: "fiat" | "crypto" | "memes";
// };

// export type Position = {
//   id: string;
//   symbol: string;
//   side: "buy" | "sell";
//   lots: number;
//   entry: number;
//   current: number;
//   sl?: number;
//   tp?: number;
//   pnl: number;
//   status: "open" | "closed";
// };

// const WATERMARK_SYMBOLS = [
//   "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$", "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "₤", "₦", "₱", "₲", "₵", "₡", "₸",
//   "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦",
//   "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎", "🙌", "🔥", "🚀", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵", "💴", "💶", "💷", "🪙"
// ];

// export default function AssetView({ 
//   coin, initialIsFavorited, isLoggedIn, userTier, availableQuotes,
//   initialTrades = [], currencySymbol = "$", initialCurrency = "USD", initialLanguage = "English (US)"
// }: { 
//   coin: any, initialIsFavorited: boolean, isLoggedIn: boolean, userTier: number, availableQuotes: Quote[],
//   initialTrades?: any[], currencySymbol?: string, initialCurrency?: string, initialLanguage?: string
// }) {
//   const router = useRouter();
  
//   const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
//   const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
//   const [showAuthModal, setShowAuthModal] = useState(false);
//   const [showSettings, setShowSettings] = useState(false);
//   const [hasDemoTraded, setHasDemoTraded] = useState(false);

//   const [isPairModalOpen, setIsPairModalOpen] = useState(false);
//   const [selectionStep, setSelectionStep] = useState<"base" | "quote">("base");
//   const [searchQuery, setSearchQuery] = useState("");

//   const [quoteCurrency, setQuoteCurrency] = useState<Quote>(
//     availableQuotes?.find(q => q.id === 'usd') || availableQuotes?.[0] || { id: 'usd', symbol: 'USD', name: 'US Dollar', rate: 1, category: 'fiat' }
//   );

//   const [positions, setPositions] = useState<Position[]>([]);

//   useEffect(() => {
//     if (!isLoggedIn) {
//       const traded = localStorage.getItem("demo_has_traded");
//       if (traded === "true") setHasDemoTraded(true);
//     }
//   }, [isLoggedIn]);

//   const handlePlaceOrder = (side: "buy" | "sell", lots: number, entry: number, sl?: number, tp?: number) => {
//     if (!isLoggedIn) {
//       if (hasDemoTraded) {
//         setShowAuthModal(true); 
//         return;
//       }
//       localStorage.setItem("demo_has_traded", "true");
//       setHasDemoTraded(true);
//       setTimeout(() => setShowAuthModal(true), 1500); 
//     }

//     if (isLoggedIn) {
//       if (userTier === 1 && coin.category === "memes") {
//         alert("Tier 1 accounts cannot trade Meme coins. Please upgrade your tier.");
//         return; 
//       }
//       if (userTier === 1 && lots > 1) {
//         alert("Tier 1 maximum lot size is 1.0. Upgrade to Tier 2 for larger trades.");
//         return;
//       }
//     }

//     const newPos: Position = {
//       id: Date.now().toString(),
//       symbol: coin.symbol.toUpperCase(),
//       side,
//       lots,
//       entry,
//       current: entry,
//       sl,
//       tp,
//       pnl: 0,
//       status: "open"
//     };
//     setPositions(prev => [newPos, ...prev]);
//   };

//   const handleClosePosition = (id: string) => {
//     setPositions(prev => prev.map(p => p.id === id ? { ...p, status: "closed" } : p));
//   };

//   const handleLeftPanelOpen = () => {
//     if (!isLoggedIn) {
//       setShowAuthModal(true);
//     } else {
//       setIsLeftPanelOpen(true);
//     }
//   };

//   const openPairModal = (step: "base" | "quote") => {
//     setSelectionStep(step);
//     setSearchQuery("");
//     setIsPairModalOpen(true);
//   };

//   const handleSelectPair = (quote: Quote) => {
//     if (selectionStep === "base") {
//       if (quote.category === "fiat") {
//         alert("Please select a Crypto asset as the base pair.");
//         return;
//       }
//       router.push(`/markets/${quote.id}`);
//       setIsPairModalOpen(false);
//     } else {
//       setQuoteCurrency(quote);
//       setIsPairModalOpen(false);
//     }
//   };

//   const filteredQuotes = availableQuotes.filter(q => {
//     const matchesCategory = selectionStep === "base" ? q.category !== "fiat" : true;
//     const matchesSearch = q.name.toLowerCase().includes(searchQuery.toLowerCase()) || q.symbol.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesCategory && matchesSearch;
//   });

//   return (
//     <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans transition-colors duration-300 flex flex-col items-center justify-center p-1 sm:p-4">
      
//       <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-8 p-4 place-items-center opacity-10 dark:opacity-5">
//         {Array.from({ length: 48 }).map((_, i) => {
//           const symbol = WATERMARK_SYMBOLS[i % WATERMARK_SYMBOLS.length];
//           return (
//             <span key={i} className="text-4xl md:text-6xl font-bold text-lime-900 dark:text-lime-100"
//                   style={{ transform: `rotate(${(i * 15) % 60 - 30}deg)` }}>
//               {symbol}
//             </span>
//           );
//         })}
//       </div>

//       <div className="relative z-10 w-full max-w-[1600px] h-[95vh] rounded-2xl sm:rounded-3xl border border-lime-500/20 dark:border-lime-500/10 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden bg-[#f4fbf5]/80 dark:bg-[#050806]/80 backdrop-blur-md flex flex-col">
        
//         {!isLoggedIn ? (
//           <div className="h-8 shrink-0 bg-lime-600 text-white text-[10px] sm:text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-md z-50">
//             <Flame className="text-amber-500" size={14} /> DEMO MODE - One free trade allowed
//           </div>
//         ) : (
//           <div className="h-8 shrink-0 bg-blue-600 text-white text-[10px] sm:text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-md z-50">
//             <ShieldCheck className="text-blue-200" size={14} /> LIVE TRADING - TIER {userTier} ACCOUNT
//           </div>
//         )}

//         <div className="h-12 shrink-0 flex items-center justify-between px-2 sm:px-4 border-b border-lime-500/10 bg-white/50 dark:bg-[#121A14]/60 backdrop-blur-md z-50 gap-2">
          
//           <button 
//             onClick={handleLeftPanelOpen}
//             className="flex items-center shrink-0 gap-1.5 px-2 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-lime-800 dark:text-lime-200 hover:bg-lime-500/10 transition-all active:scale-95"
//           >
//             <Menu size={16} className="sm:w-[18px] sm:h-[18px]" /> 
//             <span className="hidden sm:inline">Open Trade</span>
//             <span className="inline sm:hidden">Trade</span>
//           </button>

//           <div className="flex-1 flex items-center justify-center min-w-0 px-1 sm:px-4">
//             <button 
//               onClick={() => openPairModal("base")}
//               className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-lime-600 dark:text-lime-400 uppercase tracking-widest font-mono hover:text-lime-700 dark:hover:text-lime-300 transition-colors truncate max-w-[45%]"
//             >
//               {coin.symbol}
//               <ChevronDown size={10} className="shrink-0" />
//             </button>
//             <span className="text-lime-600/30 dark:text-lime-400/30 mx-1.5">/</span>
//             <button 
//               onClick={() => openPairModal("quote")}
//               className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-lime-600 dark:text-lime-400 uppercase tracking-widest font-mono hover:text-lime-700 dark:hover:text-lime-300 transition-colors truncate max-w-[45%]"
//             >
//               {quoteCurrency.symbol}
//               <ChevronDown size={10} className="shrink-0" />
//             </button>
//           </div>

//           <div className="flex items-center gap-1 shrink-0">
//             <button 
//               onClick={() => setShowSettings(true)} 
//               className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:bg-gray-500/10 transition-all active:scale-95"
//             >
//               <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
//             </button>
//             <button 
//               onClick={() => setIsRightPanelOpen(true)}
//               className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition-all active:scale-95 group"
//             >
//               <Hexagon size={16} className="sm:w-[18px] sm:h-[18px] group-hover:rotate-180 transition-transform duration-500" /> 
//               <span className="hidden sm:inline">Chart</span>
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 relative overflow-hidden">
//           <TradingTerminal 
//             coin={coin} 
//             quoteAssetSymbol={quoteCurrency.symbol}
//             positions={positions} 
//             onClosePosition={handleClosePosition}
//             initialTrades={initialTrades}
//             currencySymbol={currencySymbol}
//           />
//         </div>
//       </div>

//       <TradingSidePanel 
//         isOpen={isLeftPanelOpen} onClose={() => setIsLeftPanelOpen(false)} 
//         coin={coin} quoteCurrency={quoteCurrency} positions={positions}
//         onPlaceOrder={handlePlaceOrder} isLoggedIn={isLoggedIn}
//         onRequireAuth={() => setShowAuthModal(true)}
//       />
      
//       <ChartSidePanel 
//         isOpen={isRightPanelOpen} onClose={() => setIsRightPanelOpen(false)} 
//         coin={coin} quoteCurrency={quoteCurrency} setQuoteCurrency={setQuoteCurrency}
//         availableQuotes={availableQuotes} initialIsFavorited={initialIsFavorited}
//         isLoggedIn={isLoggedIn} onRequireAuth={() => setShowAuthModal(true)}
//       />

//       <AuthPromptModal 
//         isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} 
//       />

//       <SettingsModal 
//         isOpen={showSettings} onClose={() => setShowSettings(false)} 
//         initialCurrency={initialCurrency} initialLanguage={initialLanguage}
//       />

//       <AnimatePresence>
//         {isPairModalOpen && (
//           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
//             <motion.div 
//               initial={{ opacity: 0, scale: 0.95, y: 20 }} 
//               animate={{ opacity: 1, scale: 1, y: 0 }} 
//               exit={{ opacity: 0, scale: 0.95, y: 20 }}
//               className="relative w-full max-w-md bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
//             >
//               <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/40 dark:bg-[#121A14]/60">
//                 <h2 className="text-lg font-bold text-lime-950 dark:text-white">
//                   Select {selectionStep === "base" ? "Base Asset" : "Quote Asset"}
//                 </h2>
//                 <button onClick={() => setIsPairModalOpen(false)} className="p-1.5 rounded-lg hover:bg-lime-500/10 text-lime-600 dark:text-lime-400 transition-colors">
//                   <X size={18} />
//                 </button>
//               </div>

//               <div className="p-3">
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50 dark:text-lime-400/50" size={16} />
//                   <input 
//                     type="text" 
//                     placeholder="Search assets..." 
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="w-full bg-white/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-full py-2 pl-9 pr-4 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors"
//                   />
//                 </div>
//               </div>

//               <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
//                 {filteredQuotes.map((quote) => (
//                   <button 
//                     key={quote.id} 
//                     onClick={() => handleSelectPair(quote)}
//                     className="w-full p-3 rounded-2xl border flex items-center justify-between transition-colors border-lime-500/20 dark:border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 hover:bg-white/80 dark:hover:bg-[#121A14]/80"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black shadow-sm bg-lime-500 text-white">
//                         {quote.symbol.substring(0, 1).toUpperCase()}
//                       </div>
//                       <div className="text-left">
//                         <div className="font-bold text-sm text-lime-950 dark:text-white uppercase">{quote.symbol}</div>
//                         <div className="text-xs text-lime-800/60 dark:text-lime-200/50">{quote.name}</div>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <div className="font-mono text-sm font-bold text-lime-950 dark:text-white">
//                         {quote.category === "fiat" ? `${(1 / quote.rate).toFixed(2)}` : `$${(1 / quote.rate).toFixed(2)}`}
//                       </div>
//                       <div className="text-[10px] font-bold text-green-500 flex items-center justify-end">
//                         <ArrowUpRight size={10} className="mr-1"/> +2.4%
//                       </div>
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }