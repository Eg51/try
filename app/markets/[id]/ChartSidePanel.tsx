"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, Star, LineChart, ChevronDown, MoreHorizontal, Search, LogIn, UserPlus, Activity, TrendingUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toggleFavorite } from "@/app/actions/markets";

export type Quote = {
  id: string;
  symbol: string;
  name: string;
  rate: number;
  category: "fiat" | "crypto" | "memes";
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const statCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
};

const DEFAULT_WATCHLIST = [
  { id: "bitcoin", symbol: "BTCUSD", name: "Bitcoin", price: 64230.50, change: 2.4 },
  { id: "ethereum", symbol: "ETHUSD", name: "Ethereum", price: 3450.20, change: -1.2 },
  { id: "euro", symbol: "EURUSD", name: "Euro / Dollar", price: 1.0842, change: 0.15 },
  { id: "gold", symbol: "XAUUSD", name: "Gold", price: 2154.30, change: 0.8 },
  { id: "charcoal", symbol: "CHRBLF", name: "Charcoal / Bitterleaf", price: 42.50, change: 5.1 },
];

export default function ChartSidePanel({ 
  isOpen, 
  onClose, 
  coin, 
  quoteCurrency, 
  setQuoteCurrency,
  availableQuotes,
  initialIsFavorited,
  isLoggedIn
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  coin: any, 
  quoteCurrency: Quote,
  setQuoteCurrency: (q: Quote) => void,
  availableQuotes: Quote[],
  initialIsFavorited: boolean,
  isLoggedIn: boolean
}) {
  const router = useRouter();
  
  // States
  const [showPairDropdown, setShowPairDropdown] = useState<string | false>(false); 
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isSaving, setIsSaving] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false); 

  // Dynamic Watchlist State
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
  const [localFavorites, setLocalFavorites] = useState<string[]>(["bitcoin"]);

  // Adaptive recent quotes state
  const [recentQuoteIds, setRecentQuoteIds] = useState<string[]>(["usd", "eur", "btc", "eth", "gbp"]);

  useEffect(() => {
    const saved = localStorage.getItem("quantix_recent_quotes");
    if (saved) {
      try { setRecentQuoteIds(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // Add to Watchlist
  const addToWatchlist = async (newAsset: any) => {
    if (watchlist.find(w => w.id === newAsset.id)) return;
    
    setWatchlist(prev => [...prev, newAsset]);
    
    if (isLoggedIn) {
      const res = await toggleFavorite(newAsset.id);
      if (!res.success) {
        setWatchlist(prev => prev.filter(w => w.id !== newAsset.id)); // Revert
        alert(res.error);
      }
    }
  };

  // Remove from Watchlist
  const removeFromWatchlist = async (id: string) => {
    setWatchlist(prev => prev.filter(w => w.id !== id));
    if (isLoggedIn) {
      await toggleFavorite(id);
    }
  };

  const handleQuoteSelect = (quote: Quote) => {
    setQuoteCurrency(quote);
    setShowPairDropdown(false); 
    setShowMoreModal(false);
    
    const newRecent = [quote.id, ...recentQuoteIds.filter(id => id !== quote.id)].slice(0, 5);
    setRecentQuoteIds(newRecent);
    localStorage.setItem("quantix_recent_quotes", JSON.stringify(newRecent));
  };

  const displayedQuotes = recentQuoteIds.map(id => (availableQuotes || []).find(q => q.id === id)).filter(Boolean) as Quote[];

  const handleMainFavorite = async () => {
    if (!isLoggedIn) {
      setShowAuthModal(true); 
      return;
    }
    setIsSaving(true);
    setIsFavorited(!isFavorited);
    const res = await toggleFavorite(coin.id);
    if (!res.success) {
      setIsFavorited(isFavorited); 
      alert(res.error);
    }
    setIsSaving(false);
  };

  const toggleLocalFavorite = (id: string) => {
    setLocalFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleAssetClick = (id: string) => {
    onClose(); 
    router.push(`/markets/${id}`); 
  };

  // Data calculations
  const high24h = ((coin.high_24h || 0) * quoteCurrency.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  const low24h = ((coin.low_24h || 0) * quoteCurrency.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  const volume = ((coin.total_volume || 0) * quoteCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const marketCap = ((coin.market_cap || 0) * quoteCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const circSupply = (coin.circulating_supply || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

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
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[110] w-full sm:w-[500px] bg-[#f0fdf4] dark:bg-[#050806] border-l border-lime-500/20 dark:border-lime-500/10 shadow-2xl flex flex-col transition-colors duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <LineChart size={18} className="text-lime-600 dark:text-lime-400" />
                  <h2 className="text-sm font-bold text-lime-950 dark:text-[#ecfdf5]">Market Watch</h2>
                </div>
                
                <Button 
                  onClick={handleMainFavorite} 
                  disabled={isSaving}
                  variant="secondary" 
                  className={`h-8 px-3 text-xs border-lime-500/30 bg-white/60 dark:bg-[#121A14] rounded-lg transition-all shadow-sm ${isFavorited ? 'text-amber-500 border-amber-500/30' : 'text-lime-800 dark:text-lime-200'}`}
                >
                  <Star size={14} className={`mr-1.5 ${isFavorited ? 'fill-amber-500' : ''}`} /> 
                  {isFavorited ? "Favorited" : "Favorite"}
                </Button>
              </div>
              
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-lime-100 dark:hover:bg-white/10 text-lime-700/60 dark:text-lime-200/50 transition-colors">
                <X size={18} />
              </button>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex-1 p-6 flex flex-col space-y-6 overflow-y-auto custom-scrollbar pb-10"
            >
              {/* STATS PANEL */}
              <motion.div 
                variants={itemVariants}
                className="rounded-3xl border border-lime-500/20 dark:border-lime-500/10 bg-white/60 dark:bg-[#0a0f0b]/80 backdrop-blur-xl p-6 flex flex-col shadow-sm"
              >
                <div className="flex items-center gap-2 mb-6 text-lime-950 dark:text-white">
                  <Activity size={18} className="text-lime-500" />
                  <h3 className="font-bold tracking-tight">Market Statistics</h3>
                </div>

                <motion.div variants={containerVariants} className="grid grid-cols-2 gap-4">
                  <motion.div variants={statCardVariants} className="bg-lime-50/50 dark:bg-black/30 p-4 rounded-2xl border border-lime-500/10">
                    <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider mb-1">24h High</p>
                    <p className="text-sm font-mono font-bold text-lime-950 dark:text-white">{quoteCurrency.symbol}{high24h}</p>
                  </motion.div>

                  <motion.div variants={statCardVariants} className="bg-lime-50/50 dark:bg-black/30 p-4 rounded-2xl border border-lime-500/10">
                    <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider mb-1">24h Low</p>
                    <p className="text-sm font-mono font-bold text-lime-950 dark:text-white">{quoteCurrency.symbol}{low24h}</p>
                  </motion.div>

                  <motion.div variants={statCardVariants} className="bg-lime-50/50 dark:bg-black/30 p-4 rounded-2xl border border-lime-500/10">
                    <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider mb-1">24h Volume</p>
                    <p className="text-sm font-mono font-bold text-lime-950 dark:text-white">{quoteCurrency.symbol}{volume}</p>
                  </motion.div>

                  <motion.div variants={statCardVariants} className="bg-lime-50/50 dark:bg-black/30 p-4 rounded-2xl border border-lime-500/10">
                    <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider mb-1">Market Cap</p>
                    <p className="text-sm font-mono font-bold text-lime-950 dark:text-white">{quoteCurrency.symbol}{marketCap}</p>
                  </motion.div>

                  <motion.div variants={statCardVariants} className="col-span-2 bg-lime-50/50 dark:bg-black/30 p-4 rounded-2xl border border-lime-500/10">
                    <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-wider mb-1">Circulating Supply</p>
                    <p className="text-sm font-mono font-bold text-lime-950 dark:text-white flex items-baseline gap-2">
                      {circSupply} <span className="text-[10px] text-lime-600 dark:text-lime-400">{coin.symbol.toUpperCase()}</span>
                    </p>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* WATCHLIST */}
              <motion.div variants={itemVariants} className="rounded-3xl border border-lime-500/20 dark:border-lime-500/10 bg-white/60 dark:bg-[#0a0f0b]/80 backdrop-blur-xl p-6 flex flex-col shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-lime-950 dark:text-white">
                  <TrendingUp size={18} className="text-lime-500" />
                  <h3 className="font-bold tracking-tight">Watchlist</h3>
                </div>
                
                <div className="space-y-1 relative">
                  {watchlist.map(asset => {
                    const isActive = coin.id === asset.id;
                    return (
                      <div 
                        key={asset.id}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors group ${isActive ? 'bg-lime-500/10 border border-lime-500/20' : 'hover:bg-lime-500/5 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); toggleLocalFavorite(asset.id); }} className="text-lime-600 dark:text-lime-400 hover:scale-110 transition-transform">
                            <Star size={16} className={localFavorites.includes(asset.id) ? "fill-lime-500 text-lime-500" : "text-lime-500/50"} />
                          </button>
                          
                          <div className="text-left cursor-pointer" onClick={() => handleAssetClick(asset.id)}>
                            <div className="text-xs font-bold text-lime-950 dark:text-white flex items-center gap-2">
                              {asset.symbol}
                            </div>
                            <div className="text-[10px] text-lime-800/60 dark:text-lime-200/50">{asset.name}</div>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-2">
                          <div className="cursor-pointer" onClick={() => handleAssetClick(asset.id)}>
                            <div className="text-xs font-mono text-lime-950 dark:text-white">{asset.price.toFixed(2)}</div>
                            <div className={`text-[10px] font-mono font-bold ${asset.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>{asset.change >= 0 ? '+' : ''}{asset.change}%</div>
                          </div>

                          {/* DELETE BUTTON */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeFromWatchlist(asset.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 transition-all"
                            title="Remove from watchlist"
                          >
                            <Trash2 size={14} />
                          </button>

                          {/* DROPDOWN FOR EVERY ROW */}
                          <div className="relative">
                            <button 
                              onClick={() => setShowPairDropdown(showPairDropdown === asset.id ? false : asset.id)}
                              className="flex items-center gap-1 text-[10px] font-bold text-lime-600 dark:text-lime-400 hover:text-lime-700 transition-colors cursor-pointer bg-lime-50 dark:bg-black/40 px-2 py-1 rounded-md border border-lime-500/20"
                            >
                              / {quoteCurrency.name} <ChevronDown size={12} />
                            </button>

                            <AnimatePresence>
                              {showPairDropdown === asset.id && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                  className="absolute top-full mt-2 right-0 w-48 bg-white/95 dark:bg-[#121A14]/95 backdrop-blur-xl border border-lime-500/20 rounded-xl shadow-xl overflow-hidden z-50"
                                >
                                  {displayedQuotes.map((curr) => (
                                    <button key={curr.id} onClick={() => handleQuoteSelect(curr)} className={`w-full text-left px-4 py-2 hover:bg-lime-50 dark:hover:bg-black/40 font-bold text-sm transition-colors flex items-center justify-between ${quoteCurrency.id === curr.id ? 'text-lime-600 dark:text-lime-400' : 'text-lime-950 dark:text-white'}`}>
                                      <span>{curr.symbol} {curr.name}</span>
                                    </button>
                                  ))}
                                  <button onClick={() => { setShowPairDropdown(false); setShowMoreModal(true); }} className="w-full text-left px-4 py-3 hover:bg-lime-50 dark:hover:bg-black/40 font-bold text-sm transition-colors flex items-center gap-2 text-lime-600 dark:text-lime-400 border-t border-lime-500/10">
                                    <MoreHorizontal size={16} /> Add Asset...
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

            </motion.div>
          </motion.div>

          {/* ADD ASSET MODAL */}
          <AnimatePresence>
            {showMoreModal && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                  className="relative w-full max-w-md bg-[#f4fbf5] dark:bg-[#121A14] rounded-3xl p-6 shadow-2xl border border-lime-500/20"
                >
                  <button onClick={() => setShowMoreModal(false)} className="absolute top-4 right-4 text-lime-600 hover:text-lime-800 transition-colors">
                    <X size={20} />
                  </button>
                  
                  <h2 className="text-xl font-bold text-lime-950 dark:text-white mb-4">Add to Watchlist</h2>
                  
                  <input 
                    type="text"
                    placeholder="Search assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/50 dark:bg-black/30 border border-lime-500/20 rounded-xl px-4 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 mb-4"
                  />

                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
                    {availableQuotes
                      .filter((q: any) => q.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((quote: any) => {
                        const isAlreadyAdded = watchlist.some(w => w.id === quote.id);
                        return (
                          <div key={quote.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-lime-500/10">
                            <div>
                              <div className="text-sm font-bold text-lime-950 dark:text-white">{quote.symbol}</div>
                              <div className="text-xs text-lime-800/60 dark:text-lime-200/50">{quote.name}</div>
                            </div>
                            <button 
                              onClick={() => addToWatchlist({
                                id: quote.id,
                                symbol: quote.symbol + "USD",
                                name: quote.name,
                                price: quote.rate ? (1 / quote.rate) : 0,
                                change: 0
                              })}
                              disabled={isAlreadyAdded}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                isAlreadyAdded 
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                                  : 'bg-lime-600 hover:bg-lime-700 text-white'
                              }`}
                            >
                              {isAlreadyAdded ? "Added" : "Add"}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AUTH MODAL */}
          <AnimatePresence>
            {showAuthModal && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                  className="relative w-full max-w-sm bg-[#f4fbf5] dark:bg-[#121A14] rounded-3xl p-6 shadow-2xl border border-lime-500/20 text-center"
                >
                  <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-lime-600 hover:text-lime-800 transition-colors">
                    <X size={20} />
                  </button>
                  
                  <div className="w-16 h-16 mx-auto bg-lime-100 dark:bg-lime-900/50 rounded-full flex items-center justify-center mb-4">
                    <Star className="text-lime-600 dark:text-lime-400" size={32} />
                  </div>
                  
                  <h2 className="text-xl font-bold text-lime-950 dark:text-white mb-2">Save to Favorites</h2>
                  <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mb-6 font-medium">
                    You need an account to save assets to your watchlist.
                  </p>
                  
                  <div className="space-y-3">
                    <Button onClick={() => { window.location.href = "/login"; }} className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2">
                      <LogIn size={18} /> Log In
                    </Button>
                    <Button onClick={() => { window.location.href = "/login"; }} variant="secondary" className="w-full border-lime-500/30 bg-white/50 dark:bg-black/30 text-lime-950 dark:text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2">
                      <UserPlus size={18} /> Sign Up
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}