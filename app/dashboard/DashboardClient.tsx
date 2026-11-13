// app/dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl"; 
import { 
  TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck, Flame, 
  Newspaper, ChevronRight, Award, Zap, ArrowDown, ArrowUp, Wallet, ChevronDown,
  Loader2, AlertTriangle
} from "lucide-react";
import { KycGate } from "@/components/KycGate";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { useTour } from "@/components/providers/TourProvider"; 
import { Button } from "@/components/ui/Button";
import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";
import PairSelectionModal from "@/app/dashboard/PairSelectionModal"; // 👈 IMPORTED MODAL
import { executeTradeAction, closeTradeAction } from "@/app/actions/trade";
import { getMarketSettings } from "@/app/actions/admin-market";
import { calculateSimulatedPrice, getActiveBlock } from "@/lib/simulated-price"; 

const formatNumber = (value: string) => {
  const cleanValue = value.replace(/[^0-9.]/g, "");
  const parts = cleanValue.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
};

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
  news = [], 
}: {
  tier: number;
  displayName: string;
  userAvatar: string;
  currencySymbol?: string;
  dbAssets?: any[];
  realBalances?: any[];
  realTrades?: any[];
  realActivity?: any[];
  news?: Array<{ time: string; title: string; source: string }>;
}) {
  const t = useTranslations("Dashboard"); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openModal } = useDevModal();
  const { setSteps } = useTour();
  
  const [mounted, setMounted] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState("market");
  const [isTrading, setIsTrading] = useState(false); 
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  
  const [confirmClose, setConfirmClose] = useState<{
    trade: any;
    markPrice: number;
    pnl: number;
    pnlLabel: string;
  } | null>(null);

  const [marketBlock, setMarketBlock] = useState<{
    trend: "bullish" | "bearish" | "consolidate";
    intensity: number;
  }>({ trend: "consolidate", intensity: 5 });

  const [amount, setAmount] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const pairParam = searchParams.get("pair");
  
  // 👇 FIXED: Default to empty strings instead of BTC/USD
  const [baseAsset, setBaseAsset] = useState(""); 
  const [quoteAsset, setQuoteAsset] = useState(""); 
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);

  useEffect(() => {
    setSteps([
      { id: "tour-dash-balance", title: t("tour.balanceTitle"), text: t("tour.balanceText") },
      { id: "tour-dash-positions", title: t("tour.positionsTitle"), text: t("tour.positionsText") },
      { id: "tour-dash-quicktrade", title: t("tour.quicktradeTitle"), text: t("tour.quicktradeText") },
      { id: "tour-dash-marketwatch", title: t("tour.marketwatchTitle"), text: t("tour.marketwatchText") }
    ]);
    return () => setSteps([]);
  }, [setSteps, t]);

  useEffect(() => {
    setMounted(true);
    if (pairParam) {
      const [b, q] = pairParam.split("-");
      setBaseAsset(b);
      setQuoteAsset(q || "USD");
    } else if (!baseAsset && !quoteAsset && realTrades.length === 0) {
      // 👇 Auto-open modal for new users with no active trades
      setIsPairModalOpen(true);
    }
  }, [pairParam, realTrades.length]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await getMarketSettings();
        if (settings) {
          setMarketBlock(getActiveBlock(settings));
        }
      } catch (error) {
        console.error("Failed to fetch market settings", error);
      }
    }
    fetchSettings();
    const interval = setInterval(fetchSettings, 60000);
    return () => clearInterval(interval);
  }, []);

  const calculatePnl = (trade: any) => {
    const asset = dbAssets.find((a: any) => a.symbol === trade.baseAsset);
    const basePrice = asset ? asset.basePrice : trade.entryPrice;
    const markPrice = calculateSimulatedPrice(basePrice, marketBlock); 
    const priceDiff = markPrice - trade.entryPrice;
    const pnl = trade.side === "buy" ? priceDiff * trade.amount : -priceDiff * trade.amount;
    return { markPrice, pnl };
  };

  const executeTrade = async () => {
    if (!baseAsset || !quoteAsset) {
      setIsPairModalOpen(true);
      return;
    }

    const rawAmount = amount.replace(/,/g, "");
    const qty = parseFloat(rawAmount);

    if (!qty || qty <= 0) {
      openModal(t("invalidAmountTitle"), t("invalidAmountDesc"), "warning");
      return;
    }

    const selectedAsset = dbAssets.find((a: any) => a.symbol === baseAsset);
    if (tier === 1 && selectedAsset?.category === "memes") {
      openModal(t("tradeFailed"), t("tier1MemeRestriction"), "error");
      return;
    }

    setIsTrading(true);

    const basePrice = selectedAsset ? selectedAsset.basePrice : 100;
    const visualPrice = calculateSimulatedPrice(basePrice, marketBlock); 

    const res = await executeTradeAction({
      pair: `${baseAsset}-${quoteAsset}`,
      side: tradeType,
      price: visualPrice,
      amount: qty,
    });

    setIsTrading(false);

    if (res.error) {
      openModal(t("tradeFailed"), res.error, "error");
    } else {
      openModal(
        t("tradeSuccessful"), 
        t("tradeSuccessDesc", { 
          type: tradeType, 
          qty, 
          base: baseAsset, 
          symbol: currencySymbol, 
          price: visualPrice.toFixed(2) 
        }), 
        "success"
      );
      
      setAmount("");
      setTakeProfit("");
      setStopLoss("");
      router.refresh(); 
    }
  };

  const handleCloseTrade = (trade: any, markPrice: number, pnl: number) => {
    const pnlLabel = pnl >= 0 ? `+${currencySymbol}${pnl.toFixed(2)}` : `-${currencySymbol}${Math.abs(pnl).toFixed(2)}`;
    setConfirmClose({ trade, markPrice, pnl, pnlLabel });
  };

  const executeCloseTrade = async () => {
    if (!confirmClose) return;
    const { trade, markPrice } = confirmClose;
    
    setClosingTradeId(trade._id);
    setConfirmClose(null);

    try {
      const res = await closeTradeAction(trade._id, markPrice);
      if (res.error) {
        openModal(t("closeFailed"), res.error, "error");
      } else {
        const finalPnl = res.pnl || 0;
        openModal(
          t("positionClosed"), 
          t("realizedPnl", { amount: `${finalPnl >= 0 ? "+" : ""}${currencySymbol}${finalPnl.toFixed(2)}` }), 
          finalPnl >= 0 ? "success" : "info"
        );
        router.refresh();
      }
    } catch (error: any) {
      openModal(t("closeError"), error.message || t("closeErrorDesc"), "error");
    } finally {
      setClosingTradeId(null);
    }
  };

  if (!mounted) return null;

  const usdBalance = (realBalances.find((b: any) => b.assetId === "USD")?.cachedBalance || 0) / 100;
  const userAccountIds = new Set(realBalances.map((b: any) => b._id));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 w-full overflow-x-hidden">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        <motion.div id="tour-dash-balance" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden">
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
          {/* 👇 FIXED: Passes the current pair and the modal opener */}
          <FavorablePairsCard 
            dbAssets={dbAssets} 
            baseAsset={baseAsset} 
            quoteAsset={quoteAsset} 
            onSelectPair={() => setIsPairModalOpen(true)}
          />
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

          <motion.div id="tour-dash-positions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
              <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                <Activity size={18} className="text-lime-500" /> {t("activePositions")}
              </h3>
              <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewTerminal")}</Link>
            </div>
            <div className="w-full overflow-x-auto custom-scrollbar pb-2">
              {realTrades.length === 0 ? (
                <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
                  {t("noPositions")}
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
                      <th className="px-3 sm:px-4 py-3 font-semibold text-center">{t("action")}</th>
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
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.side === "buy" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.side === "buy" ? t("long") : t("short")}</span>
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
                                t("closePosition")
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
                  {t("noActivity")}
                </div>
              ) : (
                <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 font-semibold">{t("type")}</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold">{t("ref")}</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold">{t("amount")}</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold">{t("status")}</th>
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
                        <tr 
                          key={tx._id} 
                          // 👇 ADD THIS ONCLICK
                          onClick={() => {
                            if (tx.kind === "trade" && tx.refId) {
                              // We strip "trade_" from the refId to get the actual MongoDB ID
                              const actualTradeId = tx.refId.replace("trade_", "");
                              router.push(`/terminal?tradeId=${actualTradeId}&pair=${tx.assetId}-USD`);
                            }
                          }}
                          className={`transition-colors ${tx.kind === "trade" ? "hover:bg-lime-500/5 cursor-pointer" : ""}`}
                        >
                          <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white capitalize">{tx.kind.replace("_", " ")}</td>
                          {/* <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white capitalize">{tx.kind.replace("_", " ")}</td> */}
                          <td className="px-3 sm:px-4 py-3 font-mono text-xs text-lime-800/50 dark:text-lime-200/40">{tx.refId.slice(0, 10)}...</td>
                          <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${isCredit ? "text-green-500" : "text-red-500"}`}>
                            {isCredit ? "+" : "-"}{currencySymbol}{amountStr} {assetStr}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-green-500/10 text-green-500">
                              {t("completed")}
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
          <motion.div id="tour-dash-quicktrade" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="font-bold text-lime-950 dark:text-white mb-4">{t("quickTrade")}</h3>
            
            <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
              <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "buy" ? "bg-green-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("buy")}</button>
              <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "sell" ? "bg-red-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("sell")}</button>
            </div>

            <div className="space-y-3 mb-6">
              {/* 👇 FIXED: Buttons instead of Links, opening the Modal */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPairModalOpen(true)}
                  className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
                >
                  <span className={`text-sm font-bold transition-colors ${baseAsset ? "text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400" : "text-lime-800/50 dark:text-lime-200/30"}`}>
                    {baseAsset || t("selectBase")}
                  </span>
                  <ChevronDown size={14} className="text-lime-500 shrink-0" />
                </button>
                <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>
                <button 
                  onClick={() => setIsPairModalOpen(true)}
                  className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
                >
                  <span className={`text-sm font-bold transition-colors ${quoteAsset ? "text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400" : "text-lime-800/50 dark:text-lime-200/30"}`}>
                    {quoteAsset || t("selectQuote")}
                  </span>
                  <ChevronDown size={14} className="text-lime-500 shrink-0" />
                </button>
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
                disabled={isTrading || !amount || parseFloat(amount.replace(/,/g, "")) <= 0 || !baseAsset || !quoteAsset} 
                className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === "buy" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}
              >
                {isTrading ? t("processing") : t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
              </Button>
            </KycGate>
          </motion.div>

          <motion.div id="tour-dash-marketwatch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
              <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                <Flame size={18} className="text-orange-500" /> {t("marketWatch")}
              </h3>
              <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
            </div>
            <div className="divide-y divide-lime-500/5">
              {/* 👇 THE FIX IS ON THE NEXT TWO LINES 👇 */}
              {dbAssets.slice(0, 5).map((market: any, index: number) => {
                const livePrice = calculateSimulatedPrice(market.basePrice, marketBlock);
                const percentChange = livePrice === market.basePrice 
                  ? "0%" 
                  : `${((livePrice - market.basePrice) / market.basePrice * 100).toFixed(2)}%`;
                const isPositive = livePrice >= market.basePrice;
                
                return (
                  <div key={market._id || index} onClick={() => router.push(`/terminal?pair=${market.symbol}-USD`)} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
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
              {news && news.length > 0 ? (
                news.map((item, i) => (
                  <div key={i} className="group cursor-pointer">
                    <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">{item.time} • {item.source}</p>
                    <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">{item.title}</h4>
                  </div>
                ))
              ) : (
                <p className="text-xs text-lime-800/60 dark:text-lime-200/50 font-medium">
                  {t("noNews")}
                </p>
              )}
            </div>
          </motion.div>

        </div>
      </div>

      {/* 👇 NEW: PAIR SELECTION MODAL */}
      <PairSelectionModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        onSave={(base, quote) => {
          setBaseAsset(base);
          setQuoteAsset(quote);
        }}
        dbAssets={dbAssets}
        initialBase={baseAsset}
        initialQuote={quoteAsset}
      />

      {/* CUSTOM CONFIRM MODAL */}
      <AnimatePresence>
        {confirmClose && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                confirmClose.pnl >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              }`}>
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-lime-950 dark:text-white">
                {t("confirmCloseTitle")}
              </h3>
              <p className="text-sm text-lime-800/70 dark:text-lime-200/60 font-medium">
                {t("confirmCloseDesc", { 
                  side: confirmClose.trade.side === "buy" ? t("long") : t("short"), 
                  pair: confirmClose.trade.pair 
                })}
              </p>
              <div className="w-full bg-lime-50/50 dark:bg-black/40 rounded-xl p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-lime-800/60 dark:text-lime-200/50">{t("exitPrice")}</span>
                  <span className="text-lime-950 dark:text-white font-bold">{currencySymbol}{confirmClose.markPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-lime-800/60 dark:text-lime-200/50">{t("estimatedPnl")}</span>
                  <span className={`font-bold ${confirmClose.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{confirmClose.pnlLabel}</span>
                </div>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={() => setConfirmClose(null)} 
                  className="flex-1 py-2.5 bg-gray-200 dark:bg-[#121A14] text-lime-950 dark:text-white font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors"
                >
                  {t("cancel")}
                </button>
                <button 
                  onClick={executeCloseTrade} 
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl transition-colors shadow-lg ${
                    confirmClose.pnl >= 0 ? "bg-green-500 hover:bg-green-600 shadow-green-500/20" : "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                  }`}
                >
                  {t("closePosition")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}



// // app/dashboard/DashboardClient.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import Link from "next/link";
// import { useTranslations } from "next-intl"; 
// import { 
//   TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck, Flame, 
//   Newspaper, ChevronRight, Award, Zap, ArrowDown, ArrowUp, Wallet, ChevronDown,
//   Loader2, AlertTriangle
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { useTour } from "@/components/providers/TourProvider"; 
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";
// import PairSelectionModal from "@/app/dashboard/PairSelectionModal"; // 👈 IMPORTED MODAL
// import { executeTradeAction, closeTradeAction } from "@/app/actions/trade";
// import { getMarketSettings } from "@/app/actions/admin-market";
// import { calculateSimulatedPrice, getActiveBlock } from "@/lib/simulated-price"; 

// const formatNumber = (value: string) => {
//   const cleanValue = value.replace(/[^0-9.]/g, "");
//   const parts = cleanValue.split(".");
//   parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//   return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
// };

// function TradeSparkline({ trend }: { trend: "bullish" | "bearish" | "consolidate" }) {
//   let color = "#10b981"; 
//   let path = "M 0 20 Q 10 15, 20 25 T 40 20 T 60 25 Q 70 20 80 25 T 100 20"; 

//   if (trend === "bullish") { 
//     color = "#3b82f6"; 
//     path = "M 0 30 Q 15 25, 20 20 T 40 10 T 60 5"; 
//   } else if (trend === "bearish") { 
//     color = "#ef4444"; 
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
//   news = [], 
// }: {
//   tier: number;
//   displayName: string;
//   userAvatar: string;
//   currencySymbol?: string;
//   dbAssets?: any[];
//   realBalances?: any[];
//   realTrades?: any[];
//   realActivity?: any[];
//   news?: Array<{ time: string; title: string; source: string }>;
// }) {
//   const t = useTranslations("Dashboard"); 
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { openModal } = useDevModal();
//   const { setSteps } = useTour();
  
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");
//   const [isTrading, setIsTrading] = useState(false); 
//   const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  
//   const [confirmClose, setConfirmClose] = useState<{
//     trade: any;
//     markPrice: number;
//     pnl: number;
//     pnlLabel: string;
//   } | null>(null);

//   const [marketBlock, setMarketBlock] = useState<{
//     trend: "bullish" | "bearish" | "consolidate";
//     intensity: number;
//   }>({ trend: "consolidate", intensity: 5 });

//   const [amount, setAmount] = useState("");
//   const [takeProfit, setTakeProfit] = useState("");
//   const [stopLoss, setStopLoss] = useState("");

//   const pairParam = searchParams.get("pair");
  
//   // 👇 FIXED: Default to empty strings instead of BTC/USD
//   const [baseAsset, setBaseAsset] = useState(""); 
//   const [quoteAsset, setQuoteAsset] = useState(""); 
//   const [isPairModalOpen, setIsPairModalOpen] = useState(false);

//   useEffect(() => {
//     setSteps([
//       { id: "tour-dash-balance", title: t("tour.balanceTitle"), text: t("tour.balanceText") },
//       { id: "tour-dash-positions", title: t("tour.positionsTitle"), text: t("tour.positionsText") },
//       { id: "tour-dash-quicktrade", title: t("tour.quicktradeTitle"), text: t("tour.quicktradeText") },
//       { id: "tour-dash-marketwatch", title: t("tour.marketwatchTitle"), text: t("tour.marketwatchText") }
//     ]);
//     return () => setSteps([]);
//   }, [setSteps, t]);

//   useEffect(() => {
//     setMounted(true);
//     if (pairParam) {
//       const [b, q] = pairParam.split("-");
//       setBaseAsset(b);
//       setQuoteAsset(q || "USD");
//     } else if (!baseAsset && !quoteAsset && realTrades.length === 0) {
//       // 👇 Auto-open modal for new users with no active trades
//       setIsPairModalOpen(true);
//     }
//   }, [pairParam, realTrades.length]);

//   useEffect(() => {
//     async function fetchSettings() {
//       try {
//         const settings = await getMarketSettings();
//         if (settings) {
//           setMarketBlock(getActiveBlock(settings));
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchSettings();
//     const interval = setInterval(fetchSettings, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const calculatePnl = (trade: any) => {
//     const asset = dbAssets.find((a: any) => a.symbol === trade.baseAsset);
//     const basePrice = asset ? asset.basePrice : trade.entryPrice;
//     const markPrice = calculateSimulatedPrice(basePrice, marketBlock); 
//     const priceDiff = markPrice - trade.entryPrice;
//     const pnl = trade.side === "buy" ? priceDiff * trade.amount : -priceDiff * trade.amount;
//     return { markPrice, pnl };
//   };

//   const executeTrade = async () => {
//     if (!baseAsset || !quoteAsset) {
//       setIsPairModalOpen(true);
//       return;
//     }

//     const rawAmount = amount.replace(/,/g, "");
//     const qty = parseFloat(rawAmount);

//     if (!qty || qty <= 0) {
//       openModal(t("invalidAmountTitle"), t("invalidAmountDesc"), "warning");
//       return;
//     }

//     const selectedAsset = dbAssets.find((a: any) => a.symbol === baseAsset);
//     if (tier === 1 && selectedAsset?.category === "memes") {
//       openModal(t("tradeFailed"), t("tier1MemeRestriction"), "error");
//       return;
//     }

//     setIsTrading(true);

//     const basePrice = selectedAsset ? selectedAsset.basePrice : 100;
//     const visualPrice = calculateSimulatedPrice(basePrice, marketBlock); 

//     const res = await executeTradeAction({
//       pair: `${baseAsset}-${quoteAsset}`,
//       side: tradeType,
//       price: visualPrice,
//       amount: qty,
//     });

//     setIsTrading(false);

//     if (res.error) {
//       openModal(t("tradeFailed"), res.error, "error");
//     } else {
//       openModal(
//         t("tradeSuccessful"), 
//         t("tradeSuccessDesc", { 
//           type: tradeType, 
//           qty, 
//           base: baseAsset, 
//           symbol: currencySymbol, 
//           price: visualPrice.toFixed(2) 
//         }), 
//         "success"
//       );
      
//       setAmount("");
//       setTakeProfit("");
//       setStopLoss("");
//       router.refresh(); 
//     }
//   };

//   const handleCloseTrade = (trade: any, markPrice: number, pnl: number) => {
//     const pnlLabel = pnl >= 0 ? `+${currencySymbol}${pnl.toFixed(2)}` : `-${currencySymbol}${Math.abs(pnl).toFixed(2)}`;
//     setConfirmClose({ trade, markPrice, pnl, pnlLabel });
//   };

//   const executeCloseTrade = async () => {
//     if (!confirmClose) return;
//     const { trade, markPrice } = confirmClose;
    
//     setClosingTradeId(trade._id);
//     setConfirmClose(null);

//     try {
//       const res = await closeTradeAction(trade._id, markPrice);
//       if (res.error) {
//         openModal(t("closeFailed"), res.error, "error");
//       } else {
//         const finalPnl = res.pnl || 0;
//         openModal(
//           t("positionClosed"), 
//           t("realizedPnl", { amount: `${finalPnl >= 0 ? "+" : ""}${currencySymbol}${finalPnl.toFixed(2)}` }), 
//           finalPnl >= 0 ? "success" : "info"
//         );
//         router.refresh();
//       }
//     } catch (error: any) {
//       openModal(t("closeError"), error.message || t("closeErrorDesc"), "error");
//     } finally {
//       setClosingTradeId(null);
//     }
//   };

//   if (!mounted) return null;

//   const usdBalance = (realBalances.find((b: any) => b.assetId === "USD")?.cachedBalance || 0) / 100;
//   const userAccountIds = new Set(realBalances.map((b: any) => b._id));

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 w-full overflow-x-hidden">
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         <motion.div id="tour-dash-balance" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden">
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
//           {/* 👇 FIXED: Passes the current pair and the modal opener */}
//           <FavorablePairsCard 
//             dbAssets={dbAssets} 
//             baseAsset={baseAsset} 
//             quoteAsset={quoteAsset} 
//             onSelectPair={() => setIsPairModalOpen(true)}
//           />
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

//           <motion.div id="tour-dash-positions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Activity size={18} className="text-lime-500" /> {t("activePositions")}
//               </h3>
//               <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewTerminal")}</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               {realTrades.length === 0 ? (
//                 <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
//                   {t("noPositions")}
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
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-center">{t("action")}</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-lime-500/10">
//                     {realTrades.map((pos: any) => {
//                       const { markPrice, pnl } = calculatePnl(pos);
//                       const isProfit = pnl >= 0;
//                       const isClosing = closingTradeId === pos._id;
                      
//                       return (
//                         <tr key={pos._id} className="hover:bg-lime-500/5 transition-colors">
//                           <td className="px-3 sm:px-4 py-3 cursor-pointer" onClick={() => router.push(`/terminal?pair=${pos.pair}&tradeId=${pos._id}`)}>
//                             <div className="flex items-center gap-2">
//                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.side === "buy" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.side === "buy" ? t("long") : t("short")}</span>
//                               <span className="font-bold text-lime-950 dark:text-white">{pos.pair}</span>
//                             </div>
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.amount} {pos.baseAsset}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{currencySymbol}{pos.entryPrice.toLocaleString()}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{currencySymbol}{markPrice.toFixed(2)}</td>
//                           <td className="px-3 sm:px-4 py-3 flex justify-center">
//                             <TradeSparkline trend={marketBlock.trend} />
//                           </td>
//                           <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${isProfit ? "text-green-500" : "text-red-500"}`}>
//                             {isProfit ? "+" : ""}{currencySymbol}{pnl.toFixed(2)}
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 text-center">
//                             <button
//                               onClick={() => handleCloseTrade(pos, markPrice, pnl)}
//                               disabled={isClosing}
//                               className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 mx-auto disabled:opacity-50 ${
//                                 isProfit 
//                                   ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" 
//                                   : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
//                               }`}
//                             >
//                               {isClosing ? (
//                                 <Loader2 size={12} className="animate-spin" />
//                               ) : (
//                                 t("closePosition")
//                               )}
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
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
//               {realActivity.length === 0 ? (
//                 <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
//                   {t("noActivity")}
//                 </div>
//               ) : (
//                 <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                   <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                     <tr>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("type")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("ref")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("amount")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("status")}</th>
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
//                         <tr 
//                           key={tx._id} 
//                           // 👇 ADD THIS ONCLICK
//                           onClick={() => {
//                             if (tx.kind === "trade" && tx.refId) {
//                               // We strip "trade_" from the refId to get the actual MongoDB ID
//                               const actualTradeId = tx.refId.replace("trade_", "");
//                               router.push(`/terminal?tradeId=${actualTradeId}&pair=${tx.assetId}-USD`);
//                             }
//                           }}
//                           className={`transition-colors ${tx.kind === "trade" ? "hover:bg-lime-500/5 cursor-pointer" : ""}`}
//                         >
//                           <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white capitalize">{tx.kind.replace("_", " ")}</td>
//                           {/* <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white capitalize">{tx.kind.replace("_", " ")}</td> */}
//                           <td className="px-3 sm:px-4 py-3 font-mono text-xs text-lime-800/50 dark:text-lime-200/40">{tx.refId.slice(0, 10)}...</td>
//                           <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${isCredit ? "text-green-500" : "text-red-500"}`}>
//                             {isCredit ? "+" : "-"}{currencySymbol}{amountStr} {assetStr}
//                           </td>
//                           <td className="px-3 sm:px-4 py-3">
//                             <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-green-500/10 text-green-500">
//                               {t("completed")}
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
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: "conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)" }}>
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
//           <motion.div id="tour-dash-quicktrade" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">{t("quickTrade")}</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "buy" ? "bg-green-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("buy")}</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "sell" ? "bg-red-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("sell")}</button>
//             </div>

//             <div className="space-y-3 mb-6">
//               {/* 👇 FIXED: Buttons instead of Links, opening the Modal */}
//               <div className="flex items-center gap-2">
//                 <button 
//                   onClick={() => setIsPairModalOpen(true)}
//                   className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
//                 >
//                   <span className={`text-sm font-bold transition-colors ${baseAsset ? "text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400" : "text-lime-800/50 dark:text-lime-200/30"}`}>
//                     {baseAsset || t("selectBase")}
//                   </span>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </button>
//                 <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>
//                 <button 
//                   onClick={() => setIsPairModalOpen(true)}
//                   className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
//                 >
//                   <span className={`text-sm font-bold transition-colors ${quoteAsset ? "text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400" : "text-lime-800/50 dark:text-lime-200/30"}`}>
//                     {quoteAsset || t("selectQuote")}
//                   </span>
//                   <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                 </button>
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
//                 disabled={isTrading || !amount || parseFloat(amount.replace(/,/g, "")) <= 0 || !baseAsset || !quoteAsset} 
//                 className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === "buy" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}
//               >
//                 {isTrading ? t("processing") : t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
//               </Button>
//             </KycGate>
//           </motion.div>

//           <motion.div id="tour-dash-marketwatch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> {t("marketWatch")}
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {dbAssets.slice(0, 5).map((market: any) => {
//                 const livePrice = calculateSimulatedPrice(market.basePrice, marketBlock);
//                 const percentChange = livePrice === market.basePrice 
//                   ? "0%" 
//                   : `${((livePrice - market.basePrice) / market.basePrice * 100).toFixed(2)}%`;
//                 const isPositive = livePrice >= market.basePrice;
                
//                 return (
//                   <div key={market._id} onClick={() => router.push(`/terminal?pair=${market.symbol}-USD`)} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                         {market.symbol.charAt(0)}
//                       </div>
//                       <div>
//                         <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}/USD</p>
//                         <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">
//                         ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                       <p className={`text-xs font-bold flex items-center justify-end ${isPositive ? "text-green-500" : "text-red-500"}`}>
//                         {isPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} 
//                         {isPositive ? "+" : ""}{percentChange}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })}
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
//               {news && news.length > 0 ? (
//                 news.map((item, i) => (
//                   <div key={i} className="group cursor-pointer">
//                     <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">{item.time} • {item.source}</p>
//                     <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">{item.title}</h4>
//                   </div>
//                 ))
//               ) : (
//                 <p className="text-xs text-lime-800/60 dark:text-lime-200/50 font-medium">
//                   {t("noNews")}
//                 </p>
//               )}
//             </div>
//           </motion.div>

//         </div>
//       </div>

//       {/* 👇 NEW: PAIR SELECTION MODAL */}
//       <PairSelectionModal
//         isOpen={isPairModalOpen}
//         onClose={() => setIsPairModalOpen(false)}
//         onSave={(base, quote) => {
//           setBaseAsset(base);
//           setQuoteAsset(quote);
//         }}
//         dbAssets={dbAssets}
//         initialBase={baseAsset}
//         initialQuote={quoteAsset}
//       />

//       {/* CUSTOM CONFIRM MODAL */}
//       <AnimatePresence>
//         {confirmClose && (
//           <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 20 }}
//               className="relative w-full max-w-sm bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4"
//             >
//               <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
//                 confirmClose.pnl >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
//               }`}>
//                 <AlertTriangle size={32} />
//               </div>
//               <h3 className="text-lg font-bold text-lime-950 dark:text-white">
//                 {t("confirmCloseTitle")}
//               </h3>
//               <p className="text-sm text-lime-800/70 dark:text-lime-200/60 font-medium">
//                 {t("confirmCloseDesc", { 
//                   side: confirmClose.trade.side === "buy" ? t("long") : t("short"), 
//                   pair: confirmClose.trade.pair 
//                 })}
//               </p>
//               <div className="w-full bg-lime-50/50 dark:bg-black/40 rounded-xl p-3 space-y-1 text-xs font-mono">
//                 <div className="flex justify-between">
//                   <span className="text-lime-800/60 dark:text-lime-200/50">{t("exitPrice")}</span>
//                   <span className="text-lime-950 dark:text-white font-bold">{currencySymbol}{confirmClose.markPrice.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-lime-800/60 dark:text-lime-200/50">{t("estimatedPnl")}</span>
//                   <span className={`font-bold ${confirmClose.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{confirmClose.pnlLabel}</span>
//                 </div>
//               </div>
//               <div className="flex gap-3 w-full mt-2">
//                 <button 
//                   onClick={() => setConfirmClose(null)} 
//                   className="flex-1 py-2.5 bg-gray-200 dark:bg-[#121A14] text-lime-950 dark:text-white font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors"
//                 >
//                   {t("cancel")}
//                 </button>
//                 <button 
//                   onClick={executeCloseTrade} 
//                   className={`flex-1 py-2.5 text-white font-bold rounded-xl transition-colors shadow-lg ${
//                     confirmClose.pnl >= 0 ? "bg-green-500 hover:bg-green-600 shadow-green-500/20" : "bg-red-500 hover:bg-red-600 shadow-red-500/20"
//                   }`}
//                 >
//                   {t("closePosition")}
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }


// // app/dashboard/DashboardClient.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import Link from "next/link";
// import { useTranslations } from "next-intl"; 
// import { 
//   TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck, Flame, 
//   Newspaper, ChevronRight, Award, Zap, ArrowDown, ArrowUp, Wallet, ChevronDown,
//   Loader2, AlertTriangle
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { useTour } from "@/components/providers/TourProvider"; 
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";
// import { executeTradeAction, closeTradeAction } from "@/app/actions/trade";
// import { getMarketSettings } from "@/app/actions/admin-market";
// import { calculateSimulatedPrice, getActiveBlock } from "@/lib/simulated-price"; 

// const formatNumber = (value: string) => {
//   const cleanValue = value.replace(/[^0-9.]/g, "");
//   const parts = cleanValue.split(".");
//   parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//   return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
// };

// function TradeSparkline({ trend }: { trend: "bullish" | "bearish" | "consolidate" }) {
//   let color = "#10b981"; 
//   let path = "M 0 20 Q 10 15, 20 25 T 40 20 T 60 25 Q 70 20 80 25 T 100 20"; 

//   if (trend === "bullish") { 
//     color = "#3b82f6"; 
//     path = "M 0 30 Q 15 25, 20 20 T 40 10 T 60 5"; 
//   } else if (trend === "bearish") { 
//     color = "#ef4444"; 
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
//   news = [], 
// }: {
//   tier: number;
//   displayName: string;
//   userAvatar: string;
//   currencySymbol?: string;
//   dbAssets?: any[];
//   realBalances?: any[];
//   realTrades?: any[];
//   realActivity?: any[];
//   news?: Array<{ time: string; title: string; source: string }>;
// }) {
//   const t = useTranslations("Dashboard"); 
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { openModal } = useDevModal();
//   const { setSteps } = useTour();
  
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");
//   const [isTrading, setIsTrading] = useState(false); 
//   const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  
//   const [confirmClose, setConfirmClose] = useState<{
//     trade: any;
//     markPrice: number;
//     pnl: number;
//     pnlLabel: string;
//   } | null>(null);

//   const [marketBlock, setMarketBlock] = useState<{
//     trend: "bullish" | "bearish" | "consolidate";
//     intensity: number;
//   }>({ trend: "consolidate", intensity: 5 });

//   const [amount, setAmount] = useState("");
//   const [takeProfit, setTakeProfit] = useState("");
//   const [stopLoss, setStopLoss] = useState("");

//   const pairParam = searchParams.get("pair");
//   const [baseAsset, setBaseAsset] = useState("BTC");
//   const [quoteAsset, setQuoteAsset] = useState("USD");

//   useEffect(() => {
//     setSteps([
//       { id: "tour-dash-balance", title: t("tour.balanceTitle"), text: t("tour.balanceText") },
//       { id: "tour-dash-positions", title: t("tour.positionsTitle"), text: t("tour.positionsText") },
//       { id: "tour-dash-quicktrade", title: t("tour.quicktradeTitle"), text: t("tour.quicktradeText") },
//       { id: "tour-dash-marketwatch", title: t("tour.marketwatchTitle"), text: t("tour.marketwatchText") }
//     ]);
//     return () => setSteps([]);
//   }, [setSteps, t]);

//   useEffect(() => {
//     setMounted(true);
//     if (pairParam) {
//       const [b, q] = pairParam.split("-");
//       setBaseAsset(b);
//       setQuoteAsset(q || "USD");
//     }
//   }, [pairParam]);

//   useEffect(() => {
//     async function fetchSettings() {
//       try {
//         const settings = await getMarketSettings();
//         if (settings) {
//           setMarketBlock(getActiveBlock(settings));
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchSettings();
//     const interval = setInterval(fetchSettings, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const calculatePnl = (trade: any) => {
//     const asset = dbAssets.find((a: any) => a.symbol === trade.baseAsset);
//     const basePrice = asset ? asset.basePrice : trade.entryPrice;
//     const markPrice = calculateSimulatedPrice(basePrice, marketBlock); 
//     const priceDiff = markPrice - trade.entryPrice;
//     const pnl = trade.side === "buy" ? priceDiff * trade.amount : -priceDiff * trade.amount;
//     return { markPrice, pnl };
//   };

//   const executeTrade = async () => {
//     const rawAmount = amount.replace(/,/g, "");
//     const qty = parseFloat(rawAmount);

//     if (!qty || qty <= 0) {
//       openModal(t("invalidAmountTitle"), t("invalidAmountDesc"), "warning");
//       return;
//     }

//     const selectedAsset = dbAssets.find((a: any) => a.symbol === baseAsset);
//     if (tier === 1 && selectedAsset?.category === "memes") {
//       openModal(t("tradeFailed"), t("tier1MemeRestriction"), "error");
//       return;
//     }

//     setIsTrading(true);

//     const basePrice = selectedAsset ? selectedAsset.basePrice : 100;
//     const visualPrice = calculateSimulatedPrice(basePrice, marketBlock); 

//     const res = await executeTradeAction({
//       pair: `${baseAsset}-${quoteAsset}`,
//       side: tradeType,
//       price: visualPrice,
//       amount: qty,
//     });

//     setIsTrading(false);

//     if (res.error) {
//       openModal(t("tradeFailed"), res.error, "error");
//     } else {
//       openModal(
//         t("tradeSuccessful"), 
//         t("tradeSuccessDesc", { 
//           type: tradeType, 
//           qty, 
//           base: baseAsset, 
//           symbol: currencySymbol, 
//           price: visualPrice.toFixed(2) 
//         }), 
//         "success"
//       );
      
//       setAmount("");
//       setTakeProfit("");
//       setStopLoss("");

//       router.refresh(); 
//     }
//   };

//   const handleCloseTrade = (trade: any, markPrice: number, pnl: number) => {
//     const pnlLabel = pnl >= 0 ? `+${currencySymbol}${pnl.toFixed(2)}` : `-${currencySymbol}${Math.abs(pnl).toFixed(2)}`;
//     setConfirmClose({ trade, markPrice, pnl, pnlLabel });
//   };

//   const executeCloseTrade = async () => {
//     if (!confirmClose) return;
//     const { trade, markPrice } = confirmClose;
    
//     setClosingTradeId(trade._id);
//     setConfirmClose(null);

//     try {
//       const res = await closeTradeAction(trade._id, markPrice);
//       if (res.error) {
//         openModal(t("closeFailed"), res.error, "error");
//       } else {
//         const finalPnl = res.pnl || 0;
//         openModal(
//           t("positionClosed"), 
//           t("realizedPnl", { amount: `${finalPnl >= 0 ? "+" : ""}${currencySymbol}${finalPnl.toFixed(2)}` }), 
//           finalPnl >= 0 ? "success" : "info"
//         );
//         router.refresh();
//       }
//     } catch (error: any) {
//       openModal(t("closeError"), error.message || t("closeErrorDesc"), "error");
//     } finally {
//       setClosingTradeId(null);
//     }
//   };

//   if (!mounted) return null;

//   const usdBalance = (realBalances.find((b: any) => b.assetId === "USD")?.cachedBalance || 0) / 100;
//   const userAccountIds = new Set(realBalances.map((b: any) => b._id));

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 w-full overflow-x-hidden">
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         <motion.div id="tour-dash-balance" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden">
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
//           {/* 👇 FIXED: Passed dbAssets to Feeder-Cache */}
//           <FavorablePairsCard
//             dbAssets={dbAssets} 
//             baseAsset={baseAsset} 
//             quoteAsset={quoteAsset}
//           />
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

//           <motion.div id="tour-dash-positions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Activity size={18} className="text-lime-500" /> {t("activePositions")}
//               </h3>
//               <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewTerminal")}</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               {realTrades.length === 0 ? (
//                 <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
//                   {t("noPositions")}
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
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-center">{t("action")}</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-lime-500/10">
//                     {realTrades.map((pos: any) => {
//                       const { markPrice, pnl } = calculatePnl(pos);
//                       const isProfit = pnl >= 0;
//                       const isClosing = closingTradeId === pos._id;
                      
//                       return (
//                         <tr key={pos._id} className="hover:bg-lime-500/5 transition-colors">
//                           <td className="px-3 sm:px-4 py-3 cursor-pointer" onClick={() => router.push(`/terminal?pair=${pos.pair}&tradeId=${pos._id}`)}>
//                             <div className="flex items-center gap-2">
//                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.side === "buy" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.side === "buy" ? t("long") : t("short")}</span>
//                               <span className="font-bold text-lime-950 dark:text-white">{pos.pair}</span>
//                             </div>
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.amount} {pos.baseAsset}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{currencySymbol}{pos.entryPrice.toLocaleString()}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{currencySymbol}{markPrice.toFixed(2)}</td>
//                           <td className="px-3 sm:px-4 py-3 flex justify-center">
//                             <TradeSparkline trend={marketBlock.trend} />
//                           </td>
//                           <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${isProfit ? "text-green-500" : "text-red-500"}`}>
//                             {isProfit ? "+" : ""}{currencySymbol}{pnl.toFixed(2)}
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 text-center">
//                             <button
//                               onClick={() => handleCloseTrade(pos, markPrice, pnl)}
//                               disabled={isClosing}
//                               className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 mx-auto disabled:opacity-50 ${
//                                 isProfit 
//                                   ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" 
//                                   : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
//                               }`}
//                             >
//                               {isClosing ? (
//                                 <Loader2 size={12} className="animate-spin" />
//                               ) : (
//                                 t("closePosition")
//                               )}
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
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
//               {realActivity.length === 0 ? (
//                 <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
//                   {t("noActivity")}
//                 </div>
//               ) : (
//                 <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                   <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                     <tr>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("type")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("ref")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("amount")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("status")}</th>
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
//                           <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white capitalize">{tx.kind.replace("_", " ")}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-xs text-lime-800/50 dark:text-lime-200/40">{tx.refId.slice(0, 10)}...</td>
//                           <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${isCredit ? "text-green-500" : "text-red-500"}`}>
//                             {isCredit ? "+" : "-"}{currencySymbol}{amountStr} {assetStr}
//                           </td>
//                           <td className="px-3 sm:px-4 py-3">
//                             <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-green-500/10 text-green-500">
//                               {t("completed")}
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
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: "conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)" }}>
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
//           <motion.div id="tour-dash-quicktrade" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">{t("quickTrade")}</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "buy" ? "bg-green-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("buy")}</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "sell" ? "bg-red-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("sell")}</button>
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
//                 className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === "buy" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}
//               >
//                 {isTrading ? t("processing") : t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
//               </Button>
//             </KycGate>
//           </motion.div>

//           <motion.div id="tour-dash-marketwatch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> {t("marketWatch")}
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {dbAssets.slice(0, 5).map((market: any) => {
//                 const livePrice = calculateSimulatedPrice(market.basePrice, marketBlock);
//                 const percentChange = livePrice === market.basePrice 
//                   ? "0%" 
//                   : `${((livePrice - market.basePrice) / market.basePrice * 100).toFixed(2)}%`;
//                 const isPositive = livePrice >= market.basePrice;
                
//                 return (
//                   <div key={market._id} onClick={() => router.push(`/terminal?pair=${market.symbol}-USD`)} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                         {market.symbol.charAt(0)}
//                       </div>
//                       <div>
//                         <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}/USD</p>
//                         <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">
//                         ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                       <p className={`text-xs font-bold flex items-center justify-end ${isPositive ? "text-green-500" : "text-red-500"}`}>
//                         {isPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} 
//                         {isPositive ? "+" : ""}{percentChange}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })}
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
//               {news && news.length > 0 ? (
//                 news.map((item, i) => (
//                   <div key={i} className="group cursor-pointer">
//                     <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">{item.time} • {item.source}</p>
//                     <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">{item.title}</h4>
//                   </div>
//                 ))
//               ) : (
//                 <p className="text-xs text-lime-800/60 dark:text-lime-200/50 font-medium">
//                   {t("noNews")}
//                 </p>
//               )}
//             </div>
//           </motion.div>

//         </div>
//       </div>

//       {/* CUSTOM CONFIRM MODAL */}
//       <AnimatePresence>
//         {confirmClose && (
//           <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 20 }}
//               className="relative w-full max-w-sm bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4"
//             >
//               <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
//                 confirmClose.pnl >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
//               }`}>
//                 <AlertTriangle size={32} />
//               </div>
//               <h3 className="text-lg font-bold text-lime-950 dark:text-white">
//                 {t("confirmCloseTitle")}
//               </h3>
//               <p className="text-sm text-lime-800/70 dark:text-lime-200/60 font-medium">
//                 {t("confirmCloseDesc", { 
//                   side: confirmClose.trade.side === "buy" ? t("long") : t("short"), 
//                   pair: confirmClose.trade.pair 
//                 })}
//               </p>
//               <div className="w-full bg-lime-50/50 dark:bg-black/40 rounded-xl p-3 space-y-1 text-xs font-mono">
//                 <div className="flex justify-between">
//                   <span className="text-lime-800/60 dark:text-lime-200/50">{t("exitPrice")}</span>
//                   <span className="text-lime-950 dark:text-white font-bold">{currencySymbol}{confirmClose.markPrice.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-lime-800/60 dark:text-lime-200/50">{t("estimatedPnl")}</span>
//                   <span className={`font-bold ${confirmClose.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{confirmClose.pnlLabel}</span>
//                 </div>
//               </div>
//               <div className="flex gap-3 w-full mt-2">
//                 <button 
//                   onClick={() => setConfirmClose(null)} 
//                   className="flex-1 py-2.5 bg-gray-200 dark:bg-[#121A14] text-lime-950 dark:text-white font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors"
//                 >
//                   {t("cancel")}
//                 </button>
//                 <button 
//                   onClick={executeCloseTrade} 
//                   className={`flex-1 py-2.5 text-white font-bold rounded-xl transition-colors shadow-lg ${
//                     confirmClose.pnl >= 0 ? "bg-green-500 hover:bg-green-600 shadow-green-500/20" : "bg-red-500 hover:bg-red-600 shadow-red-500/20"
//                   }`}
//                 >
//                   {t("closePosition")}
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }


// // app/dashboard/DashboardClient.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import Link from "next/link";
// import { useTranslations } from "next-intl"; 
// import { 
//   TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck, Flame, 
//   Newspaper, ChevronRight, Award, Zap, ArrowDown, ArrowUp, Wallet, ChevronDown,
//   Loader2, AlertTriangle
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { useTour } from "@/components/providers/TourProvider"; 
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";
// import { executeTradeAction, closeTradeAction } from "@/app/actions/trade";
// import { getMarketSettings } from "@/app/actions/admin-market";
// import { calculateSimulatedPrice, getActiveBlock } from "@/lib/simulated-price"; 

// const formatNumber = (value: string) => {
//   const cleanValue = value.replace(/[^0-9.]/g, "");
//   const parts = cleanValue.split(".");
//   parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//   return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
// };

// function TradeSparkline({ trend }: { trend: "bullish" | "bearish" | "consolidate" }) {
//   let color = "#10b981"; 
//   let path = "M 0 20 Q 10 15, 20 25 T 40 20 T 60 25 Q 70 20 80 25 T 100 20"; 

//   if (trend === "bullish") { 
//     color = "#3b82f6"; 
//     path = "M 0 30 Q 15 25, 20 20 T 40 10 T 60 5"; 
//   } else if (trend === "bearish") { 
//     color = "#ef4444"; 
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
//   news = [], // 👈 MOCK DATA MOVED TO PROP
// }: {
//   tier: number;
//   displayName: string;
//   userAvatar: string;
//   currencySymbol?: string;
//   dbAssets?: any[];
//   realBalances?: any[];
//   realTrades?: any[];
//   realActivity?: any[];
//   news?: Array<{ time: string; title: string; source: string }>;
// }) {
//   const t = useTranslations("Dashboard"); 
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { openModal } = useDevModal();
//   const { setSteps } = useTour();
  
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");
//   const [isTrading, setIsTrading] = useState(false); 
//   const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  
//   // 👇 NEW: Custom confirm modal state
//   const [confirmClose, setConfirmClose] = useState<{
//     trade: any;
//     markPrice: number;
//     pnl: number;
//     pnlLabel: string;
//   } | null>(null);

//   const [marketBlock, setMarketBlock] = useState<{
//     trend: "bullish" | "bearish" | "consolidate";
//     intensity: number;
//   }>({ trend: "consolidate", intensity: 5 });

//   const [amount, setAmount] = useState("");
//   const [takeProfit, setTakeProfit] = useState("");
//   const [stopLoss, setStopLoss] = useState("");

//   const pairParam = searchParams.get("pair");
//   const [baseAsset, setBaseAsset] = useState("BTC");
//   const [quoteAsset, setQuoteAsset] = useState("USD");

//   // 👇 FIXED: i18n added and `t` in dependency array
//   useEffect(() => {
//     setSteps([
//       { id: "tour-dash-balance", title: t("tour.balanceTitle"), text: t("tour.balanceText") },
//       { id: "tour-dash-positions", title: t("tour.positionsTitle"), text: t("tour.positionsText") },
//       { id: "tour-dash-quicktrade", title: t("tour.quicktradeTitle"), text: t("tour.quicktradeText") },
//       { id: "tour-dash-marketwatch", title: t("tour.marketwatchTitle"), text: t("tour.marketwatchText") }
//     ]);
//     return () => setSteps([]);
//   }, [setSteps, t]);

//   useEffect(() => {
//     setMounted(true);
//     if (pairParam) {
//       const [b, q] = pairParam.split("-");
//       setBaseAsset(b);
//       setQuoteAsset(q || "USD");
//     }
//   }, [pairParam]);

//   useEffect(() => {
//     async function fetchSettings() {
//       try {
//         const settings = await getMarketSettings();
//         if (settings) {
//           setMarketBlock(getActiveBlock(settings));
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchSettings();
//     const interval = setInterval(fetchSettings, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const calculatePnl = (trade: any) => {
//     const asset = dbAssets.find((a: any) => a.symbol === trade.baseAsset);
//     const basePrice = asset ? asset.basePrice : trade.entryPrice;
//     const markPrice = calculateSimulatedPrice(basePrice, marketBlock); 
//     const priceDiff = markPrice - trade.entryPrice;
//     const pnl = trade.side === "buy" ? priceDiff * trade.amount : -priceDiff * trade.amount;
//     return { markPrice, pnl };
//   };

//   const executeTrade = async () => {
//     const rawAmount = amount.replace(/,/g, "");
//     const qty = parseFloat(rawAmount);

//     if (!qty || qty <= 0) {
//       openModal(t("invalidAmountTitle"), t("invalidAmountDesc"), "warning");
//       return;
//     }

//     // 👇 NEW: Tier 1 meme coin restriction
//     const selectedAsset = dbAssets.find((a: any) => a.symbol === baseAsset);
//     if (tier === 1 && selectedAsset?.category === "memes") {
//       openModal(t("tradeFailed"), t("tier1MemeRestriction"), "error");
//       return;
//     }

//     setIsTrading(true);

//     const basePrice = selectedAsset ? selectedAsset.basePrice : 100;
//     const visualPrice = calculateSimulatedPrice(basePrice, marketBlock); 

//     const res = await executeTradeAction({
//       pair: `${baseAsset}-${quoteAsset}`,
//       side: tradeType,
//       price: visualPrice,
//       amount: qty,
//     });

//     setIsTrading(false);

//     if (res.error) {
//       openModal(t("tradeFailed"), res.error, "error");
//     } else {
//       // 👇 FIXED: Translation key for success desc
//       openModal(
//         t("tradeSuccessful"), 
//         t("tradeSuccessDesc", { 
//           type: tradeType, 
//           qty, 
//           base: baseAsset, 
//           symbol: currencySymbol, 
//           price: visualPrice.toFixed(2) 
//         }), 
//         "success"
//       );
      
//       setAmount("");
//       setTakeProfit("");
//       setStopLoss("");

//       router.refresh(); 
//     }
//   };

//   // 👇 FIXED: Now opens custom modal
//   const handleCloseTrade = (trade: any, markPrice: number, pnl: number) => {
//     const pnlLabel = pnl >= 0 ? `+${currencySymbol}${pnl.toFixed(2)}` : `-${currencySymbol}${Math.abs(pnl).toFixed(2)}`;
//     setConfirmClose({ trade, markPrice, pnl, pnlLabel });
//   };

//   // 👇 NEW: Executes after confirmation
//   const executeCloseTrade = async () => {
//     if (!confirmClose) return;
//     const { trade, markPrice } = confirmClose;
    
//     setClosingTradeId(trade._id);
//     setConfirmClose(null);

//     try {
//       const res = await closeTradeAction(trade._id, markPrice);
//       if (res.error) {
//         openModal(t("closeFailed"), res.error, "error");
//       } else {
//         const finalPnl = res.pnl || 0;
//         openModal(
//           t("positionClosed"), 
//           t("realizedPnl", { amount: `${finalPnl >= 0 ? "+" : ""}${currencySymbol}${finalPnl.toFixed(2)}` }), 
//           finalPnl >= 0 ? "success" : "info"
//         );
//         router.refresh();
//       }
//     } catch (error: any) {
//       openModal(t("closeError"), error.message || t("closeErrorDesc"), "error");
//     } finally {
//       setClosingTradeId(null);
//     }
//   };

//   if (!mounted) return null;

//   // 👇 FIXED: Cleaner null safety
//   const usdBalance = (realBalances.find((b: any) => b.assetId === "USD")?.cachedBalance || 0) / 100;
//   const userAccountIds = new Set(realBalances.map((b: any) => b._id));

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 w-full overflow-x-hidden">
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         <motion.div id="tour-dash-balance" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden">
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

//           <motion.div id="tour-dash-positions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Activity size={18} className="text-lime-500" /> {t("activePositions")}
//               </h3>
//               <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewTerminal")}</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               {realTrades.length === 0 ? (
//                 <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
//                   {t("noPositions")}
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
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-center">{t("action")}</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-lime-500/10">
//                     {realTrades.map((pos: any) => {
//                       const { markPrice, pnl } = calculatePnl(pos);
//                       const isProfit = pnl >= 0;
//                       const isClosing = closingTradeId === pos._id;
                      
//                       return (
//                         <tr key={pos._id} className="hover:bg-lime-500/5 transition-colors">
//                           <td className="px-3 sm:px-4 py-3 cursor-pointer" onClick={() => router.push(`/terminal?pair=${pos.pair}&tradeId=${pos._id}`)}>
//                             <div className="flex items-center gap-2">
//                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.side === "buy" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.side === "buy" ? t("long") : t("short")}</span>
//                               <span className="font-bold text-lime-950 dark:text-white">{pos.pair}</span>
//                             </div>
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.amount} {pos.baseAsset}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{currencySymbol}{pos.entryPrice.toLocaleString()}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{currencySymbol}{markPrice.toFixed(2)}</td>
//                           <td className="px-3 sm:px-4 py-3 flex justify-center">
//                             <TradeSparkline trend={marketBlock.trend} />
//                           </td>
//                           <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${isProfit ? "text-green-500" : "text-red-500"}`}>
//                             {isProfit ? "+" : ""}{currencySymbol}{pnl.toFixed(2)}
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 text-center">
//                             <button
//                               onClick={() => handleCloseTrade(pos, markPrice, pnl)}
//                               disabled={isClosing}
//                               className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 mx-auto disabled:opacity-50 ${
//                                 isProfit 
//                                   ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" 
//                                   : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
//                               }`}
//                             >
//                               {isClosing ? (
//                                 <Loader2 size={12} className="animate-spin" />
//                               ) : (
//                                 t("closePosition") // 👈 FIXED: Translated
//                               )}
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
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
//               {realActivity.length === 0 ? (
//                 <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
//                   {t("noActivity")} {/* 👈 FIXED: Translated */}
//                 </div>
//               ) : (
//                 <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                   <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                     <tr>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("type")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("ref")}</th> {/* 👈 FIXED: Translated */}
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("amount")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("status")}</th>
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
//                           <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white capitalize">{tx.kind.replace("_", " ")}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-xs text-lime-800/50 dark:text-lime-200/40">{tx.refId.slice(0, 10)}...</td>
//                           <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${isCredit ? "text-green-500" : "text-red-500"}`}>
//                             {isCredit ? "+" : "-"}{currencySymbol}{amountStr} {assetStr}
//                           </td>
//                           <td className="px-3 sm:px-4 py-3">
//                             <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-green-500/10 text-green-500">
//                               {t("completed")}
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
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: "conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)" }}>
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
//           <motion.div id="tour-dash-quicktrade" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">{t("quickTrade")}</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "buy" ? "bg-green-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("buy")}</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "sell" ? "bg-red-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("sell")}</button>
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
//                 className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === "buy" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}
//               >
//                 {isTrading ? t("processing") : t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
//               </Button>
//             </KycGate>
//           </motion.div>

//           <motion.div id="tour-dash-marketwatch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> {t("marketWatch")}
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {dbAssets.slice(0, 5).map((market: any) => {
//                 const livePrice = calculateSimulatedPrice(market.basePrice, marketBlock);
//                 const percentChange = livePrice === market.basePrice 
//                   ? "0%" 
//                   : `${((livePrice - market.basePrice) / market.basePrice * 100).toFixed(2)}%`;
//                 const isPositive = livePrice >= market.basePrice;
                
//                 return (
//                   <div key={market._id} onClick={() => router.push(`/terminal?pair=${market.symbol}-USD`)} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                         {market.symbol.charAt(0)}
//                       </div>
//                       <div>
//                         <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}/USD</p>
//                         <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">
//                         ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                       <p className={`text-xs font-bold flex items-center justify-end ${isPositive ? "text-green-500" : "text-red-500"}`}>
//                         {isPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} 
//                         {isPositive ? "+" : ""}{percentChange}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })}
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

//           {/* 👇 MOCK DATA REPLACED WITH PROP */}
//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
//               <Newspaper size={18} className="text-blue-500" /> {t("marketNews")}
//             </h3>
//             <div className="space-y-4">
//               {news && news.length > 0 ? (
//                 news.map((item, i) => (
//                   <div key={i} className="group cursor-pointer">
//                     <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">{item.time} • {item.source}</p>
//                     <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">{item.title}</h4>
//                   </div>
//                 ))
//               ) : (
//                 <p className="text-xs text-lime-800/60 dark:text-lime-200/50 font-medium">
//                   {t("noNews")}
//                 </p>
//               )}
//             </div>
//           </motion.div>

//         </div>
//       </div>

//       {/* 👇 NEW: CUSTOM CONFIRM MODAL */}
//       <AnimatePresence>
//         {confirmClose && (
//           <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 20 }}
//               className="relative w-full max-w-sm bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4"
//             >
//               <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
//                 confirmClose.pnl >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
//               }`}>
//                 <AlertTriangle size={32} />
//               </div>
//               <h3 className="text-lg font-bold text-lime-950 dark:text-white">
//                 {t("confirmCloseTitle")}
//               </h3>
//               <p className="text-sm text-lime-800/70 dark:text-lime-200/60 font-medium">
//                 {t("confirmCloseDesc", { 
//                   side: confirmClose.trade.side === "buy" ? t("long") : t("short"), 
//                   pair: confirmClose.trade.pair 
//                 })}
//               </p>
//               <div className="w-full bg-lime-50/50 dark:bg-black/40 rounded-xl p-3 space-y-1 text-xs font-mono">
//                 <div className="flex justify-between">
//                   <span className="text-lime-800/60 dark:text-lime-200/50">{t("exitPrice")}</span>
//                   <span className="text-lime-950 dark:text-white font-bold">{currencySymbol}{confirmClose.markPrice.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-lime-800/60 dark:text-lime-200/50">{t("estimatedPnl")}</span>
//                   <span className={`font-bold ${confirmClose.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{confirmClose.pnlLabel}</span>
//                 </div>
//               </div>
//               <div className="flex gap-3 w-full mt-2">
//                 <button 
//                   onClick={() => setConfirmClose(null)} 
//                   className="flex-1 py-2.5 bg-gray-200 dark:bg-[#121A14] text-lime-950 dark:text-white font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-[#1a261d] transition-colors"
//                 >
//                   {t("cancel")}
//                 </button>
//                 <button 
//                   onClick={executeCloseTrade} 
//                   className={`flex-1 py-2.5 text-white font-bold rounded-xl transition-colors shadow-lg ${
//                     confirmClose.pnl >= 0 ? "bg-green-500 hover:bg-green-600 shadow-green-500/20" : "bg-red-500 hover:bg-red-600 shadow-red-500/20"
//                   }`}
//                 >
//                   {t("closePosition")}
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
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
//   Newspaper, ChevronRight, Award, Zap, ArrowDown, ArrowUp, Wallet, ChevronDown,
//   Loader2
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { useTour } from "@/components/providers/TourProvider"; 
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";
// import { executeTradeAction, closeTradeAction } from "@/app/actions/trade";
// import { getMarketSettings } from "@/app/actions/admin-market";
// import { calculateSimulatedPrice, getActiveBlock } from "@/lib/simulated-price"; 

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

// function TradeSparkline({ trend }: { trend: "bullish" | "bearish" | "consolidate" }) {
//   let color = "#10b981"; 
//   let path = "M 0 20 Q 10 15, 20 25 T 40 20 T 60 25 Q 70 20 80 25 T 100 20"; 

//   if (trend === "bullish") { 
//     color = "#3b82f6"; 
//     path = "M 0 30 Q 15 25, 20 20 T 40 10 T 60 5"; 
//   } else if (trend === "bearish") { 
//     color = "#ef4444"; 
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
//   const { setSteps } = useTour();
  
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");
//   const [isTrading, setIsTrading] = useState(false); 
//   const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  
//   const [marketBlock, setMarketBlock] = useState<{
//     trend: "bullish" | "bearish" | "consolidate";
//     intensity: number;
//   }>({ trend: "consolidate", intensity: 5 });

//   const [amount, setAmount] = useState("");
//   const [takeProfit, setTakeProfit] = useState("");
//   const [stopLoss, setStopLoss] = useState("");

//   const pairParam = searchParams.get("pair");
//   const [baseAsset, setBaseAsset] = useState("BTC");
//   const [quoteAsset, setQuoteAsset] = useState("USD");

//   useEffect(() => {
//     setSteps([
//       { id: "tour-dash-balance", title: "Wallet Balance", text: "This is your real-time available balance. Click deposit to add funds." },
//       { id: "tour-dash-positions", title: "Active Positions", text: "Monitor your open trades here. You can close them and realize PnL instantly." },
//       { id: "tour-dash-quicktrade", title: "Quick Trade", text: "Open a new position quickly with market or limit orders." },
//       { id: "tour-dash-marketwatch", title: "Market Watch", text: "Keep an eye on the most traded pairs and their current prices." }
//     ]);
//     return () => setSteps([]);
//   }, [setSteps]);

//   useEffect(() => {
//     setMounted(true);
//     if (pairParam) {
//       const [b, q] = pairParam.split("-");
//       setBaseAsset(b);
//       setQuoteAsset(q || "USD");
//     }
//   }, [pairParam]);

//   useEffect(() => {
//     async function fetchSettings() {
//       try {
//         const settings = await getMarketSettings();
//         if (settings) {
//           setMarketBlock(getActiveBlock(settings));
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchSettings();
//     const interval = setInterval(fetchSettings, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const calculatePnl = (trade: any) => {
//     const asset = dbAssets.find((a: any) => a.symbol === trade.baseAsset);
//     const basePrice = asset ? asset.basePrice : trade.entryPrice;
//     const markPrice = calculateSimulatedPrice(basePrice, marketBlock); 
//     const priceDiff = markPrice - trade.entryPrice;
//     const pnl = trade.side === "buy" ? priceDiff * trade.amount : -priceDiff * trade.amount;
//     return { markPrice, pnl };
//   };

//   const executeTrade = async () => {
//     const rawAmount = amount.replace(/,/g, "");
//     const qty = parseFloat(rawAmount);

//     if (!qty || qty <= 0) {
//       openModal(t("invalidAmountTitle"), t("invalidAmountDesc"), "warning");
//       return;
//     }

//     setIsTrading(true);

//     const asset = dbAssets.find((a: any) => a.symbol === baseAsset);
//     const basePrice = asset ? asset.basePrice : 100;
//     const visualPrice = calculateSimulatedPrice(basePrice, marketBlock); 

//     const res = await executeTradeAction({
//       pair: `${baseAsset}-${quoteAsset}`,
//       side: tradeType,
//       price: visualPrice,
//       amount: qty,
//     });

//     setIsTrading(false);

//     if (res.error) {
//       openModal(t("tradeFailed"), res.error, "error");
//     } else {
//       openModal(
//         t("tradeSuccessful"), 
//         `Your ${tradeType} order for ${qty} ${baseAsset} was filled at ${currencySymbol}${visualPrice.toFixed(2)}.`, 
//         "success"
//       );
      
//       setAmount("");
//       setTakeProfit("");
//       setStopLoss("");

//       router.refresh(); 
//     }
//   };

//   const handleCloseTrade = async (trade: any, markPrice: number, pnl: number) => {
//     const pnlLabel = pnl >= 0 ? `+${currencySymbol}${pnl.toFixed(2)}` : `-${currencySymbol}${Math.abs(pnl).toFixed(2)}`;
    
//     if (!confirm(`Close ${trade.side === "buy" ? t("long") : t("short")} ${trade.pair}?\n\nExit Price: ${currencySymbol}${markPrice.toFixed(2)}\nEstimated PnL: ${pnlLabel}`)) {
//       return;
//     }

//     setClosingTradeId(trade._id);

//     try {
//       const res = await closeTradeAction(trade._id, markPrice);

//       if (res.error) {
//         openModal(t("closeFailed"), res.error, "error");
//       } else {
//         const finalPnl = res.pnl || 0;
//         openModal(
//           t("positionClosed"), 
//           t("realizedPnl", { amount: `${finalPnl >= 0 ? "+" : ""}${currencySymbol}${finalPnl.toFixed(2)}` }), 
//           finalPnl >= 0 ? "success" : "info"
//         );
//         router.refresh();
//       }
//     } catch (error: any) {
//       openModal(t("closeError"), error.message || "Failed to close position.", "error");
//     } finally {
//       setClosingTradeId(null);
//     }
//   };

//   if (!mounted) return null;

//   const usdBalance = realBalances.find((b: any) => b.assetId === "USD")?.cachedBalance / 100 || 0;
//   const userAccountIds = new Set(realBalances.map((b: any) => b._id));

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 w-full overflow-x-hidden">
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         <motion.div id="tour-dash-balance" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden">
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

//           <motion.div id="tour-dash-positions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//             <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Activity size={18} className="text-lime-500" /> {t("activePositions")}
//               </h3>
//               <Link href="/terminal" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewTerminal")}</Link>
//             </div>
//             <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//               {realTrades.length === 0 ? (
//                 <div className="p-8 text-center text-lime-800/60 dark:text-lime-200/50 text-sm font-medium">
//                   {t("noPositions")}
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
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-center">{t("action")}</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-lime-500/10">
//                     {realTrades.map((pos: any) => {
//                       const { markPrice, pnl } = calculatePnl(pos);
//                       const isProfit = pnl >= 0;
//                       const isClosing = closingTradeId === pos._id;
                      
//                       return (
//                         <tr key={pos._id} className="hover:bg-lime-500/5 transition-colors">
//                           <td className="px-3 sm:px-4 py-3 cursor-pointer" onClick={() => router.push(`/terminal?pair=${pos.pair}&tradeId=${pos._id}`)}>
//                             <div className="flex items-center gap-2">
//                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.side === "buy" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.side === "buy" ? t("long") : t("short")}</span>
//                               <span className="font-bold text-lime-950 dark:text-white">{pos.pair}</span>
//                             </div>
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.amount} {pos.baseAsset}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{currencySymbol}{pos.entryPrice.toLocaleString()}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{currencySymbol}{markPrice.toFixed(2)}</td>
//                           <td className="px-3 sm:px-4 py-3 flex justify-center">
//                             <TradeSparkline trend={marketBlock.trend} />
//                           </td>
//                           <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${isProfit ? "text-green-500" : "text-red-500"}`}>
//                             {isProfit ? "+" : ""}{currencySymbol}{pnl.toFixed(2)}
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 text-center">
//                             <button
//                               onClick={() => handleCloseTrade(pos, markPrice, pnl)}
//                               disabled={isClosing}
//                               className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 mx-auto disabled:opacity-50 ${
//                                 isProfit 
//                                   ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" 
//                                   : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
//                               }`}
//                             >
//                               {isClosing ? (
//                                 <Loader2 size={12} className="animate-spin" />
//                               ) : (
//                                 "Close Position"
//                               )}
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
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
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("status")}</th>
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
//                           <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white capitalize">{tx.kind.replace("_", " ")}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-xs text-lime-800/50 dark:text-lime-200/40">{tx.refId.slice(0, 10)}...</td>
//                           <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${isCredit ? "text-green-500" : "text-red-500"}`}>
//                             {isCredit ? "+" : "-"}{currencySymbol}{amountStr} {assetStr}
//                           </td>
//                           <td className="px-3 sm:px-4 py-3">
//                             <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-green-500/10 text-green-500">
//                               {t("completed")}
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
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: "conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)" }}>
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
//           <motion.div id="tour-dash-quicktrade" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">{t("quickTrade")}</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "buy" ? "bg-green-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("buy")}</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "sell" ? "bg-red-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("sell")}</button>
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
//                 className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === "buy" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}
//               >
//                 {isTrading ? t("processing") : t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
//               </Button>
//             </KycGate>
//           </motion.div>

//           <motion.div id="tour-dash-marketwatch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> {t("marketWatch")}
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {dbAssets.slice(0, 5).map((market: any) => {
//                 const livePrice = calculateSimulatedPrice(market.basePrice, marketBlock);
//                 const percentChange = livePrice === market.basePrice 
//                   ? "0%" 
//                   : `${((livePrice - market.basePrice) / market.basePrice * 100).toFixed(2)}%`;
//                 const isPositive = livePrice >= market.basePrice;
                
//                 return (
//                   <div key={market._id} onClick={() => router.push(`/terminal?pair=${market.symbol}-USD`)} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                         {market.symbol.charAt(0)}
//                       </div>
//                       <div>
//                         <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}/USD</p>
//                         <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">
//                         ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                       <p className={`text-xs font-bold flex items-center justify-end ${isPositive ? "text-green-500" : "text-red-500"}`}>
//                         {isPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} 
//                         {isPositive ? "+" : ""}{percentChange}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })}
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



// // components/features/TradingTerminal.tsx
// "use client";

// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Crosshair, PenTool, Minus, Trash2, ChevronDown, Search, ArrowUpRight,
//   Settings2, MoveUpRight, Square, AlignEndHorizontal, X, Clock, LayoutGrid,
//   History, Eye
// } from "lucide-react";
// import { executeTradeAction, saveDrawingAction, deleteDrawingAction, closeTradeAction } from "@/app/actions/trade";
// import { getMarketSettings } from "@/app/actions/admin-market";
// import { calculateSimulatedPrice, getActiveBlock } from "@/lib/simulated-price"; // 👈 Imported shared utility
// import { useTour } from "@/components/providers/TourProvider";

// export const COMMODITIES: Record<string, any> = {
//   CHR: { name: 'Charcoal', unit: 'bag', base: 42.50, region: 'Enugu', color: '#f59e0b' },
//   BLF: { name: 'Bitterleaf', unit: 'bundle', base: 18.20, region: 'Onitsha', color: '#10b981' },
//   SCN: { name: 'Scrap iron', unit: 'tonne', base: 285.00, region: 'Kano', color: '#78716c' },
//   ENO: { name: 'Condemned oil', unit: 'barrel', base: 62.40, region: 'P/H', color: '#1e293b' },
//   PLM: { name: 'Palm oil', unit: 'litre', base: 2.85, region: 'Benin', color: '#ea580c' },
//   GRI: { name: 'Garri', unit: 'kg', base: 1.45, region: 'Ibadan', color: '#ca8a04' },
// };

// const TIMEFRAMES: Record<string, { label: string, points: number, interval: number, vol: number }> = {
//   "1m":  { label: "1M", points: 200, interval: 60 * 1000, vol: 0.0005 },
//   "1h":  { label: "1H", points: 200, interval: 60 * 60 * 1000, vol: 0.002 },
//   "4h":  { label: "4H", points: 200, interval: 4 * 60 * 60 * 1000, vol: 0.005 },
//   "6h":  { label: "6H", points: 200, interval: 6 * 60 * 60 * 1000, vol: 0.008 },
//   "12h": { label: "12H", points: 200, interval: 12 * 60 * 60 * 1000, vol: 0.012 },
//   "24h": { label: "24H", points: 200, interval: 24 * 60 * 60 * 1000, vol: 0.018 },
//   "1w":  { label: "1W", points: 200, interval: 7 * 24 * 60 * 60 * 1000, vol: 0.03 },
//   "2w":  { label: "2W", points: 200, interval: 14 * 24 * 60 * 60 * 1000, vol: 0.04 },
//   "3w":  { label: "3W", points: 200, interval: 21 * 24 * 60 * 60 * 1000, vol: 0.05 },
//   "1M":  { label: "1M", points: 200, interval: 30 * 24 * 60 * 60 * 1000, vol: 0.06 },
//   "2M":  { label: "2M", points: 200, interval: 60 * 24 * 60 * 60 * 1000, vol: 0.08 },
//   "4M":  { label: "4M", points: 200, interval: 120 * 24 * 60 * 60 * 1000, vol: 0.12 },
//   "6M":  { label: "6M", points: 200, interval: 180 * 24 * 60 * 60 * 1000, vol: 0.15 },
//   "1y":  { label: "1Y", points: 200, interval: 365 * 24 * 60 * 60 * 1000, vol: 0.25 },
// };

// const getChartGridConfig = (tf: string) => {
//   if (["1m", "1h", "4h"].includes(tf)) return { gridInterval: 4, boundary: "day" };
//   if (["6h", "12h", "24h", "1w"].includes(tf)) return { gridInterval: 6, boundary: "month" };
//   return { gridInterval: 2, boundary: "year" };
// };

// export default function TradingTerminal({
//   coin,
//   quoteAssetSymbol,
//   positions = [],
//   onClosePosition,
//   initialTrades = [],
//   currencySymbol = "$",
//   availableQuotes = [],
//   dbAssets = [],
// }: {
//   coin?: any,
//   quoteAssetSymbol?: string,
//   positions?: any[],
//   onClosePosition?: (id: string) => void,
//   initialTrades?: any[],
//   currencySymbol?: string,
//   availableQuotes?: any[],
//   dbAssets?: any[],
// }) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { setSteps } = useTour();

//   const pairParam = searchParams.get("pair");
//   const tradeIdParam = searchParams.get("tradeId");

//   const [isMarketOpen, setIsMarketOpen] = useState(false);
//   const [timeframe, setTimeframe] = useState("1h");
//   const [marketBlock, setMarketBlock] = useState<any>(null); // 👈 State for Admin Settings

//   const [baseAsset, setBaseAsset] = useState(pairParam?.split("-")[0] || coin?.symbol?.toUpperCase() || "CHR");
//   const [quoteAsset, setQuoteAsset] = useState(pairParam?.split("-")[1] || quoteAssetSymbol || "USD");

//   const [isSelectingPair, setIsSelectingPair] = useState(false);
//   const [selectionStep, setSelectionStep] = useState<"base" | "quote">("base");
//   const [searchQuery, setSearchQuery] = useState("");

//   const [showToolsModal, setShowToolsModal] = useState(false);
//   const [showTimeframeModal, setShowTimeframeModal] = useState(false);

//   const [showHistoryModal, setShowHistoryModal] = useState(false);
//   const [historySearch, setHistorySearch] = useState("");
//   const [selectedHistoryTrade, setSelectedHistoryTrade] = useState<any>(null);

//   const [zoom, setZoom] = useState(1);
//   const [activeTool, setActiveTool] = useState<"cursor" | "line" | "hline" | "ray" | "rect" | "fib">("cursor");

//   const [drawings, setDrawings] = useState<any[]>([]);
//   const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([]);
//   const [activeTradeId, setActiveTradeId] = useState<string | null>(tradeIdParam);

//   const [mousePos, setMousePos] = useState<{ x: number, y: number, price: number, time: number } | null>(null);
//   const [pinnedInfo, setPinnedInfo] = useState<{ x: number, y: number, price: number, time: number } | null>(null);

//   const [trades, setTrades] = useState<any[]>(initialTrades);
//   const activeTradesList = coin ? positions : trades;

//   const chartContainerRef = useRef<HTMLDivElement>(null);
//   const svgRef = useRef<SVGSVGElement>(null);
//   const candlesRef = useRef<any[]>([]);

//   const activePairId = `${baseAsset}-${quoteAsset}`;

//   // Sync URL params (e.g. navigating from Dashboard to Terminal)
//   useEffect(() => {
//     if (pairParam) {
//       const [b, q] = pairParam.split("-");
//       if (b) setBaseAsset(b);
//       if (q) setQuoteAsset(q);
//     }
//     if (tradeIdParam) {
//       setActiveTradeId(tradeIdParam);
//       setShowHistoryModal(true);
//     }
//   }, [pairParam, tradeIdParam]);

//   // 👇 FETCH ADMIN MARKET SETTINGS EVERY 60 SECONDS
//   useEffect(() => {
//     async function fetchSettings() {
//       const settings = await getMarketSettings();
//       if (settings) {
//         setMarketBlock(getActiveBlock(settings));
//       }
//     }
    
//     fetchSettings();
//     const interval = setInterval(fetchSettings, 60000); 
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     setSteps([
//       { id: "tour-terminal-header", title: "Trading Pair", text: "This shows your active trading pair. Click it to open the market selector." },
//       { id: "tour-terminal-tools", title: "Drawing Tools", text: "Click here to access line, ray, fibonacci, and other technical analysis tools." },
//       { id: "tour-terminal-timeframe", title: "Timeframes", text: "Switch between 1-minute, 1-hour, daily, or weekly charts." },
//       { id: "tour-terminal-chart", title: "Live Chart", text: "This is where the price action happens. You can draw analysis and track live trends." },
//       { id: "tour-terminal-history", title: "Trade History", text: "View your past trades, check PnL, and manage open positions." }
//     ]);
//     return () => setSteps([]);
//   }, [setSteps]);

//   useEffect(() => {
//     const checkMarket = () => {
//       const now = new Date();
//       const day = now.getDay();
//       const hour = now.getHours();
//       const isWeekend = day === 0 || day === 6;
//       const isTradingHours = hour >= 9 && hour < 17;
//       setIsMarketOpen(!isWeekend && isTradingHours);
//     };
//     checkMarket();
//     const interval = setInterval(checkMarket, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     if (activeTradeId) {
//       const trade = activeTradesList.find(t => t._id === activeTradeId || t.id === activeTradeId);
//       if (trade) setDrawings(trade.drawings || []);
//     } else {
//       setDrawings([]);
//     }
//     setSelectedDrawingIds([]);
//   }, [activeTradeId, activeTradesList]);

//   useEffect(() => { if (coin) setBaseAsset(coin.symbol.toUpperCase()); }, [coin]);
//   useEffect(() => { if (quoteAssetSymbol) setQuoteAsset(quoteAssetSymbol); }, [quoteAssetSymbol]);

//   // Trend Color Logic (Synced with Dashboard Sparklines)
//   const getTrendColor = (data: any[]) => {
//     if (activeTradeId) {
//       const trade = activeTradesList.find(t => t._id === activeTradeId || t.id === activeTradeId);
//       if (trade && trade.status === "closed") return "#ef4444"; 
//     }

//     if (data.length < 5) return "#10b981"; 
    
//     const recent = data.slice(-15);
//     const highs = recent.map(c => c.h);
//     const lows = recent.map(c => c.l);
//     const currentClose = recent[recent.length - 1].c;
//     const prevHigh = Math.max(...highs.slice(0, -1));
//     const prevLow = Math.min(...lows.slice(0, -1));

//     if (activeTradeId) {
//        const trade = activeTradesList.find(t => t._id === activeTradeId || t.id === activeTradeId);
//        if (trade && currentClose < (trade.entryPrice || trade.entry)) return "#ef4444"; 
//     }

//     if (currentClose > prevHigh) return "#3b82f6"; 
//     if (currentClose < prevLow) return "#eab308"; 
//     return "#10b981"; 
//   };

//   // 👇 DYNAMIC CANDLE GENERATION WITH ADMIN OVERRIDE (Using Shared Utility)
//   const generateCandles = useCallback((pairId: string, tf: string) => {
//     const cfg = TIMEFRAMES[tf];
//     const basePrice = coin ? coin.current_price : (COMMODITIES[pairId.split("-")[0]]?.base || 1);

//     // Calculate current drift using the shared utility
//     let drift = 0;
//     if (marketBlock) {
//       const simulated = calculateSimulatedPrice(basePrice, marketBlock);
//       drift = (simulated / basePrice) - 1;
//     }

//     let seed = baseAsset.length * 100;
//     const candles = [];
//     let close = basePrice;

//     for (let i = 0; i < cfg.points; i++) {
//       const r1 = ((seed = (seed*9301+49297) % 233280) / 233280);
//       const open = close;
      
//       const noise = (r1 - 0.5) * cfg.vol * 2;
//       const bodyMove = noise + (drift * 0.01); // Scaled down for visual clarity
      
//       close = open * (1 + bodyMove);
//       const high = Math.max(open, close) * (1 + r1 * cfg.vol);
//       const low = Math.min(open, close) * (1 - r1 * cfg.vol);

//       candles.push({ t: Date.now() - (cfg.points - i) * cfg.interval, o: open, h: high, l: low, c: close });
//     }
//     return candles;
//   }, [coin, baseAsset, marketBlock]);

//   const renderChart = useCallback(() => {
//     const svg = svgRef.current;
//     const container = chartContainerRef.current;
//     if (!svg || !container) return;

//     const W = container.clientWidth;
//     const H = container.clientHeight;
//     if (W === 0 || H === 0) return;

//     const data = candlesRef.current;
//     if (data.length === 0) return;

//     const visibleCount = Math.max(10, Math.floor(data.length / zoom));
//     const visibleData = data.slice(-visibleCount);

//     let pMin = Math.min(...visibleData.map(c => c.l));
//     let pMax = Math.max(...visibleData.map(c => c.h));
//     const padP = (pMax - pMin) * 0.1 || 1;
//     pMin -= padP; pMax += padP;

//     const PAD_L = 10, PAD_R = 65, PAD_T = 20, PAD_B = 30;
//     const plotW = W - PAD_L - PAD_R;
//     const plotH = H - PAD_T - PAD_B;

//     const yForP = (p: number) => PAD_T + (1 - (p - pMin) / (pMax - pMin)) * plotH;

//     const tMin = visibleData[0].t;
//     const tMax = visibleData[visibleData.length - 1].t;
//     const xForT = (t: number) => PAD_L + ((t - tMin) / (tMax - tMin)) * plotW;

//     const parts = [];

//     for (let i = 0; i <= 5; i++) {
//       const p = pMin + (pMax - pMin) * (i / 5);
//       const y = yForP(p);
//       parts.push(`<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#333" stroke-width="1" stroke-dasharray="4 4"/>`);
//       parts.push(`<text x="${W - PAD_R + 10}" y="${y + 4}" fill="#888" font-size="10" font-family="monospace">${currencySymbol}${p.toFixed(p < 1 ? 6 : 2)}</text>`);
//     }

//     const { gridInterval, boundary } = getChartGridConfig(timeframe);

//     visibleData.forEach((c, i) => {
//       const x = xForT(c.t);
//       if (i % gridInterval === 0) {
//         parts.push(`<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${PAD_T + plotH}" stroke="#2a2a2a" stroke-width="1" stroke-dasharray="4 4"/>`);
//       }
//       if (i > 0) {
//         const prevC = visibleData[i - 1];
//         const d = new Date(c.t);
//         const pd = new Date(prevC.t);
//         let isBoundary = false;

//         if (boundary === "day" && d.getDate() !== pd.getDate()) isBoundary = true;
//         if (boundary === "month" && d.getMonth() !== pd.getMonth()) isBoundary = true;
//         if (boundary === "year" && d.getFullYear() !== pd.getFullYear()) isBoundary = true;

//         if (isBoundary) {
//           parts.push(`<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${PAD_T + plotH}" stroke="#555" stroke-width="1" />`);
//           const label = boundary === "year" ? d.getFullYear().toString() : boundary === "month" ? d.toLocaleString('default', { month: 'short' }) : `${d.getDate()}/${d.getMonth() + 1}`;
//           parts.push(`<text x="${x + 2}" y="${PAD_T + plotH + 15}" fill="#666" font-size="9" font-family="monospace">${label}</text>`);
//         }
//       }
//     });

//     const isLineMode = visibleData.length > 80 || (plotW / visibleData.length) < 4;
//     const trendColor = getTrendColor(visibleData);
//     const slotW = plotW / visibleData.length;

//     if (isLineMode) {
//       parts.push(`
//         <defs>
//           <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="0%" stop-color="${trendColor}" stop-opacity="0.5"/>
//             <stop offset="100%" stop-color="${trendColor}" stop-opacity="0"/>
//           </linearGradient>
//           <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
//             <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
//             <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
//           </filter>
//         </defs>
//       `);
//       let linePath = '';
//       visibleData.forEach((c, i) => {
//         const x = xForT(c.t);
//         const y = yForP(c.c);
//         if (i === 0) linePath += `M ${x} ${y}`;
//         else {
//           const prevX = xForT(visibleData[i - 1].t);
//           const prevY = yForP(visibleData[i - 1].c);
//           const cpX = (x + prevX) / 2;
//           linePath += ` C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`;
//         }
//       });
//       const areaPath = `${linePath} L ${xForT(visibleData[visibleData.length - 1].t)} ${PAD_T + plotH} L ${xForT(visibleData[0].t)} ${PAD_T + plotH} Z`;
//       parts.push(`<path d="${areaPath}" fill="url(#glowGrad)" />`);
//       parts.push(`<path d="${linePath}" fill="none" stroke="${trendColor}" stroke-width="2.5" filter="url(#glowFilter)" />`);
//     } else {
//       visibleData.forEach((c, i) => {
//         const cx = xForT(c.t);
//         const isBull = c.c >= c.o;
//         const color = isBull ? "#10b981" : "#ef4444";
//         parts.push(`<line x1="${cx}" y1="${yForP(c.h)}" x2="${cx}" y2="${yForP(c.l)}" stroke="${color}" stroke-width="1.5"/>`);
//         parts.push(`<rect x="${cx - slotW*0.35}" y="${Math.min(yForP(c.o), yForP(c.c))}" width="${slotW*0.7}" height="${Math.max(1, Math.abs(yForP(c.c) - yForP(c.o)))}" fill="${color}" rx="1"/>`);
//       });
//     }

//     drawings.forEach(d => {
//       const isSelected = selectedDrawingIds.includes(d.id);
//       const stroke = isSelected ? "#3b82f6" : "#eab308";
//       const fill = isSelected ? "rgba(59, 130, 246, 0.1)" : "rgba(234, 179, 8, 0.1)";

//       const x1 = xForT(d.start.t);
//       const y1 = yForP(d.start.p);
//       const x2 = xForT(d.end.t);
//       const y2 = yForP(d.end.p);

//       if (d.type === "line") {
//         parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
//       } else if (d.type === "hline") {
//         parts.push(`<line x1="${PAD_L}" y1="${y1}" x2="${W - PAD_R}" y2="${y1}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}" stroke-dasharray="5 5" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
//       } else if (d.type === "ray") {
//         const dx = x2 - x1;
//         const dy = y2 - y1;
//         const extX = W - PAD_R;
//         const extY = y1 + (dy / dx) * (extX - x1);
//         parts.push(`<line x1="${x1}" y1="${y1}" x2="${extX}" y2="${extY}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
//       } else if (d.type === "rect") {
//         const rx = Math.min(x1, x2);
//         const ry = Math.min(y1, y2);
//         const rw = Math.abs(x1 - x2);
//         const rh = Math.abs(y1 - y2);
//         parts.push(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${fill}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
//       } else if (d.type === "fib") {
//         const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
//         const top = Math.min(y1, y2);
//         const bottom = Math.max(y1, y2);
//         const height = bottom - top;
//         const left = Math.min(x1, x2);
//         const right = Math.max(x1, x2);

//         parts.push(`<line x1="${left}" y1="${top}" x2="${right}" y2="${top}" stroke="${stroke}" stroke-width="1" />`);
//         parts.push(`<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="${stroke}" stroke-width="1" />`);
//         parts.push(`<line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" stroke="${stroke}" stroke-width="1" opacity="0.5" />`);
//         parts.push(`<line x1="${right}" y1="${top}" x2="${right}" y2="${bottom}" stroke="${stroke}" stroke-width="1" opacity="0.5" />`);

//         levels.forEach(l => {
//           const ly = top + height * l;
//           parts.push(`<line x1="${left}" y1="${ly}" x2="${right}" y2="${ly}" stroke="${stroke}" stroke-width="${isSelected ? 2 : 1}" stroke-dasharray="3 3" pointer-events="stroke" cursor="pointer" data-id="${d.id}" />`);
//           parts.push(`<text x="${left + 4}" y="${ly - 4}" fill="${stroke}" font-size="9" font-family="monospace">${(l * 100).toFixed(1)}%</text>`);
//         });
//       }
//     });

//     const last = visibleData[visibleData.length - 1];
//     const lastY = yForP(last.c);
//     parts.push(`<line x1="${PAD_L}" y1="${lastY}" x2="${W - PAD_R}" y2="${lastY}" stroke="${trendColor}" stroke-width="1" stroke-dasharray="2 2"/>`);
//     parts.push(`<rect x="${W - PAD_R + 2}" y="${lastY - 9}" width="60" height="18" fill="${trendColor}" rx="3"/>`);
//     parts.push(`<text x="${W - PAD_R + 6}" y="${lastY + 4}" fill="#000" font-size="10" font-weight="bold" font-family="monospace">${currencySymbol}${last.c.toFixed(last.c < 1 ? 6 : 2)}</text>`);

//     svg.innerHTML = parts.join("");
//   }, [zoom, drawings, selectedDrawingIds, currencySymbol, timeframe]);

//   const [isDrawing, setIsDrawing] = useState(false);
//   const [startPos, setStartPos] = useState<{ x: number, y: number, t: number, p: number } | null>(null);

//   const getCoords = (e: React.MouseEvent) => {
//     const svg = svgRef.current;
//     if (!svg) return null;
//     const rect = svg.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     const container = chartContainerRef.current;
//     if (!container) return null;
//     const W = container.clientWidth;
//     const H = container.clientHeight;
//     const data = candlesRef.current;
//     const visibleCount = Math.max(10, Math.floor(data.length / zoom));
//     const visibleData = data.slice(-visibleCount);

//     let pMin = Math.min(...visibleData.map(c => c.l));
//     let pMax = Math.max(...visibleData.map(c => c.h));
//     const padP = (pMax - pMin) * 0.1 || 1;
//     pMin -= padP; pMax += padP;

//     const PAD_L = 10, PAD_R = 65, PAD_T = 20, PAD_B = 30;
//     const plotW = W - PAD_L - PAD_R;
//     const plotH = H - PAD_T - PAD_B;

//     const pForY = (y: number) => pMin + (1 - (y - PAD_T) / plotH) * (pMax - pMin);
//     const tMin = visibleData[0].t;
//     const tMax = visibleData[visibleData.length - 1].t;
//     const tForX = (x: number) => tMin + ((x - PAD_L) / plotW) * (tMax - tMin);

//     return { x, y, t: tForX(x), p: pForY(y) };
//   };

//   const handleMouseMove = (e: React.MouseEvent) => {
//     const coords = getCoords(e);
//     if (!coords) return;
//     setMousePos({ x: coords.x, y: coords.y, price: coords.p, time: coords.t });
//   };

//   const handleMouseLeave = () => {
//     setMousePos(null);
//   };

//   const handleMouseDown = (e: React.MouseEvent) => {
//     const coords = getCoords(e);
//     if (!coords) return;

//     if (activeTool === "cursor") {
//       setPinnedInfo({ x: coords.x, y: coords.y, price: coords.p, time: coords.t });
//       const target = e.target as SVGElement;
//       const drawingId = target.getAttribute("data-id");

//       if (drawingId) {
//         if (e.shiftKey) {
//           setSelectedDrawingIds(prev =>
//             prev.includes(drawingId) ? prev.filter(id => id !== drawingId) : [...prev, drawingId]
//           );
//         } else {
//           setSelectedDrawingIds([drawingId]);
//         }
//       } else {
//         setSelectedDrawingIds([]);
//         setPinnedInfo(null);
//       }
//     } else if (activeTool === "hline") {
//       const newDrawing = { id: Date.now().toString(), type: "hline", start: { t: coords.t, p: coords.p }, end: { t: coords.t, p: coords.p } };
//       setDrawings(prev => [...prev, newDrawing]);
//       if (activeTradeId) saveDrawingAction(activeTradeId, newDrawing);
//       setActiveTool("cursor");
//       setShowToolsModal(false);
//     } else {
//       setIsDrawing(true);
//       setStartPos(coords);
//     }
//   };

//   const handleMouseUp = (e: React.MouseEvent) => {
//     if (!isDrawing || !startPos) return;
//     const coords = getCoords(e);
//     if (!coords) return;

//     if (Math.abs(coords.x - startPos.x) > 5 || Math.abs(coords.y - startPos.y) > 5) {
//       const newDrawing = {
//         id: Date.now().toString(),
//         type: activeTool,
//         start: { t: startPos.t, p: startPos.p },
//         end: { t: coords.t, p: coords.p }
//       };
//       setDrawings(prev => [...prev, newDrawing]);
//       if (activeTradeId) saveDrawingAction(activeTradeId, newDrawing);
//     }
//     setIsDrawing(false);
//     setActiveTool("cursor");
//     setShowToolsModal(false);
//   };

//   const deleteSelected = async () => {
//     if (selectedDrawingIds.length === 0) return;
//     setDrawings(prev => prev.filter(d => !selectedDrawingIds.includes(d.id)));
//     if (activeTradeId) {
//       for (const id of selectedDrawingIds) {
//         await deleteDrawingAction(activeTradeId, id);
//       }
//     }
//     setSelectedDrawingIds([]);
//   };

//   useEffect(() => {
//     candlesRef.current = generateCandles(activePairId, timeframe);
//     renderChart();
//     const ro = new ResizeObserver(renderChart);
//     if (chartContainerRef.current) ro.observe(chartContainerRef.current);
//     return () => ro.disconnect();
//   }, [activePairId, generateCandles, renderChart, timeframe, marketBlock]);

//   const handleDeleteHistory = (id: string) => {
//     setTrades(prev => prev.filter(t => t._id !== id && t.id !== id));
//     setSelectedHistoryTrade(null);
//   };

//   const handleCloseOrForfeit = (trade: any) => {
//     const id = trade._id || trade.id;
//     const isProfit = (trade.pnl || 0) > 0;

//     if (window.confirm(isProfit ? "Are you sure you want to Take Profit?" : "Are you sure you want to Close & Forfeit this trade?")) {
//       if (onClosePosition) {
//         onClosePosition(id);
//       } else {
//         closeTradeAction(id, coin ? coin.current_price : 0).then(() => {
//           setTrades(prev => prev.filter(t => t._id !== id));
//         });
//       }
//       setSelectedHistoryTrade(null);
//     }
//   };

//   const allAvailableAssets = React.useMemo(() => {
//     const baseAssets = dbAssets.map((a: any) => ({
//       id: a.symbol,
//       symbol: a.symbol,
//       name: a.name,
//       color: a.color,
//       image: a.image
//     }));

//     if (availableQuotes.length > 0) {
//       availableQuotes.forEach((q: any) => {
//         if (!baseAssets.find((a: any) => a.symbol === q.symbol.toUpperCase())) {
//           baseAssets.push({
//             id: q.id,
//             symbol: q.symbol.toUpperCase(),
//             name: q.name,
//             color: q.category === 'crypto' ? "#f59e0b" : q.category === 'memes' ? "#ec4899" : "#3b82f6",
//             image: q.image
//           });
//         }
//       });
//     }

//     if (coin && !baseAssets.find((a: any) => a.symbol === coin.symbol.toUpperCase())) {
//       baseAssets.unshift({
//         id: coin.id,
//         symbol: coin.symbol.toUpperCase(),
//         name: coin.name,
//         color: "#f59e0b",
//         image: coin.image
//       });
//     }

//     return baseAssets;
//   }, [dbAssets, availableQuotes, coin]);

//   const filteredAssets = allAvailableAssets.filter((asset: any) =>
//     (asset.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
//     (asset.symbol || "").toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const filteredHistory = activeTradesList.filter((t: any) =>
//     (t.baseAsset || t.symbol || "").toLowerCase().includes(historySearch.toLowerCase())
//   );

//   return (
//     <div className="flex flex-col h-full bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden relative">
//       <div id="tour-terminal-header" className="flex items-center justify-between p-3 border-b border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md shrink-0">
//         <button
//           onClick={() => { setIsSelectingPair(true); setSelectionStep("base"); setSearchQuery(""); }}
//           className="flex items-center gap-2 bg-white/50 dark:bg-[#050806]/80 px-3 py-1.5 rounded-lg border border-lime-500/20 hover:border-lime-500 cursor-pointer transition-colors"
//         >
//           <span className="text-sm font-bold uppercase tracking-wider text-lime-950 dark:text-[#ecfdf5]">
//             {baseAsset} / {quoteAsset}
//           </span>
//           <ChevronDown size={14} className="text-lime-600 dark:text-lime-400" />
//         </button>

//         <div className={`text-xs font-bold px-2 py-1 rounded ${isMarketOpen ? "bg-green-500/10 text-green-600 dark:text-green-500" : "bg-red-500/10 text-red-600 dark:text-red-500"}`}>
//           {isMarketOpen ? "MARKET OPEN" : "MARKET CLOSED"}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col relative overflow-hidden">
//         <div className="flex items-center justify-between gap-2 p-2 bg-white/30 dark:bg-[#121A14]/50 border-b border-lime-500/10 backdrop-blur z-10">
//           <button
//             id="tour-terminal-tools"
//             onClick={() => { setShowToolsModal(!showToolsModal); setShowTimeframeModal(false); }}
//             className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors shadow-sm ${showToolsModal ? "bg-lime-600 text-white border-lime-600" : "bg-white/50 dark:bg-[#050806]/80 border-lime-500/20 text-lime-800 dark:text-lime-200 hover:border-lime-500/50"}`}
//           >
//             <Settings2 size={16} />
//             <span className="text-[11px] font-bold uppercase tracking-wider">Tools</span>
//           </button>

//           <button
//             id="tour-terminal-timeframe"
//             onClick={() => { setShowTimeframeModal(!showTimeframeModal); setShowToolsModal(false); }}
//             className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors shadow-sm ${showTimeframeModal ? "bg-lime-600 text-white border-lime-600" : "bg-white/50 dark:bg-[#050806]/80 border-lime-500/20 text-lime-800 dark:text-lime-200 hover:border-lime-500/50"}`}
//           >
//             <Clock size={14} className={showTimeframeModal ? "text-white" : "text-lime-600 dark:text-lime-400"} />
//             <span className="text-[11px] font-bold font-mono tracking-wider">{TIMEFRAMES[timeframe].label}</span>
//             <ChevronDown size={14} className={showTimeframeModal ? "text-white" : "text-lime-600 dark:text-lime-400"} />
//           </button>
//         </div>

//         <div
//           id="tour-terminal-chart"
//           ref={chartContainerRef}
//           className="flex-1 w-full h-full cursor-crosshair bg-transparent relative"
//           onWheel={(e) => {
//             if (e.deltaY > 0) setZoom(z => Math.max(0.5, z / 1.1));
//             else setZoom(z => Math.min(10, z * 1.1));
//           }}
//           onMouseMove={handleMouseMove}
//           onMouseLeave={handleMouseLeave}
//           onMouseDown={handleMouseDown}
//           onMouseUp={handleMouseUp}
//         >
//           <svg ref={svgRef} className="w-full h-full block" />

//           {pinnedInfo && (
//             <div
//               className="absolute z-30 bg-[#0a0f0b]/90 border border-lime-500/30 text-white text-[10px] font-mono p-2 rounded-lg shadow-xl pointer-events-none flex flex-col gap-1 backdrop-blur-md"
//               style={{
//                 left: pinnedInfo.x > (chartContainerRef.current!.clientWidth / 2) ? pinnedInfo.x - 100 : pinnedInfo.x + 15,
//                 top: pinnedInfo.y - 40
//               }}
//             >
//               <div className="text-lime-400 font-bold">{currencySymbol}{pinnedInfo.price.toFixed(2)}</div>
//               <div className="text-gray-400">{new Date(pinnedInfo.time).toLocaleTimeString()}</div>
//             </div>
//           )}

//           {mousePos && !pinnedInfo && (
//             <div
//               className="absolute z-20 bg-[#0a0f0b]/80 border border-lime-500/20 text-white text-[10px] font-mono p-1.5 rounded-lg shadow-lg pointer-events-none flex flex-col opacity-80"
//               style={{ left: mousePos.x + 15, top: mousePos.y - 30 }}
//             >
//               <div>{currencySymbol}{mousePos.price.toFixed(2)}</div>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="shrink-0 p-3 bg-white/40 dark:bg-[#121A14]/60 backdrop-blur-md border-t border-lime-500/10">
//         <button
//           id="tour-terminal-history"
//           onClick={() => setShowHistoryModal(true)}
//           className="w-full flex items-center justify-between bg-white/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-xl px-4 py-3 hover:border-lime-500/50 transition-colors group"
//         >
//           <div className="flex items-center gap-2 text-lime-800 dark:text-lime-200 font-bold text-sm">
//             <History size={16} className="text-lime-600 dark:text-lime-400" />
//             Trade History
//           </div>
//           <div className="flex items-center gap-2 text-xs font-mono text-lime-600 dark:text-lime-400">
//             {activeTradesList.length} Trades
//             <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
//           </div>
//         </button>
//       </div>

//       <AnimatePresence>
//         {showHistoryModal && (
//           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 20 }}
//               className="relative w-full max-w-lg bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
//             >
//               <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/40 dark:bg-[#121A14]/60 shrink-0">
//                 <h2 className="text-lg font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                   <History size={18} className="text-lime-500" /> Trade History
//                 </h2>
//                 <button onClick={() => setShowHistoryModal(false)} className="p-1.5 rounded-lg hover:bg-lime-500/10 text-lime-600 dark:text-lime-400 transition-colors">
//                   <X size={18} />
//                 </button>
//               </div>

//               <div className="p-3 shrink-0">
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50 dark:text-lime-400/50" size={16} />
//                   <input
//                     type="text"
//                     placeholder="Search history..."
//                     value={historySearch}
//                     onChange={(e) => setHistorySearch(e.target.value)}
//                     className="w-full bg-white/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-full py-2 pl-9 pr-4 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors"
//                   />
//                 </div>
//               </div>

//               <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
//                 {filteredHistory.map((t) => (
//                   <div
//                     key={t._id || t.id}
//                     className={`p-3 rounded-2xl border transition-colors flex flex-col gap-2 cursor-pointer ${
//                       activeTradeId === (t._id || t.id)
//                         ? "border-lime-500 bg-lime-500/10"
//                         : "border-lime-500/20 dark:border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50"
//                     }`}
//                     onClick={() => setActiveTradeId(t._id || t.id)}
//                   >
//                     <div className="flex justify-between items-center">
//                       <div className="flex items-center gap-2">
//                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.side === 'buy' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
//                           {t.side?.toUpperCase() || "BUY"}
//                         </span>
//                         <span className="font-bold text-sm text-lime-950 dark:text-white">
//                           {t.baseAsset || t.symbol}/{t.quoteAsset || "USD"}
//                         </span>
//                       </div>
//                       <span className={`font-mono text-sm font-bold ${t.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
//                         {t.pnl >= 0 ? "+" : ""}{currencySymbol}{(t.pnl || 0).toFixed(2)}
//                       </span>
//                     </div>

//                     <div className="flex justify-between items-center text-xs font-mono text-lime-800/60 dark:text-lime-200/50">
//                       <div>Qty: {t.amount || t.lots} @ ${t.entryPrice || t.entry}</div>
//                       <div className="flex gap-1">
//                         <button onClick={(e) => { e.stopPropagation(); setSelectedHistoryTrade(t); }} className="p-1.5 bg-lime-500/10 text-lime-600 rounded hover:bg-lime-500/20" title="View Details"><Eye size={14} /></button>
//                         <button onClick={(e) => { e.stopPropagation(); handleDeleteHistory(t._id || t.id); }} className="p-1.5 bg-red-500/10 text-red-600 rounded hover:bg-red-500/20" title="Delete Record"><Trash2 size={14} /></button>

//                         <button
//                           onClick={(e) => { e.stopPropagation(); handleCloseOrForfeit(t); }}
//                           className={`px-2 py-1 rounded font-bold text-[10px] transition-colors ${
//                             (t.pnl || 0) > 0
//                               ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
//                               : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
//                           }`}
//                         >
//                           {(t.pnl || 0) > 0 ? "Take Profit" : "Close & Forfeit"}
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//                 {filteredHistory.length === 0 && (
//                   <div className="text-center text-xs text-lime-800/60 dark:text-lime-200/50 py-8">
//                     No trade history found.
//                   </div>
//                 )}
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {selectedHistoryTrade && (
//           <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 0.95 }}
//               className="relative w-full max-w-sm bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 border border-lime-500/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
//             >
//               <div className="flex justify-between items-center border-b border-lime-500/10 pb-3">
//                 <h3 className="font-bold text-lime-950 dark:text-white">Trade Details</h3>
//                 <button onClick={() => setSelectedHistoryTrade(null)} className="text-gray-500 hover:text-red-500"><X size={16} /></button>
//               </div>
//               <div className="space-y-2 text-sm font-mono">
//                 <div className="flex justify-between"><span className="text-gray-500">Asset:</span> <span className="font-bold text-lime-950 dark:text-white">{selectedHistoryTrade.baseAsset || selectedHistoryTrade.symbol}</span></div>
//                 <div className="flex justify-between"><span className="text-gray-500">Side:</span> <span className={`font-bold uppercase ${selectedHistoryTrade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>{selectedHistoryTrade.side}</span></div>
//                 <div className="flex justify-between"><span className="text-gray-500">Entry Price:</span> <span className="text-lime-950 dark:text-white">${selectedHistoryTrade.entryPrice || selectedHistoryTrade.entry}</span></div>
//                 <div className="flex justify-between"><span className="text-gray-500">Quantity:</span> <span className="text-lime-950 dark:text-white">{selectedHistoryTrade.amount || selectedHistoryTrade.lots}</span></div>
//                 <div className="flex justify-between"><span className="text-gray-500">PnL:</span> <span className={`font-bold ${selectedHistoryTrade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{selectedHistoryTrade.pnl >= 0 ? "+" : ""}{currencySymbol}{(selectedHistoryTrade.pnl || 0).toFixed(2)}</span></div>
//               </div>
//               <button onClick={() => setSelectedHistoryTrade(null)} className="mt-4 w-full py-2 bg-lime-600 text-white font-bold rounded-xl hover:bg-lime-700 transition-colors">Close Details</button>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {showTimeframeModal && (
//           <motion.div
//             initial={{ opacity: 0, y: 10, scale: 0.95 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 10, scale: 0.95 }}
//             className="absolute top-28 right-2 z-50 p-3 bg-white/95 dark:bg-[#121A14]/95 backdrop-blur-xl border border-lime-500/30 dark:border-lime-500/20 rounded-2xl shadow-2xl w-56"
//           >
//             <div className="flex items-center justify-between mb-3 px-1">
//               <span className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">Timeframes</span>
//               <button onClick={() => setShowTimeframeModal(false)} className="text-red-500 hover:bg-red-500/10 p-1 rounded-full transition-colors"><X size={14} /></button>
//             </div>

//             <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
//               {Object.entries(TIMEFRAMES).map(([key, tf]) => (
//                 <button
//                   key={key}
//                   onClick={() => { setTimeframe(key); setShowTimeframeModal(false); }}
//                   className={`py-2 rounded-lg text-[11px] font-bold font-mono transition-all flex items-center justify-center ${
//                     timeframe === key
//                       ? "bg-lime-600 text-white shadow-md"
//                       : "text-lime-800 dark:text-lime-200 bg-lime-500/5 hover:bg-lime-500/15"
//                   }`}
//                 >
//                   {tf.label}
//                 </button>
//               ))}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {showToolsModal && (
//           <motion.div
//             initial={{ opacity: 0, y: 10, scale: 0.95 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 10, scale: 0.95 }}
//             className="absolute top-28 left-2 z-50 p-2 bg-white/95 dark:bg-[#121A14]/95 backdrop-blur-xl border border-lime-500/30 dark:border-lime-500/20 rounded-2xl shadow-2xl flex flex-col gap-1 w-14"
//           >
//             <button onClick={() => setShowToolsModal(false)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"><X size={12} /></button>

//             <button onClick={() => { setActiveTool("cursor"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "cursor" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Cursor"><Crosshair size={20} /></button>
//             <button onClick={() => { setActiveTool("line"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "line" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Trend Line"><PenTool size={20} /></button>
//             <button onClick={() => { setActiveTool("hline"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "hline" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Horizontal Line"><Minus size={20} /></button>
//             <button onClick={() => { setActiveTool("ray"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "ray" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Ray"><MoveUpRight size={20} /></button>
//             <button onClick={() => { setActiveTool("rect"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "rect" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Rectangle"><Square size={20} /></button>
//             <button onClick={() => { setActiveTool("fib"); setShowToolsModal(false); }} className={`p-2 rounded-xl flex justify-center transition-colors ${activeTool === "fib" ? "bg-lime-600 text-white shadow-md" : "text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`} title="Fibonacci"><AlignEndHorizontal size={20} /></button>

//             <div className="h-px w-full bg-lime-500/20 my-1" />

//             <button onClick={deleteSelected} disabled={selectedDrawingIds.length === 0} className={`p-2 rounded-xl flex justify-center transition-colors ${selectedDrawingIds.length > 0 ? "text-red-500 hover:bg-red-500/10" : "text-lime-500/30 dark:text-lime-200/20 cursor-not-allowed"}`} title="Delete Selected"><Trash2 size={20} /></button>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isSelectingPair && (
//           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 20 }}
//               className="relative w-full max-w-md bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
//             >
//               <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/40 dark:bg-[#121A14]/60 shrink-0">
//                 <h2 className="text-lg font-bold text-lime-950 dark:text-white">
//                   Select {selectionStep === "base" ? "Base Asset" : "Quote Asset"}
//                 </h2>
//                 <button onClick={() => setIsSelectingPair(false)} className="p-1.5 rounded-lg hover:bg-lime-500/10 text-lime-600 dark:text-lime-400 transition-colors">
//                   <X size={18} />
//                 </button>
//               </div>

//               <div className="p-3 shrink-0">
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
//                 {filteredAssets.map((asset) => (
//                   <button
//                     key={asset.id}
//                     onClick={() => {
//                       if (selectionStep === "base") {
//                         setBaseAsset(asset.symbol);
//                         setSelectionStep("quote");
//                         setSearchQuery("");
//                       } else {
//                         if (asset.symbol === baseAsset) return;
//                         setQuoteAsset(asset.symbol);
//                         setIsSelectingPair(false);
//                       }
//                     }}
//                     className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-colors ${baseAsset === asset.symbol && selectionStep === "quote" ? "opacity-50 cursor-not-allowed border-lime-500/10 bg-white/30 dark:bg-[#121A14]/30" : "border-lime-500/20 dark:border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 hover:bg-white/80 dark:hover:bg-[#121A14]/80"}`}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black shadow-sm overflow-hidden shrink-0" style={{ background: asset.color || "#84cc16" }}>
//                         {asset.image ? (
//                           <img src={asset.image} alt={asset.symbol} className="w-full h-full object-cover" />
//                         ) : (
//                           asset.symbol[0]
//                         )}
//                       </div>
//                       <div className="text-left">
//                         <div className="font-bold text-sm text-lime-950 dark:text-white uppercase">{asset.symbol}</div>
//                         <div className="text-xs text-lime-800/60 dark:text-lime-200/50">{asset.name}</div>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <div className="font-mono text-sm font-bold text-lime-950 dark:text-white">
//                         {asset.symbol === coin?.symbol?.toUpperCase() ? `$${coin.current_price.toFixed(2)}` : `$${(COMMODITIES[asset.symbol]?.base || 0).toFixed(2)}`}
//                       </div>
//                       <div className="text-[10px] font-bold text-green-500 flex items-center justify-end">
//                         <ArrowUpRight size={10} className="mr-1"/> +2.4%
//                       </div>
//                     </div>
//                   </button>
//                 ))}
//               </div>

//               <div className="p-3 border-t border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 shrink-0">
//                 <button
//                   onClick={() => {
//                     setIsSelectingPair(false);
//                     router.push("/markets");
//                   }}
//                   className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/20 text-lime-700 dark:text-lime-300 font-bold text-sm transition-colors"
//                 >
//                   <LayoutGrid size={16} />
//                   {selectionStep === "base" ? "Explore All Base Markets" : "Explore All Markets"}
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
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
//   Newspaper, ChevronRight, Award, Zap, ArrowDown, ArrowUp, Wallet, ChevronDown,
//   Loader2
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { useTour } from "@/components/providers/TourProvider"; // 👈 RESTORED
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";
// import { executeTradeAction, closeTradeAction } from "@/app/actions/trade";
// import { getMarketSettings } from "@/app/actions/admin-market";

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

// // 👇 HELPER: Calculate drift based on Admin's trend + intensity
// const calculateDrift = (trend: string, intensity: number): number => {
//   const multiplier = intensity / 100; 
//   if (trend === "bullish") return multiplier;
//   if (trend === "bearish") return -multiplier;
//   return 0;
// };

// // 👇 HELPER: Get current progress through the active 4-hour block (0.0 to 1.0)
// const getBlockProgress = (): number => {
//   const now = new Date();
//   const hour = now.getHours();
//   const minute = now.getMinutes();
//   const currentHour = hour + minute / 60;
  
//   let start: number, end: number;
//   if (hour < 7) { start = 0; end = 7; }
//   else if (hour < 12) { start = 7; end = 12; }
//   else if (hour < 18) { start = 12; end = 18; }
//   else { start = 18; end = 24; }
  
//   return Math.min(1, Math.max(0, (currentHour - start) / (end - start)));
// };

// // 👇 HELPER: Calculate simulated market price (Base → Base+Drift over block progress)
// const getSimulatedMarketPrice = (
//   basePrice: number, 
//   block: { trend: "bullish" | "bearish" | "consolidate"; intensity: number }
// ): number => {
//   const drift = calculateDrift(block.trend, block.intensity);
//   const progress = getBlockProgress();
//   return basePrice * (1 + drift * progress);
// };

// function TradeSparkline({ trend }: { trend: "bullish" | "bearish" | "consolidate" }) {
//   let color = "#10b981"; 
//   let path = "M 0 20 Q 10 15, 20 25 T 40 20 T 60 25 Q 70 20 80 25 T 100 20"; 

//   if (trend === "bullish") { 
//     color = "#3b82f6"; 
//     path = "M 0 30 Q 15 25, 20 20 T 40 10 T 60 5"; 
//   } else if (trend === "bearish") { 
//     color = "#ef4444"; 
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
//   const { setSteps } = useTour(); // 👈 RESTORED
  
//   const [mounted, setMounted] = useState(false);
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");
//   const [isTrading, setIsTrading] = useState(false); 
//   const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  
//   const [marketBlock, setMarketBlock] = useState<{
//     trend: "bullish" | "bearish" | "consolidate";
//     intensity: number;
//   }>({ trend: "consolidate", intensity: 5 });

//   const [amount, setAmount] = useState("");
//   const [takeProfit, setTakeProfit] = useState("");
//   const [stopLoss, setStopLoss] = useState("");

//   const pairParam = searchParams.get("pair");
//   const [baseAsset, setBaseAsset] = useState("BTC");
//   const [quoteAsset, setQuoteAsset] = useState("USD");

//   // 👇 RESTORED: TOUR STEPS
//   useEffect(() => {
//     setSteps([
//       { id: "tour-dash-balance", title: "Wallet Balance", text: "This is your real-time available balance. Click deposit to add funds." },
//       { id: "tour-dash-positions", title: "Active Positions", text: "Monitor your open trades here. You can close them and realize PnL instantly." },
//       { id: "tour-dash-quicktrade", title: "Quick Trade", text: "Open a new position quickly with market or limit orders." },
//       { id: "tour-dash-marketwatch", title: "Market Watch", text: "Keep an eye on the most traded pairs and their current prices." }
//     ]);
//     return () => setSteps([]);
//   }, [setSteps]);

//   useEffect(() => {
//     setMounted(true);
//     if (pairParam) {
//       const [b, q] = pairParam.split("-");
//       setBaseAsset(b);
//       setQuoteAsset(q || "USD");
//     }
//   }, [pairParam]);

//   // 👇 FETCH ADMIN MARKET SETTINGS ON MOUNT + EVERY 60s
//   useEffect(() => {
//     async function fetchSettings() {
//       try {
//         const settings = await getMarketSettings();
//         if (settings) {
//           const hour = new Date().getHours();
//           let activeBlock = settings.block4;
//           if (hour >= 0 && hour < 7) activeBlock = settings.block1;
//           else if (hour >= 7 && hour < 12) activeBlock = settings.block2;
//           else if (hour >= 12 && hour < 18) activeBlock = settings.block3;
          
//           setMarketBlock({
//             trend: activeBlock.trend as "bullish" | "bearish" | "consolidate",
//             intensity: activeBlock.intensity || 5,
//           });
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchSettings();
//     const interval = setInterval(fetchSettings, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const calculatePnl = (trade: any) => {
//     const asset = dbAssets.find((a: any) => a.symbol === trade.baseAsset);
//     const basePrice = asset ? asset.basePrice : trade.entryPrice;
//     const markPrice = getSimulatedMarketPrice(basePrice, marketBlock);
//     const priceDiff = markPrice - trade.entryPrice;
//     const pnl = trade.side === "buy" ? priceDiff * trade.amount : -priceDiff * trade.amount;
//     return { markPrice, pnl };
//   };

//   const executeTrade = async () => {
//     const rawAmount = amount.replace(/,/g, "");
//     const qty = parseFloat(rawAmount);

//     if (!qty || qty <= 0) {
//       openModal(t("invalidAmountTitle"), t("invalidAmountDesc"), "warning");
//       return;
//     }

//     setIsTrading(true);

//     const asset = dbAssets.find((a: any) => a.symbol === baseAsset);
//     const basePrice = asset ? asset.basePrice : 100;
//     const currentPrice = getSimulatedMarketPrice(basePrice, marketBlock);

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
//       openModal(
//         "Trade Successful", 
//         `Your ${tradeType} order for ${qty} ${baseAsset} was filled at ${currencySymbol}${currentPrice.toFixed(2)}.`, 
//         "success"
//       );
      
//       setAmount("");
//       setTakeProfit("");
//       setStopLoss("");

//       router.refresh(); 
//     }
//   };

//   const handleCloseTrade = async (trade: any, markPrice: number, pnl: number) => {
//     const pnlLabel = pnl >= 0 ? `+${currencySymbol}${pnl.toFixed(2)}` : `-${currencySymbol}${Math.abs(pnl).toFixed(2)}`;
    
//     if (!confirm(`Close ${trade.side === "buy" ? "LONG" : "SHORT"} ${trade.pair}?\n\nExit Price: ${currencySymbol}${markPrice.toFixed(2)}\nEstimated PnL: ${pnlLabel}`)) {
//       return;
//     }

//     setClosingTradeId(trade._id);

//     try {
//       const res = await closeTradeAction(trade._id, markPrice);

//       if (res.error) {
//         openModal("Close Failed", res.error, "error");
//       } else {
//         const finalPnl = res.pnl || 0;
//         openModal(
//           "Position Closed", 
//           `Realized PnL: ${finalPnl >= 0 ? "+" : ""}${currencySymbol}${finalPnl.toFixed(2)}. Funds have been settled in your ledger.`, 
//           finalPnl >= 0 ? "success" : "info"
//         );
//         router.refresh();
//       }
//     } catch (error: any) {
//       openModal("Close Error", error.message || "Failed to close position.", "error");
//     } finally {
//       setClosingTradeId(null);
//     }
//   };

//   if (!mounted) return null;

//   const usdBalance = realBalances.find((b: any) => b.assetId === "USD")?.cachedBalance / 100 || 0;
//   const userAccountIds = new Set(realBalances.map((b: any) => b._id));

//   return (
//     <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 w-full overflow-x-hidden">
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
//         <motion.div id="tour-dash-balance" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden">
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

//           <motion.div id="tour-dash-positions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
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
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-center">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-lime-500/10">
//                     {realTrades.map((pos: any) => {
//                       const { markPrice, pnl } = calculatePnl(pos);
//                       const isProfit = pnl >= 0;
//                       const isClosing = closingTradeId === pos._id;
                      
//                       return (
//                         <tr key={pos._id} className="hover:bg-lime-500/5 transition-colors">
//                           <td className="px-3 sm:px-4 py-3 cursor-pointer" onClick={() => router.push(`/terminal?pair=${pos.pair}&tradeId=${pos._id}`)}>
//                             <div className="flex items-center gap-2">
//                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.side === "buy" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.side === "buy" ? "LONG" : "SHORT"}</span>
//                               <span className="font-bold text-lime-950 dark:text-white">{pos.pair}</span>
//                             </div>
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.amount} {pos.baseAsset}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{currencySymbol}{pos.entryPrice.toLocaleString()}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{currencySymbol}{markPrice.toFixed(2)}</td>
//                           <td className="px-3 sm:px-4 py-3 flex justify-center">
//                             <TradeSparkline trend={marketBlock.trend} />
//                           </td>
//                           <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${isProfit ? "text-green-500" : "text-red-500"}`}>
//                             {isProfit ? "+" : ""}{currencySymbol}{pnl.toFixed(2)}
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 text-center">
//                             <button
//                               onClick={() => handleCloseTrade(pos, markPrice, pnl)}
//                               disabled={isClosing}
//                               className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 mx-auto disabled:opacity-50 ${
//                                 isProfit 
//                                   ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" 
//                                   : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
//                               }`}
//                             >
//                               {isClosing ? (
//                                 <Loader2 size={12} className="animate-spin" />
//                               ) : (
//                                 "Close Position"
//                               )}
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
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
//                           <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white capitalize">{tx.kind.replace("_", " ")}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-xs text-lime-800/50 dark:text-lime-200/40">{tx.refId.slice(0, 10)}...</td>
//                           <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${isCredit ? "text-green-500" : "text-red-500"}`}>
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
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: "conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)" }}>
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
//           <motion.div id="tour-dash-quicktrade" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative">
//             <h3 className="font-bold text-lime-950 dark:text-white mb-4">{t("quickTrade")}</h3>
            
//             <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "buy" ? "bg-green-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("buy")}</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "sell" ? "bg-red-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("sell")}</button>
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
//                 className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === "buy" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}
//               >
//                 {isTrading ? "Processing..." : t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
//               </Button>
//             </KycGate>
//           </motion.div>

//           <motion.div id="tour-dash-marketwatch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden">
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <Flame size={18} className="text-orange-500" /> {t("marketWatch")}
//               </h3>
//               <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">{t("viewAll")}</Link>
//             </div>
//             <div className="divide-y divide-lime-500/5">
//               {dbAssets.slice(0, 5).map((market: any) => {
//                 const livePrice = getSimulatedMarketPrice(market.basePrice, marketBlock);
//                 const percentChange = livePrice === market.basePrice 
//                   ? "0%" 
//                   : `${((livePrice - market.basePrice) / market.basePrice * 100).toFixed(2)}%`;
//                 const isPositive = livePrice >= market.basePrice;
                
//                 return (
//                   <div key={market._id} onClick={() => router.push(`/terminal?pair=${market.symbol}-USD`)} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                         {market.symbol.charAt(0)}
//                       </div>
//                       <div>
//                         <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}/USD</p>
//                         <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">
//                         ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                       <p className={`text-xs font-bold flex items-center justify-end ${isPositive ? "text-green-500" : "text-red-500"}`}>
//                         {isPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} 
//                         {isPositive ? "+" : ""}{percentChange}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })}
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
//   Newspaper, ChevronRight, Award, Zap, ArrowDown, ArrowUp, Wallet, ChevronDown,
//   Loader2
// } from "lucide-react";
// import { KycGate } from "@/components/KycGate";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Button } from "@/components/ui/Button";
// import UserAvatar, { TimeGreeting } from "@/app/dashboard/UserAvatar";
// import FavorablePairsCard from "@/app/dashboard/FavorablePairsCard";
// import { executeTradeAction, closeTradeAction } from "@/app/actions/trade";
// import { getMarketSettings } from "@/app/actions/admin-market";

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

// // 👇 HELPER: Calculate drift based on Admin's trend + intensity
// const calculateDrift = (trend: string, intensity: number): number => {
//   const multiplier = intensity / 100; // Intensity 1-10 maps to 1%-10% drift
//   if (trend === "bullish") return multiplier;
//   if (trend === "bearish") return -multiplier;
//   return 0;
// };

// // 👇 HELPER: Get current progress through the active 4-hour block (0.0 to 1.0)
// const getBlockProgress = (): number => {
//   const now = new Date();
//   const hour = now.getHours();
//   const minute = now.getMinutes();
//   const currentHour = hour + minute / 60;
  
//   let start: number, end: number;
//   if (hour < 7) { start = 0; end = 7; }
//   else if (hour < 12) { start = 7; end = 12; }
//   else if (hour < 18) { start = 12; end = 18; }
//   else { start = 18; end = 24; }
  
//   return Math.min(1, Math.max(0, (currentHour - start) / (end - start)));
// };

// // 👇 HELPER: Calculate simulated market price (Base → Base+Drift over block progress)
// const getSimulatedMarketPrice = (
//   basePrice: number, 
//   block: { trend: "bullish" | "bearish" | "consolidate"; intensity: number }
// ): number => {
//   const drift = calculateDrift(block.trend, block.intensity);
//   const progress = getBlockProgress();
//   return basePrice * (1 + drift * progress);
// };

// // 👇 SPARKLINE COMPONENT
// function TradeSparkline({ trend }: { trend: "bullish" | "bearish" | "consolidate" }) {
//   let color = "#10b981"; 
//   let path = "M 0 20 Q 10 15, 20 25 T 40 20 T 60 25 Q 70 20 80 25 T 100 20"; 

//   if (trend === "bullish") { 
//     color = "#3b82f6"; 
//     path = "M 0 30 Q 15 25, 20 20 T 40 10 T 60 5"; 
//   } else if (trend === "bearish") { 
//     color = "#ef4444"; 
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
//   const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  
//   // 👇 MARKET BLOCK (Trend + Intensity from Admin)
//   const [marketBlock, setMarketBlock] = useState<{
//     trend: "bullish" | "bearish" | "consolidate";
//     intensity: number;
//   }>({ trend: "consolidate", intensity: 5 });

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

//   // 👇 FETCH ADMIN MARKET SETTINGS ON MOUNT + EVERY 60s
//   useEffect(() => {
//     async function fetchSettings() {
//       try {
//         const settings = await getMarketSettings();
//         if (settings) {
//           const hour = new Date().getHours();
//           let activeBlock = settings.block4;
//           if (hour >= 0 && hour < 7) activeBlock = settings.block1;
//           else if (hour >= 7 && hour < 12) activeBlock = settings.block2;
//           else if (hour >= 12 && hour < 18) activeBlock = settings.block3;
          
//           setMarketBlock({
//             trend: activeBlock.trend as "bullish" | "bearish" | "consolidate",
//             intensity: activeBlock.intensity || 5,
//           });
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchSettings();
//     const interval = setInterval(fetchSettings, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   // 👇 CALCULATE PNL FOR A GIVEN TRADE
//   const calculatePnl = (trade: any) => {
//     const asset = dbAssets.find((a: any) => a.symbol === trade.baseAsset);
//     const basePrice = asset ? asset.basePrice : trade.entryPrice;
//     const markPrice = getSimulatedMarketPrice(basePrice, marketBlock);
//     const priceDiff = markPrice - trade.entryPrice;
//     const pnl = trade.side === "buy" ? priceDiff * trade.amount : -priceDiff * trade.amount;
//     return { markPrice, pnl };
//   };

//   // 👇 EXECUTE NEW TRADE (uses simulated market price for consistency)
//   const executeTrade = async () => {
//     const rawAmount = amount.replace(/,/g, "");
//     const qty = parseFloat(rawAmount);

//     if (!qty || qty <= 0) {
//       openModal(t("invalidAmountTitle"), t("invalidAmountDesc"), "warning");
//       return;
//     }

//     setIsTrading(true);

//     const asset = dbAssets.find((a: any) => a.symbol === baseAsset);
//     const basePrice = asset ? asset.basePrice : 100;
    
//     // 👇 Use the same simulation as PnL calculation
//     const currentPrice = getSimulatedMarketPrice(basePrice, marketBlock);

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
//       openModal(
//         "Trade Successful", 
//         `Your ${tradeType} order for ${qty} ${baseAsset} was filled at ${currencySymbol}${currentPrice.toFixed(2)}.`, 
//         "success"
//       );
      
//       setAmount("");
//       setTakeProfit("");
//       setStopLoss("");

//       router.refresh(); 
//     }
//   };

//   // 👇 CLOSE ACTIVE POSITION (with price shown in confirmation)
//   const handleCloseTrade = async (trade: any, markPrice: number, pnl: number) => {
//     const pnlLabel = pnl >= 0 ? `+${currencySymbol}${pnl.toFixed(2)}` : `-${currencySymbol}${Math.abs(pnl).toFixed(2)}`;
    
//     if (!confirm(`Close ${trade.side === "buy" ? "LONG" : "SHORT"} ${trade.pair}?\n\nExit Price: ${currencySymbol}${markPrice.toFixed(2)}\nEstimated PnL: ${pnlLabel}`)) {
//       return;
//     }

//     setClosingTradeId(trade._id);

//     try {
//       const res = await closeTradeAction(trade._id, markPrice);

//       if (res.error) {
//         openModal("Close Failed", res.error, "error");
//       } else {
//         const finalPnl = res.pnl || 0;
//         openModal(
//           "Position Closed", 
//           `Realized PnL: ${finalPnl >= 0 ? "+" : ""}${currencySymbol}${finalPnl.toFixed(2)}. Funds have been settled in your ledger.`, 
//           finalPnl >= 0 ? "success" : "info"
//         );
//         router.refresh();
//       }
//     } catch (error: any) {
//       openModal("Close Error", error.message || "Failed to close position.", "error");
//     } finally {
//       setClosingTradeId(null);
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
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-center">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-lime-500/10">
//                     {realTrades.map((pos: any) => {
//                       const { markPrice, pnl } = calculatePnl(pos);
//                       const isProfit = pnl >= 0;
//                       const isClosing = closingTradeId === pos._id;
                      
//                       return (
//                         <tr key={pos._id} className="hover:bg-lime-500/5 transition-colors">
//                           <td className="px-3 sm:px-4 py-3 cursor-pointer" onClick={() => router.push(`/terminal?pair=${pos.pair}&tradeId=${pos._id}`)}>
//                             <div className="flex items-center gap-2">
//                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.side === "buy" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>{pos.side === "buy" ? "LONG" : "SHORT"}</span>
//                               <span className="font-bold text-lime-950 dark:text-white">{pos.pair}</span>
//                             </div>
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.amount} {pos.baseAsset}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{currencySymbol}{pos.entryPrice.toLocaleString()}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{currencySymbol}{markPrice.toFixed(2)}</td>
//                           <td className="px-3 sm:px-4 py-3 flex justify-center">
//                             <TradeSparkline trend={marketBlock.trend} />
//                           </td>
//                           <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${isProfit ? "text-green-500" : "text-red-500"}`}>
//                             {isProfit ? "+" : ""}{currencySymbol}{pnl.toFixed(2)}
//                           </td>
//                           <td className="px-3 sm:px-4 py-3 text-center">
//                             <button
//                               onClick={() => handleCloseTrade(pos, markPrice, pnl)}
//                               disabled={isClosing}
//                               className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 mx-auto disabled:opacity-50 ${
//                                 isProfit 
//                                   ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" 
//                                   : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
//                               }`}
//                             >
//                               {isClosing ? (
//                                 <Loader2 size={12} className="animate-spin" />
//                               ) : (
//                                 "Close Position"
//                               )}
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
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
//                           <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white capitalize">{tx.kind.replace("_", " ")}</td>
//                           <td className="px-3 sm:px-4 py-3 font-mono text-xs text-lime-800/50 dark:text-lime-200/40">{tx.refId.slice(0, 10)}...</td>
//                           <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${isCredit ? "text-green-500" : "text-red-500"}`}>
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
//               <div className="w-24 h-24 rounded-full shrink-0" style={{ background: "conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)" }}>
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
//               <button onClick={() => setTradeType("buy")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "buy" ? "bg-green-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("buy")}</button>
//               <button onClick={() => setTradeType("sell")} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "sell" ? "bg-red-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}>{t("sell")}</button>
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
//                 className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === "buy" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}
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
//               {dbAssets.slice(0, 5).map((market: any) => {
//                 const livePrice = getSimulatedMarketPrice(market.basePrice, marketBlock);
//                 const percentChange = livePrice === market.basePrice 
//                   ? "0%" 
//                   : `${((livePrice - market.basePrice) / market.basePrice * 100).toFixed(2)}%`;
//                 const isPositive = livePrice >= market.basePrice;
                
//                 return (
//                   <div key={market._id} onClick={() => router.push(`/terminal?pair=${market.symbol}-USD`)} className="block p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                         {market.symbol.charAt(0)}
//                       </div>
//                       <div>
//                         <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{market.symbol}/USD</p>
//                         <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">
//                         ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                       <p className={`text-xs font-bold flex items-center justify-end ${isPositive ? "text-green-500" : "text-red-500"}`}>
//                         {isPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />} 
//                         {isPositive ? "+" : ""}{percentChange}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })}
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
