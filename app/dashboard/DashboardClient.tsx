// app/dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl"; // 👈 Imported
import { 
  TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck, Flame, 
  Newspaper, ChevronRight, Award, Zap, ArrowDown, ArrowUp, Wallet, ChevronDown
} from "lucide-react";
import { KycGate } from "@/components/KycGate";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { Button } from "@/components/ui/Button";
import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";

const MARKETS = [
  { symbol: 'BTC/USD', name: 'Bitcoin', price: '$64,230.00', change: '+2.4%', up: true, icon: "₿" },
  { symbol: 'ETH/USD', name: 'Ethereum', price: '$3,450.00', change: '-1.2%', up: false, icon: "Ξ" },
  { symbol: 'CHR-NGN', name: 'Charcoal', price: '₦42.50', change: '+0.8%', up: true, icon: "🌾" },
  { symbol: 'SOL/USD', name: 'Solana', price: '$145.20', change: '-0.5%', up: false, icon: "◎" },
  { symbol: 'DOGE/USD', name: 'Dogecoin', price: '$0.15', change: '+5.2%', up: true, icon: "Ð" },
];

const INITIAL_ACTIVITY = [
  { id: 'act-1', type: "Deposit", asset: "USDT", amount: "+500.00", status: "Completed", date: "Today, 10:45 AM" },
  { id: 'act-2', type: "Withdrawal", asset: "DOGE", amount: "-2,500", status: "Pending", date: "Yesterday, 4:20 PM" },
  { id: 'act-3', type: "Trade", asset: "BTC/USD", amount: "Long", status: "Filled", date: "Yesterday, 9:00 AM" },
];

const INITIAL_POSITIONS = [
  { id: 'pos-1', asset: "BTC/USD", type: "Long", size: "0.5 BTC", entry: "$64,200", current: "$67,430", pnl: "+$1,615", pnlPct: "+2.5%", isProfit: true, tp: "$68,000", sl: "$63,000", status: "increasing" as const },
  { id: 'pos-2', asset: "ETH/USD", type: "Short", size: "2.0 ETH", entry: "$3,600", current: "$3,450", pnl: "+$300", pnlPct: "+4.1%", isProfit: true, tp: "$3,400", sl: "$3,700", status: "stable" as const },
  { id: 'pos-3', asset: "SOL/USD", type: "Long", size: "10 SOL", entry: "$150", current: "$145", pnl: "-$50", pnlPct: "-3.3%", isProfit: false, tp: "$160", sl: "$140", status: "falling" as const },
];

const NEWS = [
  { time: "10m ago", title: "Bitcoin breaks $67k resistance amid ETF inflows", source: "Bloomberg" },
  { time: "1h ago", title: "SEC delays decision on Ethereum spot ETF", source: "Reuters" },
  { time: "3h ago", title: "Global commodity prices stabilize after recent surge", source: "Financial Times" },
];

const formatNumber = (value: string) => {
  const cleanValue = value.replace(/[^0-9.]/g, "");
  const parts = cleanValue.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
};

function TradeSparkline({ status }: { status: 'stable' | 'increasing' | 'falling' | 'closed' }) {
  let color = "#10b981";
  let path = "M 0 20 Q 10 20, 20 15 T 40 15 T 60 20";
  if (status === 'increasing') { color = "#3b82f6"; path = "M 0 25 Q 15 25, 20 15 T 40 10 T 60 5"; }
  else if (status === 'falling') { color = "#eab308"; path = "M 0 5 Q 15 10, 20 15 T 40 20 T 60 25"; }
  else if (status === 'closed') { color = "#ef4444"; path = "M 0 5 Q 15 10, 20 25 T 40 30 T 60 35"; }

  return (
    <svg viewBox="0 0 60 40" className="w-16 h-8 overflow-visible">
      <defs>
        <linearGradient id={`grad-${status}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L 60 40 L 0 40 Z`} fill={`url(#grad-${status})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardClient({ 
  tier,
  displayName,
  userAvatar,
  currencySymbol = "$",
  dbAssets = [],
}: {
  tier: number;
  displayName: string;
  userAvatar: string;
  currencySymbol?: string;
  dbAssets?: any[];
}) {
  const t = useTranslations("Dashboard"); // 👈 Initialize translator
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openModal } = useDevModal();
  
  const [mounted, setMounted] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState("market");

  const [amount, setAmount] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [positions, setPositions] = useState<any[]>(INITIAL_POSITIONS);
  const [activity, setActivity] = useState<any[]>(INITIAL_ACTIVITY);

  const pairParam = searchParams.get("pair");
  const [baseAsset, setBaseAsset] = useState("BTC");
  const [quoteAsset, setQuoteAsset] = useState("USD");

  useEffect(() => {
    setMounted(true);
    if (pairParam) {
      const [b, q] = pairParam.split("-");
      setBaseAsset(b);
      setQuoteAsset(q || "USD");
    }
  }, [pairParam]);

  const executeTrade = () => {
    const rawAmount = amount.replace(/,/g, "");
    const qty = parseFloat(rawAmount);

    if (!qty || qty <= 0) {
      openModal(t("invalidAmountTitle"), t("invalidAmountDesc"), "warning");
      return;
    }

    const newPosId = `pos-${Date.now()}`;
    const newPos = {
      id: newPosId,
      asset: `${baseAsset}/${quoteAsset}`,
      type: tradeType === "buy" ? "Long" : "Short",
      size: `${qty} ${baseAsset}`,
      entry: `$${MARKETS.find(m => m.symbol.startsWith(baseAsset))?.price || "0.00"}`,
      current: `$${MARKETS.find(m => m.symbol.startsWith(baseAsset))?.price || "0.00"}`,
      pnl: "$0.00",
      pnlPct: "0%",
      isProfit: true,
      tp: takeProfit || null,
      sl: stopLoss || null,
      status: "increasing"
    };

    setPositions([newPos, ...positions]);
    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        type: "Trade",
        asset: `${baseAsset}/${quoteAsset}`,
        amount: tradeType === "buy" ? "Long" : "Short",
        status: "Filled",
        date: t("justNow"),
      },
      ...prev,
    ]);

    setAmount("");
    setTakeProfit("");
    setStopLoss("");
    
    router.push(`/terminal?pair=${baseAsset}-${quoteAsset}&tradeId=${newPosId}`);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 w-full overflow-x-hidden">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden">
          <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-8 opacity-[0.03] dark:opacity-[0.02]">
            <Wallet size={200} strokeWidth={1} />
          </div>

          <div className="flex flex-col gap-6 w-full relative z-10 h-full">
            <div className="flex justify-between items-center w-full gap-4 min-w-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <UserAvatar initialImage={userAvatar} userName={displayName} />
                <TimeGreeting userName={displayName} />
              </div>
              <div className="flex flex-col items-end justify-center shrink-0">
                <span className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 mb-0.5 sm:mb-1 whitespace-nowrap">
                  {t("walletBalance")}
                </span>
                <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                  <span className="text-sm sm:text-lg font-extrabold text-lime-950 dark:text-white">{currencySymbol}</span>
                  <span className="text-xl sm:text-3xl font-extrabold text-lime-950 dark:text-white tracking-tight">
                    $1,250.00
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-md mt-auto pt-2">
              <Link href="/dashboard/transfer?mode=deposit" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#5d9e17] text-white rounded-xl text-sm sm:text-base font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20">
                <ArrowDown size={18} /> {t("deposit")}
              </Link>
              <Link href="/dashboard/transfer?mode=withdraw" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#e5e7eb] dark:bg-[#121A14] text-gray-700 dark:text-gray-300 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors">
                <ArrowUp size={18} /> {t("withdraw")}
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <FavorablePairsCard />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="lg:col-span-2 space-y-6">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-xl">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-600 dark:text-lime-400">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lime-950 dark:text-white text-lg">{t("tierAccount", { tier })}</h3>
                <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">{t("unlockCrypto")}</p>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
              <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
                <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
              </div>
              <Link href="/dashboard/rewards" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
                {t("viewTasks")}
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
              <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                <Activity size={18} className="text-lime-500" /> {t("activePositions")}
              </h3>
              <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewTerminal")}</Link>
            </div>
            <div className="w-full overflow-x-auto custom-scrollbar pb-2">
              <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
                <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 font-semibold">{t("asset")}</th>
                    <th className="px-3 sm:px-4 py-3 font-semibold">{t("size")}</th>
                    <th className="px-3 sm:px-4 py-3 font-semibold">{t("entryPrice")}</th>
                    <th className="px-3 sm:px-4 py-3 font-semibold">{t("markPrice")}</th>
                    <th className="px-3 sm:px-4 py-3 font-semibold text-center">{t("trend")}</th>
                    <th className="px-3 sm:px-4 py-3 font-semibold text-right">{t("unrealizedPnl")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lime-500/10">
                  {positions.map((pos, i) => (
                    <tr key={i} onClick={() => router.push(`/terminal?pair=${pos.asset.replace('/', '-')}&tradeId=${pos.id}`)} className="hover:bg-lime-500/5 transition-colors cursor-pointer">
                      <td className="px-3 sm:px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.type === "Long" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.type}</span>
                          <span className="font-bold text-lime-950 dark:text-white">{pos.asset}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.size}</td>
                      <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{pos.entry}</td>
                      <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{pos.current}</td>
                      <td className="px-3 sm:px-4 py-3 flex justify-center">
                        <TradeSparkline status={pos.status as any} />
                      </td>
                      <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${pos.isProfit ? "text-green-500" : "text-red-500"}`}>
                        {pos.pnl} <span className="text-xs opacity-70">({pos.pnlPct})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl mt-6">
            <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
              <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                <Wallet size={18} className="text-lime-500" /> {t("recentActivity")}
              </h3>
              <Link href="/dashboard/transfer" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
            </div>
            <div className="w-full overflow-x-auto custom-scrollbar pb-2">
              <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
                <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 font-semibold">{t("type")}</th>
                    <th className="px-3 sm:px-4 py-3 font-semibold">{t("asset")}</th>
                    <th className="px-3 sm:px-4 py-3 font-semibold">{t("amount")}</th>
                    <th className="px-3 sm:px-4 py-3 font-semibold">{t("status")}</th>
                    <th className="px-3 sm:px-4 py-3 font-semibold text-right">{t("date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lime-500/10">
                  {activity.map((tx, i) => (
                    <tr key={i} onClick={() => tx.type === 'Trade' ? router.push(`/terminal?pair=${tx.asset.replace('/', '-')}&tradeId=${tx.id}`) : null} className={`transition-colors ${tx.type === 'Trade' ? 'cursor-pointer hover:bg-lime-500/5' : ''}`}>
                      <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white">{tx.type}</td>
                      <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{tx.asset}</td>
                      <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${tx.type === 'Deposit' ? 'text-green-500' : tx.type === 'Withdrawal' ? 'text-red-500' : 'text-lime-950 dark:text-white'}`}>
                        {tx.amount}
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${tx.status === 'Completed' || tx.status === 'Filled' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right text-xs text-lime-800/50 dark:text-lime-200/40">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
              <div className="w-24 h-24 rounded-full shrink-0" style={{ background: 'conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)' }}>
                <div className="w-16 h-16 bg-[#f4fbf5] dark:bg-[#0a0f0b] rounded-full m-auto translate-y-4 flex items-center justify-center">
                  <PieChart size={20} className="text-lime-500" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-lime-950 dark:text-white mb-2">{t("assetAllocation")}</h4>
                <div className="space-y-1 text-xs font-medium">
                  <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-lime-500">● {t("crypto")}</span> <span>60%</span></div>
                  <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-blue-500">● {t("commodities")}</span> <span>25%</span></div>
                  <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-amber-500">● {t("fiat")}</span> <span>15%</span></div>
                </div>
              </div>
            </div>

            <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-lime-950 dark:text-white">{t("riskMetrics")}</h4>
                <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">{t("lowRisk")}</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>{t("maxDrawdown")}</span> <span>4.2%</span></div>
                  <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>{t("riskRewardRatio")}</span> <span>1 : 2.4</span></div>
                  <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]"></div></div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="font-bold text-lime-950 dark:text-white mb-4">{t("quickTrade")}</h3>
            
            <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
              <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'buy' ? 'bg-green-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>{t("buy")}</button>
              <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>{t("sell")}</button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <Link href="/markets?select=base&returnUrl=/dashboard" className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group" title={t("selectBase")}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{baseAsset}</span>
                  </div>
                  <ChevronDown size={14} className="text-lime-500 shrink-0" />
                </Link>
                <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>
                <Link href="/markets?select=quote&returnUrl=/dashboard" className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group" title={t("selectQuote")}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{quoteAsset}</span>
                  </div>
                  <ChevronDown size={14} className="text-lime-500 shrink-0" />
                </Link>
              </div>

              <div className="relative">
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none">
                  <option value="market">{t("marketOrder")}</option>
                  <option value="limit">{t("limitOrder")}</option>
                  <option value="stop">{t("stopLoss")}</option>
                </select>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
                  <span>{t("amount")}</span>
                  <span>{t("available")}: {currencySymbol}4,500</span>
                </div>
                <input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(formatNumber(e.target.value))} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block px-1">{t("takeProfit")}</label>
                  <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder={t("price")} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block px-1">{t("stopLoss")}</label>
                  <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder={t("price")} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
                </div>
              </div>
            </div>

            <KycGate requiredTier={1} currentTier={tier} featureName="trading">
              <Button onClick={executeTrade} disabled={!amount || parseFloat(amount.replace(/,/g, "")) <= 0} className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}>
                {t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
              </Button>
            </KycGate>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
              <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                <Flame size={18} className="text-orange-500" /> {t("marketWatch")}
              </h3>
              <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
            </div>
            <div className="divide-y divide-lime-500/5">
              {MARKETS.map((market) => (
                <div key={market.symbol} onClick={() => router.push(`/terminal?pair=${market.symbol.replace('/', '-')}`)} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">{market.icon}</div>
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
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none">
              <Award size={100} />
            </div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30">
                <Zap size={18} />
              </div>
              <div>
                <h3 className="font-bold text-lime-950 dark:text-white">{t("levelTrader", { level: 4 })}</h3>
                <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">1,200 / 1,500 XP</p>
              </div>
            </div>
            <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10">
              <div className="h-full bg-lime-500 rounded-full w-[80%]"></div>
            </div>
            <Link href="/dashboard/rewards" className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10">
              {t("viewRewards")} <ChevronRight size={14} />
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl">
            <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
              <Newspaper size={18} className="text-blue-500" /> {t("marketNews")}
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

//         // app/dashboard/DashboardClient.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { motion } from "framer-motion";
// import Link from "next/link";
// import { 
//   TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck, Flame, 
//   Newspaper, ChevronRight, Award, Zap, User, ArrowDown, ArrowUp, Wallet, ChevronDown
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";

// const MARKETS = [
//   { symbol: 'BTC/USD', name: 'Bitcoin', price: '$64,230.00', change: '+2.4%', up: true, icon: "₿" },
//   { symbol: 'ETH/USD', name: 'Ethereum', price: '$3,450.00', change: '-1.2%', up: false, icon: "Ξ" },
//   { symbol: 'CHR-NGN', name: 'Charcoal', price: '₦42.50', change: '+0.8%', up: true, icon: "🌾" },
//   { symbol: 'SOL/USD', name: 'Solana', price: '$145.20', change: '-0.5%', up: false, icon: "◎" },
//   { symbol: 'DOGE/USD', name: 'Dogecoin', price: '$0.15', change: '+5.2%', up: true, icon: "Ð" },
// ];

// const RECENT_ACTIVITY = [
//   { id: 'act-1', type: "Deposit", asset: "USDT", amount: "+500.00", status: "Completed", date: "Today, 10:45 AM" },
//   { id: 'act-2', type: "Withdrawal", asset: "DOGE", amount: "-2,500", status: "Pending", date: "Yesterday, 4:20 PM" },
//   { id: 'act-3', type: "Trade", asset: "BTC/USD", amount: "Long", status: "Filled", date: "Yesterday, 9:00 AM" },
// ];

// const POSITIONS = [
//   { id: 'pos-1', asset: "BTC/USD", type: "Long", size: "0.5 BTC", entry: "$64,200", current: "$67,430", pnl: "+$1,615", pnlPct: "+2.5%", isProfit: true, tp: "$68,000", sl: "$63,000", status: "increasing" as const },
//   { id: 'pos-2', asset: "ETH/USD", type: "Short", size: "2.0 ETH", entry: "$3,600", current: "$3,450", pnl: "+$300", pnlPct: "+4.1%", isProfit: true, tp: "$3,400", sl: "$3,700", status: "stable" as const },
//   { id: 'pos-3', asset: "SOL/USD", type: "Long", size: "10 SOL", entry: "$150", current: "$145", pnl: "-$50", pnlPct: "-3.3%", isProfit: false, tp: "$160", sl: "$140", status: "falling" as const },
// ];

// const NEWS = [
//   { time: "10m ago", title: "Bitcoin breaks $67k resistance amid ETF inflows", source: "Bloomberg" },
//   { time: "1h ago", title: "SEC delays decision on Ethereum spot ETF", source: "Reuters" },
//   { time: "3h ago", title: "Global commodity prices stabilize after recent surge", source: "Financial Times" },
// ];

// function TradeSparkline({ status }: { status: 'stable' | 'increasing' | 'falling' | 'closed' }) {
//   let color = "#10b981";
//   let path = "M 0 20 Q 10 20, 20 15 T 40 15 T 60 20";
//   if (status === 'increasing') { color = "#3b82f6"; path = "M 0 25 Q 15 25, 20 15 T 40 10 T 60 5"; }
//   else if (status === 'falling') { color = "#eab308"; path = "M 0 5 Q 15 10, 20 15 T 40 20 T 60 25"; }
//   else if (status === 'closed') { color = "#ef4444"; path = "M 0 5 Q 15 10, 20 25 T 40 30 T 60 35"; }

//   return (
//     <svg viewBox="0 0 60 40" className="w-16 h-8 overflow-visible">
//       <defs>
//         <linearGradient id={`grad-${status}`} x1="0" y1="0" x2="0" y2="1">
//           <stop offset="0%" stopColor={color} stopOpacity="0.4" />
//           <stop offset="100%" stopColor={color} stopOpacity="0" />
//         </linearGradient>
//       </defs>
//       <path d={`${path} L 60 40 L 0 40 Z`} fill={`url(#grad-${status})`} />
//       <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
//     </svg>
//   );
// }

// export default function DashboardClient({ 
//   tier,
//   displayName,
//   userAvatar,
//   currencySymbol = "$",
//   dbAssets = [],
// }: {
//   tier: number;
//   displayName: string;
//   userAvatar: string;
//   currencySymbol?: string;
//   dbAssets?: any[];
// }) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { openModal } = useDevModal();
  
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");

//   // Read the selected pair from URL (e.g. ?pair=BTC-USD from the Markets page)
//   const pairParam = searchParams.get("pair");
//   const [baseAsset, setBaseAsset] = useState("BTC");
//   const [quoteAsset, setQuoteAsset] = useState("USD");

//   useEffect(() => {
//     setMounted(true);
//     if (pairParam) {
//       const [b, q] = pairParam.split("-");
//       setBaseAsset(b);
//       setQuoteAsset(q || "USD");
//     }
//   }, [pairParam]);

//   if (!mounted) return null;

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 w-full overflow-x-hidden">
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         {/* CARD 1: REDESIGNED HEADER */}
//         <motion.div 
//           initial={{ opacity: 0, y: -20 }} 
//           animate={{ opacity: 1, y: 0 }} 
//           className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden"
//         >
//           <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-8 opacity-[0.03] dark:opacity-[0.02]">
//             <Wallet size={200} strokeWidth={1} />
//           </div>

//           <div className="flex flex-col gap-6 w-full relative z-10 h-full">
//             <div className="flex justify-between items-center w-full gap-4 min-w-0">
//               <div className="flex items-center gap-3 sm:gap-4 min-w-0">
//                 <UserAvatar initialImage={userAvatar} userName={displayName} />
//                 <TimeGreeting userName={displayName} />
//               </div>
//               <div className="flex flex-col items-end justify-center shrink-0">
//                 <span className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 mb-0.5 sm:mb-1 whitespace-nowrap">
//                   Wallet Balance
//                 </span>
//                 <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
//                   <span className="text-sm sm:text-lg font-extrabold text-lime-950 dark:text-white">₦</span>
//                   <span className="text-xl sm:text-3xl font-extrabold text-lime-950 dark:text-white tracking-tight">
//                     $1,250.00
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-md mt-auto pt-2">
//               <Link href="/dashboard/transfer?mode=deposit" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#5d9e17] text-white rounded-xl text-sm sm:text-base font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20">
//                 <ArrowDown size={18} /> Deposit
//               </Link>
//               <Link href="/dashboard/transfer?mode=withdraw" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#e5e7eb] dark:bg-[#121A14] text-gray-700 dark:text-gray-300 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors">
//                 <ArrowUp size={18} /> Withdraw
//               </Link>
//             </div>
//           </div>
//         </motion.div>

//         {/* CARD 2: FAVORABLE PAIRS */}
//         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//           <FavorablePairsCard />
//         </motion.div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
//         {/* LEFT COLUMN (2/3 width on desktop) */}
//         <div className="lg:col-span-2 space-y-6">
          
//           {/* TIER CARD */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-xl">
//             <div className="flex items-center gap-4 mb-4 sm:mb-0">
//               <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-600 dark:text-lime-400">
//                 <ShieldCheck size={32} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white text-lg">Tier {tier} Account</h3>
//                 <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">Unlock crypto and meme coins.</p>
//               </div>
//             </div>
//             <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
//               <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
//                 <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
//               </div>
//               <Link href="/dashboard/rewards" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
//                 View Tasks & Rewards
//               </Link>
//             </div>
//           </motion.div>

//           {/* ACTIVE POSITIONS TABLE */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Activity size={18} className="text-lime-500" /> Active Positions
//               </h3>
//               <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View Terminal</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Asset</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Size</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Entry Price</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Mark Price</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold text-center">Trend</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold text-right">Unrealized P&L</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {POSITIONS.map((pos, i) => (
//                     <tr key={i} onClick={() => router.push(`/terminal?pair=${pos.asset.replace('/', '-')}&tradeId=${pos.id}`)} className="hover:bg-lime-500/5 transition-colors cursor-pointer">
//                       <td className="px-3 sm:px-4 py-3">
//                         <div className="flex items-center gap-2">
//                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.type === "Long" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.type}</span>
//                           <span className="font-bold text-lime-950 dark:text-white">{pos.asset}</span>
//                         </div>
//                       </td>
//                       <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.size}</td>
//                       <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{pos.entry}</td>
//                       <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{pos.current}</td>
//                       <td className="px-3 sm:px-4 py-3 flex justify-center">
//                         <TradeSparkline status={pos.status as any} />
//                       </td>
//                       <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${pos.isProfit ? "text-green-500" : "text-red-500"}`}>
//                         {pos.pnl} <span className="text-xs opacity-70">({pos.pnlPct})</span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>
//         {/* RECENT ACTIVITY TABLE */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl mt-6">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Wallet size={18} className="text-lime-500" /> Recent Activity
//               </h3>
//               <Link href="/dashboard/transfer" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Type</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Asset</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Amount</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Status</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold text-right">Date</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {RECENT_ACTIVITY.map((tx, i) => (
//                     <tr key={i} onClick={() => tx.type === 'Trade' ? router.push(`/terminal?pair=${tx.asset.replace('/', '-')}&tradeId=${tx.id}`) : null} className={`transition-colors ${tx.type === 'Trade' ? 'cursor-pointer hover:bg-lime-500/5' : ''}`}>
//                       <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white">{tx.type}</td>
//                       <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{tx.asset}</td>
//                       <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${tx.type === 'Deposit' ? 'text-green-500' : tx.type === 'Withdrawal' ? 'text-red-500' : 'text-lime-950 dark:text-white'}`}>
//                         {tx.amount}
//                       </td>
//                       <td className="px-3 sm:px-4 py-3">
//                         <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${tx.status === 'Completed' || tx.status === 'Filled' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
//                           {tx.status}
//                         </span>
//                       </td>
//                       <td className="px-3 sm:px-4 py-3 text-right text-xs text-lime-800/50 dark:text-lime-200/40">{tx.date}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>

//           {/* RISK & PERFORMANCE ANALYTICS */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: 'conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)' }}>
//                 <div className="w-16 h-16 bg-[#f4fbf5] dark:bg-[#0a0f0b] rounded-full m-auto translate-y-4 flex items-center justify-center">
//                   <PieChart size={20} className="text-lime-500" />
//                 </div>
//               </div>
//               <div>
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white mb-2">Asset Allocation</h4>
//                 <div className="space-y-1 text-xs font-medium">
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-lime-500">● Crypto</span> <span>60%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-blue-500">● Commodities</span> <span>25%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-amber-500">● Fiat</span> <span>15%</span></div>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
//               <div className="flex justify-between items-center mb-4">
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white">Risk Metrics</h4>
//                 <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">Low Risk</span>
//               </div>
//               <div className="space-y-3">
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Max Drawdown</span> <span>4.2%</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]"></div></div>
//                 </div>
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Risk-Reward Ratio</span> <span>1 : 2.4</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]"></div></div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>

//         </div>

//         {/* RIGHT COLUMN (1/3 width on desktop) */}
//         <div className="space-y-6">
          
//           {/* TRADING / ORDER PANEL */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">Quick Trade</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'buy' ? 'bg-green-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Buy</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Sell</button>
//             </div>

//             <div className="space-y-3 mb-6">
//               <div className="flex items-center gap-2">
//                 <Link
//                   href="/markets?select=base&returnUrl=/dashboard"
//                   className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
//                   title="Select Base Asset"
//                 >
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{baseAsset}</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>

//                 <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>

//                 <Link
//                   href="/markets?select=quote&returnUrl=/dashboard"
//                   className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
//                   title="Select Quote Asset"
//                 >
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{quoteAsset}</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>
//               </div>

//               <div className="relative">
//                 <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none">
//                   <option value="market">Market Order</option>
//                   <option value="limit">Limit Order</option>
//                   <option value="stop">Stop-Loss</option>
//                 </select>
//               </div>
//               <div>
//                 <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
//                   <span>Amount</span>
//                   <span>Available: $4,500</span>
//                 </div>
//                 <input type="number" placeholder="0.00" className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//               </div>
//             </div>

//             <KycGate requiredTier={1} currentTier={tier} featureName="trading">
//               <Button 
//                 onClick={() => router.push(`/terminal?pair=${baseAsset}-${quoteAsset}`)}
//                 className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
//               >
//                 Execute {tradeType === 'buy' ? 'Buy' : 'Sell'} Order
//               </Button>
//             </KycGate>
//           </motion.div>

//           {/* MARKET WATCH */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> Market Watch
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {MARKETS.map((market) => (
//                 <div 
//                   key={market.symbol} 
//                   onClick={() => router.push(`/terminal?pair=${market.symbol.replace('/', '-')}`)}
//                   className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                       {market.icon}
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}</p>
//                       <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">{market.price}</p>
//                     <p className={`text-xs font-bold flex items-center justify-end ${market.up ? 'text-green-500' : 'text-red-500'}`}>
//                       {market.up ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} {market.change}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//           {/* GAMIFICATION HUB */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
//             <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none">
//               <Award size={100} />
//             </div>
//             <div className="flex items-center gap-3 mb-3 relative z-10">
//               <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30">
//                 <Zap size={18} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white">Level 4 Trader</h3>
//                 <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">1,200 / 1,500 XP</p>
//               </div>
//             </div>
//             <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10">
//               <div className="h-full bg-lime-500 rounded-full w-[80%]"></div>
//             </div>
//             <Link href="/dashboard/rewards" className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10">
//               View Rewards & Badges <ChevronRight size={14} />
//             </Link>
//           </motion.div>

//           {/* MARKET NEWS */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
//               <Newspaper size={18} className="text-blue-500" /> Market News
//             </h3>
//             <div className="space-y-4">
//               {NEWS.map((news, i) => (
//                 <div key={i} className="group cursor-pointer">
//                   <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">{news.time} • {news.source}</p>
//                   <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">{news.title}</h4>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//         </div>
//       </div>
//     </div>
//   );
// }


// // app/dashboard/DashboardClient.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { motion } from "framer-motion";
// import Link from "next/link";
// import { 
//   TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck, Flame, 
//   Newspaper, ChevronRight, Award, Zap, ArrowDown, ArrowUp, Wallet, ChevronDown
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";

// const MARKETS = [
//   { symbol: 'BTC/USD', name: 'Bitcoin', price: '$64,230.00', change: '+2.4%', up: true, icon: "₿" },
//   { symbol: 'ETH/USD', name: 'Ethereum', price: '$3,450.00', change: '-1.2%', up: false, icon: "Ξ" },
//   { symbol: 'CHR-NGN', name: 'Charcoal', price: '₦42.50', change: '+0.8%', up: true, icon: "🌾" },
//   { symbol: 'SOL/USD', name: 'Solana', price: '$145.20', change: '-0.5%', up: false, icon: "◎" },
//   { symbol: 'DOGE/USD', name: 'Dogecoin', price: '$0.15', change: '+5.2%', up: true, icon: "Ð" },
// ];

// const POSITIONS = [
//   { id: 'pos-1', asset: "BTC/USD", type: "Long", size: "0.5 BTC", entry: "$64,200", current: "$67,430", pnl: "+$1,615", pnlPct: "+2.5%", isProfit: true, tp: "$68,000", sl: "$63,000", status: "increasing" as const },
//   { id: 'pos-2', asset: "ETH/USD", type: "Short", size: "2.0 ETH", entry: "$3,600", current: "$3,450", pnl: "+$300", pnlPct: "+4.1%", isProfit: true, tp: "$3,400", sl: "$3,700", status: "stable" as const },
//   { id: 'pos-3', asset: "SOL/USD", type: "Long", size: "10 SOL", entry: "$150", current: "$145", pnl: "-$50", pnlPct: "-3.3%", isProfit: false, tp: "$160", sl: "$140", status: "falling" as const },
// ];

// const RECENT_ACTIVITY = [
//   { id: 'act-1', type: "Deposit", asset: "USDT", amount: "+500.00", status: "Completed", date: "Today, 10:45 AM" },
//   { id: 'act-2', type: "Withdrawal", asset: "DOGE", amount: "-2,500", status: "Pending", date: "Yesterday, 4:20 PM" },
//   { id: 'act-3', type: "Trade", asset: "BTC/USD", amount: "Long", status: "Filled", date: "Yesterday, 9:00 AM" },
// ];

// const NEWS = [
//   { time: "10m ago", title: "Bitcoin breaks $67k resistance amid ETF inflows", source: "Bloomberg" },
//   { time: "1h ago", title: "SEC delays decision on Ethereum spot ETF", source: "Reuters" },
//   { time: "3h ago", title: "Global commodity prices stabilize after recent surge", source: "Financial Times" },
// ];

// function TradeSparkline({ status }: { status: 'stable' | 'increasing' | 'falling' | 'closed' }) {
//   let color = "#10b981";
//   let path = "M 0 20 Q 10 20, 20 15 T 40 15 T 60 20";
//   if (status === 'increasing') { color = "#3b82f6"; path = "M 0 25 Q 15 25, 20 15 T 40 10 T 60 5"; }
//   else if (status === 'falling') { color = "#eab308"; path = "M 0 5 Q 15 10, 20 15 T 40 20 T 60 25"; }
//   else if (status === 'closed') { color = "#ef4444"; path = "M 0 5 Q 15 10, 20 25 T 40 30 T 60 35"; }

//   return (
//     <svg viewBox="0 0 60 40" className="w-16 h-8 overflow-visible">
//       <defs>
//         <linearGradient id={`grad-${status}`} x1="0" y1="0" x2="0" y2="1">
//           <stop offset="0%" stopColor={color} stopOpacity="0.4" />
//           <stop offset="100%" stopColor={color} stopOpacity="0" />
//         </linearGradient>
//       </defs>
//       <path d={`${path} L 60 40 L 0 40 Z`} fill={`url(#grad-${status})`} />
//       <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
//     </svg>
//   );
// }

// export default function DashboardClient({ 
//   tier,
//   displayName,
//   userAvatar,
//   currencySymbol = "$",
//   dbAssets = [],
// }: {
//   tier: number;
//   displayName: string;
//   userAvatar: string;
//   currencySymbol?: string;
//   dbAssets?: any[];
// }) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { openModal } = useDevModal();
  
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");

//   // Read the selected pair from URL (e.g. ?pair=BTC-USD from the Markets page)
//   const pairParam = searchParams.get("pair");
//   const [baseAsset, setBaseAsset] = useState("BTC");
//   const [quoteAsset, setQuoteAsset] = useState("USD");

//   useEffect(() => {
//     setMounted(true);
//     if (pairParam) {
//       const [b, q] = pairParam.split("-");
//       setBaseAsset(b);
//       setQuoteAsset(q || "USD");
//     }
//   }, [pairParam]);

//   if (!mounted) return null;

//   return (
//     <div className="w-full max-w-[100vw] overflow-x-hidden space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4">
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         {/* HEADER CARD */}
//         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-xl h-full overflow-hidden">
//           <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-8 opacity-[0.03] dark:opacity-[0.02]">
//             <Wallet size={200} strokeWidth={1} />
//           </div>
//           <div className="flex flex-col gap-6 w-full relative z-10 h-full">
//             <div className="flex justify-between items-center w-full gap-4 min-w-0">
//               <div className="flex items-center gap-3 sm:gap-4 min-w-0">
//                 <UserAvatar initialImage={userAvatar} userName={displayName} />
//                 <TimeGreeting userName={displayName} />
//               </div>
//               <div className="flex flex-col items-end justify-center shrink-0">
//                 <span className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 mb-0.5 sm:mb-1 whitespace-nowrap">Wallet Balance</span>
//                 <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
//                   <span className="text-sm sm:text-lg font-extrabold text-lime-950 dark:text-white">₦</span>
//                   <span className="text-xl sm:text-3xl font-extrabold text-lime-950 dark:text-white tracking-tight">$1,250.00</span>
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-md mt-auto pt-2">
//               <Link href="/dashboard/transfer?mode=deposit" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#5d9e17] text-white rounded-xl text-sm sm:text-base font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20">
//                 <ArrowDown size={18} /> Deposit
//               </Link>
//               <Link href="/dashboard/transfer?mode=withdraw" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#e5e7eb] dark:bg-[#121A14] text-gray-700 dark:text-gray-300 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors">
//                 <ArrowUp size={18} /> Withdraw
//               </Link>
//             </div>
//           </div>
//         </motion.div>

//         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//           <FavorablePairsCard />
//         </motion.div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
//         <div className="lg:col-span-2 space-y-6">
          
//           {/* TIER CARD */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-xl">
//             <div className="flex items-center gap-4 mb-4 sm:mb-0">
//               <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-600 dark:text-lime-400"><ShieldCheck size={32} /></div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white text-lg">Tier {tier} Account</h3>
//                 <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">Unlock crypto and meme coins.</p>
//               </div>
//             </div>
//             <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
//               <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
//                 <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
//               </div>
//               <Link href="/dashboard/rewards" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View Tasks & Rewards</Link>
//             </div>
//           </motion.div>

//           {/* ACTIVE POSITIONS (Dynamic Mobile Scroll) */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2"><Activity size={18} className="text-lime-500" /> Active Positions</h3>
//               <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View Terminal</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Asset</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Size</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Entry Price</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Mark Price</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold text-center">Trend</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold text-right">Unrealized P&L</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {POSITIONS.map((pos, i) => (
//                     <tr key={i} onClick={() => router.push(`/terminal?pair=${pos.asset.replace('/', '-')}&tradeId=${pos.id}`)} className="hover:bg-lime-500/5 transition-colors cursor-pointer">
//                       <td className="px-3 sm:px-4 py-3">
//                         <div className="flex items-center gap-2">
//                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.type === "Long" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.type}</span>
//                           <span className="font-bold text-lime-950 dark:text-white">{pos.asset}</span>
//                         </div>
//                       </td>
//                       <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.size}</td>
//                       <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{pos.entry}</td>
//                       <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{pos.current}</td>
//                       <td className="px-3 sm:px-4 py-3 flex justify-center"><TradeSparkline status={pos.status as any} /></td>
//                       <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${pos.isProfit ? "text-green-500" : "text-red-500"}`}>
//                         {pos.pnl} <span className="text-xs opacity-70">({pos.pnlPct})</span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>

//           {/* RECENT ACTIVITY (Dynamic Mobile Scroll) */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl mt-6">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2"><Wallet size={18} className="text-lime-500" /> Recent Activity</h3>
//               <Link href="/dashboard/transfer" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Type</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Asset</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Amount</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">Status</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold text-right">Date</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {RECENT_ACTIVITY.map((tx, i) => (
//                     <tr key={i} onClick={() => tx.type === 'Trade' ? router.push(`/terminal?pair=${tx.asset.replace('/', '-')}&tradeId=${tx.id}`) : null} className={`transition-colors ${tx.type === 'Trade' ? 'cursor-pointer hover:bg-lime-500/5' : ''}`}>
//                       <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white">{tx.type}</td>
//                       <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{tx.asset}</td>
//                       <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${tx.type === 'Deposit' ? 'text-green-500' : tx.type === 'Withdrawal' ? 'text-red-500' : 'text-lime-950 dark:text-white'}`}>{tx.amount}</td>
//                       <td className="px-3 sm:px-4 py-3">
//                         <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${tx.status === 'Completed' || tx.status === 'Filled' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>{tx.status}</span>
//                       </td>
//                       <td className="px-3 sm:px-4 py-3 text-right text-xs text-lime-800/50 dark:text-lime-200/40">{tx.date}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>

//           {/* RISK METRICS */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: 'conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)' }}>
//                 <div className="w-16 h-16 bg-[#f4fbf5] dark:bg-[#0a0f0b] rounded-full m-auto translate-y-4 flex items-center justify-center"><PieChart size={20} className="text-lime-500" /></div>
//               </div>
//               <div>
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white mb-2">Asset Allocation</h4>
//                 <div className="space-y-1 text-xs font-medium">
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-lime-500">● Crypto</span> <span>60%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-blue-500">● Commodities</span> <span>25%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-amber-500">● Fiat</span> <span>15%</span></div>
//                 </div>
//               </div>
//             </div>
//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
//               <div className="flex justify-between items-center mb-4">
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white">Risk Metrics</h4>
//                 <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">Low Risk</span>
//               </div>
//               <div className="space-y-3">
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Max Drawdown</span> <span>4.2%</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]"></div></div>
//                 </div>
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Risk-Reward Ratio</span> <span>1 : 2.4</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]"></div></div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         </div>

//         <div className="space-y-6">
//           {/* QUICK TRADE (Now links to /markets with returnUrl) */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">Quick Trade</h3>
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'buy' ? 'bg-green-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Buy</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Sell</button>
//             </div>

//             <div className="space-y-3 mb-6">
//               <div className="flex items-center gap-2">
//                 <Link href="/markets?select=base&returnUrl=/dashboard" className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group" title="Select Base Asset">
//                   <div className="flex items-center gap-2">
//                     <span className="font-bold text-sm text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{baseAsset}</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>
//                 <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>
//                 <Link href="/markets?select=quote&returnUrl=/dashboard" className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group" title="Select Quote Asset">
//                   <div className="flex items-center gap-2">
//                     <span className="font-bold text-sm text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{quoteAsset}</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>
//               </div>

//               <div className="relative">
//                 <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none">
//                   <option value="market">Market Order</option>
//                   <option value="limit">Limit Order</option>
//                 </select>
//               </div>
//               <div>
//                 <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
//                   <span>Amount</span>
//                   <span>Available: $4,500</span>
//                 </div>
//                 <input type="number" placeholder="0.00" className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//               </div>
//             </div>

//             <KycGate requiredTier={1} currentTier={tier} featureName="trading">
//               <Button 
//                 onClick={() => router.push(`/terminal?pair=${baseAsset}-${quoteAsset}`)} 
//                 className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
//               >
//                 Execute {tradeType === 'buy' ? 'Buy' : 'Sell'} Order
//               </Button>
//             </KycGate>
//           </motion.div>

//           {/* MARKET WATCH */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2"><Flame size={18} className="text-orange-500" /> Market Watch</h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {MARKETS.map((market) => (
//                 <div key={market.symbol} onClick={() => router.push(`/terminal?pair=${market.symbol.replace('/', '-')}`)} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">{market.icon}</div>
//                     <div>
//                       <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}</p>
//                       <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">{market.price}</p>
//                     <p className={`text-xs font-bold flex items-center justify-end ${market.up ? 'text-green-500' : 'text-red-500'}`}>
//                       {market.up ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} {market.change}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//           {/* GAMIFICATION & NEWS */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
//             <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none"><Award size={100} /></div>
//             <div className="flex items-center gap-3 mb-3 relative z-10">
//               <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30"><Zap size={18} /></div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white">Level 4 Trader</h3>
//                 <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">1,200 / 1,500 XP</p>
//               </div>
//             </div>
//             <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10"><div className="h-full bg-lime-500 rounded-full w-[80%]"></div></div>
//             <Link href="/dashboard/rewards" className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10">View Rewards & Badges <ChevronRight size={14} /></Link>
//           </motion.div>

//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2"><Newspaper size={18} className="text-blue-500" /> Market News</h3>
//             <div className="space-y-4">
//               {NEWS.map((news, i) => (
//                 <div key={i} className="group cursor-pointer">
//                   <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">{news.time} • {news.source}</p>
//                   <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">{news.title}</h4>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// }
// // app/dashboard/DashboardClient.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { motion } from "framer-motion";
// import Link from "next/link";
// import { 
//   TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
//   Activity, PieChart, ShieldCheck, Flame, 
//   Newspaper, ChevronRight, Award, Zap, User, ArrowDown, ArrowUp, Wallet, ChevronDown,
//   AlertTriangle, CheckCircle2
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";

// const MARKETS = [
//   { symbol: 'BTC/USD', name: 'Bitcoin', price: '$64,230.00', change: '+2.4%', up: true, icon: "₿" },
//   { symbol: 'ETH/USD', name: 'Ethereum', price: '$3,450.00', change: '-1.2%', up: false, icon: "Ξ" },
//   { symbol: 'CHR-NGN', name: 'Charcoal', price: '₦42.50', change: '+0.8%', up: true, icon: "🌾" },
//   { symbol: 'SOL/USD', name: 'Solana', price: '$145.20', change: '-0.5%', up: false, icon: "◎" },
//   { symbol: 'DOGE/USD', name: 'Dogecoin', price: '$0.15', change: '+5.2%', up: true, icon: "Ð" },
// ];

// // Added TP/SL and Sparkline types
// const RECENT_ACTIVITY = [
//   { id: 'act-1', type: "Deposit", asset: "USDT", amount: "+500.00", status: "Completed", date: "Today, 10:45 AM" },
//   { id: 'act-2', type: "Withdrawal", asset: "DOGE", amount: "-2,500", status: "Pending", date: "Yesterday, 4:20 PM" },
//   { id: 'act-3', type: "Trade", asset: "BTC/USD", amount: "Long", status: "Filled", date: "Yesterday, 9:00 AM" },
// ];

// const POSITIONS = [
//   { id: 'pos-1', asset: "BTC/USD", type: "Long", size: "0.5 BTC", entry: "$64,200", current: "$67,430", pnl: "+$1,615", pnlPct: "+2.5%", isProfit: true, tp: "$68,000", sl: "$63,000", status: "increasing" as const },
//   { id: 'pos-2', asset: "ETH/USD", type: "Short", size: "2.0 ETH", entry: "$3,600", current: "$3,450", pnl: "+$300", pnlPct: "+4.1%", isProfit: true, tp: "$3,400", sl: "$3,700", status: "stable" as const },
//   { id: 'pos-3', asset: "SOL/USD", type: "Long", size: "10 SOL", entry: "$150", current: "$145", pnl: "-$50", pnlPct: "-3.3%", isProfit: false, tp: "$160", sl: "$140", status: "falling" as const },
// ];

// const NEWS = [
//   { time: "10m ago", title: "Bitcoin breaks $67k resistance amid ETF inflows", source: "Bloomberg" },
//   { time: "1h ago", title: "SEC delays decision on Ethereum spot ETF", source: "Reuters" },
//   { time: "3h ago", title: "Global commodity prices stabilize after recent surge", source: "Financial Times" },
// ];

// // 👇 Sparkline Component
// function TradeSparkline({ status }: { status: 'stable' | 'increasing' | 'falling' | 'closed' }) {
//   let color = "#10b981"; // Green
//   let path = "M 0 20 Q 10 20, 20 15 T 40 15 T 60 20";

//   if (status === 'increasing') {
//     color = "#3b82f6"; // Blue
//     path = "M 0 25 Q 15 25, 20 15 T 40 10 T 60 5";
//   } else if (status === 'falling') {
//     color = "#eab308"; // Yellow
//     path = "M 0 5 Q 15 10, 20 15 T 40 20 T 60 25";
//   } else if (status === 'closed') {
//     color = "#ef4444"; // Red
//     path = "M 0 5 Q 15 10, 20 25 T 40 30 T 60 35";
//   }

//   return (
//     <svg viewBox="0 0 60 40" className="w-16 h-8 overflow-visible">
//       <defs>
//         <linearGradient id={`grad-${status}`} x1="0" y1="0" x2="0" y2="1">
//           <stop offset="0%" stopColor={color} stopOpacity="0.4" />
//           <stop offset="100%" stopColor={color} stopOpacity="0" />
//         </linearGradient>
//       </defs>
//       <path d={`${path} L 60 40 L 0 40 Z`} fill={`url(#grad-${status})`} />
//       <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
//     </svg>
//   );
// }

// export default function DashboardClient({ 
//   tier,
//   displayName,
//   userAvatar,
//   currencySymbol = "$",
//   dbAssets = [],
// }: {
//   tier: number;
//   displayName: string;
//   userAvatar: string;
//   currencySymbol?: string;
//   dbAssets?: any[];
// }) {
//   const router = useRouter();
//   const { openModal } = useDevModal(); // Hook for notifications
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");

//   useEffect(() => setMounted(true), []);

//   // Simulate TP/SL triggers
//   useEffect(() => {
//     if (mounted) {
//       const timer = setTimeout(() => {
//         openModal(
//           "Take Profit", 
//           "Your trade on BTC/USD has reached your Take Profit target of $68,000. Trade closed.", 
//           "success"
//         );
//       }, 5000); // Trigger after 5 seconds just for demo
//       return () => clearTimeout(timer);
//     }
//   }, [mounted, openModal]);

//   if (!mounted) return null;

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8">
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         {/* CARD 1: REDESIGNED HEADER */}
//         <motion.div 
//           initial={{ opacity: 0, y: -20 }} 
//           animate={{ opacity: 1, y: 0 }} 
//           className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden"
//         >
//           <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-8 opacity-[0.03] dark:opacity-[0.02]">
//             <Wallet size={200} strokeWidth={1} />
//           </div>

//           <div className="flex flex-col gap-6 w-full relative z-10 h-full">
//             <div className="flex justify-between items-center w-full gap-4 min-w-0">
//               <div className="flex items-center gap-3 sm:gap-4 min-w-0">
//                 <UserAvatar initialImage={userAvatar} userName={displayName} />
//                 <TimeGreeting userName={displayName} />
//               </div>
//               <div className="flex flex-col items-end justify-center shrink-0">
//                 <span className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 mb-0.5 sm:mb-1 whitespace-nowrap">
//                   Wallet Balance
//                 </span>
//                 <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
//                   <span className="text-sm sm:text-lg font-extrabold text-lime-950 dark:text-white">₦</span>
//                   <span className="text-xl sm:text-3xl font-extrabold text-lime-950 dark:text-white tracking-tight">
//                     $1,250.00
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-md mt-auto pt-2">
//               <Link 
//                 href="/dashboard/transfer?mode=deposit" 
//                 className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#5d9e17] text-white rounded-xl text-sm sm:text-base font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20"
//               >
//                 <ArrowDown size={18} /> Deposit
//               </Link>
//               <Link 
//                 href="/dashboard/transfer?mode=withdraw" 
//                 className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#e5e7eb] dark:bg-[#121A14] text-gray-700 dark:text-gray-300 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors">
//                 <ArrowUp size={18} /> Withdraw
//               </Link>
//             </div>
//           </div>
//         </motion.div>

//         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//           <FavorablePairsCard />
//         </motion.div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
//         <div className="lg:col-span-2 space-y-6">
          
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-xl">
//             <div className="flex items-center gap-4 mb-4 sm:mb-0">
//               <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-600 dark:text-lime-400">
//                 <ShieldCheck size={32} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white text-lg">Tier {tier} Account</h3>
//                 <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">Unlock crypto and meme coins.</p>
//               </div>
//             </div>
//             <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
//               <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
//                 <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
//               </div>
//               <Link href="/dashboard/rewards" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
//                 View Tasks & Rewards
//               </Link>
//             </div>
//           </motion.div>

//           {/* 👇 ACTIVE POSITIONS TABLE (Mobile Responsive + Sparkline) 👇 */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Activity size={18} className="text-lime-500" /> Active Positions
//               </h3>
//               <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View Terminal</Link>
//             </div>
//             {/* Added overflow-x-auto and min-w for mobile scrolling */}
//             <div className="overflow-x-auto custom-scrollbar">
//               <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="p-4 font-semibold">Asset</th>
//                     <th className="p-4 font-semibold">Size</th>
//                     <th className="p-4 font-semibold">Entry Price</th>
//                     <th className="p-4 font-semibold">Mark Price</th>
//                     <th className="p-4 font-semibold text-center">Trend</th>
//                     <th className="p-4 font-semibold text-right">Unrealized P&L</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {POSITIONS.map((pos, i) => (
//                     <tr 
//                       key={i} 
//                       onClick={() => router.push(`/terminal?pair=${pos.asset.replace('/', '-')}&tradeId=${pos.id}`)}
//                       className="hover:bg-lime-500/5 transition-colors cursor-pointer"
//                     >
//                       <td className="p-4">
//                         <div className="flex items-center gap-2">
//                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.type === "Long" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.type}</span>
//                           <span className="font-bold text-lime-950 dark:text-white">{pos.asset}</span>
//                         </div>
//                       </td>
//                       <td className="p-4 font-mono text-lime-800 dark:text-lime-200">{pos.size}</td>
//                       <td className="p-4 font-mono text-lime-800/60 dark:text-lime-200/50">{pos.entry}</td>
//                       <td className="p-4 font-mono text-lime-950 dark:text-white">{pos.current}</td>
//                       <td className="p-4 flex justify-center">
//                         <TradeSparkline status={pos.status} />
//                       </td>
//                       <td className={`p-4 text-right font-bold font-mono ${pos.isProfit ? "text-green-500" : "text-red-500"}`}>
//                         {pos.pnl} <span className="text-xs opacity-70">({pos.pnlPct})</span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>

//           {/* 👇 RECENT ACTIVITY TABLE (Mobile Responsive) 👇 */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl mt-6">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Wallet size={18} className="text-lime-500" /> Recent Activity
//               </h3>
//               <Link href="/dashboard/transfer" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</Link>
//             </div>
//             <div className="overflow-x-auto custom-scrollbar">
//               <table className="w-full text-left text-sm whitespace-nowrap min-w-[500px]">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="p-4 font-semibold">Type</th>
//                     <th className="p-4 font-semibold">Asset</th>
//                     <th className="p-4 font-semibold">Amount</th>
//                     <th className="p-4 font-semibold">Status</th>
//                     <th className="p-4 font-semibold text-right">Date</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {RECENT_ACTIVITY.map((tx, i) => (
//                     <tr 
//                       key={i} 
//                       onClick={() => tx.type === 'Trade' ? router.push(`/terminal?pair=${tx.asset.replace('/', '-')}&tradeId=${tx.id}`) : null}
//                       className={`transition-colors ${tx.type === 'Trade' ? 'cursor-pointer hover:bg-lime-500/5' : ''}`}
//                     >
//                       <td className="p-4 font-bold text-lime-950 dark:text-white">{tx.type}</td>
//                       <td className="p-4 font-mono text-lime-800 dark:text-lime-200">{tx.asset}</td>
//                       <td className={`p-4 font-mono font-bold ${tx.type === 'Deposit' ? 'text-green-500' : tx.type === 'Withdrawal' ? 'text-red-500' : 'text-lime-950 dark:text-white'}`}>
//                         {tx.amount}
//                       </td>
//                       <td className="p-4">
//                         <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${tx.status === 'Completed' || tx.status === 'Filled' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
//                           {tx.status}
//                         </span>
//                       </td>
//                       <td className="p-4 text-right text-xs text-lime-800/50 dark:text-lime-200/40">{tx.date}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>

//           {/* RISK & PERFORMANCE ANALYTICS */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: 'conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)' }}>
//                 <div className="w-16 h-16 bg-[#f4fbf5] dark:bg-[#0a0f0b] rounded-full m-auto translate-y-4 flex items-center justify-center">
//                   <PieChart size={20} className="text-lime-500" />
//                 </div>
//               </div>
//               <div>
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white mb-2">Asset Allocation</h4>
//                 <div className="space-y-1 text-xs font-medium">
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-lime-500">● Crypto</span> <span>60%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-blue-500">● Commodities</span> <span>25%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-amber-500">● Fiat</span> <span>15%</span></div>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
//               <div className="flex justify-between items-center mb-4">
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white">Risk Metrics</h4>
//                 <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">Low Risk</span>
//               </div>
//               <div className="space-y-3">
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Max Drawdown</span> <span>4.2%</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]"></div></div>
//                 </div>
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Risk-Reward Ratio</span> <span>1 : 2.4</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]"></div></div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         </div>

//         <div className="space-y-6">
//           {/* TRADING / ORDER PANEL (Added TP/SL inputs) */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">Quick Trade</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'buy' ? 'bg-green-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Buy</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Sell</button>
//             </div>

//             <div className="space-y-3 mb-6">
//               <div className="flex items-center gap-2">
//                 <Link
//                   href="/markets?select=base"
//                   className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
//                   title="Select Base Asset"
//                 >
//                   <div className="flex items-center gap-2">
//                     <svg className="w-5 h-5 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
//                       <circle cx="16" cy="16" r="16" fill="#F7931A"/>
//                       <path d="M22.3 13.8C22.6 12 21.3 11 19.3 10.4L20 7.6L18.2 7.2L17.5 9.9C17 9.8 16.5 9.6 16 9.5L16.7 6.8L14.9 6.4L14.2 9.2C13.8 9.1 13.4 9 13 8.9L13 8.9L10.5 8.3L10.1 10.2C10.1 10.2 11.4 10.5 11.4 10.5C12.1 10.7 12.2 11.2 12.2 11.5L11.4 14.7C11.4 14.7 11.5 14.7 11.5 14.8L11.4 14.8L10.3 19.3C10.2 19.5 10.1 19.8 9.6 19.7C9.6 19.7 8.3 19.4 8.3 19.4L7.6 21.4L9.9 22C10.3 22.1 10.8 22.2 11.2 22.3L10.5 25.1L12.3 25.5L13 22.7C13.5 22.8 13.9 22.9 14.4 23L13.7 25.8L15.5 26.2L16.2 23.4C19.1 24 21.3 23.7 22.2 21.1C23 19 22.1 17.8 20 17C21.5 16.6 22.1 15.5 22.3 13.8ZM18.3 20C17.7 21.4 16.5 21 15.4 20.7L16.2 17.5C17.3 17.8 18.8 18.3 18.3 20ZM19.3 14.1C18.8 15.4 17.7 15 16.8 14.8L17.5 11.9C18.4 12.1 19.7 12.5 19.3 14.1Z" fill="white"/>
//                     </svg>
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">BTC</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>

//                 <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>

//                 <Link
//                   href="/markets?select=quote"
//                   className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
//                   title="Select Quote Asset"
//                 >
//                   <div className="flex items-center gap-2">
//                     <svg className="w-5 h-5 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
//                       <circle cx="16" cy="16" r="16" fill="#20B26C"/>
//                       <path d="M16 23.5C13.5 23.5 11.5 21.5 11.5 19H14C14 20.2 14.9 21 16 21C17.1 21 18 20.2 18 19C18 17.8 17.1 17 16 17C13.5 17 11.5 15 11.5 12.5C11.5 10.2 13.2 8.3 15.5 8V6H16.5V8C18.8 8.3 20.5 10.2 20.5 12.5H18C18 11.3 17.1 10.5 16 10.5C14.9 10.5 14 11.3 14 12.5C14 13.7 14.9 14.5 16 14.5C18.5 14.5 20.5 16.5 20.5 19C20.5 21.3 18.8 23.2 16.5 23.5V26H15.5V23.5Z" fill="white"/>
//                     </svg>
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">USD</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>
//               </div>

//               <div className="relative">
//                 <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none">
//                   <option value="market">Market Order</option>
//                   <option value="limit">Limit Order</option>
//                   <option value="stop">Stop-Loss</option>
//                 </select>
//               </div>
//               <div>
//                 <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
//                   <span>Amount</span>
//                   <span>Available: $4,500</span>
//                 </div>
//                 <input type="number" placeholder="0.00" className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//               </div>

//               {/* NEW: Take Profit / Stop Loss Inputs */}
//               <div className="grid grid-cols-2 gap-2">
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block px-1">Take Profit</label>
//                   <input type="number" placeholder="Price" className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block px-1">Stop Loss</label>
//                   <input type="number" placeholder="Price" className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                 </div>
//               </div>
//             </div>

//             <KycGate requiredTier={1} currentTier={tier} featureName="trading">
//               <Button className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}>
//                 Execute {tradeType === 'buy' ? 'Buy' : 'Sell'} Order
//               </Button>
//             </KycGate>
//           </motion.div>

//           {/* MARKET WATCH */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> Market Watch
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {MARKETS.map((market) => (
//                 <div 
//                   key={market.symbol} 
//                   onClick={() => router.push(`/terminal?pair=${market.symbol.replace('/', '-')}`)}
//                   className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                       {market.icon}
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}</p>
//                       <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">{market.price}</p>
//                     <p className={`text-xs font-bold flex items-center justify-end ${market.up ? 'text-green-500' : 'text-red-500'}`}>
//                       {market.up ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} {market.change}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//           {/* GAMIFICATION HUB */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
//             <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none">
//               <Award size={100} />
//             </div>
//             <div className="flex items-center gap-3 mb-3 relative z-10">
//               <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30">
//                 <Zap size={18} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white">Level 4 Trader</h3>
//                 <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">1,200 / 1,500 XP</p>
//               </div>
//             </div>
//             <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10">
//               <div className="h-full bg-lime-500 rounded-full w-[80%]"></div>
//             </div>
//             <Link href="/dashboard/rewards" className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10">
//               View Rewards & Badges <ChevronRight size={14} />
//             </Link>
//           </motion.div>

//           {/* MARKET NEWS */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
//               <Newspaper size={18} className="text-blue-500" /> Market News
//             </h3>
//             <div className="space-y-4">
//               {NEWS.map((news, i) => (
//                 <div key={i} className="group cursor-pointer">
//                   <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">{news.time} • {news.source}</p>
//                   <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">{news.title}</h4>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// }
// // app/dashboard/DashboardClient.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { motion } from "framer-motion";
// import Link from "next/link";
// import { 
//   TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
//   Activity, PieChart, ShieldCheck, Flame, 
//   Newspaper, ChevronRight, Award, Zap, User, ArrowDown, ArrowUp, Wallet, ChevronDown
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";

// const MARKETS = [
//   { symbol: 'BTC/USD', name: 'Bitcoin', price: '$64,230.00', change: '+2.4%', up: true, icon: "₿" },
//   { symbol: 'ETH/USD', name: 'Ethereum', price: '$3,450.00', change: '-1.2%', up: false, icon: "Ξ" },
//   { symbol: 'CHR-NGN', name: 'Charcoal', price: '₦42.50', change: '+0.8%', up: true, icon: "🌾" },
//   { symbol: 'SOL/USD', name: 'Solana', price: '$145.20', change: '-0.5%', up: false, icon: "◎" },
//   { symbol: 'DOGE/USD', name: 'Dogecoin', price: '$0.15', change: '+5.2%', up: true, icon: "Ð" },
// ];

// // Added id to link to terminal
// const RECENT_ACTIVITY = [
//   { id: 'act-1', type: "Deposit", asset: "USDT", amount: "+500.00", status: "Completed", date: "Today, 10:45 AM" },
//   { id: 'act-2', type: "Withdrawal", asset: "DOGE", amount: "-2,500", status: "Pending", date: "Yesterday, 4:20 PM" },
//   { id: 'act-3', type: "Trade", asset: "BTC/USD", amount: "Long", status: "Filled", date: "Yesterday, 9:00 AM" },
// ];

// // Added id to link to terminal
// const POSITIONS = [
//   { id: 'pos-1', asset: "BTC/USD", type: "Long", size: "0.5 BTC", entry: "$64,200", current: "$67,430", pnl: "+$1,615", pnlPct: "+2.5%", isProfit: true },
//   { id: 'pos-2', asset: "ETH/USD", type: "Short", size: "2.0 ETH", entry: "$3,600", current: "$3,450", pnl: "+$300", pnlPct: "+4.1%", isProfit: true },
//   { id: 'pos-3', asset: "SOL/USD", type: "Long", size: "10 SOL", entry: "$150", current: "$145", pnl: "-$50", pnlPct: "-3.3%", isProfit: false },
// ];

// const NEWS = [
//   { time: "10m ago", title: "Bitcoin breaks $67k resistance amid ETF inflows", source: "Bloomberg" },
//   { time: "1h ago", title: "SEC delays decision on Ethereum spot ETF", source: "Reuters" },
//   { time: "3h ago", title: "Global commodity prices stabilize after recent surge", source: "Financial Times" },
// ];

// export default function DashboardClient({ 
//   tier,
//   displayName,
//   userAvatar,
//   currencySymbol = "$",
//   dbAssets = [],
// }: {
//   tier: number;
//   displayName: string;
//   userAvatar: string;
//   currencySymbol?: string;
//   dbAssets?: any[];
// }) {
//   const router = useRouter();
//   const { openModal } = useDevModal();
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");

//   useEffect(() => setMounted(true), []);

//   if (!mounted) return null;

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8">
      
//       {/* 👇 TOP GRID: HEADER & FAVORABLE PAIRS 👇 */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         {/* CARD 1: REDESIGNED HEADER */}
//         <motion.div 
//           initial={{ opacity: 0, y: -20 }} 
//           animate={{ opacity: 1, y: 0 }} 
//           className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden"
//         >
//           {/* Watermark */}
//           <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-8 opacity-[0.03] dark:opacity-[0.02]">
//             <Wallet size={200} strokeWidth={1} />
//           </div>

//           <div className="flex flex-col gap-6 w-full relative z-10 h-full">
            
//             {/* Top Row: Avatar/Greeting and Wallet Balance */}
//             <div className="flex justify-between items-center w-full gap-4 min-w-0">
              
//               {/* Left: Avatar & Greeting */}
//               <div className="flex items-center gap-3 sm:gap-4 min-w-0">
//                 <UserAvatar initialImage={userAvatar} userName={displayName} />
//                 <TimeGreeting userName={displayName} />
//               </div>
              
//               {/* Right: Wallet Balance */}
//               <div className="flex flex-col items-end justify-center shrink-0">
//                 <span className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 mb-0.5 sm:mb-1 whitespace-nowrap">
//                   Wallet Balance
//                 </span>
//                 <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
//                   <span className="text-sm sm:text-lg font-extrabold text-lime-950 dark:text-white">₦</span>
//                   <span className="text-xl sm:text-3xl font-extrabold text-lime-950 dark:text-white tracking-tight">
//                     $1,250.00
//                   </span>
//                 </div>
//               </div>

//             </div>

//             {/* Bottom Row: Buttons */}
//             <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-md mt-auto pt-2">
//               {/* Green Deposit Button */}
//               <Link 
//                 href="/dashboard/transfer?mode=deposit" 
//                 className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#5d9e17] text-white rounded-xl text-sm sm:text-base font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20"
//               >
//                 <ArrowDown size={18} /> Deposit
//               </Link>
              
//               {/* Grey Withdraw Button */}
//               <Link 
//                 href="/dashboard/transfer?mode=withdraw" 
//                 className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#e5e7eb] dark:bg-[#121A14] text-gray-700 dark:text-gray-300 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors">
//                 <ArrowUp size={18} /> Withdraw
//               </Link>
//             </div>
//           </div>
//         </motion.div>

//         {/* CARD 2: FAVORABLE PAIRS */}
//         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//           <FavorablePairsCard />
//         </motion.div>

//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
//         {/* LEFT COLUMN (2/3 width on desktop) */}
//         <div className="lg:col-span-2 space-y-6">
          
//           {/* TIER CARD */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-xl">
//             <div className="flex items-center gap-4 mb-4 sm:mb-0">
//               <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-600 dark:text-lime-400">
//                 <ShieldCheck size={32} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white text-lg">Tier {tier} Account</h3>
//                 <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">Unlock crypto and meme coins.</p>
//               </div>
//             </div>
//             <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
//               <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
//                 <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
//               </div>
//               <Link href="/dashboard/rewards" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
//                 View Tasks & Rewards
//               </Link>
//             </div>
//           </motion.div>

//           {/* ACTIVE POSITIONS TABLE */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Activity size={18} className="text-lime-500" /> Active Positions
//               </h3>
//               <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View Terminal</Link>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full text-left text-sm whitespace-nowrap">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="p-4 font-semibold">Asset</th>
//                     <th className="p-4 font-semibold">Size</th>
//                     <th className="p-4 font-semibold">Entry Price</th>
//                     <th className="p-4 font-semibold">Mark Price</th>
//                     <th className="p-4 font-semibold text-right">Unrealized P&L</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {POSITIONS.map((pos, i) => (
//                     <tr 
//                       key={i} 
//                       onClick={() => router.push(`/terminal?pair=${pos.asset.replace('/', '-')}&tradeId=${pos.id}`)}
//                       className="hover:bg-lime-500/5 transition-colors cursor-pointer"
//                     >
//                       <td className="p-4">
//                         <div className="flex items-center gap-2">
//                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.type === "Long" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.type}</span>
//                           <span className="font-bold text-lime-950 dark:text-white">{pos.asset}</span>
//                         </div>
//                       </td>
//                       <td className="p-4 font-mono text-lime-800 dark:text-lime-200">{pos.size}</td>
//                       <td className="p-4 font-mono text-lime-800/60 dark:text-lime-200/50">{pos.entry}</td>
//                       <td className="p-4 font-mono text-lime-950 dark:text-white">{pos.current}</td>
//                       <td className={`p-4 text-right font-bold font-mono ${pos.isProfit ? "text-green-500" : "text-red-500"}`}>
//                         {pos.pnl} <span className="text-xs opacity-70">({pos.pnlPct})</span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>

//           {/* RECENT ACTIVITY TABLE */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl mt-6">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Wallet size={18} className="text-lime-500" /> Recent Activity
//               </h3>
//               <Link href="/dashboard/transfer" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</Link>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full text-left text-sm whitespace-nowrap">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="p-4 font-semibold">Type</th>
//                     <th className="p-4 font-semibold">Asset</th>
//                     <th className="p-4 font-semibold">Amount</th>
//                     <th className="p-4 font-semibold">Status</th>
//                     <th className="p-4 font-semibold text-right">Date</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {RECENT_ACTIVITY.map((tx, i) => (
//                     <tr 
//                       key={i} 
//                       onClick={() => tx.type === 'Trade' ? router.push(`/terminal?pair=${tx.asset.replace('/', '-')}&tradeId=${tx.id}`) : null}
//                       className={`transition-colors ${tx.type === 'Trade' ? 'cursor-pointer hover:bg-lime-500/5' : ''}`}
//                     >
//                       <td className="p-4 font-bold text-lime-950 dark:text-white">{tx.type}</td>
//                       <td className="p-4 font-mono text-lime-800 dark:text-lime-200">{tx.asset}</td>
//                       <td className={`p-4 font-mono font-bold ${tx.type === 'Deposit' ? 'text-green-500' : tx.type === 'Withdrawal' ? 'text-red-500' : 'text-lime-950 dark:text-white'}`}>
//                         {tx.amount}
//                       </td>
//                       <td className="p-4">
//                         <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${tx.status === 'Completed' || tx.status === 'Filled' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
//                           {tx.status}
//                         </span>
//                       </td>
//                       <td className="p-4 text-right text-xs text-lime-800/50 dark:text-lime-200/40">{tx.date}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>

//           {/* RISK & PERFORMANCE ANALYTICS */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: 'conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)' }}>
//                 <div className="w-16 h-16 bg-[#f4fbf5] dark:bg-[#0a0f0b] rounded-full m-auto translate-y-4 flex items-center justify-center">
//                   <PieChart size={20} className="text-lime-500" />
//                 </div>
//               </div>
//               <div>
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white mb-2">Asset Allocation</h4>
//                 <div className="space-y-1 text-xs font-medium">
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-lime-500">● Crypto</span> <span>60%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-blue-500">● Commodities</span> <span>25%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-amber-500">● Fiat</span> <span>15%</span></div>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
//               <div className="flex justify-between items-center mb-4">
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white">Risk Metrics</h4>
//                 <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">Low Risk</span>
//               </div>
//               <div className="space-y-3">
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Max Drawdown</span> <span>4.2%</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]"></div></div>
//                 </div>
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Risk-Reward Ratio</span> <span>1 : 2.4</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]"></div></div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>

//         </div>

//         {/* RIGHT COLUMN (1/3 width on desktop) */}
//         <div className="space-y-6">
          
//           {/* TRADING / ORDER PANEL */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">Quick Trade</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'buy' ? 'bg-green-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Buy</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Sell</button>
//             </div>

//             <div className="space-y-3 mb-6">
//               {/* NEW ASSET SELECTOR UI */}
//               <div className="flex items-center gap-2">
//                 <Link
//                   href="/markets?select=base"
//                   className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
//                   title="Select Base Asset"
//                 >
//                   <div className="flex items-center gap-2">
//                     <svg className="w-5 h-5 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
//                       <circle cx="16" cy="16" r="16" fill="#F7931A"/>
//                       <path d="M22.3 13.8C22.6 12 21.3 11 19.3 10.4L20 7.6L18.2 7.2L17.5 9.9C17 9.8 16.5 9.6 16 9.5L16.7 6.8L14.9 6.4L14.2 9.2C13.8 9.1 13.4 9 13 8.9L13 8.9L10.5 8.3L10.1 10.2C10.1 10.2 11.4 10.5 11.4 10.5C12.1 10.7 12.2 11.2 12.2 11.5L11.4 14.7C11.4 14.7 11.5 14.7 11.5 14.8L11.4 14.8L10.3 19.3C10.2 19.5 10.1 19.8 9.6 19.7C9.6 19.7 8.3 19.4 8.3 19.4L7.6 21.4L9.9 22C10.3 22.1 10.8 22.2 11.2 22.3L10.5 25.1L12.3 25.5L13 22.7C13.5 22.8 13.9 22.9 14.4 23L13.7 25.8L15.5 26.2L16.2 23.4C19.1 24 21.3 23.7 22.2 21.1C23 19 22.1 17.8 20 17C21.5 16.6 22.1 15.5 22.3 13.8ZM18.3 20C17.7 21.4 16.5 21 15.4 20.7L16.2 17.5C17.3 17.8 18.8 18.3 18.3 20ZM19.3 14.1C18.8 15.4 17.7 15 16.8 14.8L17.5 11.9C18.4 12.1 19.7 12.5 19.3 14.1Z" fill="white"/>
//                     </svg>
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">BTC</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>

//                 <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>

//                 <Link
//                   href="/markets?select=quote"
//                   className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
//                   title="Select Quote Asset"
//                 >
//                   <div className="flex items-center gap-2">
//                     <svg className="w-5 h-5 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
//                       <circle cx="16" cy="16" r="16" fill="#20B26C"/>
//                       <path d="M16 23.5C13.5 23.5 11.5 21.5 11.5 19H14C14 20.2 14.9 21 16 21C17.1 21 18 20.2 18 19C18 17.8 17.1 17 16 17C13.5 17 11.5 15 11.5 12.5C11.5 10.2 13.2 8.3 15.5 8V6H16.5V8C18.8 8.3 20.5 10.2 20.5 12.5H18C18 11.3 17.1 10.5 16 10.5C14.9 10.5 14 11.3 14 12.5C14 13.7 14.9 14.5 16 14.5C18.5 14.5 20.5 16.5 20.5 19C20.5 21.3 18.8 23.2 16.5 23.5V26H15.5V23.5Z" fill="white"/>
//                     </svg>
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">USD</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>
//               </div>

//               <div className="relative">
//                 <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none">
//                   <option value="market">Market Order</option>
//                   <option value="limit">Limit Order</option>
//                   <option value="stop">Stop-Loss</option>
//                 </select>
//               </div>
//               <div>
//                 <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
//                   <span>Amount</span>
//                   <span>Available: $4,500</span>
//                 </div>
//                 <input type="number" placeholder="0.00" className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//               </div>
//             </div>

//             <KycGate requiredTier={1} currentTier={tier} featureName="trading">
//               <Button className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}>
//                 Execute {tradeType === 'buy' ? 'Buy' : 'Sell'} Order
//               </Button>
//             </KycGate>
//           </motion.div>

//           {/* MARKET WATCH */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> Market Watch
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {MARKETS.map((market) => (
//                 <div 
//                   key={market.symbol} 
//                   onClick={() => router.push(`/terminal?pair=${market.symbol.replace('/', '-')}`)}
//                   className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                       {market.icon}
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}</p>
//                       <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">{market.price}</p>
//                     <p className={`text-xs font-bold flex items-center justify-end ${market.up ? 'text-green-500' : 'text-red-500'}`}>
//                       {market.up ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} {market.change}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//           {/* GAMIFICATION HUB */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
//             <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none">
//               <Award size={100} />
//             </div>
//             <div className="flex items-center gap-3 mb-3 relative z-10">
//               <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30">
//                 <Zap size={18} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white">Level 4 Trader</h3>
//                 <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">1,200 / 1,500 XP</p>
//               </div>
//             </div>
//             <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10">
//               <div className="h-full bg-lime-500 rounded-full w-[80%]"></div>
//             </div>
//             <Link href="/dashboard/rewards" className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10">
//               View Rewards & Badges <ChevronRight size={14} />
//             </Link>
//           </motion.div>

//           {/* MARKET NEWS */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
//               <Newspaper size={18} className="text-blue-500" /> Market News
//             </h3>
//             <div className="space-y-4">
//               {NEWS.map((news, i) => (
//                 <div key={i} className="group cursor-pointer">
//                   <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">{news.time} • {news.source}</p>
//                   <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">{news.title}</h4>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//         </div>
//       </div>
//     </div>
//   );
// }



// // app/dashboard/DashboardClient.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import Link from "next/link";
// import { 
//   TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
//   Activity, PieChart, ShieldCheck, Flame, 
//   Newspaper, ChevronRight, Award, Zap, User, ArrowDown, ArrowUp, Wallet, ChevronDown
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";

// const MARKETS = [
//   { symbol: 'BTC/USD', name: 'Bitcoin', price: '$64,230.00', change: '+2.4%', up: true, icon: "₿" },
//   { symbol: 'ETH/USD', name: 'Ethereum', price: '$3,450.00', change: '-1.2%', up: false, icon: "Ξ" },
//   { symbol: 'CHR-NGN', name: 'Charcoal', price: '₦42.50', change: '+0.8%', up: true, icon: "🌾" },
//   { symbol: 'SOL/USD', name: 'Solana', price: '$145.20', change: '-0.5%', up: false, icon: "◎" },
//   { symbol: 'DOGE/USD', name: 'Dogecoin', price: '$0.15', change: '+5.2%', up: true, icon: "Ð" },
// ];

// const RECENT_ACTIVITY = [
//   { type: "Deposit", asset: "USDT", amount: "+500.00", status: "Completed", date: "Today, 10:45 AM" },
//   { type: "Withdrawal", asset: "DOGE", amount: "-2,500", status: "Pending", date: "Yesterday, 4:20 PM" },
//   { type: "Trade", asset: "BTC/USD", amount: "Long", status: "Filled", date: "Yesterday, 9:00 AM" },
// ];

// const POSITIONS = [
//   { asset: "BTC/USD", type: "Long", size: "0.5 BTC", entry: "$64,200", current: "$67,430", pnl: "+$1,615", pnlPct: "+2.5%", isProfit: true },
//   { asset: "ETH/USD", type: "Short", size: "2.0 ETH", entry: "$3,600", current: "$3,450", pnl: "+$300", pnlPct: "+4.1%", isProfit: true },
//   { asset: "SOL/USD", type: "Long", size: "10 SOL", entry: "$150", current: "$145", pnl: "-$50", pnlPct: "-3.3%", isProfit: false },
// ];

// const NEWS = [
//   { time: "10m ago", title: "Bitcoin breaks $67k resistance amid ETF inflows", source: "Bloomberg" },
//   { time: "1h ago", title: "SEC delays decision on Ethereum spot ETF", source: "Reuters" },
//   { time: "3h ago", title: "Global commodity prices stabilize after recent surge", source: "Financial Times" },
// ];

// export default function DashboardClient({ 
//     tier,
//   displayName,
//   userAvatar,
//   currencySymbol = "$",
//   dbAssets = [],
// }: {
//   tier: number;
//   displayName: string;
//   userAvatar: string;
//   currencySymbol?: string;
//   dbAssets?: any[];
// }) {
//   const { openModal } = useDevModal();
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");

//   useEffect(() => setMounted(true), []);

//   if (!mounted) return null;

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8">
      
//       {/* 👇 TOP GRID: HEADER & FAVORABLE PAIRS 👇 */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         {/* CARD 1: REDESIGNED HEADER */}
//         <motion.div 
//           initial={{ opacity: 0, y: -20 }} 
//           animate={{ opacity: 1, y: 0 }} 
//           className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden"
//         >
//           {/* Watermark */}
//           <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-8 opacity-[0.03] dark:opacity-[0.02]">
//             <Wallet size={200} strokeWidth={1} />
//           </div>

//           <div className="flex flex-col gap-6 w-full relative z-10 h-full">
            
//             {/* Top Row: Avatar/Greeting and Wallet Balance */}
//             <div className="flex justify-between items-center w-full gap-4 min-w-0">
              
//               {/* Left: Avatar & Greeting */}
//               <div className="flex items-center gap-3 sm:gap-4 min-w-0">
//                 <UserAvatar initialImage={userAvatar} userName={displayName} />
//                 <TimeGreeting userName={displayName} />
//               </div>
              
//               {/* Right: Wallet Balance */}
//               <div className="flex flex-col items-end justify-center shrink-0">
//                 <span className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 mb-0.5 sm:mb-1 whitespace-nowrap">
//                   Wallet Balance
//                 </span>
//                 <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
//                   <span className="text-sm sm:text-lg font-extrabold text-lime-950 dark:text-white">₦</span>
//                   <span className="text-xl sm:text-3xl font-extrabold text-lime-950 dark:text-white tracking-tight">
//                     $1,250.00
//                   </span>
//                 </div>
//               </div>

//             </div>

//             {/* Bottom Row: Buttons */}
//             <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-md mt-auto pt-2">
//               {/* Green Deposit Button */}
//               <Link 
//                 href="/dashboard/transfer?mode=deposit" 
//                 className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#5d9e17] text-white rounded-xl text-sm sm:text-base font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20"
//               >
//                 <ArrowDown size={18} /> Deposit
//               </Link>
              
//               {/* Grey Withdraw Button */}
//               <Link 
//                 href="/dashboard/transfer?mode=withdraw" 
//                 className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#e5e7eb] dark:bg-[#121A14] text-gray-700 dark:text-gray-300 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors">
//                 <ArrowUp size={18} /> Withdraw
//               </Link>
//             </div>
//           </div>
//         </motion.div>

//         {/* CARD 2: FAVORABLE PAIRS */}
//         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//           <FavorablePairsCard />
//         </motion.div>

//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
//         {/* LEFT COLUMN (2/3 width on desktop) */}
//         <div className="lg:col-span-2 space-y-6">
          
//           {/* TIER CARD */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-xl">
//             <div className="flex items-center gap-4 mb-4 sm:mb-0">
//               <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-600 dark:text-lime-400">
//                 <ShieldCheck size={32} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white text-lg">Tier {tier} Account</h3>
//                 <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">Unlock crypto and meme coins.</p>
//               </div>
//             </div>
//             <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
//               <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
//                 <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
//               </div>
//               <Link href="/dashboard/rewards" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
//                 View Tasks & Rewards
//               </Link>
//             </div>
//           </motion.div>

//           {/* ACTIVE POSITIONS TABLE */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Activity size={18} className="text-lime-500" /> Active Positions
//               </h3>
//               <Link href="/dashboard/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View History</Link>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full text-left text-sm whitespace-nowrap">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="p-4 font-semibold">Asset</th>
//                     <th className="p-4 font-semibold">Size</th>
//                     <th className="p-4 font-semibold">Entry Price</th>
//                     <th className="p-4 font-semibold">Mark Price</th>
//                     <th className="p-4 font-semibold text-right">Unrealized P&L</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {POSITIONS.map((pos, i) => (
//                     <tr key={i} className="hover:bg-lime-500/5 transition-colors">
//                       <td className="p-4">
//                         <div className="flex items-center gap-2">
//                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.type === "Long" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.type}</span>
//                           <span className="font-bold text-lime-950 dark:text-white">{pos.asset}</span>
//                         </div>
//                       </td>
//                       <td className="p-4 font-mono text-lime-800 dark:text-lime-200">{pos.size}</td>
//                       <td className="p-4 font-mono text-lime-800/60 dark:text-lime-200/50">{pos.entry}</td>
//                       <td className="p-4 font-mono text-lime-950 dark:text-white">{pos.current}</td>
//                       <td className={`p-4 text-right font-bold font-mono ${pos.isProfit ? "text-green-500" : "text-red-500"}`}>
//                         {pos.pnl} <span className="text-xs opacity-70">({pos.pnlPct})</span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>

//           {/* 👇 RECENT ACTIVITY TABLE (Syncs with Transfer Page) 👇 */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl mt-6">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Wallet size={18} className="text-lime-500" /> Recent Activity
//               </h3>
//               <Link href="/dashboard/transfer" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</Link>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full text-left text-sm whitespace-nowrap">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="p-4 font-semibold">Type</th>
//                     <th className="p-4 font-semibold">Asset</th>
//                     <th className="p-4 font-semibold">Amount</th>
//                     <th className="p-4 font-semibold">Status</th>
//                     <th className="p-4 font-semibold text-right">Date</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {RECENT_ACTIVITY.map((tx, i) => (
//                     <tr key={i} className="hover:bg-lime-500/5 transition-colors">
//                       <td className="p-4 font-bold text-lime-950 dark:text-white">{tx.type}</td>
//                       <td className="p-4 font-mono text-lime-800 dark:text-lime-200">{tx.asset}</td>
//                       <td className={`p-4 font-mono font-bold ${tx.type === 'Deposit' ? 'text-green-500' : tx.type === 'Withdrawal' ? 'text-red-500' : 'text-lime-950 dark:text-white'}`}>
//                         {tx.amount}
//                       </td>
//                       <td className="p-4">
//                         <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${tx.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
//                           {tx.status}
//                         </span>
//                       </td>
//                       <td className="p-4 text-right text-xs text-lime-800/50 dark:text-lime-200/40">{tx.date}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>

//           {/* RISK & PERFORMANCE ANALYTICS */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: 'conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)' }}>
//                 <div className="w-16 h-16 bg-[#f4fbf5] dark:bg-[#0a0f0b] rounded-full m-auto translate-y-4 flex items-center justify-center">
//                   <PieChart size={20} className="text-lime-500" />
//                 </div>
//               </div>
//               <div>
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white mb-2">Asset Allocation</h4>
//                 <div className="space-y-1 text-xs font-medium">
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-lime-500">● Crypto</span> <span>60%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-blue-500">● Commodities</span> <span>25%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-amber-500">● Fiat</span> <span>15%</span></div>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
//               <div className="flex justify-between items-center mb-4">
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white">Risk Metrics</h4>
//                 <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">Low Risk</span>
//               </div>
//               <div className="space-y-3">
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Max Drawdown</span> <span>4.2%</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]"></div></div>
//                 </div>
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Risk-Reward Ratio</span> <span>1 : 2.4</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]"></div></div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>

//         </div>

//         {/* RIGHT COLUMN (1/3 width on desktop) */}
//         <div className="space-y-6">
          
//           {/* TRADING / ORDER PANEL */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">Quick Trade</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'buy' ? 'bg-green-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Buy</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Sell</button>
//             </div>

//             <div className="space-y-3 mb-6">
//               {/* NEW ASSET SELECTOR UI */}
//               <div className="flex items-center gap-2">
//                 <Link
//                   href="/markets?select=base"
//                   className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
//                   title="Select Base Asset"
//                 >
//                   <div className="flex items-center gap-2">
//                     <svg className="w-5 h-5 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
//                       <circle cx="16" cy="16" r="16" fill="#F7931A"/>
//                       <path d="M22.3 13.8C22.6 12 21.3 11 19.3 10.4L20 7.6L18.2 7.2L17.5 9.9C17 9.8 16.5 9.6 16 9.5L16.7 6.8L14.9 6.4L14.2 9.2C13.8 9.1 13.4 9 13 8.9L13 8.9L10.5 8.3L10.1 10.2C10.1 10.2 11.4 10.5 11.4 10.5C12.1 10.7 12.2 11.2 12.2 11.5L11.4 14.7C11.4 14.7 11.5 14.7 11.5 14.8L11.4 14.8L10.3 19.3C10.2 19.5 10.1 19.8 9.6 19.7C9.6 19.7 8.3 19.4 8.3 19.4L7.6 21.4L9.9 22C10.3 22.1 10.8 22.2 11.2 22.3L10.5 25.1L12.3 25.5L13 22.7C13.5 22.8 13.9 22.9 14.4 23L13.7 25.8L15.5 26.2L16.2 23.4C19.1 24 21.3 23.7 22.2 21.1C23 19 22.1 17.8 20 17C21.5 16.6 22.1 15.5 22.3 13.8ZM18.3 20C17.7 21.4 16.5 21 15.4 20.7L16.2 17.5C17.3 17.8 18.8 18.3 18.3 20ZM19.3 14.1C18.8 15.4 17.7 15 16.8 14.8L17.5 11.9C18.4 12.1 19.7 12.5 19.3 14.1Z" fill="white"/>
//                     </svg>
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">BTC</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>

//                 <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>

//                 <Link
//                   href="/markets?select=quote"
//                   className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
//                   title="Select Quote Asset"
//                 >
//                   <div className="flex items-center gap-2">
//                     <svg className="w-5 h-5 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
//                       <circle cx="16" cy="16" r="16" fill="#20B26C"/>
//                       <path d="M16 23.5C13.5 23.5 11.5 21.5 11.5 19H14C14 20.2 14.9 21 16 21C17.1 21 18 20.2 18 19C18 17.8 17.1 17 16 17C13.5 17 11.5 15 11.5 12.5C11.5 10.2 13.2 8.3 15.5 8V6H16.5V8C18.8 8.3 20.5 10.2 20.5 12.5H18C18 11.3 17.1 10.5 16 10.5C14.9 10.5 14 11.3 14 12.5C14 13.7 14.9 14.5 16 14.5C18.5 14.5 20.5 16.5 20.5 19C20.5 21.3 18.8 23.2 16.5 23.5V26H15.5V23.5Z" fill="white"/>
//                     </svg>
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">USD</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>
//               </div>

//               <div className="relative">
//                 <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none">
//                   <option value="market">Market Order</option>
//                   <option value="limit">Limit Order</option>
//                   <option value="stop">Stop-Loss</option>
//                 </select>
//               </div>
//               <div>
//                 <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
//                   <span>Amount</span>
//                   <span>Available: $4,500</span>
//                 </div>
//                 <input type="number" placeholder="0.00" className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//               </div>
//             </div>

//             <KycGate requiredTier={1} currentTier={tier} featureName="trading">
//               <Button className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}>
//                 Execute {tradeType === 'buy' ? 'Buy' : 'Sell'} Order
//               </Button>
//             </KycGate>
//           </motion.div>

//           {/* MARKET WATCH */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> Market Watch
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {MARKETS.map((market) => (
//                 <Link key={market.symbol} href={`/markets/${market.symbol.split('/')[0].toLowerCase()}`} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                       {market.icon}
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}</p>
//                       <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">{market.price}</p>
//                     <p className={`text-xs font-bold flex items-center justify-end ${market.up ? 'text-green-500' : 'text-red-500'}`}>
//                       {market.up ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} {market.change}
//                     </p>
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           </motion.div>

//           {/* GAMIFICATION HUB */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
//             <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none">
//               <Award size={100} />
//             </div>
//             <div className="flex items-center gap-3 mb-3 relative z-10">
//               <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30">
//                 <Zap size={18} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white">Level 4 Trader</h3>
//                 <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">1,200 / 1,500 XP</p>
//               </div>
//             </div>
//             <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10">
//               <div className="h-full bg-lime-500 rounded-full w-[80%]"></div>
//             </div>
//             <Link href="/dashboard/rewards" className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10">
//               View Rewards & Badges <ChevronRight size={14} />
//             </Link>
//           </motion.div>

//           {/* MARKET NEWS */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
//               <Newspaper size={18} className="text-blue-500" /> Market News
//             </h3>
//             <div className="space-y-4">
//               {NEWS.map((news, i) => (
//                 <div key={i} className="group cursor-pointer">
//                   <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">{news.time} • {news.source}</p>
//                   <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">{news.title}</h4>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//         </div>
//       </div>
//     </div>
//   );
// }




// // app/dashboard/DashboardClient.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import Link from "next/link";
// import { 
//   TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
//   Activity, PieChart, ShieldCheck, Flame, 
//   Newspaper, ChevronRight, Award, Zap, User, ArrowDown, ArrowUp, Wallet
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";

// const MARKETS = [
//   { symbol: 'BTC/USD', name: 'Bitcoin', price: '$64,230.00', change: '+2.4%', up: true, icon: "₿" },
//   { symbol: 'ETH/USD', name: 'Ethereum', price: '$3,450.00', change: '-1.2%', up: false, icon: "Ξ" },
//   { symbol: 'CHR-NGN', name: 'Charcoal', price: '₦42.50', change: '+0.8%', up: true, icon: "🌾" },
//   { symbol: 'SOL/USD', name: 'Solana', price: '$145.20', change: '-0.5%', up: false, icon: "◎" },
//   { symbol: 'DOGE/USD', name: 'Dogecoin', price: '$0.15', change: '+5.2%', up: true, icon: "Ð" },
// ];

// const POSITIONS = [
//   { asset: "BTC/USD", type: "Long", size: "0.5 BTC", entry: "$64,200", current: "$67,430", pnl: "+$1,615", pnlPct: "+2.5%", isProfit: true },
//   { asset: "ETH/USD", type: "Short", size: "2.0 ETH", entry: "$3,600", current: "$3,450", pnl: "+$300", pnlPct: "+4.1%", isProfit: true },
//   { asset: "SOL/USD", type: "Long", size: "10 SOL", entry: "$150", current: "$145", pnl: "-$50", pnlPct: "-3.3%", isProfit: false },
// ];

// const NEWS = [
//   { time: "10m ago", title: "Bitcoin breaks $67k resistance amid ETF inflows", source: "Bloomberg" },
//   { time: "1h ago", title: "SEC delays decision on Ethereum spot ETF", source: "Reuters" },
//   { time: "3h ago", title: "Global commodity prices stabilize after recent surge", source: "Financial Times" },
// ];

// export default function DashboardClient({ 
//   tier, 
//   displayName, 
//   userAvatar 
// }: { 
//   tier: number, 
//   displayName: string, 
//   userAvatar: string 
// }) {
//   const { openModal } = useDevModal();
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");

//   useEffect(() => setMounted(true), []);

//   if (!mounted) return null;

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8">
      
//       {/* 👇 TOP GRID: HEADER & FAVORABLE PAIRS 👇 */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         {/* CARD 1: REDESIGNED HEADER */}
//         <motion.div 
//           initial={{ opacity: 0, y: -20 }} 
//           animate={{ opacity: 1, y: 0 }} 
//           className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden"
//         >
//           {/* Watermark */}
//           <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-8 opacity-[0.03] dark:opacity-[0.02]">
//             <Wallet size={200} strokeWidth={1} />
//           </div>

//           <div className="flex flex-col gap-6 w-full relative z-10 h-full">
            
//             {/* Top Row: Avatar/Greeting and Wallet Balance */}
//             <div className="flex justify-between items-center w-full gap-4 min-w-0">
              
//               {/* Left: Avatar & Greeting */}
//               <div className="flex items-center gap-3 sm:gap-4 min-w-0">
//                 <UserAvatar initialImage={userAvatar} userName={displayName} />
//                 <TimeGreeting userName={displayName} />
//               </div>
              
//               {/* Right: Wallet Balance */}
//               <div className="flex flex-col items-end justify-center shrink-0">
//                 <span className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 mb-0.5 sm:mb-1 whitespace-nowrap">
//                   Wallet Balance
//                 </span>
//                 <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
//                   {/* Use a currency symbol that matches your image */}
//                   <span className="text-sm sm:text-lg font-extrabold text-lime-950 dark:text-white">₦</span>
//                   <span className="text-xl sm:text-3xl font-extrabold text-lime-950 dark:text-white tracking-tight">
//                     $1,250.00
//                   </span>
//                 </div>
//               </div>

//             </div>

//             {/* Bottom Row: Buttons */}
//             <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-md mt-auto pt-2">
//               {/* Green Deposit Button */}
//               <button 
//                 onClick={() => openModal("Deposit", "Deposit features are coming soon.", "info")} 
//                 className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#5d9e17] text-white rounded-xl text-sm sm:text-base font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20"
//               >
//                 <ArrowDown size={18} /> Deposit
//               </button>
              
//               {/* Grey Withdraw Button */}
//               <button 
//                 onClick={() => openModal("Withdraw", "Withdrawal features are coming soon.", "info")} 
//                 className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#e5e7eb] dark:bg-[#121A14] text-gray-700 dark:text-gray-300 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors"
//               >
//                 <ArrowUp size={18} /> Withdraw
//               </button>
//             </div>

//           </div>
//         </motion.div>

//         {/* CARD 2: FAVORABLE PAIRS */}
//         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//           <FavorablePairsCard />
//         </motion.div>

//       </div>

//       {/* 👇 REST OF THE DASHBOARD 👇 */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
//         {/* LEFT COLUMN (2/3 width on desktop) */}
//         <div className="lg:col-span-2 space-y-6">
          
//           {/* TIER CARD */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-xl">
//             <div className="flex items-center gap-4 mb-4 sm:mb-0">
//               <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-600 dark:text-lime-400">
//                 <ShieldCheck size={32} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white text-lg">Tier {tier} Account</h3>
//                 <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">Unlock crypto and meme coins.</p>
//               </div>
//             </div>
//             <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
//               <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
//                 <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
//               </div>
//               <Link href="/dashboard/rewards" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
//                 View Tasks & Rewards
//               </Link>
//             </div>
//           </motion.div>

//           {/* ACTIVE POSITIONS TABLE */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Activity size={18} className="text-lime-500" /> Active Positions
//               </h3>
//               <Link href="/dashboard/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View History</Link>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full text-left text-sm whitespace-nowrap">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="p-4 font-semibold">Asset</th>
//                     <th className="p-4 font-semibold">Size</th>
//                     <th className="p-4 font-semibold">Entry Price</th>
//                     <th className="p-4 font-semibold">Mark Price</th>
//                     <th className="p-4 font-semibold text-right">Unrealized P&L</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {POSITIONS.map((pos, i) => (
//                     <tr key={i} className="hover:bg-lime-500/5 transition-colors">
//                       <td className="p-4">
//                         <div className="flex items-center gap-2">
//                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.type === "Long" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.type}</span>
//                           <span className="font-bold text-lime-950 dark:text-white">{pos.asset}</span>
//                         </div>
//                       </td>
//                       <td className="p-4 font-mono text-lime-800 dark:text-lime-200">{pos.size}</td>
//                       <td className="p-4 font-mono text-lime-800/60 dark:text-lime-200/50">{pos.entry}</td>
//                       <td className="p-4 font-mono text-lime-950 dark:text-white">{pos.current}</td>
//                       <td className={`p-4 text-right font-bold font-mono ${pos.isProfit ? "text-green-500" : "text-red-500"}`}>
//                         {pos.pnl} <span className="text-xs opacity-70">({pos.pnlPct})</span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>

//           {/* RISK & PERFORMANCE ANALYTICS */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: 'conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)' }}>
//                 <div className="w-16 h-16 bg-[#f4fbf5] dark:bg-[#0a0f0b] rounded-full m-auto translate-y-4 flex items-center justify-center">
//                   <PieChart size={20} className="text-lime-500" />
//                 </div>
//               </div>
//               <div>
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white mb-2">Asset Allocation</h4>
//                 <div className="space-y-1 text-xs font-medium">
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-lime-500">● Crypto</span> <span>60%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-blue-500">● Commodities</span> <span>25%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-amber-500">● Fiat</span> <span>15%</span></div>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
//               <div className="flex justify-between items-center mb-4">
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white">Risk Metrics</h4>
//                 <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">Low Risk</span>
//               </div>
//               <div className="space-y-3">
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Max Drawdown</span> <span>4.2%</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]"></div></div>
//                 </div>
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>Risk-Reward Ratio</span> <span>1 : 2.4</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]"></div></div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>

//         </div>

//         {/* RIGHT COLUMN (1/3 width on desktop) */}
//         <div className="space-y-6">
          
//           {/* TRADING / ORDER PANEL */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">Quick Trade</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'buy' ? 'bg-green-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Buy</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>Sell</button>
//             </div>

//             <div className="space-y-3 mb-6">
//               <div className="relative">
//                 <select className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none font-bold">
//                   <option>BTC / USD</option>
//                   <option>ETH / USD</option>
//                 </select>
//               </div>
//               <div className="relative">
//                 <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none">
//                   <option value="market">Market Order</option>
//                   <option value="limit">Limit Order</option>
//                   <option value="stop">Stop-Loss</option>
//                 </select>
//               </div>
//               <div>
//                 <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
//                   <span>Amount</span>
//                   <span>Available: $4,500</span>
//                 </div>
//                 <input type="number" placeholder="0.00" className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//               </div>
//             </div>

//             <KycGate requiredTier={1} currentTier={tier} featureName="trading">
//               <Button className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}>
//                 Execute {tradeType === 'buy' ? 'Buy' : 'Sell'} Order
//               </Button>
//             </KycGate>
//           </motion.div>

//           {/* MARKET WATCH */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> Market Watch
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">View All</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {MARKETS.map((market) => (
//                 <Link key={market.symbol} href={`/markets/${market.symbol.split('/')[0].toLowerCase()}`} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                       {market.icon}
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}</p>
//                       <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">{market.price}</p>
//                     <p className={`text-xs font-bold flex items-center justify-end ${market.up ? 'text-green-500' : 'text-red-500'}`}>
//                       {market.up ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} {market.change}
//                     </p>
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           </motion.div>

//           {/* GAMIFICATION HUB */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
//             <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none">
//               <Award size={100} />
//             </div>
//             <div className="flex items-center gap-3 mb-3 relative z-10">
//               <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30">
//                 <Zap size={18} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white">Level 4 Trader</h3>
//                 <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">1,200 / 1,500 XP</p>
//               </div>
//             </div>
//             <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10">
//               <div className="h-full bg-lime-500 rounded-full w-[80%]"></div>
//             </div>
//             <Link href="/dashboard/rewards" className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10">
//               View Rewards & Badges <ChevronRight size={14} />
//             </Link>
//           </motion.div>

//           {/* MARKET NEWS */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
//               <Newspaper size={18} className="text-blue-500" /> Market News
//             </h3>
//             <div className="space-y-4">
//               {NEWS.map((news, i) => (
//                 <div key={i} className="group cursor-pointer">
//                   <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">{news.time} • {news.source}</p>
//                   <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">{news.title}</h4>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//         </div>
//       </div>
//     </div>
//   );
// }