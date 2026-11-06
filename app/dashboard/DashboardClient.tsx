// app/dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl"; 
import { 
  TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck, Flame, 
  Newspaper, ChevronRight, Award, Zap, ArrowDown, ArrowUp, Wallet, ChevronDown,
  Loader2
} from "lucide-react";
import { KycGate } from "@/components/KycGate";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { Button } from "@/components/ui/Button";
import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";
import { executeTradeAction, closeTradeAction } from "@/app/actions/trade";
import { getMarketSettings } from "@/app/actions/admin-market";

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

// 👇 HELPER: Calculate drift based on Admin's trend + intensity
const calculateDrift = (trend: string, intensity: number): number => {
  const multiplier = intensity / 100; // Intensity 1-10 maps to 1%-10% drift
  if (trend === "bullish") return multiplier;
  if (trend === "bearish") return -multiplier;
  return 0;
};

// 👇 HELPER: Get current progress through the active 4-hour block (0.0 to 1.0)
const getBlockProgress = (): number => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentHour = hour + minute / 60;
  
  let start: number, end: number;
  if (hour < 7) { start = 0; end = 7; }
  else if (hour < 12) { start = 7; end = 12; }
  else if (hour < 18) { start = 12; end = 18; }
  else { start = 18; end = 24; }
  
  return Math.min(1, Math.max(0, (currentHour - start) / (end - start)));
};

// 👇 HELPER: Calculate simulated market price (Base → Base+Drift over block progress)
const getSimulatedMarketPrice = (
  basePrice: number, 
  block: { trend: "bullish" | "bearish" | "consolidate"; intensity: number }
): number => {
  const drift = calculateDrift(block.trend, block.intensity);
  const progress = getBlockProgress();
  return basePrice * (1 + drift * progress);
};

// 👇 SPARKLINE COMPONENT
function TradeSparkline({ trend }: { trend: "bullish" | "bearish" | "consolidate" }) {
  let color = "#10b981"; 
  let path = "M 0 20 Q 10 15, 20 25 T 40 20 T 60 25 Q 70 20 80 25 T 100 20"; 

  if (trend === "bullish") { 
    color = "#3b82f6"; 
    path = "M 0 30 Q 15 25, 20 20 T 40 10 T 60 5"; 
  } else if (trend === "bearish") { 
    color = "#ef4444"; 
    path = "M 0 5 Q 15 10, 20 15 T 40 20 T 60 30"; 
  }

  return (
    <svg viewBox="0 0 60 40" className="w-16 h-8 overflow-visible">
      <defs>
        <linearGradient id={`grad-${trend}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L 60 40 L 0 40 Z`} fill={`url(#grad-${trend})`} />
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
  realBalances = [],
  realTrades = [],
  realActivity = [],
}: {
  tier: number;
  displayName: string;
  userAvatar: string;
  currencySymbol?: string;
  dbAssets?: any[];
  realBalances?: any[];
  realTrades?: any[];
  realActivity?: any[];
}) {
  const t = useTranslations("Dashboard"); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openModal } = useDevModal();
  
  const [mounted, setMounted] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState("market");
  const [isTrading, setIsTrading] = useState(false); 
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  
  // 👇 MARKET BLOCK (Trend + Intensity from Admin)
  const [marketBlock, setMarketBlock] = useState<{
    trend: "bullish" | "bearish" | "consolidate";
    intensity: number;
  }>({ trend: "consolidate", intensity: 5 });

  const [amount, setAmount] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

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

  // 👇 FETCH ADMIN MARKET SETTINGS ON MOUNT + EVERY 60s
  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await getMarketSettings();
        if (settings) {
          const hour = new Date().getHours();
          let activeBlock = settings.block4;
          if (hour >= 0 && hour < 7) activeBlock = settings.block1;
          else if (hour >= 7 && hour < 12) activeBlock = settings.block2;
          else if (hour >= 12 && hour < 18) activeBlock = settings.block3;
          
          setMarketBlock({
            trend: activeBlock.trend as "bullish" | "bearish" | "consolidate",
            intensity: activeBlock.intensity || 5,
          });
        }
      } catch (error) {
        console.error("Failed to fetch market settings", error);
      }
    }
    fetchSettings();
    const interval = setInterval(fetchSettings, 60000);
    return () => clearInterval(interval);
  }, []);

  // 👇 CALCULATE PNL FOR A GIVEN TRADE
  const calculatePnl = (trade: any) => {
    const asset = dbAssets.find((a: any) => a.symbol === trade.baseAsset);
    const basePrice = asset ? asset.basePrice : trade.entryPrice;
    const markPrice = getSimulatedMarketPrice(basePrice, marketBlock);
    const priceDiff = markPrice - trade.entryPrice;
    const pnl = trade.side === "buy" ? priceDiff * trade.amount : -priceDiff * trade.amount;
    return { markPrice, pnl };
  };

  // 👇 EXECUTE NEW TRADE (uses simulated market price for consistency)
  const executeTrade = async () => {
    const rawAmount = amount.replace(/,/g, "");
    const qty = parseFloat(rawAmount);

    if (!qty || qty <= 0) {
      openModal(t("invalidAmountTitle"), t("invalidAmountDesc"), "warning");
      return;
    }

    setIsTrading(true);

    const asset = dbAssets.find((a: any) => a.symbol === baseAsset);
    const basePrice = asset ? asset.basePrice : 100;
    
    // 👇 Use the same simulation as PnL calculation
    const currentPrice = getSimulatedMarketPrice(basePrice, marketBlock);

    const res = await executeTradeAction({
      pair: `${baseAsset}-${quoteAsset}`,
      side: tradeType,
      price: currentPrice,
      amount: qty,
    });

    setIsTrading(false);

    if (res.error) {
      openModal("Trade Failed", res.error, "error");
    } else {
      openModal(
        "Trade Successful", 
        `Your ${tradeType} order for ${qty} ${baseAsset} was filled at ${currencySymbol}${currentPrice.toFixed(2)}.`, 
        "success"
      );
      
      setAmount("");
      setTakeProfit("");
      setStopLoss("");

      router.refresh(); 
    }
  };

  // 👇 CLOSE ACTIVE POSITION (with price shown in confirmation)
  const handleCloseTrade = async (trade: any, markPrice: number, pnl: number) => {
    const pnlLabel = pnl >= 0 ? `+${currencySymbol}${pnl.toFixed(2)}` : `-${currencySymbol}${Math.abs(pnl).toFixed(2)}`;
    
    if (!confirm(`Close ${trade.side === "buy" ? "LONG" : "SHORT"} ${trade.pair}?\n\nExit Price: ${currencySymbol}${markPrice.toFixed(2)}\nEstimated PnL: ${pnlLabel}`)) {
      return;
    }

    setClosingTradeId(trade._id);

    try {
      const res = await closeTradeAction(trade._id, markPrice);

      if (res.error) {
        openModal("Close Failed", res.error, "error");
      } else {
        const finalPnl = res.pnl || 0;
        openModal(
          "Position Closed", 
          `Realized PnL: ${finalPnl >= 0 ? "+" : ""}${currencySymbol}${finalPnl.toFixed(2)}. Funds have been settled in your ledger.`, 
          finalPnl >= 0 ? "success" : "info"
        );
        router.refresh();
      }
    } catch (error: any) {
      openModal("Close Error", error.message || "Failed to close position.", "error");
    } finally {
      setClosingTradeId(null);
    }
  };

  if (!mounted) return null;

  const usdBalance = realBalances.find((b: any) => b.assetId === "USD")?.cachedBalance / 100 || 0;
  const userAccountIds = new Set(realBalances.map((b: any) => b._id));

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
                    {usdBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

          {/* REAL ACTIVE POSITIONS TABLE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
              <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                <Activity size={18} className="text-lime-500" /> {t("activePositions")}
              </h3>
              <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewTerminal")}</Link>
            </div>
            <div className="w-full overflow-x-auto custom-scrollbar pb-2">
              {realTrades.length === 0 ? (
                <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
                  No open positions. Visit the terminal to place a trade.
                </div>
              ) : (
                <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 font-semibold">{t("asset")}</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold">{t("size")}</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold">{t("entryPrice")}</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold">{t("markPrice")}</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-center">{t("trend")}</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-right">{t("unrealizedPnl")}</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lime-500/10">
                    {realTrades.map((pos: any) => {
                      const { markPrice, pnl } = calculatePnl(pos);
                      const isProfit = pnl >= 0;
                      const isClosing = closingTradeId === pos._id;
                      
                      return (
                        <tr key={pos._id} className="hover:bg-lime-500/5 transition-colors">
                          <td className="px-3 sm:px-4 py-3 cursor-pointer" onClick={() => router.push(`/terminal?pair=${pos.pair}&tradeId=${pos._id}`)}>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.side === "buy" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.side === "buy" ? "LONG" : "SHORT"}</span>
                              <span className="font-bold text-lime-950 dark:text-white">{pos.pair}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.amount} {pos.baseAsset}</td>
                          <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{currencySymbol}{pos.entryPrice.toLocaleString()}</td>
                          <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{currencySymbol}{markPrice.toFixed(2)}</td>
                          <td className="px-3 sm:px-4 py-3 flex justify-center">
                            <TradeSparkline trend={marketBlock.trend} />
                          </td>
                          <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${isProfit ? "text-green-500" : "text-red-500"}`}>
                            {isProfit ? "+" : ""}{currencySymbol}{pnl.toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-center">
                            <button
                              onClick={() => handleCloseTrade(pos, markPrice, pnl)}
                              disabled={isClosing}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 mx-auto disabled:opacity-50 ${
                                isProfit 
                                  ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" 
                                  : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                              }`}
                            >
                              {isClosing ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                "Close Position"
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>

          {/* REAL RECENT ACTIVITY TABLE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl mt-6">
            <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
              <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                <Wallet size={18} className="text-lime-500" /> {t("recentActivity")}
              </h3>
              <Link href="/dashboard/transfer" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
            </div>
            <div className="w-full overflow-x-auto custom-scrollbar pb-2">
              {realActivity.length === 0 ? (
                <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
                  No recent activity found.
                </div>
              ) : (
                <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 font-semibold">{t("type")}</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold">Ref</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold">{t("amount")}</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold">Status</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-right">{t("date")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lime-500/10">
                    {realActivity.map((tx: any) => {
                      const userEntry = tx.entries.find((e: any) => userAccountIds.has(e.accountId));
                      const isCredit = userEntry?.direction === "credit";
                      const amountStr = userEntry ? (userEntry.amount / 100).toLocaleString() : "0.00";
                      const assetStr = userEntry ? userEntry.assetId : "USD";
                      
                      return (
                        <tr key={tx._id} className="transition-colors">
                          <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white capitalize">{tx.kind.replace("_", " ")}</td>
                          <td className="px-3 sm:px-4 py-3 font-mono text-xs text-lime-800/50 dark:text-lime-200/40">{tx.refId.slice(0, 10)}...</td>
                          <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${isCredit ? "text-green-500" : "text-red-500"}`}>
                            {isCredit ? "+" : "-"}{currencySymbol}{amountStr} {assetStr}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-green-500/10 text-green-500">
                              COMPLETED
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-right text-xs text-lime-800/50 dark:text-lime-200/40">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
              <div className="w-24 h-24 rounded-full shrink-0" style={{ background: "conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)" }}>
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
              <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "buy" ? "bg-green-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("buy")}</button>
              <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "sell" ? "bg-red-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("sell")}</button>
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
                  <span>{t("available")}: {currencySymbol}{usdBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
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
              <Button 
                onClick={executeTrade} 
                disabled={isTrading || !amount || parseFloat(amount.replace(/,/g, "")) <= 0} 
                className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === "buy" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}
              >
                {isTrading ? "Processing..." : t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
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
              {dbAssets.slice(0, 5).map((market: any) => {
                const livePrice = getSimulatedMarketPrice(market.basePrice, marketBlock);
                const percentChange = livePrice === market.basePrice 
                  ? "0%" 
                  : `${((livePrice - market.basePrice) / market.basePrice * 100).toFixed(2)}%`;
                const isPositive = livePrice >= market.basePrice;
                
                return (
                  <div key={market._id} onClick={() => router.push(`/terminal?pair=${market.symbol}-USD`)} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
                        {market.symbol.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}/USD</p>
                        <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">
                        ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-xs font-bold flex items-center justify-end ${isPositive ? "text-green-500" : "text-red-500"}`}>
                        {isPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} 
                        {isPositive ? "+" : ""}{percentChange}
                      </p>
                    </div>
                  </div>
                );
              })}
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

// // app/dashboard/DashboardClient.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { motion } from "framer-motion";
// import Link from "next/link";
// import { useTranslations } from "next-intl"; 
// import { 
//   TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck, Flame, 
//   Newspaper, ChevronRight, Award, Zap, ArrowDown, ArrowUp, Wallet, ChevronDown
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";
// import { executeTradeAction } from "@/app/actions/trade"; 
// import { getMarketSettings } from "@/app/actions/admin-market"; // 👈 Imported Admin Action

// const NEWS = [
//   { time: "10m ago", title: "Bitcoin breaks $67k resistance amid ETF inflows", source: "Bloomberg" },
//   { time: "1h ago", title: "SEC delays decision on Ethereum spot ETF", source: "Reuters" },
//   { time: "3h ago", title: "Global commodity prices stabilize after recent surge", source: "Financial Times" },
// ];

// const formatNumber = (value: string) => {
//   const cleanValue = value.replace(/[^0-9.]/g, "");
//   const parts = cleanValue.split(".");
//   parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//   return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
// };

// // 👇 UPDATED SPARKLINE COMPONENT
// function TradeSparkline({ trend }: { trend: "bullish" | "bearish" | "consolidate" }) {
//   let color = "#10b981"; // Green
//   let path = "M 0 20 Q 10 15, 20 25 T 40 20 T 60 25 Q 70 20 80 25 T 100 20"; // Consolidate

//   if (trend === 'bullish') { 
//     color = "#3b82f6"; // Blue
//     path = "M 0 30 Q 15 25, 20 20 T 40 10 T 60 5"; 
//   } else if (trend === 'bearish') { 
//     color = "#ef4444"; // Red
//     path = "M 0 5 Q 15 10, 20 15 T 40 20 T 60 30"; 
//   }

//   return (
//     <svg viewBox="0 0 60 40" className="w-16 h-8 overflow-visible">
//       <defs>
//         <linearGradient id={`grad-${trend}`} x1="0" y1="0" x2="0" y2="1">
//           <stop offset="0%" stopColor={color} stopOpacity="0.4" />
//           <stop offset="100%" stopColor={color} stopOpacity="0" />
//         </linearGradient>
//       </defs>
//       <path d={`${path} L 60 40 L 0 40 Z`} fill={`url(#grad-${trend})`} />
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
//   realBalances = [],
//   realTrades = [],
//   realActivity = [],
// }: {
//   tier: number;
//   displayName: string;
//   userAvatar: string;
//   currencySymbol?: string;
//   dbAssets?: any[];
//   realBalances?: any[];
//   realTrades?: any[];
//   realActivity?: any[];
// }) {
//   const t = useTranslations("Dashboard"); 
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { openModal } = useDevModal();
  
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");
//   const [isTrading, setIsTrading] = useState(false); 
  
//   // 👇 STATE FOR ADMIN MARKET TREND
//   const [currentTrend, setCurrentTrend] = useState<"bullish" | "bearish" | "consolidate">("consolidate");

//   const [amount, setAmount] = useState("");
//   const [takeProfit, setTakeProfit] = useState("");
//   const [stopLoss, setStopLoss] = useState("");

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

//   // 👇 FETCH ADMIN TREND ON MOUNT
//   useEffect(() => {
//     async function fetchTrend() {
//       try {
//         const settings = await getMarketSettings();
//         if (settings) {
//           const hour = new Date().getHours();
//           let activeBlock = settings.block4;
//           if (hour >= 0 && hour < 7) activeBlock = settings.block1;
//           else if (hour >= 7 && hour < 12) activeBlock = settings.block2;
//           else if (hour >= 12 && hour < 18) activeBlock = settings.block3;
          
//           setCurrentTrend(activeBlock.trend);
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchTrend();
//     const interval = setInterval(fetchTrend, 60000); // Refresh every minute
//     return () => clearInterval(interval);
//   }, []);

//   const executeTrade = async () => {
//     const rawAmount = amount.replace(/,/g, "");
//     const qty = parseFloat(rawAmount);

//     if (!qty || qty <= 0) {
//       openModal(t("invalidAmountTitle"), t("invalidAmountDesc"), "warning");
//       return;
//     }

//     setIsTrading(true);

//     const asset = dbAssets.find((a: any) => a.symbol === baseAsset);
//     const currentPrice = asset ? asset.basePrice : 100;

//     const res = await executeTradeAction({
//       pair: `${baseAsset}-${quoteAsset}`,
//       side: tradeType,
//       price: currentPrice,
//       amount: qty,
//     });

//     setIsTrading(false);

//     if (res.error) {
//       openModal("Trade Failed", res.error, "error");
//     } else {
//       openModal("Trade Successful", `Your ${tradeType} order for ${qty} ${baseAsset} was filled at ${currencySymbol}${currentPrice}.`, "success");
      
//       setAmount("");
//       setTakeProfit("");
//       setStopLoss("");

//       router.refresh(); 
//     }
//   };

//   if (!mounted) return null;

//   const usdBalance = realBalances.find((b: any) => b.assetId === "USD")?.cachedBalance / 100 || 0;
//   const userAccountIds = new Set(realBalances.map((b: any) => b._id));

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 w-full overflow-x-hidden">
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden">
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
//                   {t("walletBalance")}
//                 </span>
//                 <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
//                   <span className="text-sm sm:text-lg font-extrabold text-lime-950 dark:text-white">{currencySymbol}</span>
//                   <span className="text-xl sm:text-3xl font-extrabold text-lime-950 dark:text-white tracking-tight">
//                     {usdBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-md mt-auto pt-2">
//               <Link href="/dashboard/transfer?mode=deposit" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#5d9e17] text-white rounded-xl text-sm sm:text-base font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20">
//                 <ArrowDown size={18} /> {t("deposit")}
//               </Link>
//               <Link href="/dashboard/transfer?mode=withdraw" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#e5e7eb] dark:bg-[#121A14] text-gray-700 dark:text-gray-300 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors">
//                 <ArrowUp size={18} /> {t("withdraw")}
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
//                 <h3 className="font-bold text-lime-950 dark:text-white text-lg">{t("tierAccount", { tier })}</h3>
//                 <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">{t("unlockCrypto")}</p>
//               </div>
//             </div>
//             <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
//               <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
//                 <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
//               </div>
//               <Link href="/dashboard/rewards" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
//                 {t("viewTasks")}
//               </Link>
//             </div>
//           </motion.div>

//           {/* REAL ACTIVE POSITIONS TABLE */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Activity size={18} className="text-lime-500" /> {t("activePositions")}
//               </h3>
//               <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewTerminal")}</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               {realTrades.length === 0 ? (
//                 <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
//                   No open positions. Visit the terminal to place a trade.
//                 </div>
//               ) : (
//                 <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                   <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                     <tr>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("asset")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("size")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("entryPrice")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("markPrice")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-center">{t("trend")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-right">{t("unrealizedPnl")}</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-lime-500/10">
//                     {realTrades.map((pos: any) => (
//                       <tr key={pos._id} onClick={() => router.push(`/terminal?pair=${pos.pair}&tradeId=${pos._id}`)} className="hover:bg-lime-500/5 transition-colors cursor-pointer">
//                         <td className="px-3 sm:px-4 py-3">
//                           <div className="flex items-center gap-2">
//                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.side === "buy" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.side === "buy" ? "LONG" : "SHORT"}</span>
//                             <span className="font-bold text-lime-950 dark:text-white">{pos.pair}</span>
//                           </div>
//                         </td>
//                         <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.amount} {pos.baseAsset}</td>
//                         <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{currencySymbol}{pos.entryPrice.toLocaleString()}</td>
//                         <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{currencySymbol}{(pos.entryPrice * 1.02).toFixed(2)}</td>
//                         <td className="px-3 sm:px-4 py-3 flex justify-center">
//                           {/* 👇 SYNCED WITH ADMIN TREND 👇 */}
//                           <TradeSparkline trend={currentTrend} />
//                         </td>
//                         <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${pos.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
//                           {pos.pnl >= 0 ? "+" : ""}{currencySymbol}{pos.pnl.toFixed(2)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           </motion.div>

//           {/* REAL RECENT ACTIVITY TABLE */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl mt-6">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Wallet size={18} className="text-lime-500" /> {t("recentActivity")}
//               </h3>
//               <Link href="/dashboard/transfer" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               {realActivity.length === 0 ? (
//                 <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
//                   No recent activity found.
//                 </div>
//               ) : (
//                 <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                   <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                     <tr>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("type")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">Ref</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("amount")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">Status</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-right">{t("date")}</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-lime-500/10">
//                     {realActivity.map((tx: any) => {
//                       const userEntry = tx.entries.find((e: any) => userAccountIds.has(e.accountId));
//                       const isCredit = userEntry?.direction === "credit";
//                       const amountStr = userEntry ? (userEntry.amount / 100).toLocaleString() : "0.00";
//                       const assetStr = userEntry ? userEntry.assetId : "USD";
                      
//                       return (
//                         <tr key={tx._id} className="transition-colors">
//                           <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white capitalize">{tx.kind.replace('_', ' ')}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-xs text-lime-800/50 dark:text-lime-200/40">{tx.refId.slice(0, 10)}...</td>
//                           <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${isCredit ? 'text-green-500' : 'text-red-500'}`}>
//                             {isCredit ? "+" : "-"}{currencySymbol}{amountStr} {assetStr}
//                           </td>
//                           <td className="px-3 sm:px-4 py-3">
//                             <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-green-500/10 text-green-500">
//                               COMPLETED
//                             </span>
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 text-right text-xs text-lime-800/50 dark:text-lime-200/40">
//                             {new Date(tx.createdAt).toLocaleDateString()}
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           </motion.div>

//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: 'conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)' }}>
//                 <div className="w-16 h-16 bg-[#f4fbf5] dark:bg-[#0a0f0b] rounded-full m-auto translate-y-4 flex items-center justify-center">
//                   <PieChart size={20} className="text-lime-500" />
//                 </div>
//               </div>
//               <div>
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white mb-2">{t("assetAllocation")}</h4>
//                 <div className="space-y-1 text-xs font-medium">
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-lime-500">● {t("crypto")}</span> <span>60%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-blue-500">● {t("commodities")}</span> <span>25%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-amber-500">● {t("fiat")}</span> <span>15%</span></div>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
//               <div className="flex justify-between items-center mb-4">
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white">{t("riskMetrics")}</h4>
//                 <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">{t("lowRisk")}</span>
//               </div>
//               <div className="space-y-3">
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>{t("maxDrawdown")}</span> <span>4.2%</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]"></div></div>
//                 </div>
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>{t("riskRewardRatio")}</span> <span>1 : 2.4</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]"></div></div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>

//         </div>

//         <div className="space-y-6">
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">{t("quickTrade")}</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'buy' ? 'bg-green-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>{t("buy")}</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>{t("sell")}</button>
//             </div>

//             <div className="space-y-3 mb-6">
//               <div className="flex items-center gap-2">
//                 <Link href="/markets?select=base&returnUrl=/dashboard" className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group" title={t("selectBase")}>
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{baseAsset}</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>
//                 <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>
//                 <Link href="/markets?select=quote&returnUrl=/dashboard" className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group" title={t("selectQuote")}>
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{quoteAsset}</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>
//               </div>

//               <div className="relative">
//                 <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none">
//                   <option value="market">{t("marketOrder")}</option>
//                   <option value="limit">{t("limitOrder")}</option>
//                   <option value="stop">{t("stopLoss")}</option>
//                 </select>
//               </div>
              
//               <div>
//                 <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
//                   <span>{t("amount")}</span>
//                   <span>{t("available")}: {currencySymbol}{usdBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
//                 </div>
//                 <input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(formatNumber(e.target.value))} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//               </div>

//               <div className="grid grid-cols-2 gap-2">
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block px-1">{t("takeProfit")}</label>
//                   <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder={t("price")} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block px-1">{t("stopLoss")}</label>
//                   <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder={t("price")} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                 </div>
//               </div>
//             </div>

//             <KycGate requiredTier={1} currentTier={tier} featureName="trading">
//               <Button 
//                 onClick={executeTrade} 
//                 disabled={isTrading || !amount || parseFloat(amount.replace(/,/g, "")) <= 0} 
//                 className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
//               >
//                 {isTrading ? "Processing..." : t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
//               </Button>
//             </KycGate>
//           </motion.div>

//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> {t("marketWatch")}
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {dbAssets.slice(0, 5).map((market: any) => (
//                 <div key={market._id} onClick={() => router.push(`/terminal?pair=${market.symbol}-USD`)} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                       {market.symbol.charAt(0)}
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}/USD</p>
//                       <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">${market.basePrice.toLocaleString()}</p>
//                     <p className={`text-xs font-bold flex items-center justify-end ${currentTrend === 'bullish' ? 'text-green-500' : currentTrend === 'bearish' ? 'text-red-500' : 'text-amber-500'}`}>
//                       {currentTrend === 'bullish' ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} 
//                       {currentTrend === 'bullish' ? '+2.4%' : currentTrend === 'bearish' ? '-1.8%' : '0.1%'}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
//             <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none">
//               <Award size={100} />
//             </div>
//             <div className="flex items-center gap-3 mb-3 relative z-10">
//               <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30">
//                 <Zap size={18} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white">{t("levelTrader", { level: 4 })}</h3>
//                 <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">1,200 / 1,500 XP</p>
//               </div>
//             </div>
//             <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10">
//               <div className="h-full bg-lime-500 rounded-full w-[80%]"></div>
//             </div>
//             <Link href="/dashboard/rewards" className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10">
//               {t("viewRewards")} <ChevronRight size={14} />
//             </Link>
//           </motion.div>

//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
//               <Newspaper size={18} className="text-blue-500" /> {t("marketNews")}
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
// import { useTranslations } from "next-intl"; 
// import { 
//   TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck, Flame, 
//   Newspaper, ChevronRight, Award, Zap, ArrowDown, ArrowUp, Wallet, ChevronDown
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";
// import { executeTradeAction } from "@/app/actions/trade"; // 👈 Imported Server Action

// const NEWS = [
//   { time: "10m ago", title: "Bitcoin breaks $67k resistance amid ETF inflows", source: "Bloomberg" },
//   { time: "1h ago", title: "SEC delays decision on Ethereum spot ETF", source: "Reuters" },
//   { time: "3h ago", title: "Global commodity prices stabilize after recent surge", source: "Financial Times" },
// ];

// const formatNumber = (value: string) => {
//   const cleanValue = value.replace(/[^0-9.]/g, "");
//   const parts = cleanValue.split(".");
//   parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//   return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
// };

// function TradeSparkline({ status }: { status: string }) {
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
//   realBalances = [],
//   realTrades = [],
//   realActivity = [],
// }: {
//   tier: number;
//   displayName: string;
//   userAvatar: string;
//   currencySymbol?: string;
//   dbAssets?: any[];
//   realBalances?: any[];
//   realTrades?: any[];
//   realActivity?: any[];
// }) {
//   const t = useTranslations("Dashboard"); 
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { openModal } = useDevModal();
  
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");
//   const [isTrading, setIsTrading] = useState(false); // 👈 Added loading state

//   const [amount, setAmount] = useState("");
//   const [takeProfit, setTakeProfit] = useState("");
//   const [stopLoss, setStopLoss] = useState("");

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

//   // 👇 REAL EXECUTE TRADE LOGIC RESTORED
//   const executeTrade = async () => {
//     const rawAmount = amount.replace(/,/g, "");
//     const qty = parseFloat(rawAmount);

//     if (!qty || qty <= 0) {
//       openModal(t("invalidAmountTitle"), t("invalidAmountDesc"), "warning");
//       return;
//     }

//     setIsTrading(true);

//     // Find the current price from the real database assets
//     const asset = dbAssets.find((a: any) => a.symbol === baseAsset);
//     const currentPrice = asset ? asset.basePrice : 100; // fallback to 100 if not found

//     // Call the real Server Action
//     const res = await executeTradeAction({
//       pair: `${baseAsset}-${quoteAsset}`,
//       side: tradeType,
//       price: currentPrice,
//       amount: qty,
//     });

//     setIsTrading(false);

//     if (res.error) {
//       openModal("Trade Failed", res.error, "error");
//     } else {
//       openModal("Trade Successful", `Your ${tradeType} order for ${qty} ${baseAsset} was filled at ${currencySymbol}${currentPrice}.`, "success");
      
//       setAmount("");
//       setTakeProfit("");
//       setStopLoss("");

//       // Refresh the server component data to show the new real trade!
//       router.refresh(); 
//     }
//   };

//   if (!mounted) return null;

//   // Calculate real USD balance from the ledger
//   const usdBalance = realBalances.find((b: any) => b.assetId === "USD")?.cachedBalance / 100 || 0;
  
//   // Create a set of user account IDs for the activity table logic
//   const userAccountIds = new Set(realBalances.map((b: any) => b._id));

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 w-full overflow-x-hidden">
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden">
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
//                   {t("walletBalance")}
//                 </span>
//                 <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
//                   <span className="text-sm sm:text-lg font-extrabold text-lime-950 dark:text-white">{currencySymbol}</span>
//                   <span className="text-xl sm:text-3xl font-extrabold text-lime-950 dark:text-white tracking-tight">
//                     {usdBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-md mt-auto pt-2">
//               <Link href="/dashboard/transfer?mode=deposit" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#5d9e17] text-white rounded-xl text-sm sm:text-base font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20">
//                 <ArrowDown size={18} /> {t("deposit")}
//               </Link>
//               <Link href="/dashboard/transfer?mode=withdraw" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#e5e7eb] dark:bg-[#121A14] text-gray-700 dark:text-gray-300 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors">
//                 <ArrowUp size={18} /> {t("withdraw")}
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
//                 <h3 className="font-bold text-lime-950 dark:text-white text-lg">{t("tierAccount", { tier })}</h3>
//                 <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">{t("unlockCrypto")}</p>
//               </div>
//             </div>
//             <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
//               <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
//                 <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
//               </div>
//               <Link href="/dashboard/rewards" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
//                 {t("viewTasks")}
//               </Link>
//             </div>
//           </motion.div>

//           {/* REAL ACTIVE POSITIONS TABLE */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Activity size={18} className="text-lime-500" /> {t("activePositions")}
//               </h3>
//               <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewTerminal")}</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               {realTrades.length === 0 ? (
//                 <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
//                   No open positions. Visit the terminal to place a trade.
//                 </div>
//               ) : (
//                 <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                   <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                     <tr>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("asset")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("size")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("entryPrice")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("markPrice")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-center">{t("trend")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-right">{t("unrealizedPnl")}</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-lime-500/10">
//                     {realTrades.map((pos: any) => (
//                       <tr key={pos._id} onClick={() => router.push(`/terminal?pair=${pos.pair}&tradeId=${pos._id}`)} className="hover:bg-lime-500/5 transition-colors cursor-pointer">
//                         <td className="px-3 sm:px-4 py-3">
//                           <div className="flex items-center gap-2">
//                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.side === "buy" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.side === "buy" ? "LONG" : "SHORT"}</span>
//                             <span className="font-bold text-lime-950 dark:text-white">{pos.pair}</span>
//                           </div>
//                         </td>
//                         <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.amount} {pos.baseAsset}</td>
//                         <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{currencySymbol}{pos.entryPrice.toLocaleString()}</td>
//                         <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{currencySymbol}{(pos.entryPrice * 1.02).toFixed(2)}</td>
//                         <td className="px-3 sm:px-4 py-3 flex justify-center">
//                           <TradeSparkline status={pos.pnl >= 0 ? "increasing" : "falling"} />
//                         </td>
//                         <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${pos.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
//                           {pos.pnl >= 0 ? "+" : ""}{currencySymbol}{pos.pnl.toFixed(2)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           </motion.div>

//           {/* REAL RECENT ACTIVITY TABLE */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl mt-6">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Wallet size={18} className="text-lime-500" /> {t("recentActivity")}
//               </h3>
//               <Link href="/dashboard/transfer" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               {realActivity.length === 0 ? (
//                 <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
//                   No recent activity found.
//                 </div>
//               ) : (
//                 <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                   <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                     <tr>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("type")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">Ref</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("amount")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">Status</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-right">{t("date")}</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-lime-500/10">
//                     {realActivity.map((tx: any) => {
//                       // 👇 Find the specific entry that belongs to the USER (not the system)
//                       const userEntry = tx.entries.find((e: any) => userAccountIds.has(e.accountId));
//                       const isCredit = userEntry?.direction === "credit";
//                       const amountStr = userEntry ? (userEntry.amount / 100).toLocaleString() : "0.00";
//                       const assetStr = userEntry ? userEntry.assetId : "USD";
                      
//                       return (
//                         <tr key={tx._id} className="transition-colors">
//                           <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white capitalize">{tx.kind.replace('_', ' ')}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-xs text-lime-800/50 dark:text-lime-200/40">{tx.refId.slice(0, 10)}...</td>
//                           <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${isCredit ? 'text-green-500' : 'text-red-500'}`}>
//                             {isCredit ? "+" : "-"}{currencySymbol}{amountStr} {assetStr}
//                           </td>
//                           <td className="px-3 sm:px-4 py-3">
//                             <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-green-500/10 text-green-500">
//                               COMPLETED
//                             </span>
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 text-right text-xs text-lime-800/50 dark:text-lime-200/40">
//                             {new Date(tx.createdAt).toLocaleDateString()}
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           </motion.div>

//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: 'conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)' }}>
//                 <div className="w-16 h-16 bg-[#f4fbf5] dark:bg-[#0a0f0b] rounded-full m-auto translate-y-4 flex items-center justify-center">
//                   <PieChart size={20} className="text-lime-500" />
//                 </div>
//               </div>
//               <div>
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white mb-2">{t("assetAllocation")}</h4>
//                 <div className="space-y-1 text-xs font-medium">
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-lime-500">● {t("crypto")}</span> <span>60%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-blue-500">● {t("commodities")}</span> <span>25%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-amber-500">● {t("fiat")}</span> <span>15%</span></div>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
//               <div className="flex justify-between items-center mb-4">
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white">{t("riskMetrics")}</h4>
//                 <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">{t("lowRisk")}</span>
//               </div>
//               <div className="space-y-3">
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>{t("maxDrawdown")}</span> <span>4.2%</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]"></div></div>
//                 </div>
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>{t("riskRewardRatio")}</span> <span>1 : 2.4</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]"></div></div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>

//         </div>

//         <div className="space-y-6">
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">{t("quickTrade")}</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'buy' ? 'bg-green-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>{t("buy")}</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>{t("sell")}</button>
//             </div>

//             <div className="space-y-3 mb-6">
//               <div className="flex items-center gap-2">
//                 <Link href="/markets?select=base&returnUrl=/dashboard" className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group" title={t("selectBase")}>
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{baseAsset}</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>
//                 <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>
//                 <Link href="/markets?select=quote&returnUrl=/dashboard" className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group" title={t("selectQuote")}>
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{quoteAsset}</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>
//               </div>

//               <div className="relative">
//                 <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none">
//                   <option value="market">{t("marketOrder")}</option>
//                   <option value="limit">{t("limitOrder")}</option>
//                   <option value="stop">{t("stopLoss")}</option>
//                 </select>
//               </div>
              
//               <div>
//                 <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
//                   <span>{t("amount")}</span>
//                   <span>{t("available")}: {currencySymbol}{usdBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
//                 </div>
//                 <input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(formatNumber(e.target.value))} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//               </div>

//               <div className="grid grid-cols-2 gap-2">
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block px-1">{t("takeProfit")}</label>
//                   <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder={t("price")} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block px-1">{t("stopLoss")}</label>
//                   <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder={t("price")} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                 </div>
//               </div>
//             </div>

//             <KycGate requiredTier={1} currentTier={tier} featureName="trading">
//               <Button 
//                 onClick={executeTrade} 
//                 disabled={isTrading || !amount || parseFloat(amount.replace(/,/g, "")) <= 0} 
//                 className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
//               >
//                 {isTrading ? "Processing..." : t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
//               </Button>
//             </KycGate>
//           </motion.div>

//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> {t("marketWatch")}
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {dbAssets.slice(0, 5).map((market: any) => (
//                 <div key={market._id} onClick={() => router.push(`/terminal?pair=${market.symbol}-USD`)} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                       {market.symbol.charAt(0)}
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}/USD</p>
//                       <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">${market.basePrice.toLocaleString()}</p>
//                     <p className={`text-xs font-bold flex items-center justify-end text-green-500`}>
//                       <TrendingUp size={12} className="mr-0.5" /> +2.4%
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
//             <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none">
//               <Award size={100} />
//             </div>
//             <div className="flex items-center gap-3 mb-3 relative z-10">
//               <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30">
//                 <Zap size={18} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white">{t("levelTrader", { level: 4 })}</h3>
//                 <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">1,200 / 1,500 XP</p>
//               </div>
//             </div>
//             <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10">
//               <div className="h-full bg-lime-500 rounded-full w-[80%]"></div>
//             </div>
//             <Link href="/dashboard/rewards" className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10">
//               {t("viewRewards")} <ChevronRight size={14} />
//             </Link>
//           </motion.div>

//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
//               <Newspaper size={18} className="text-blue-500" /> {t("marketNews")}
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
// import { useTranslations } from "next-intl"; // 👈 Imported
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

// const INITIAL_ACTIVITY = [
//   { id: 'act-1', type: "Deposit", asset: "USDT", amount: "+500.00", status: "Completed", date: "Today, 10:45 AM" },
//   { id: 'act-2', type: "Withdrawal", asset: "DOGE", amount: "-2,500", status: "Pending", date: "Yesterday, 4:20 PM" },
//   { id: 'act-3', type: "Trade", asset: "BTC/USD", amount: "Long", status: "Filled", date: "Yesterday, 9:00 AM" },
// ];

// const INITIAL_POSITIONS = [
//   { id: 'pos-1', asset: "BTC/USD", type: "Long", size: "0.5 BTC", entry: "$64,200", current: "$67,430", pnl: "+$1,615", pnlPct: "+2.5%", isProfit: true, tp: "$68,000", sl: "$63,000", status: "increasing" as const },
//   { id: 'pos-2', asset: "ETH/USD", type: "Short", size: "2.0 ETH", entry: "$3,600", current: "$3,450", pnl: "+$300", pnlPct: "+4.1%", isProfit: true, tp: "$3,400", sl: "$3,700", status: "stable" as const },
//   { id: 'pos-3', asset: "SOL/USD", type: "Long", size: "10 SOL", entry: "$150", current: "$145", pnl: "-$50", pnlPct: "-3.3%", isProfit: false, tp: "$160", sl: "$140", status: "falling" as const },
// ];

// const NEWS = [
//   { time: "10m ago", title: "Bitcoin breaks $67k resistance amid ETF inflows", source: "Bloomberg" },
//   { time: "1h ago", title: "SEC delays decision on Ethereum spot ETF", source: "Reuters" },
//   { time: "3h ago", title: "Global commodity prices stabilize after recent surge", source: "Financial Times" },
// ];

// const formatNumber = (value: string) => {
//   const cleanValue = value.replace(/[^0-9.]/g, "");
//   const parts = cleanValue.split(".");
//   parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//   return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
// };

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
//   const t = useTranslations("Dashboard"); // 👈 Initialize translator
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { openModal } = useDevModal();
  
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");

//   const [amount, setAmount] = useState("");
//   const [takeProfit, setTakeProfit] = useState("");
//   const [stopLoss, setStopLoss] = useState("");
//   const [positions, setPositions] = useState<any[]>(INITIAL_POSITIONS);
//   const [activity, setActivity] = useState<any[]>(INITIAL_ACTIVITY);

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

//   const executeTrade = () => {
//     const rawAmount = amount.replace(/,/g, "");
//     const qty = parseFloat(rawAmount);

//     if (!qty || qty <= 0) {
//       openModal(t("invalidAmountTitle"), t("invalidAmountDesc"), "warning");
//       return;
//     }

//     const newPosId = `pos-${Date.now()}`;
//     const newPos = {
//       id: newPosId,
//       asset: `${baseAsset}/${quoteAsset}`,
//       type: tradeType === "buy" ? "Long" : "Short",
//       size: `${qty} ${baseAsset}`,
//       entry: `$${MARKETS.find(m => m.symbol.startsWith(baseAsset))?.price || "0.00"}`,
//       current: `$${MARKETS.find(m => m.symbol.startsWith(baseAsset))?.price || "0.00"}`,
//       pnl: "$0.00",
//       pnlPct: "0%",
//       isProfit: true,
//       tp: takeProfit || null,
//       sl: stopLoss || null,
//       status: "increasing"
//     };

//     setPositions([newPos, ...positions]);
//     setActivity((prev) => [
//       {
//         id: `act-${Date.now()}`,
//         type: "Trade",
//         asset: `${baseAsset}/${quoteAsset}`,
//         amount: tradeType === "buy" ? "Long" : "Short",
//         status: "Filled",
//         date: t("justNow"),
//       },
//       ...prev,
//     ]);

//     setAmount("");
//     setTakeProfit("");
//     setStopLoss("");
    
//     router.push(`/terminal?pair=${baseAsset}-${quoteAsset}&tradeId=${newPosId}`);
//   };

//   if (!mounted) return null;

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 w-full overflow-x-hidden">
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden">
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
//                   {t("walletBalance")}
//                 </span>
//                 <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
//                   <span className="text-sm sm:text-lg font-extrabold text-lime-950 dark:text-white">{currencySymbol}</span>
//                   <span className="text-xl sm:text-3xl font-extrabold text-lime-950 dark:text-white tracking-tight">
//                     $1,250.00
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-md mt-auto pt-2">
//               <Link href="/dashboard/transfer?mode=deposit" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#5d9e17] text-white rounded-xl text-sm sm:text-base font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20">
//                 <ArrowDown size={18} /> {t("deposit")}
//               </Link>
//               <Link href="/dashboard/transfer?mode=withdraw" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#e5e7eb] dark:bg-[#121A14] text-gray-700 dark:text-gray-300 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors">
//                 <ArrowUp size={18} /> {t("withdraw")}
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
//                 <h3 className="font-bold text-lime-950 dark:text-white text-lg">{t("tierAccount", { tier })}</h3>
//                 <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">{t("unlockCrypto")}</p>
//               </div>
//             </div>
//             <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
//               <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
//                 <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]"></div>
//               </div>
//               <Link href="/dashboard/rewards" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
//                 {t("viewTasks")}
//               </Link>
//             </div>
//           </motion.div>

//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Activity size={18} className="text-lime-500" /> {t("activePositions")}
//               </h3>
//               <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewTerminal")}</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">{t("asset")}</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">{t("size")}</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">{t("entryPrice")}</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">{t("markPrice")}</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold text-center">{t("trend")}</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold text-right">{t("unrealizedPnl")}</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {positions.map((pos, i) => (
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

//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl mt-6">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Wallet size={18} className="text-lime-500" /> {t("recentActivity")}
//               </h3>
//               <Link href="/dashboard/transfer" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                 <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                   <tr>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">{t("type")}</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">{t("asset")}</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">{t("amount")}</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold">{t("status")}</th>
//                     <th className="px-3 sm:px-4 py-3 font-semibold text-right">{t("date")}</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-lime-500/10">
//                   {activity.map((tx, i) => (
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

//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: 'conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)' }}>
//                 <div className="w-16 h-16 bg-[#f4fbf5] dark:bg-[#0a0f0b] rounded-full m-auto translate-y-4 flex items-center justify-center">
//                   <PieChart size={20} className="text-lime-500" />
//                 </div>
//               </div>
//               <div>
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white mb-2">{t("assetAllocation")}</h4>
//                 <div className="space-y-1 text-xs font-medium">
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-lime-500">● {t("crypto")}</span> <span>60%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-blue-500">● {t("commodities")}</span> <span>25%</span></div>
//                   <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-amber-500">● {t("fiat")}</span> <span>15%</span></div>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
//               <div className="flex justify-between items-center mb-4">
//                 <h4 className="text-sm font-bold text-lime-950 dark:text-white">{t("riskMetrics")}</h4>
//                 <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">{t("lowRisk")}</span>
//               </div>
//               <div className="space-y-3">
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>{t("maxDrawdown")}</span> <span>4.2%</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]"></div></div>
//                 </div>
//                 <div>
//                   <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>{t("riskRewardRatio")}</span> <span>1 : 2.4</span></div>
//                   <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]"></div></div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>

//         </div>

//         <div className="space-y-6">
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">{t("quickTrade")}</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'buy' ? 'bg-green-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>{t("buy")}</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === 'sell' ? 'bg-red-500 text-white shadow-md' : 'text-lime-800 dark:text-lime-200'}`}>{t("sell")}</button>
//             </div>

//             <div className="space-y-3 mb-6">
//               <div className="flex items-center gap-2">
//                 <Link href="/markets?select=base&returnUrl=/dashboard" className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group" title={t("selectBase")}>
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{baseAsset}</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>
//                 <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>
//                 <Link href="/markets?select=quote&returnUrl=/dashboard" className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group" title={t("selectQuote")}>
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{quoteAsset}</span>
//                   </div>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </Link>
//               </div>

//               <div className="relative">
//                 <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none">
//                   <option value="market">{t("marketOrder")}</option>
//                   <option value="limit">{t("limitOrder")}</option>
//                   <option value="stop">{t("stopLoss")}</option>
//                 </select>
//               </div>
              
//               <div>
//                 <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
//                   <span>{t("amount")}</span>
//                   <span>{t("available")}: {currencySymbol}4,500</span>
//                 </div>
//                 <input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(formatNumber(e.target.value))} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//               </div>

//               <div className="grid grid-cols-2 gap-2">
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block px-1">{t("takeProfit")}</label>
//                   <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder={t("price")} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block px-1">{t("stopLoss")}</label>
//                   <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder={t("price")} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                 </div>
//               </div>
//             </div>

//             <KycGate requiredTier={1} currentTier={tier} featureName="trading">
//               <Button onClick={executeTrade} disabled={!amount || parseFloat(amount.replace(/,/g, "")) <= 0} className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}>
//                 {t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
//               </Button>
//             </KycGate>
//           </motion.div>

//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> {t("marketWatch")}
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
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

//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
//             <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none">
//               <Award size={100} />
//             </div>
//             <div className="flex items-center gap-3 mb-3 relative z-10">
//               <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30">
//                 <Zap size={18} />
//               </div>
//               <div>
//                 <h3 className="font-bold text-lime-950 dark:text-white">{t("levelTrader", { level: 4 })}</h3>
//                 <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">1,200 / 1,500 XP</p>
//               </div>
//             </div>
//             <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10">
//               <div className="h-full bg-lime-500 rounded-full w-[80%]"></div>
//             </div>
//             <Link href="/dashboard/rewards" className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10">
//               {t("viewRewards")} <ChevronRight size={14} />
//             </Link>
//           </motion.div>

//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
//               <Newspaper size={18} className="text-blue-500" /> {t("marketNews")}
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