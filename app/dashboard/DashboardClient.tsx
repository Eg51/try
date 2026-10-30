// app/dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  Search, Activity, PieChart, ShieldCheck, Flame, 
  Newspaper, ChevronRight, Award, Zap, ArrowRightLeft 
} from "lucide-react";
import { KycGate } from "@/components/KycGate";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { Button } from "@/components/ui/Button";
import UserAvatar from "@/app/dashboard/UserAvatar"; // 👈 Imported UserAvatar

const MARKETS = [
  { symbol: 'BTC/USD', name: 'Bitcoin', price: '$64,230.00', change: '+2.4%', up: true, icon: "₿" },
  { symbol: 'ETH/USD', name: 'Ethereum', price: '$3,450.00', change: '-1.2%', up: false, icon: "Ξ" },
  { symbol: 'CHR-NGN', name: 'Charcoal', price: '₦42.50', change: '+0.8%', up: true, icon: "🌾" },
  { symbol: 'SOL/USD', name: 'Solana', price: '$145.20', change: '-0.5%', up: false, icon: "◎" },
  { symbol: 'DOGE/USD', name: 'Dogecoin', price: '$0.15', change: '+5.2%', up: true, icon: "Ð" },
];

const POSITIONS = [
  { asset: "BTC/USD", type: "Long", size: "0.5 BTC", entry: "$64,200", current: "$67,430", pnl: "+$1,615", pnlPct: "+2.5%", isProfit: true },
  { asset: "ETH/USD", type: "Short", size: "2.0 ETH", entry: "$3,600", current: "$3,450", pnl: "+$300", pnlPct: "+4.1%", isProfit: true },
  { asset: "SOL/USD", type: "Long", size: "10 SOL", entry: "$150", current: "$145", pnl: "-$50", pnlPct: "-3.3%", isProfit: false },
];

const NEWS = [
  { time: "10m ago", title: "Bitcoin breaks $67k resistance amid ETF inflows", source: "Bloomberg" },
  { time: "1h ago", title: "SEC delays decision on Ethereum spot ETF", source: "Reuters" },
  { time: "3h ago", title: "Global commodity prices stabilize after recent surge", source: "Financial Times" },
];

// 👇 Added userAvatar to the props type
export default function DashboardClient({ 
  tier, 
  displayName, 
  userAvatar 
}: { 
  tier: number, 
  displayName: string, 
  userAvatar: string 
}) {
  const { openModal } = useDevModal();
  const [mounted, setMounted] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState("market");

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* 1. HEADER & QUICK ACTIONS */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* 👇 AVATAR & WELCOME TEXT 👇 */}
        <div className="flex items-center gap-4">
          <UserAvatar initialImage={userAvatar} userName={displayName} />
          <div>
            <h1 className="text-2xl font-extrabold text-lime-950 dark:text-white tracking-tight">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">
              Here is your portfolio summary.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={() => openModal("Deposit", "Deposit features are coming soon.", "info")} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-lime-600 text-white rounded-xl text-sm font-bold hover:bg-lime-700 transition-colors shadow-lg shadow-lime-600/20">
            <ArrowDownRight size={16} /> Deposit
          </button>
          <button onClick={() => openModal("Withdraw", "Withdrawal features are coming soon.", "info")} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/60 dark:bg-[#121A14]/60 border border-lime-500/20 text-lime-950 dark:text-white rounded-xl text-sm font-bold hover:bg-white transition-colors">
            <ArrowUpRight size={16} /> Withdraw
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 2. PORTFOLIO BALANCE CARD */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-lime-400/20 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <p className="text-sm font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest mb-1">Total Portfolio Value</p>
                <h2 className="text-4xl sm:text-5xl font-extrabold font-mono text-lime-950 dark:text-white">
                  ₦ 4,250,000<span className="text-2xl text-lime-800/50 dark:text-lime-200/50">.00</span>
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center text-sm font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md">
                    <TrendingUp size={14} className="mr-1" /> +12.5%
                  </span>
                  <span className="text-xs text-lime-800/50 dark:text-lime-200/40 font-medium">All time</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10 pt-4 border-t border-lime-500/10">
              <div>
                <p className="text-xs text-lime-800/50 dark:text-lime-200/40 font-medium mb-1">Available Cash</p>
                <p className="font-bold text-lime-950 dark:text-white">$4,500.00</p>
              </div>
              <div>
                <p className="text-xs text-lime-800/50 dark:text-lime-200/40 font-medium mb-1">Invested</p>
                <p className="font-bold text-lime-950 dark:text-white">$9,730.50</p>
              </div>
              <div>
                <p className="text-xs text-lime-800/50 dark:text-lime-200/40 font-medium mb-1">Buying Power</p>
                <p className="font-bold text-lime-950 dark:text-white">$22,000.00</p>
              </div>
              <div>
                <p className="text-xs text-lime-800/50 dark:text-lime-200/40 font-medium mb-1">Today's P&L</p>
                <p className="font-bold text-green-500">+$230.50</p>
              </div>
            </div>
          </motion.div>

          {/* 3. YOUR TIER CARD */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-xl">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-600 dark:text-lime-400">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lime-950 dark:text-white text-lg">Tier {tier} Account</h3>
                <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">Unlock crypto and meme coins.</p>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
              <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
                <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
              </div>
              <Link href="/dashboard/rewards" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
                View Tasks & Rewards
              </Link>
            </div>
          </motion.div>

          {/* 4. ACTIVE POSITIONS TABLE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
              <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                <Activity size={18} className="text-lime-500" /> Active Positions
              </h3>
              <Link href="/dashboard/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View History</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
                  <tr>
                    <th className="p-4 font-semibold">Asset</th>
                    <th className="p-4 font-semibold">Size</th>
                    <th className="p-4 font-semibold">Entry Price</th>
                    <th className="p-4 font-semibold">Mark Price</th>
                    <th className="p-4 font-semibold text-right">Unrealized P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lime-500/10">
                  {POSITIONS.map((pos, i) => (
                    <tr key={i} className="hover:bg-lime-500/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.type === "Long" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.type}</span>
                          <span className="font-bold text-lime-950 dark:text-white">{pos.asset}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-lime-800 dark:text-lime-200">{pos.size}</td>
                      <td className="p-4 font-mono text-lime-800/60 dark:text-lime-200/50">{pos.entry}</td>
                      <td className="p-4 font-mono text-lime-950 dark:text-white">{pos.current}</td>
                      <td className={`p-4 text-right font-bold font-mono ${pos.isProfit ? "text-green-500" : "text-red-500"}`}>
                        {pos.pnl} <span className="text-xs opacity-70">({pos.pnlPct})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* 5. RISK & PERFORMANCE ANALYTICS */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
              <div className="w-24 h-24 rounded-full shrink-0" style={{ background: 'conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)' }}>
                <div className="w-16 h-16 bg-[#f4fbf5] dark:bg-[#0a0f0b] rounded-full m-auto translate-y-4 flex items-center justify-center">
                  <PieChart size={20} className="text-lime-500" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-lime-950 dark:text-white mb-2">Asset Allocation</h4>
                <div className="space-y-1 text-xs font-medium">
                  <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-lime-500">● Crypto</span> <span>60%</span></div>
                  <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-blue-500">● Commodities</span> <span>25%</span></div>
                  <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-amber-500">● Fiat</span> <span>15%</span></div>
                </div>
              </div>
            </div>

            <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-lime-950 dark:text-white">Risk Metrics</h4>
                <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">Low Risk</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Max Drawdown</span> <span>4.2%</span></div>
                  <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Risk-Reward Ratio</span> <span>1 : 2.4</span></div>
                  <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]"></div></div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* RIGHT COLUMN (1/3 width on desktop) */}
        <div className="space-y-6">
          
          {/* 6. TRADING / ORDER PANEL */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="font-bold text-lime-950 dark:text-white mb-4">Quick Trade</h3>
            
            <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
              <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'buy' ? 'bg-green-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Buy</button>
              <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Sell</button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="relative">
                <select className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none font-bold">
                  <option>BTC / USD</option>
                  <option>ETH / USD</option>
                </select>
              </div>
              <div className="relative">
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none">
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                  <option value="stop">Stop-Loss</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
                  <span>Amount</span>
                  <span>Available: $4,500</span>
                </div>
                <input type="number" placeholder="0.00" className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
              </div>
            </div>

            <KycGate requiredTier={1} currentTier={tier} featureName="trading">
              <Button className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}>
                Execute {tradeType === 'buy' ? 'Buy' : 'Sell'} Order
              </Button>
            </KycGate>
          </motion.div>

          {/* 7. MARKET WATCH */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
              <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                <Flame size={18} className="text-orange-500" /> Market Watch
              </h3>
              <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-lime-500/5">
              {MARKETS.map((market) => (
                <Link key={market.symbol} href={`/markets/${market.symbol.split('/')[0].toLowerCase()}`} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
                      {market.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}</p>
                      <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">{market.price}</p>
                    <p className={`text-xs font-bold flex items-center justify-end ${market.up ? 'text-green-500' : 'text-red-500'}`}>
                      {market.up ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} {market.change}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* 8. GAMIFICATION HUB */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none">
              <Award size={100} />
            </div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30">
                <Zap size={18} />
              </div>
              <div>
                <h3 className="font-bold text-lime-950 dark:text-white">Level 4 Trader</h3>
                <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">1,200 / 1,500 XP</p>
              </div>
            </div>
            <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10">
              <div className="h-full bg-lime-500 rounded-full w-[80%]"></div>
            </div>
            <Link href="/dashboard/rewards" className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10">
              View Rewards & Badges <ChevronRight size={14} />
            </Link>
          </motion.div>

          {/* 9. MARKET NEWS */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl">
            <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
              <Newspaper size={18} className="text-blue-500" /> Market News
            </h3>
            <div className="space-y-4">
              {NEWS.map((news, i) => (
                <div key={i} className="group cursor-pointer">
                  <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">{news.time} • {news.source}</p>
                  <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">{news.title}</h4>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}