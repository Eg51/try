"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap,
  Coins,
  DollarSign,
  TrendingUp,
  BarChart2,
  PieChart
} from "lucide-react";
import { useTour } from "@/components/providers/TourProvider"; // 👈 Imported Tour Hook

export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  category: "crypto" | "fiat" | "memes";
};

export default function MarketTable({ 
  initialCoins, 
  isLoggedIn, 
  userTier 
}: { 
  initialCoins: MarketCoin[], 
  isLoggedIn: boolean, 
  userTier: number 
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "crypto" | "fiat" | "memes">("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof MarketCoin, direction: 'asc' | 'desc' } | null>({ key: 'market_cap', direction: 'desc' });
  const { setSteps } = useTour(); // 👈 Get setSteps from TourProvider

  // 👇 1. CONFIGURE TOUR STEPS
  useEffect(() => {
    setSteps([
      { id: "tour-markets-header", title: "Global Markets", text: "Browse all available assets here, including Crypto, Memes, and Fiat currencies." },
      { id: "tour-markets-tabs", title: "Filter by Category", text: "Use these tabs to quickly filter the list by asset class." },
      { id: "tour-markets-search", title: "Search Assets", text: "Type here to instantly find a specific coin or token." },
      { id: "tour-markets-table", title: "Live Market Data", text: "Click any column header (like Price or Volume) to sort the table." },
      { id: "tour-markets-trade-btn", title: "Start Trading", text: "Click 'Trade' on any asset to open the advanced trading terminal." },
    ]);

    // Clear steps when leaving the page to prevent conflicts
    return () => setSteps([]);
  }, [setSteps]);

  const filteredAndSortedCoins = useMemo(() => {
    let result = [...initialCoins];
    if (activeTab !== "all") result = result.filter(coin => coin.category === activeTab);
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(coin => 
        coin.name.toLowerCase().includes(lowerSearch) || 
        coin.symbol.toLowerCase().includes(lowerSearch)
      );
    }
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? 0;
        const bValue = b[sortConfig.key] ?? 0;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [initialCoins, activeTab, search, sortConfig]);

  const handleSort = (key: keyof MarketCoin) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="rounded-3xl bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] overflow-hidden w-full max-w-full">
      
      {/* Header Controls */}
      <div id="tour-markets-header" className="p-4 sm:p-6 border-b border-lime-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-black/40"> {/* 👈 Added Tour ID */}
        
        {/* Tabs */}
        <div id="tour-markets-tabs" className="flex p-1 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner w-full md:w-auto overflow-x-auto hide-scrollbar"> {/* 👈 Added Tour ID */}
          {(["all", "crypto", "memes", "fiat"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none capitalize px-4 sm:px-6 py-1.5 sm:py-2 text-[0.7rem] sm:text-sm font-bold rounded-full transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-white dark:bg-[#121A14] text-lime-950 dark:text-white shadow-sm" 
                  : "text-lime-700/60 dark:text-lime-400/60 hover:text-lime-950 dark:hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div id="tour-markets-search" className="relative w-full md:w-72"> {/* 👈 Added Tour ID */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-700/50 w-4 h-4 sm:w-5 sm:h-5" />
          <input 
            type="text" 
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/60 dark:bg-[#050806]/60 border border-lime-500/20 text-lime-950 dark:text-white placeholder-lime-700/50 rounded-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 focus:outline-none focus:border-lime-500 transition-colors text-xs sm:text-sm font-medium"
          />
        </div>
      </div>

      {/* Table Container */}
      <div id="tour-markets-table" className="w-full"> {/* 👈 Added Tour ID */}
        <table className="w-full table-fixed text-left border-collapse">
          
          <colgroup><col className="w-[22%] sm:w-[20%]" /><col className="w-[18%] sm:w-[15%]" /><col className="w-[15%] sm:w-[15%]" /><col className="w-[15%] sm:w-[15%]" /><col className="w-[15%] sm:w-[15%]" /><col className="w-[15%] sm:w-[20%]" /></colgroup>

          <thead>
            <tr className="border-b border-lime-500/10 text-[0.55rem] sm:text-xs uppercase tracking-wider text-lime-800/60 dark:text-lime-200/50">
              
              <th className="px-2 py-3 sm:p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-left" onClick={() => handleSort('name')}>
                <span className="hidden sm:inline">Asset</span>
                <motion.div className="flex sm:hidden justify-start" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Coins size={16} className="text-lime-500" strokeWidth={2.5} />
                </motion.div>
              </th>
              
              <th className="px-2 py-3 sm:p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-right" onClick={() => handleSort('current_price')}>
                <span className="hidden sm:inline">Price</span>
                <motion.div className="flex sm:hidden justify-end" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <DollarSign size={16} className="text-lime-500" strokeWidth={2.5} />
                </motion.div>
              </th>
              
              <th className="px-2 py-3 sm:p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-right" onClick={() => handleSort('price_change_percentage_24h')}>
                <span className="hidden sm:inline">24h Change</span>
                <motion.div className="flex sm:hidden justify-end" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <TrendingUp size={16} className="text-lime-500" strokeWidth={2.5} />
                </motion.div>
              </th>
              
              <th className="px-2 py-3 sm:p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-right" onClick={() => handleSort('total_volume')}>
                <span className="hidden sm:inline">24h Volume</span>
                <motion.div className="flex sm:hidden justify-end" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <BarChart2 size={16} className="text-lime-500" strokeWidth={2.5} />
                </motion.div>
              </th>
              
              <th className="px-2 py-3 sm:p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-right" onClick={() => handleSort('market_cap')}>
                <span className="hidden sm:inline">Market Cap</span>
                <motion.div className="flex sm:hidden justify-end" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <PieChart size={16} className="text-lime-500" strokeWidth={2.5} />
                </motion.div>
              </th>
              
              <th className="px-2 py-3 sm:p-4 font-bold text-center">
                <span className="hidden sm:inline">Action</span>
                <motion.div className="flex sm:hidden justify-center" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Zap size={16} className="text-lime-500" strokeWidth={2.5} />
                </motion.div>
              </th>

            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredAndSortedCoins.map((coin, idx) => (
                <motion.tr 
                  key={coin.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                  className="border-b border-lime-500/5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group"
                >
                  
                  {/* ASSET */}
                  <td className="px-2 py-3 sm:p-4">
                    <Link href={`/markets/${coin.id}`} className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
                      {coin.image ? (
                        <img 
                          src={coin.image} 
                          alt={coin.name} 
                          className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-white/5 shrink-0 object-cover" 
                        />
                      ) : (
                        <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center font-bold text-[0.5rem] sm:text-xs text-lime-600 dark:text-lime-400 shrink-0">
                          {coin.symbol.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="font-bold text-[0.65rem] sm:text-sm text-lime-950 dark:text-[#ecfdf5] leading-tight truncate">
                          {coin.symbol.toUpperCase()}
                        </div>
                        <div className="hidden sm:block text-xs text-lime-800/60 dark:text-lime-200/50 truncate leading-tight">
                          {coin.name}
                        </div>
                      </div>
                    </Link>
                  </td>

                  {/* PRICE */}
                  <td className="px-2 py-3 sm:p-4 text-right font-mono font-bold text-[0.65rem] sm:text-sm text-lime-950 dark:text-white truncate">
                    ${coin.current_price.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: coin.current_price < 1 ? 6 : 2 
                    })}
                  </td>

                  {/* 24H CHANGE */}
                  <td className={`px-2 py-3 sm:p-4 text-right font-mono font-bold text-[0.65rem] sm:text-sm truncate ${
                    coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <span className="inline-flex items-center justify-end">
                      {coin.price_change_percentage_24h >= 0 
                        ? <ArrowUpRight className="mr-0.5 w-3 h-3 sm:w-4 sm:h-4" /> 
                        : <ArrowDownRight className="mr-0.5 w-3 h-3 sm:w-4 sm:h-4" />
                      }
                      {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                    </span>
                  </td>

                  {/* VOLUME */}
                  <td className="px-2 py-3 sm:p-4 text-right font-mono text-[0.65rem] sm:text-sm text-lime-800/70 dark:text-lime-200/60 truncate">
                    ${(coin.total_volume / 1000000).toFixed(1)}M
                  </td>

                  {/* MARKET CAP */}
                  <td className="px-2 py-3 sm:p-4 text-right font-mono text-[0.65rem] sm:text-sm text-lime-800/70 dark:text-lime-200/60 truncate">
                    {coin.market_cap > 0 ? `$${(coin.market_cap / 1000000000).toFixed(1)}B` : '—'}
                  </td>
                  
                  {/* ACTION */}
                  <td id={idx === 0 ? "tour-markets-trade-btn" : undefined} className="px-2 py-3 sm:p-4 text-center"> {/* 👈 Added Tour ID to first row */}
                    <Link 
                      href={`/markets/${coin.id}`}
                      className="inline-flex items-center justify-center bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs rounded-lg shadow-sm transition-transform active:scale-95 px-2.5 py-2 sm:px-4 sm:py-2"
                    >
                      <span className="hidden sm:inline">Trade</span>
                      <Zap className="block sm:hidden w-3.5 h-3.5" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {filteredAndSortedCoins.length === 0 && (
          <div className="p-12 text-center text-lime-800/60 dark:text-lime-200/50 font-medium">
            No assets found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
// "use client";

// import { useState, useMemo } from "react";
// import Link from "next/link";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   Search, 
//   ArrowUpRight, 
//   ArrowDownRight, 
//   Zap,
//   Coins,
//   DollarSign,
//   TrendingUp,
//   BarChart2,
//   PieChart
// } from "lucide-react";

// export type MarketCoin = {
//   id: string;
//   symbol: string;
//   name: string;
//   image: string;
//   current_price: number;
//   price_change_percentage_24h: number;
//   total_volume: number;
//   market_cap: number;
//   category: "crypto" | "fiat" | "memes";
// };

// export default function MarketTable({ 
//   initialCoins, 
//   isLoggedIn, 
//   userTier 
// }: { 
//   initialCoins: MarketCoin[], 
//   isLoggedIn: boolean, 
//   userTier: number 
// }) {
//   const [search, setSearch] = useState("");
//   const [activeTab, setActiveTab] = useState<"all" | "crypto" | "fiat" | "memes">("all");
//   const [sortConfig, setSortConfig] = useState<{ key: keyof MarketCoin, direction: 'asc' | 'desc' } | null>({ key: 'market_cap', direction: 'desc' });

//   const filteredAndSortedCoins = useMemo(() => {
//     let result = [...initialCoins];
//     if (activeTab !== "all") result = result.filter(coin => coin.category === activeTab);
//     if (search) {
//       const lowerSearch = search.toLowerCase();
//       result = result.filter(coin => 
//         coin.name.toLowerCase().includes(lowerSearch) || 
//         coin.symbol.toLowerCase().includes(lowerSearch)
//       );
//     }
//     if (sortConfig) {
//       result.sort((a, b) => {
//         const aValue = a[sortConfig.key] ?? 0;
//         const bValue = b[sortConfig.key] ?? 0;
//         if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
//         if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
//         return 0;
//       });
//     }
//     return result;
//   }, [initialCoins, activeTab, search, sortConfig]);

//   const handleSort = (key: keyof MarketCoin) => {
//     let direction: 'asc' | 'desc' = 'desc';
//     if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
//       direction = 'asc';
//     }
//     setSortConfig({ key, direction });
//   };

//   return (
//     <div className="rounded-3xl bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] overflow-hidden w-full max-w-full">
      
//       {/* Header Controls */}
//       <div className="p-4 sm:p-6 border-b border-lime-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-black/40">
        
//         {/* Tabs */}
//         <div className="flex p-1 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner w-full md:w-auto overflow-x-auto hide-scrollbar">
//           {(["all", "crypto", "memes", "fiat"] as const).map((tab) => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className={`flex-1 md:flex-none capitalize px-4 sm:px-6 py-1.5 sm:py-2 text-[0.7rem] sm:text-sm font-bold rounded-full transition-colors whitespace-nowrap ${
//                 activeTab === tab 
//                   ? "bg-white dark:bg-[#121A14] text-lime-950 dark:text-white shadow-sm" 
//                   : "text-lime-700/60 dark:text-lime-400/60 hover:text-lime-950 dark:hover:text-white"
//               }`}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>

//         {/* Search */}
//         <div className="relative w-full md:w-72">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-700/50 w-4 h-4 sm:w-5 sm:h-5" />
//           <input 
//             type="text" 
//             placeholder="Search assets..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full bg-white/60 dark:bg-[#050806]/60 border border-lime-500/20 text-lime-950 dark:text-white placeholder-lime-700/50 rounded-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 focus:outline-none focus:border-lime-500 transition-colors text-xs sm:text-sm font-medium"
//           />
//         </div>
//       </div>

//       {/* Table Container */}
//       <div className="w-full">
//         <table className="w-full table-fixed text-left border-collapse">
          
//           <colgroup><col className="w-[22%] sm:w-[20%]" /><col className="w-[18%] sm:w-[15%]" /><col className="w-[15%] sm:w-[15%]" /><col className="w-[15%] sm:w-[15%]" /><col className="w-[15%] sm:w-[15%]" /><col className="w-[15%] sm:w-[20%]" /></colgroup>

//           <thead>
//             <tr className="border-b border-lime-500/10 text-[0.55rem] sm:text-xs uppercase tracking-wider text-lime-800/60 dark:text-lime-200/50">
              
//               <th className="px-2 py-3 sm:p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-left" onClick={() => handleSort('name')}>
//                 <span className="hidden sm:inline">Asset</span>
//                 <motion.div className="flex sm:hidden justify-start" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
//                   <Coins size={16} className="text-lime-500" strokeWidth={2.5} />
//                 </motion.div>
//               </th>
              
//               <th className="px-2 py-3 sm:p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-right" onClick={() => handleSort('current_price')}>
//                 <span className="hidden sm:inline">Price</span>
//                 <motion.div className="flex sm:hidden justify-end" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
//                   <DollarSign size={16} className="text-lime-500" strokeWidth={2.5} />
//                 </motion.div>
//               </th>
              
//               <th className="px-2 py-3 sm:p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-right" onClick={() => handleSort('price_change_percentage_24h')}>
//                 <span className="hidden sm:inline">24h Change</span>
//                 <motion.div className="flex sm:hidden justify-end" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
//                   <TrendingUp size={16} className="text-lime-500" strokeWidth={2.5} />
//                 </motion.div>
//               </th>
              
//               <th className="px-2 py-3 sm:p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-right" onClick={() => handleSort('total_volume')}>
//                 <span className="hidden sm:inline">24h Volume</span>
//                 <motion.div className="flex sm:hidden justify-end" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
//                   <BarChart2 size={16} className="text-lime-500" strokeWidth={2.5} />
//                 </motion.div>
//               </th>
              
//               <th className="px-2 py-3 sm:p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-right" onClick={() => handleSort('market_cap')}>
//                 <span className="hidden sm:inline">Market Cap</span>
//                 <motion.div className="flex sm:hidden justify-end" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
//                   <PieChart size={16} className="text-lime-500" strokeWidth={2.5} />
//                 </motion.div>
//               </th>
              
//               <th className="px-2 py-3 sm:p-4 font-bold text-center">
//                 <span className="hidden sm:inline">Action</span>
//                 <motion.div className="flex sm:hidden justify-center" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
//                   <Zap size={16} className="text-lime-500" strokeWidth={2.5} />
//                 </motion.div>
//               </th>

//             </tr>
//           </thead>
//           <tbody>
//             <AnimatePresence>
//               {filteredAndSortedCoins.map((coin, idx) => (
//                 <motion.tr 
//                   key={coin.id}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, scale: 0.95 }}
//                   transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
//                   className="border-b border-lime-500/5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group"
//                 >
                  
//                   {/* ASSET */}
//                   <td className="px-2 py-3 sm:p-4">
//                     <Link href={`/markets/${coin.id}`} className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
//                       {coin.image ? (
//                         <img 
//                           src={coin.image} 
//                           alt={coin.name} 
//                           className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-white/5 shrink-0 object-cover" 
//                         />
//                       ) : (
//                         <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center font-bold text-[0.5rem] sm:text-xs text-lime-600 dark:text-lime-400 shrink-0">
//                           {coin.symbol.substring(0, 2).toUpperCase()}
//                         </div>
//                       )}
                      
//                       <div className="flex flex-col min-w-0 flex-1">
//                         <div className="font-bold text-[0.65rem] sm:text-sm text-lime-950 dark:text-[#ecfdf5] leading-tight truncate">
//                           {coin.symbol.toUpperCase()}
//                         </div>
//                         <div className="hidden sm:block text-xs text-lime-800/60 dark:text-lime-200/50 truncate leading-tight">
//                           {coin.name}
//                         </div>
//                       </div>
//                     </Link>
//                   </td>

//                   {/* PRICE */}
//                   <td className="px-2 py-3 sm:p-4 text-right font-mono font-bold text-[0.65rem] sm:text-sm text-lime-950 dark:text-white truncate">
//                     ${coin.current_price.toLocaleString(undefined, { 
//                       minimumFractionDigits: 2, 
//                       maximumFractionDigits: coin.current_price < 1 ? 6 : 2 
//                     })}
//                   </td>

//                   {/* 24H CHANGE */}
//                   <td className={`px-2 py-3 sm:p-4 text-right font-mono font-bold text-[0.65rem] sm:text-sm truncate ${
//                     coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
//                   }`}>
//                     <span className="inline-flex items-center justify-end">
//                       {coin.price_change_percentage_24h >= 0 
//                         ? <ArrowUpRight className="mr-0.5 w-3 h-3 sm:w-4 sm:h-4" /> 
//                         : <ArrowDownRight className="mr-0.5 w-3 h-3 sm:w-4 sm:h-4" />
//                       }
//                       {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
//                     </span>
//                   </td>

//                   {/* VOLUME */}
//                   <td className="px-2 py-3 sm:p-4 text-right font-mono text-[0.65rem] sm:text-sm text-lime-800/70 dark:text-lime-200/60 truncate">
//                     ${(coin.total_volume / 1000000).toFixed(1)}M
//                   </td>

//                   {/* MARKET CAP */}
//                   <td className="px-2 py-3 sm:p-4 text-right font-mono text-[0.65rem] sm:text-sm text-lime-800/70 dark:text-lime-200/60 truncate">
//                     {coin.market_cap > 0 ? `$${(coin.market_cap / 1000000000).toFixed(1)}B` : '—'}
//                   </td>
                  
//                   {/* ACTION */}
//                   <td className="px-2 py-3 sm:p-4 text-center">
//                     <Link 
//                       href={`/markets/${coin.id}`}
//                       className="inline-flex items-center justify-center bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs rounded-lg shadow-sm transition-transform active:scale-95 px-2.5 py-2 sm:px-4 sm:py-2"
//                     >
//                       <span className="hidden sm:inline">Trade</span>
//                       <Zap className="block sm:hidden w-3.5 h-3.5" />
//                     </Link>
//                   </td>
//                 </motion.tr>
//               ))}
//             </AnimatePresence>
//           </tbody>
//         </table>
        
//         {filteredAndSortedCoins.length === 0 && (
//           <div className="p-12 text-center text-lime-800/60 dark:text-lime-200/50 font-medium">
//             No assets found matching your search.
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }