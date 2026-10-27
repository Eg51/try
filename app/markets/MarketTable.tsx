"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowUpRight, ArrowDownRight, ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string; // <-- ADDED THIS LINE
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  category: "crypto" | "fiat" | "memes";
};

export default function MarketTable({ initialCoins }: { initialCoins: MarketCoin[] }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "crypto" | "fiat" | "memes">("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof MarketCoin, direction: 'asc' | 'desc' } | null>({ key: 'market_cap', direction: 'desc' });

  // Filter and Sort Logic
  const filteredAndSortedCoins = useMemo(() => {
    let result = initialCoins;

    // 1. Filter by Tab
    if (activeTab !== "all") {
      result = result.filter(coin => coin.category === activeTab);
    }

    // 2. Filter by Search
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(coin => 
        coin.name.toLowerCase().includes(lowerSearch) || 
        coin.symbol.toLowerCase().includes(lowerSearch)
      );
    }

    // 3. Sort
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
    <div className="rounded-3xl bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] overflow-hidden">
      
      {/* Header Controls */}
      <div className="p-4 sm:p-6 border-b border-lime-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-black/40">
        
        {/* Tabs */}
        <div className="flex p-1 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner w-full md:w-auto overflow-x-auto">
          {(["all", "crypto", "memes", "fiat"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none capitalize px-6 py-2 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${
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
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-700/50" size={18} />
          <input 
            type="text" 
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/60 dark:bg-[#050806]/60 border border-lime-500/20 text-lime-950 dark:text-white placeholder-lime-700/50 rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:border-lime-500 transition-colors text-sm font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-lime-500/10 text-xs uppercase tracking-wider text-lime-800/60 dark:text-lime-200/50">
              <th className="p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors" onClick={() => handleSort('name')}>Asset</th>
              <th className="p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-right" onClick={() => handleSort('current_price')}>Price</th>
              <th className="p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-right" onClick={() => handleSort('price_change_percentage_24h')}>24h Change</th>
              <th className="p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-right" onClick={() => handleSort('total_volume')}>24h Volume</th>
              <th className="p-4 font-bold cursor-pointer hover:text-lime-600 transition-colors text-right" onClick={() => handleSort('market_cap')}>Market Cap</th>
              <th className="p-4 font-bold text-center">Action</th>
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
                  <td className="p-4">
                    <div className="relative flex items-center w-40 h-10 group/asset cursor-pointer">
                      
                      {/* LOGO (Visible by default) */}
                      {coin.image ? (
                        <img 
                          src={coin.image} 
                          alt={coin.name} 
                          className="w-8 h-8 rounded-full bg-white/5 absolute left-0 group-hover/asset:opacity-0 transition-opacity duration-200" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center font-bold text-xs text-lime-600 dark:text-lime-400 absolute left-0 group-hover/asset:opacity-0 transition-opacity duration-200">
                          {coin.symbol.substring(0, 3).toUpperCase()}
                        </div>
                      )}

                      {/* NAME & SYMBOL (Visible on hover) */}
                      <div className="absolute left-0 opacity-0 group-hover/asset:opacity-100 transition-opacity duration-200 flex flex-col justify-center">
                        <div className="font-bold text-lime-950 dark:text-[#ecfdf5] leading-tight truncate">
                          {coin.name}
                        </div>
                        <div className="text-xs text-lime-800/60 dark:text-lime-200/50 uppercase font-mono leading-tight">
                          {coin.symbol}
                        </div>
                      </div>

                    </div>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-lime-950 dark:text-white">
                    ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center font-bold text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {coin.price_change_percentage_24h >= 0 ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                      {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-sm text-lime-800/70 dark:text-lime-200/60">
                    ${(coin.total_volume / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
                  </td>
                  <td className="p-4 text-right font-mono text-sm text-lime-800/70 dark:text-lime-200/60">
                    {coin.market_cap > 0 ? `$${(coin.market_cap / 1000000000).toLocaleString(undefined, { maximumFractionDigits: 2 })}B` : '—'}
                  </td>
                    <td className="p-4 text-center">
                    <Button 
                      onClick={() => { window.location.href = `/markets/${coin.id}`; }} 
                      className="bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs px-4 py-2 h-8 rounded-lg shadow-sm transition-transform active:scale-95"
                    >
                      Trade
                    </Button>
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