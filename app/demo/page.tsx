// app/demo/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck, Flame,
  Newspaper, ChevronRight, Award, Zap, Wallet, ArrowUp, ArrowDown,
  LogOut, LogIn, UserPlus, X, ChevronDown, Sparkles, Sun, Sunrise,
  Sunset, Moon, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { getDemoSessionAction, executeDemoTradeAction } from "@/app/actions/demo"; // 👈 Imported DB Actions

const WATERMARK_SYMBOLS = [
  "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲",
  "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰",
  "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$",
  "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "лв", "din", "ден",
  "L", "Q", "B/.", "₡", "₲", "Gs", "S/.", "Bs.", "$U", "RD$", "J$", "TT$",
  "Bds$", "EC$", "FJ$", "WS$", "T$", "VT", "K", "T", "₭", "₮", "៛", "₫", "Rp",
  "RM", "S$", "฿", "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ",
  "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ",
  "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨",
  "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦", "✕",
  "✖", "☰", "⛓", "🔗", "🌐", "⚙️", "🧩", "🧮", "📈", "📉", "⚖️", "🛡️", "🔑", "🗝️",
  "🧊", "🔥", "💧", "🌪️", "🌍", "🪐", "☄️", "🛰️", "🐕", "🐶", "🐱", "🐸", "🐵",
  "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳",
  "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎",
  "🙌", "🔥", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵",
  "💴", "💶", "💷", "🍌", "🍕", "🍻", "🍼", "🧠", "👽", "🤖", "👻", "💀", "🤡",
  "🐂", "🐻", "🦍", "🐕‍🦺", "🦴", "🥩", "🍗", "🧀", "🌮", "🍔", "🍟", "🥑",
];

const BTC_PRICE_USD = 64230;
const NGN_PER_USD = 1500;
const BTC_PRICE_NGN = BTC_PRICE_USD * NGN_PER_USD;

const MARKETS = [
  { symbol: "BTC", name: "Bitcoin", price: BTC_PRICE_USD, change: "+2.4%", up: true, icon: "₿" },
  { symbol: "ETH", name: "Ethereum", price: 3450, change: "-1.2%", up: false, icon: "Ξ" },
  { symbol: "CHR", name: "Charcoal", price: 42.5, change: "+0.8%", up: true, icon: "🌾" },
  { symbol: "SOL", name: "Solana", price: 145.2, change: "-0.5%", up: false, icon: "◎" },
  { symbol: "DOGE", name: "Dogecoin", price: 0.15, change: "+5.2%", up: true, icon: "Ð" },
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

function DemoGreeting() {
  const t = useTranslations("Demo");
  const [greeting, setGreeting] = useState({
    text: t("goodEvening"),
    icon: <Sun size={16} fill="currentColor" />,
    color: "text-amber-500",
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting({ text: t("goodMorning"), icon: <Sunrise size={16} fill="currentColor" />, color: "text-amber-500" });
    else if (hour >= 12 && hour < 17) setGreeting({ text: t("goodAfternoon"), icon: <Sun size={16} fill="currentColor" />, color: "text-orange-500" });
    else if (hour >= 17 && hour < 21) setGreeting({ text: t("goodEvening"), icon: <Sunset size={16} fill="currentColor" />, color: "text-rose-500" });
    else setGreeting({ text: t("goodNight"), icon: <Moon size={16} fill="currentColor" />, color: "text-indigo-400" });
  }, [t]);

  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-1 sm:gap-2 mb-0.5 whitespace-nowrap">
        <span className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">
          {greeting.text},
        </span>
        <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className={`${greeting.color} shrink-0`}>
          {greeting.icon}
        </motion.div>
      </div>
      <h1 className="text-lg sm:text-xl font-extrabold text-lime-950 dark:text-white tracking-tight truncate max-w-[120px] xs:max-w-[150px] sm:max-w-none">
        {t("demoTrader")}
      </h1>
    </div>
  );
}

function TradeSparkline({ status }: { status: string }) {
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

export default function DemoPage() {
  const t = useTranslations("Demo");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openModal } = useDevModal();
  const [showExitModal, setShowExitModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // 👇 DB STATE
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [baseAsset, setBaseAsset] = useState("BTC");
  const [quoteAsset, setQuoteAsset] = useState("USD");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState("market");
  const [amount, setAmount] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const pairParam = searchParams.get("pair");

  useEffect(() => {
    setMounted(true);
    if (pairParam) {
      const [b, q] = pairParam.split("-");
      setBaseAsset(b);
      setQuoteAsset(q || "USD");
    }
    
    // 👇 FETCH OR CREATE SESSION
    async function init() {
      const data = await getDemoSessionAction();
      setSession(data);
      setIsLoading(false);
    }
    init();
  }, [pairParam]);

  const activePairSymbol = `${baseAsset}/${quoteAsset}`;
  const activeMarket = MARKETS.find(m => m.symbol === baseAsset) || MARKETS[0];
  const activePrice = activeMarket.price;

  const watermarks = useMemo(
    () =>
      WATERMARK_SYMBOLS.flatMap((symbol, i) =>
        Array.from({ length: 4 }).map((_, j) => ({
          symbol,
          rotation: ((i * 13 + j * 7) % 60) - 30,
          top: `${(i * 17 + j * 23) % 100}%`,
          left: `${(i * 29 + j * 11) % 100}%`,
          scale: 1 + ((i + j) % 3) * 0.4,
        }))
      ),
    []
  );

  const totalNgn = session ? session.ngnBalance + session.btcBalance * BTC_PRICE_NGN : 0;

  const executeTrade = async () => {
    if (!session) return;
    
    // Check if user already has an open position in demo
    const activePositions = session.positions.filter((p: any) => p.status !== "closed");
    if (activePositions.length > 0) {
      openModal(
        t("signInRequired"), 
        t("signInPrompt"), 
        "info",
        { label: t("signIn"), onClick: () => router.push("/login") }
      );
      return;
    }

    const rawAmount = amount.replace(/,/g, "");
    const qty = parseFloat(rawAmount);

    if (!qty || qty <= 0) {
      setFeedback({ type: "error", msg: t("invalidAmount") });
      return;
    }

    setIsExecuting(true);
    setFeedback(null);

    const res = await executeDemoTradeAction({
      pair: activePairSymbol,
      side: tradeType,
      amount: qty,
      price: activePrice,
    });

    setIsExecuting(false);

    if (res.error) {
      setFeedback({ type: "error", msg: res.error });
    } else {
      setAmount("");
      setTakeProfit("");
      setStopLoss("");
      // Re-fetch session to get updated balances
      const updatedData = await getDemoSessionAction();
      setSession(updatedData);
      
      router.push(`/terminal?pair=${activePairSymbol.replace('/', '-')}&tradeId=${res.tradeId}`);
    }
  };

  if (!mounted || isLoading || !session) return null;

  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans pb-12 transition-colors duration-300 w-full max-w-[100vw]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {watermarks.map((wm, idx) => (
          <span
            key={idx}
            className="absolute text-4xl md:text-6xl font-bold text-lime-900/[0.04] dark:text-lime-100/[0.02]"
            style={{
              transform: `rotate(${wm.rotation}deg) scale(${wm.scale})`,
              top: wm.top,
              left: wm.left,
            }}
          >
            {wm.symbol}
          </span>
        ))}
      </div>

      <div className="absolute top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-50 bg-lime-600 text-white text-center py-2 text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md">
        <Flame className="text-amber-500" size={16} /> {t("demoModeBanner")}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6 pb-12 pt-6 px-2 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-8 opacity-[0.03] dark:opacity-[0.02]">
              <Wallet size={200} strokeWidth={1} />
            </div>

            <div className="flex flex-col gap-6 w-full relative z-10 h-full">
              
              <div className="flex justify-between items-center sm:flex-col sm:items-start sm:gap-4 w-full gap-4 min-w-0">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full shrink-0">
                    <div className="w-full h-full rounded-full overflow-hidden border-[4px] border-white dark:border-[#1a261d] bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center shadow-xl">
                      <Sparkles size={24} className="text-white sm:w-7 sm:h-7" />
                    </div>
                  </div>
                  <DemoGreeting />
                </div>

                <div className="flex flex-col items-end sm:items-start justify-center shrink-0 sm:mt-2">
                  <span className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 mb-0.5 sm:mb-1 whitespace-nowrap">
                    {t("demoBalance")}
                  </span>
                  <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                    <span className="text-sm sm:text-lg font-extrabold text-lime-950 dark:text-white">₦</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-lime-950 dark:text-white tracking-tight">
                      {totalNgn.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-md mt-auto pt-2">
                <div className="flex-1 flex flex-col rounded-xl px-3 py-2 bg-white/50 dark:bg-[#121A14]/60 border border-lime-500/20">
                  <span className="text-[9px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">
                    BTC
                  </span>
                  <span className="text-sm font-mono font-bold text-lime-950 dark:text-white">
                    ₿ {session.btcBalance.toFixed(4)}
                  </span>
                </div>
                <Button
                  onClick={() => setShowExitModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#5d9e17] text-white rounded-xl text-sm sm:text-base font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20 h-auto"
                >
                  <LogIn size={18} /> {t("goLive")}
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-lime-500" /> {t("favorablePairs")}
              </h3>
              <span className="text-[10px] font-bold bg-lime-500/10 text-lime-600 dark:text-lime-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {t("demo")}
              </span>
            </div>
            <div className="space-y-2">
              {[ 
                { symbol: "BTC/USD", name: "Bitcoin", change: "+2.4%", up: true, icon: "₿" },
                { symbol: "ETH/USD", name: "Ethereum", change: "+1.2%", up: true, icon: "Ξ" },
                { symbol: "SOL/USD", name: "Solana", change: "+5.1%", up: true, icon: "◎" },
                { symbol: "CHR-NGN", name: "Charcoal", change: "+0.8%", up: true, icon: "🌾" },
              ].map((p) => (
                <div
                  key={p.symbol}
                  onClick={() => router.push('/markets?select=base&returnUrl=/demo')}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-[#121A14]/40 border border-lime-500/10 hover:border-lime-500/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold text-sm">
                      {p.icon}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-lime-950 dark:text-white">{p.symbol}</div>
                      <div className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{p.name}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-500">{p.change}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-xl"
            >
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-600 dark:text-lime-400">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-lime-950 dark:text-white text-lg">{t("tierAccount")}</h3>
                  <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">
                    {t("unlocked")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
                  <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]" />
                </div>
                <span className="text-xs font-bold text-lime-600 dark:text-lime-400">
                  {t("earnXp")}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl"
            >
              <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
                <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                  <Activity size={18} className="text-lime-500" /> {t("activePositions")}
                </h3>
                <span className="text-xs font-bold text-lime-600 dark:text-lime-400">
                  {session.positions.filter((p: any) => p.status !== "closed").length} {t("open")}
                </span>
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
                    {session.positions.map((pos: any) => (
                      <tr 
                        key={pos.id} 
                        onClick={() => router.push(`/terminal?pair=${pos.asset.replace('/', '-')}&tradeId=${pos.id}`)}
                        className="hover:bg-lime-500/5 transition-colors cursor-pointer"
                      >
                        <td className="px-3 sm:px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.type === "Long" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                              {pos.type}
                            </span>
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl"
            >
              <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
                <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                  <Wallet size={18} className="text-lime-500" /> {t("recentActivity")}
                </h3>
                <span className="text-xs font-bold text-lime-600 dark:text-lime-400">
                  {session.activity.length} {t("entries")}
                </span>
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
                    {session.activity.map((tx: any) => (
                      <tr 
                        key={tx.id} 
                        onClick={() => tx.type === 'Trade' ? router.push(`/terminal?pair=${tx.asset.replace('/', '-')}&tradeId=${tx.id}`) : null}
                        className={`transition-colors ${tx.type === 'Trade' ? 'cursor-pointer hover:bg-lime-500/5' : ''}`}
                      >
                        <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white">{tx.type}</td>
                        <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{tx.asset}</td>
                        <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${tx.type === "Deposit" ? "text-green-500" : tx.type === "Withdrawal" ? "text-red-500" : "text-lime-950 dark:text-white"}`}>
                          {tx.amount}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${tx.status === "Completed" || tx.status === "Filled" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}>
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
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
                    <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]" /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>{t("riskRewardRatio")}</span> <span>1 : 2.4</span></div>
                    <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]" /></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative"
            >
              <h3 className="font-bold text-lime-950 dark:text-white mb-4">{t("quickTrade")}</h3>

              <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
                <button
                  onClick={() => setTradeType("buy")}
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "buy" ? "bg-green-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}
                >
                  {t("buy")}
                </button>
                <button
                  onClick={() => setTradeType("sell")}
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "sell" ? "bg-red-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}
                >
                  {t("sell")}
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <Link 
                    href="/markets?select=base&returnUrl=/demo"
                    className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-lime-950 dark:text-white group-hover:text-lime-600 transition-colors">{baseAsset}</span>
                    </div>
                    <ChevronDown size={14} className="text-lime-500 shrink-0" />
                  </Link>
                  <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>
                  <Link 
                    href="/markets?select=quote&returnUrl=/demo"
                    className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-lime-950 dark:text-white group-hover:text-lime-600 transition-colors">{quoteAsset}</span>
                    </div>
                    <ChevronDown size={14} className="text-lime-500 shrink-0" />
                  </Link>
                </div>

                <div className="relative">
                  <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none pr-8">
                    <option value="market">{t("marketOrder")}</option>
                    <option value="limit">{t("limitOrder")}</option>
                    <option value="stop">{t("stopLoss")}</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
                    <span>{t("amount")}</span>
                    <span>
                      {t("available")}:{" "}
                      {quoteAsset === "BTC"
                        ? `₿ ${session.btcBalance.toFixed(4)}`
                        : `₦ ${session.ngnBalance.toLocaleString()}`}
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(formatNumber(e.target.value))}
                    className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono"
                  />
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

              {feedback && (
                <div
                  className={`mb-3 p-2 rounded-lg text-xs font-bold ${
                    feedback.type === "success"
                      ? "bg-green-500/10 text-green-600 border border-green-500/20"
                      : "bg-red-500/10 text-red-600 border border-red-500/20"
                  }`}
                >
                  {feedback.msg}
                </div>
              )}

              <Button
                onClick={executeTrade}
                disabled={isExecuting || !amount || parseFloat(amount.replace(/,/g, "")) <= 0}
                className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === "buy" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}
              >
                {isExecuting ? <Loader2 className="animate-spin" size={18} /> : t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
              </Button>

              <p className="text-[10px] text-center mt-3 text-lime-800/50 dark:text-lime-200/40 font-medium">
                {t("simulated")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
                <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
                  <Flame size={18} className="text-orange-500" /> {t("marketWatch")}
                </h3>
                <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
                  {t("viewAll")}
                </Link>
              </div>
              <div className="divide-y divide-lime-500/5">
                {MARKETS.map((market) => (
                  <div 
                    key={market.symbol} 
                    onClick={() => router.push(`/terminal?pair=${market.symbol}-USD`)}
                    className="p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
                        {market.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                          {market.symbol}/USD
                        </p>
                        <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">
                        ${market.price.toLocaleString()}
                      </p>
                      <p className={`text-xs font-bold flex items-center justify-end ${market.up ? "text-green-500" : "text-red-500"}`}>
                        {market.up ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                        {market.change}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden"
            >
              <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none">
                <Award size={100} />
              </div>
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-lime-950 dark:text-white">{t("levelTrader", { level: 4 })}</h3>
                  <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">
                    1,200 / 1,500 XP
                  </p>
                </div>
              </div>
              <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10">
                <div className="h-full bg-lime-500 rounded-full w-[80%]" />
              </div>
              <Link
                href="/dashboard/rewards"
                className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10"
              >
                {t("viewRewards")} <ChevronRight size={14} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl"
            >
              <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
                <Newspaper size={18} className="text-blue-500" /> {t("marketNews")}
              </h3>
              <div className="space-y-4">
                {NEWS.map((news, i) => (
                  <div key={i} className="group cursor-pointer">
                    <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">
                      {news.time} • {news.source}
                    </p>
                    <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">
                      {news.title}
                    </h4>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#f4fbf5] dark:bg-[#121A14] rounded-3xl p-6 shadow-2xl border border-lime-500/20 text-center"
            >
              <button
                onClick={() => setShowExitModal(false)}
                className="cursor-pointer absolute top-4 right-4 text-lime-600 hover:text-lime-800 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 mx-auto bg-lime-100 dark:bg-lime-900/50 rounded-full flex items-center justify-center mb-4">
                <LogOut className="text-lime-600 dark:text-lime-400" size={32} />
              </div>

              <h2 className="text-xl font-bold text-lime-950 dark:text-white mb-2">
                {t("readyToTrade")}
              </h2>
              <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mb-6 font-medium">
                {t("createAccountPrompt")}
              </p>

              <div className="space-y-3">
                <Link
                  href="/login"
                  className="w-full bg-lime-600 cursor-pointer hover:bg-lime-700 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <LogIn size={18} /> {t("logIn")}
                </Link>
                <Link
                  href="/login"
                  className="w-full border border-lime-500/30 bg-white/50 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 text-lime-950 dark:text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <UserPlus size={18} /> {t("signUp")}
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// // app/demo/page.tsx
// "use client";

// import { useState, useEffect, useMemo } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import Link from "next/link";
// import { useTranslations } from "next-intl"; // 👈 Imported for i18n
// import {
//   TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck, Flame,
//   Newspaper, ChevronRight, Award, Zap, Wallet, ArrowUp, ArrowDown,
//   LogOut, LogIn, UserPlus, X, ChevronDown, Sparkles, Sun, Sunrise,
//   Sunset, Moon,
// } from "lucide-react";
// import { Button } from "@/components/ui/Button";
// import { useDevModal } from "@/components/providers/DevModalProvider";

// // ─────────────────────────────────────────────────────────────────────────────
// // Watermarks & Constants
// // ─────────────────────────────────────────────────────────────────────────────
// const WATERMARK_SYMBOLS = [
//   "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲",
//   "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰",
//   "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$",
//   "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "лв", "din", "ден",
//   "L", "Q", "B/.", "₡", "₲", "Gs", "S/.", "Bs.", "$U", "RD$", "J$", "TT$",
//   "Bds$", "EC$", "FJ$", "WS$", "T$", "VT", "K", "T", "₭", "₮", "៛", "₫", "Rp",
//   "RM", "S$", "฿", "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ",
//   "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ",
//   "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨",
//   "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦", "✕",
//   "✖", "☰", "⛓", "🔗", "🌐", "⚙️", "🧩", "🧮", "📈", "📉", "⚖️", "🛡️", "🔑", "🗝️",
//   "🧊", "🔥", "💧", "🌪️", "🌍", "🪐", "☄️", "🛰️", "🐕", "🐶", "🐱", "🐸", "🐵",
//   "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳",
//   "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎",
//   "🙌", "🔥", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵",
//   "💴", "💶", "💷", "🍌", "🍕", "🍻", "🍼", "🧠", "👽", "🤖", "👻", "💀", "🤡",
//   "🐂", "🐻", "🦍", "🐕‍🦺", "🦴", "🥩", "🍗", "🧀", "🌮", "🍔", "🍟", "🥑",
// ];

// const BTC_PRICE_USD = 64230;
// const NGN_PER_USD = 1500;
// const BTC_PRICE_NGN = BTC_PRICE_USD * NGN_PER_USD;

// const MARKETS = [
//   { symbol: "BTC", name: "Bitcoin", price: BTC_PRICE_USD, change: "+2.4%", up: true, icon: "₿" },
//   { symbol: "ETH", name: "Ethereum", price: 3450, change: "-1.2%", up: false, icon: "Ξ" },
//   { symbol: "CHR", name: "Charcoal", price: 42.5, change: "+0.8%", up: true, icon: "🌾" },
//   { symbol: "SOL", name: "Solana", price: 145.2, change: "-0.5%", up: false, icon: "◎" },
//   { symbol: "DOGE", name: "Dogecoin", price: 0.15, change: "+5.2%", up: true, icon: "Ð" },
// ];

// const FIAT = [
//   { symbol: "USD", name: "US Dollar", icon: "$" },
//   { symbol: "NGN", name: "Nigerian Naira", icon: "₦" },
// ];

// const NEWS = [
//   { time: "10m ago", title: "Bitcoin breaks $67k resistance amid ETF inflows", source: "Bloomberg" },
//   { time: "1h ago", title: "SEC delays decision on Ethereum spot ETF", source: "Reuters" },
//   { time: "3h ago", title: "Global commodity prices stabilize after recent surge", source: "Financial Times" },
// ];

// const INITIAL_POSITIONS = [
//   { id: "demo-1", asset: "BTC/USD", type: "Long", size: "0.5 BTC", entry: "$64,200", current: "$67,430", pnl: "+$1,615", pnlPct: "+2.5%", isProfit: true, tp: "$68,000", sl: "$63,000", status: "increasing" as const },
//   { id: "demo-2", asset: "ETH/USD", type: "Short", size: "2.0 ETH", entry: "$3,600", current: "$3,450", pnl: "+$300", pnlPct: "+4.1%", isProfit: true, tp: "$3,400", sl: "$3,700", status: "stable" as const },
//   { id: "demo-3", asset: "SOL/USD", type: "Long", size: "10 SOL", entry: "$150", current: "$145", pnl: "-$50", pnlPct: "-3.3%", isProfit: false, tp: "$160", sl: "$140", status: "falling" as const },
// ];

// const INITIAL_ACTIVITY = [
//   { id: "demo-a1", type: "Deposit", asset: "USDT", amount: "+500.00", status: "Completed", date: "Today, 10:45 AM" },
//   { id: "demo-a2", type: "Withdrawal", asset: "DOGE", amount: "-2,500", status: "Pending", date: "Yesterday, 4:20 PM" },
//   { id: "demo-a3", type: "Trade", asset: "BTC/USD", amount: "Long", status: "Filled", date: "Yesterday, 9:00 AM" },
// ];

// // 👇 Place Value Formatter (Auto-Commas)
// const formatNumber = (value: string) => {
//   const cleanValue = value.replace(/[^0-9.]/g, "");
//   const parts = cleanValue.split(".");
//   parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//   return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
// };

// function DemoGreeting() {
//   const t = useTranslations("Demo"); // 👈 Init inside helper
//   const [greeting, setGreeting] = useState({
//     text: t("goodEvening"),
//     icon: <Sun size={16} fill="currentColor" />,
//     color: "text-amber-500",
//   });

//   useEffect(() => {
//     const hour = new Date().getHours();
//     if (hour >= 5 && hour < 12) {
//       setGreeting({ text: t("goodMorning"), icon: <Sunrise size={16} fill="currentColor" />, color: "text-amber-500" });
//     } else if (hour >= 12 && hour < 17) {
//       setGreeting({ text: t("goodAfternoon"), icon: <Sun size={16} fill="currentColor" />, color: "text-orange-500" });
//     } else if (hour >= 17 && hour < 21) {
//       setGreeting({ text: t("goodEvening"), icon: <Sunset size={16} fill="currentColor" />, color: "text-rose-500" });
//     } else {
//       setGreeting({ text: t("goodNight"), icon: <Moon size={16} fill="currentColor" />, color: "text-indigo-400" });
//     }
//   }, [t]);

//   return (
//     <div className="flex flex-col min-w-0">
//       <div className="flex items-center gap-1 sm:gap-2 mb-0.5 whitespace-nowrap">
//         <span className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">
//           {greeting.text},
//         </span>
//         <motion.div
//           animate={{ y: [0, -2, 0] }}
//           transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
//           className={`${greeting.color} shrink-0`}
//         >
//           {greeting.icon}
//         </motion.div>
//       </div>
//       <h1 className="text-lg sm:text-xl font-extrabold text-lime-950 dark:text-white tracking-tight truncate max-w-[120px] xs:max-w-[150px] sm:max-w-none">
//         {t("demoTrader")}
//       </h1>
//     </div>
//   );
// }

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

// export default function DemoPage() {
//   const t = useTranslations("Demo"); // 👈 Initialize translator
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { openModal } = useDevModal();
//   const [showExitModal, setShowExitModal] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   const [ngnBalance, setNgnBalance] = useState(4_250_000);
//   const [btcBalance, setBtcBalance] = useState(0.045);

//   const [baseAsset, setBaseAsset] = useState("BTC");
//   const [quoteAsset, setQuoteAsset] = useState("USD");
//   const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
//   const [orderType, setOrderType] = useState("market");
//   const [amount, setAmount] = useState("");
//   const [takeProfit, setTakeProfit] = useState("");
//   const [stopLoss, setStopLoss] = useState("");

//   const [positions, setPositions] = useState<any[]>(INITIAL_POSITIONS);
//   const [activity, setActivity] = useState<any[]>(INITIAL_ACTIVITY);
//   const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

//   const pairParam = searchParams.get("pair");

//   useEffect(() => {
//     setMounted(true);
//     if (pairParam) {
//       const [b, q] = pairParam.split("-");
//       setBaseAsset(b);
//       setQuoteAsset(q || "USD");
//     }
//   }, [pairParam]);

//   const activePairSymbol = `${baseAsset}/${quoteAsset}`;
//   const activeMarket = MARKETS.find(m => m.symbol === baseAsset) || MARKETS[0];
//   const activePrice = activeMarket.price;

//   const watermarks = useMemo(
//     () =>
//       WATERMARK_SYMBOLS.flatMap((symbol, i) =>
//         Array.from({ length: 4 }).map((_, j) => ({
//           symbol,
//           rotation: ((i * 13 + j * 7) % 60) - 30,
//           top: `${(i * 17 + j * 23) % 100}%`,
//           left: `${(i * 29 + j * 11) % 100}%`,
//           scale: 1 + ((i + j) % 3) * 0.4,
//         }))
//       ),
//     []
//   );

//   const totalNgn = ngnBalance + btcBalance * BTC_PRICE_NGN;

//   const executeTrade = () => {
//     const activePositions = positions.filter(p => p.status !== "closed");
//     if (activePositions.length > 0) {
//       openModal(
//         t("signInRequired"), 
//         t("signInPrompt"), 
//         "info",
//         { label: t("signIn"), onClick: () => router.push("/login") }
//       );
//       return;
//     }

//     const rawAmount = amount.replace(/,/g, "");
//     const qty = parseFloat(rawAmount);

//     if (!qty || qty <= 0) {
//       setFeedback({ type: "error", msg: t("invalidAmount") });
//       return;
//     }

//     if (quoteAsset === "NGN") {
//       const cost = qty * activePrice * NGN_PER_USD;
//       if (cost > ngnBalance) {
//         setFeedback({ type: "error", msg: t("insufficientNgn") });
//         return;
//       }
//       setNgnBalance((v) => v - cost);
//     } else {
//       const cost = qty * activePrice;
//       if (cost > btcBalance * BTC_PRICE_USD) {
//          setFeedback({ type: "error", msg: t("insufficientUsd") });
//          return;
//       }
//       setBtcBalance((v) => v - (cost / BTC_PRICE_USD));
//     }

//     const newPosId = `demo-pos-${Date.now()}`;
//     const newPos = {
//       id: newPosId,
//       asset: activePairSymbol,
//       type: tradeType === "buy" ? "Long" : "Short",
//       size: `${qty} ${baseAsset}`,
//       entry: `$${activePrice.toFixed(2)}`,
//       current: `$${activePrice.toFixed(2)}`,
//       pnl: "$0.00",
//       pnlPct: "0%",
//       isProfit: true,
//       tp: takeProfit || null,
//       sl: stopLoss || null,
//       status: "increasing"
//     };

//     setPositions([newPos, ...positions.filter(p => p.status === "closed")]);
//     setActivity((prev) => [
//       {
//         id: `demo-act-${Date.now()}`,
//         type: "Trade",
//         asset: activePairSymbol,
//         amount: tradeType === "buy" ? "Long" : "Short",
//         status: "Filled",
//         date: t("justNow"),
//       },
//       ...prev,
//     ]);

//     setAmount("");
//     setTakeProfit("");
//     setStopLoss("");
    
//     router.push(`/terminal?pair=${activePairSymbol.replace('/', '-')}&tradeId=${newPosId}`);
//   };

//   if (!mounted) return null;

//   return (
//     <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans pb-12 transition-colors duration-300 w-full max-w-[100vw]">
//       <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
//         {watermarks.map((wm, idx) => (
//           <span
//             key={idx}
//             className="absolute text-4xl md:text-6xl font-bold text-lime-900/[0.04] dark:text-lime-100/[0.02]"
//             style={{
//               transform: `rotate(${wm.rotation}deg) scale(${wm.scale})`,
//               top: wm.top,
//               left: wm.left,
//             }}
//           >
//             {wm.symbol}
//           </span>
//         ))}
//       </div>

//       <div className="absolute top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0" />
//       <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0" />

//       <div className="relative z-50 bg-lime-600 text-white text-center py-2 text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md">
//         <Flame className="text-amber-500" size={16} /> {t("demoModeBanner")}
//       </div>

//       <div className="relative z-10 max-w-7xl mx-auto space-y-6 pb-12 pt-6 px-2 sm:px-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden"
//           >
//             <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-8 opacity-[0.03] dark:opacity-[0.02]">
//               <Wallet size={200} strokeWidth={1} />
//             </div>

//             <div className="flex flex-col gap-6 w-full relative z-10 h-full">
              
//               <div className="flex justify-between items-center sm:flex-col sm:items-start sm:gap-4 w-full gap-4 min-w-0">
//                 <div className="flex items-center gap-3 sm:gap-4 min-w-0">
//                   <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full shrink-0">
//                     <div className="w-full h-full rounded-full overflow-hidden border-[4px] border-white dark:border-[#1a261d] bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center shadow-xl">
//                       <Sparkles size={24} className="text-white sm:w-7 sm:h-7" />
//                     </div>
//                   </div>
//                   <DemoGreeting />
//                 </div>

//                 <div className="flex flex-col items-end sm:items-start justify-center shrink-0 sm:mt-2">
//                   <span className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 mb-0.5 sm:mb-1 whitespace-nowrap">
//                     {t("demoBalance")}
//                   </span>
//                   <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
//                     <span className="text-sm sm:text-lg font-extrabold text-lime-950 dark:text-white">₦</span>
//                     <span className="text-xl sm:text-2xl font-extrabold text-lime-950 dark:text-white tracking-tight">
//                       {totalNgn.toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-md mt-auto pt-2">
//                 <div className="flex-1 flex flex-col rounded-xl px-3 py-2 bg-white/50 dark:bg-[#121A14]/60 border border-lime-500/20">
//                   <span className="text-[9px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">
//                     BTC
//                   </span>
//                   <span className="text-sm font-mono font-bold text-lime-950 dark:text-white">
//                     ₿ {btcBalance.toFixed(4)}
//                   </span>
//                 </div>
//                 <Button
//                   onClick={() => setShowExitModal(true)}
//                   className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[#5d9e17] text-white rounded-xl text-sm sm:text-base font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20 h-auto"
//                 >
//                   <LogIn size={18} /> {t("goLive")}
//                 </Button>
//               </div>
//             </div>
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.1 }}
//             className="bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full overflow-hidden"
//           >
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                 <TrendingUp size={18} className="text-lime-500" /> {t("favorablePairs")}
//               </h3>
//               <span className="text-[10px] font-bold bg-lime-500/10 text-lime-600 dark:text-lime-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
//                 {t("demo")}
//               </span>
//             </div>
//             <div className="space-y-2">
//               {[ 
//                 { symbol: "BTC/USD", name: "Bitcoin", change: "+2.4%", up: true, icon: "₿" },
//                 { symbol: "ETH/USD", name: "Ethereum", change: "+1.2%", up: true, icon: "Ξ" },
//                 { symbol: "SOL/USD", name: "Solana", change: "+5.1%", up: true, icon: "◎" },
//                 { symbol: "CHR-NGN", name: "Charcoal", change: "+0.8%", up: true, icon: "🌾" },
//               ].map((p) => (
//                 <div
//                   key={p.symbol}
//                   onClick={() => router.push('/markets?select=base&returnUrl=/demo')}
//                   className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-[#121A14]/40 border border-lime-500/10 hover:border-lime-500/30 transition-colors cursor-pointer"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold text-sm">
//                       {p.icon}
//                     </div>
//                     <div>
//                       <div className="font-bold text-sm text-lime-950 dark:text-white">{p.symbol}</div>
//                       <div className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{p.name}</div>
//                     </div>
//                   </div>
//                   <span className="text-xs font-bold text-green-500">{p.change}</span>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
//           <div className="lg:col-span-2 space-y-6">
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.15 }}
//               className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-xl"
//             >
//               <div className="flex items-center gap-4 mb-4 sm:mb-0">
//                 <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-600 dark:text-lime-400">
//                   <ShieldCheck size={32} />
//                 </div>
//                 <div>
//                   <h3 className="font-bold text-lime-950 dark:text-white text-lg">{t("tierAccount")}</h3>
//                   <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium">
//                     {t("unlocked")}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
//                 <div className="w-full sm:w-48 bg-white/50 dark:bg-[#050806]/80 rounded-full h-2 overflow-hidden border border-lime-500/20 mb-2 shadow-inner">
//                   <div className="bg-lime-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(132,204,22,0.8)]" />
//                 </div>
//                 <span className="text-xs font-bold text-lime-600 dark:text-lime-400">
//                   {t("earnXp")}
//                 </span>
//               </div>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2 }}
//               className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl"
//             >
//               <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//                 <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                   <Activity size={18} className="text-lime-500" /> {t("activePositions")}
//                 </h3>
//                 <span className="text-xs font-bold text-lime-600 dark:text-lime-400">
//                   {positions.filter((p: any) => p.status !== "closed").length} {t("open")}
//                 </span>
//               </div>
//               <div className="w-full overflow-x-auto custom-scrollbar pb-2">
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
//                     {positions.map((pos) => (
//                       <tr 
//                         key={pos.id} 
//                         onClick={() => router.push(`/terminal?pair=${pos.asset.replace('/', '-')}&tradeId=${pos.id}`)}
//                         className="hover:bg-lime-500/5 transition-colors cursor-pointer"
//                       >
//                         <td className="px-3 sm:px-4 py-3">
//                           <div className="flex items-center gap-2">
//                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.type === "Long" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
//                               {pos.type}
//                             </span>
//                             <span className="font-bold text-lime-950 dark:text-white">{pos.asset}</span>
//                           </div>
//                         </td>
//                         <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{pos.size}</td>
//                         <td className="px-3 sm:px-4 py-3 font-mono text-lime-800/60 dark:text-lime-200/50">{pos.entry}</td>
//                         <td className="px-3 sm:px-4 py-3 font-mono text-lime-950 dark:text-white">{pos.current}</td>
//                         <td className="px-3 sm:px-4 py-3 flex justify-center">
//                           <TradeSparkline status={pos.status as any} />
//                         </td>
//                         <td className={`px-3 sm:px-4 py-3 text-right font-bold font-mono ${pos.isProfit ? "text-green-500" : "text-red-500"}`}>
//                           {pos.pnl} <span className="text-xs opacity-70">({pos.pnlPct})</span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.22 }}
//               className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl"
//             >
//               <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//                 <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                   <Wallet size={18} className="text-lime-500" /> {t("recentActivity")}
//                 </h3>
//                 <span className="text-xs font-bold text-lime-600 dark:text-lime-400">
//                   {activity.length} {t("entries")}
//                 </span>
//               </div>
//               <div className="w-full overflow-x-auto custom-scrollbar pb-2">
//                 <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
//                   <thead className="text-xs text-lime-800/50 dark:text-lime-200/40 bg-lime-500/5">
//                     <tr>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("type")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("asset")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("amount")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold">{t("status")}</th>
//                       <th className="px-3 sm:px-4 py-3 font-semibold text-right">{t("date")}</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-lime-500/10">
//                     {activity.map((tx) => (
//                       <tr 
//                         key={tx.id} 
//                         onClick={() => tx.type === 'Trade' ? router.push(`/terminal?pair=${tx.asset.replace('/', '-')}&tradeId=${tx.id}`) : null}
//                         className={`transition-colors ${tx.type === 'Trade' ? 'cursor-pointer hover:bg-lime-500/5' : ''}`}
//                       >
//                         <td className="px-3 sm:px-4 py-3 font-bold text-lime-950 dark:text-white">{tx.type}</td>
//                         <td className="px-3 sm:px-4 py-3 font-mono text-lime-800 dark:text-lime-200">{tx.asset}</td>
//                         <td className={`px-3 sm:px-4 py-3 font-mono font-bold ${tx.type === "Deposit" ? "text-green-500" : tx.type === "Withdrawal" ? "text-red-500" : "text-lime-950 dark:text-white"}`}>
//                           {tx.amount}
//                         </td>
//                         <td className="px-3 sm:px-4 py-3">
//                           <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${tx.status === "Completed" || tx.status === "Filled" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}>
//                             {tx.status}
//                           </span>
//                         </td>
//                         <td className="px-3 sm:px-4 py-3 text-right text-xs text-lime-800/50 dark:text-lime-200/40">{tx.date}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.25 }}
//               className="grid grid-cols-1 sm:grid-cols-2 gap-6"
//             >
//               <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex items-center gap-6">
//                 <div className="w-24 h-24 rounded-full shrink-0" style={{ background: "conic-gradient(#84cc16 0% 60%, #3b82f6 60% 85%, #f59e0b 85% 100%)" }}>
//                   <div className="w-16 h-16 bg-[#f4fbf5] dark:bg-[#0a0f0b] rounded-full m-auto translate-y-4 flex items-center justify-center">
//                     <PieChart size={20} className="text-lime-500" />
//                   </div>
//                 </div>
//                 <div>
//                   <h4 className="text-sm font-bold text-lime-950 dark:text-white mb-2">{t("assetAllocation")}</h4>
//                   <div className="space-y-1 text-xs font-medium">
//                     <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-lime-500">● {t("crypto")}</span> <span>60%</span></div>
//                     <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-blue-500">● {t("commodities")}</span> <span>25%</span></div>
//                     <div className="flex justify-between w-32 text-lime-800 dark:text-lime-200"><span className="text-amber-500">● {t("fiat")}</span> <span>15%</span></div>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
//                 <div className="flex justify-between items-center mb-4">
//                   <h4 className="text-sm font-bold text-lime-950 dark:text-white">{t("riskMetrics")}</h4>
//                   <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded">{t("lowRisk")}</span>
//                 </div>
//                 <div className="space-y-3">
//                   <div>
//                     <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>{t("maxDrawdown")}</span> <span>4.2%</span></div>
//                     <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]" /></div>
//                   </div>
//                   <div>
//                     <div className="flex justify-between text-xs font-semibold mb-1 text-lime-800/70 dark:text-lime-200/60"><span>{t("riskRewardRatio")}</span> <span>1 : 2.4</span></div>
//                     <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[70%]" /></div>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           </div>

//           <div className="space-y-6">
//             <motion.div
//               initial={{ opacity: 0, x: 20 }}
//               animate={{ opacity: 1, x: 0 }}
//               className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl relative"
//             >
//               <h3 className="font-bold text-lime-950 dark:text-white mb-4">{t("quickTrade")}</h3>

//               <div className="flex p-1 bg-lime-100/50 dark:bg-[#121A14] rounded-xl mb-4 border border-lime-500/10">
//                 <button
//                   onClick={() => setTradeType("buy")}
//                   className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "buy" ? "bg-green-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}
//                 >
//                   {t("buy")}
//                 </button>
//                 <button
//                   onClick={() => setTradeType("sell")}
//                   className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${tradeType === "sell" ? "bg-red-500 text-white shadow-md" : "text-lime-800 dark:text-lime-200"}`}
//                 >
//                   {t("sell")}
//                 </button>
//               </div>

//               <div className="space-y-3 mb-4">
//                 <div className="flex items-center gap-2">
//                   <Link 
//                     href="/markets?select=base&returnUrl=/demo"
//                     className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
//                   >
//                     <div className="flex items-center gap-2">
//                       <span className="font-bold text-sm text-lime-950 dark:text-white group-hover:text-lime-600 transition-colors">{baseAsset}</span>
//                     </div>
//                     <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                   </Link>
//                   <span className="text-lime-800/40 dark:text-lime-200/30 font-bold">/</span>
//                   <Link 
//                     href="/markets?select=quote&returnUrl=/demo"
//                     className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl hover:border-lime-500/50 transition-colors group"
//                   >
//                     <div className="flex items-center gap-2">
//                       <span className="font-bold text-sm text-lime-950 dark:text-white group-hover:text-lime-600 transition-colors">{quoteAsset}</span>
//                     </div>
//                     <ChevronDown size={14} className="text-lime-500 shrink-0" />
//                   </Link>
//                 </div>

//                 <div className="relative">
//                   <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 appearance-none pr-8">
//                     <option value="market">{t("marketOrder")}</option>
//                     <option value="limit">{t("limitOrder")}</option>
//                     <option value="stop">{t("stopLoss")}</option>
//                   </select>
//                   <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" />
//                 </div>

//                 <div>
//                   <div className="flex justify-between text-xs text-lime-800/60 dark:text-lime-200/50 mb-1 px-1">
//                     <span>{t("amount")}</span>
//                     <span>
//                       {t("available")}:{" "}
//                       {quoteAsset === "BTC"
//                         ? `₿ ${btcBalance.toFixed(4)}`
//                         : `₦ ${ngnBalance.toLocaleString()}`}
//                     </span>
//                   </div>
//                   <input
//                     type="text"
//                     inputMode="decimal"
//                     placeholder="0.00"
//                     value={amount}
//                     onChange={(e) => setAmount(formatNumber(e.target.value))}
//                     className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono"
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-2">
//                   <div>
//                     <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block px-1">{t("takeProfit")}</label>
//                     <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder={t("price")} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                   </div>
//                   <div>
//                     <label className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block px-1">{t("stopLoss")}</label>
//                     <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder={t("price")} className="w-full bg-white dark:bg-[#121A14] border border-lime-500/20 rounded-xl px-3 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 font-mono" />
//                   </div>
//                 </div>
//               </div>

//               {feedback && (
//                 <div
//                   className={`mb-3 p-2 rounded-lg text-xs font-bold ${
//                     feedback.type === "success"
//                       ? "bg-green-500/10 text-green-600 border border-green-500/20"
//                       : "bg-red-500/10 text-red-600 border border-red-500/20"
//                   }`}
//                 >
//                   {feedback.msg}
//                 </div>
//               )}

//               <Button
//                 onClick={executeTrade}
//                 disabled={!amount || parseFloat(amount.replace(/,/g, "")) <= 0}
//                 className={`w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${tradeType === "buy" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}
//               >
//                 {t("executeOrder", { type: tradeType === "buy" ? t("buy") : t("sell") })}
//               </Button>

//               <p className="text-[10px] text-center mt-3 text-lime-800/50 dark:text-lime-200/40 font-medium">
//                 {t("simulated")}
//               </p>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, x: 20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: 0.1 }}
//               className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl overflow-hidden"
//             >
//               <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//                 <h3 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//                   <Flame size={18} className="text-orange-500" /> {t("marketWatch")}
//                 </h3>
//                 <Link href="/markets" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline">
//                   {t("viewAll")}
//                 </Link>
//               </div>
//               <div className="divide-y divide-lime-500/5">
//                 {MARKETS.map((market) => (
//                   <div 
//                     key={market.symbol} 
//                     onClick={() => router.push(`/terminal?pair=${market.symbol}-USD`)}
//                     className="p-3 flex items-center justify-between hover:bg-lime-500/5 transition-colors cursor-pointer group"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold font-mono text-sm">
//                         {market.icon}
//                       </div>
//                       <div>
//                         <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
//                           {market.symbol}/USD
//                         </p>
//                         <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40">{market.name}</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-bold font-mono text-lime-950 dark:text-white">
//                         ${market.price.toLocaleString()}
//                       </p>
//                       <p className={`text-xs font-bold flex items-center justify-end ${market.up ? "text-green-500" : "text-red-500"}`}>
//                         {market.up ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
//                         {market.change}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, x: 20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: 0.15 }}
//               className="bg-gradient-to-br from-lime-500/20 to-green-500/10 dark:from-lime-500/10 dark:to-green-500/5 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden"
//             >
//               <div className="absolute -top-4 -right-4 text-lime-500/10 dark:text-lime-400/5 pointer-events-none">
//                 <Award size={100} />
//               </div>
//               <div className="flex items-center gap-3 mb-3 relative z-10">
//                 <div className="p-2 bg-lime-500 text-white rounded-lg shadow-lg shadow-lime-500/30">
//                   <Zap size={18} />
//                 </div>
//                 <div>
//                   <h3 className="font-bold text-lime-950 dark:text-white">{t("levelTrader", { level: 4 })}</h3>
//                   <p className="text-[10px] font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest">
//                     1,200 / 1,500 XP
//                   </p>
//                 </div>
//               </div>
//               <div className="h-2 w-full bg-lime-500/20 rounded-full overflow-hidden mb-3 relative z-10">
//                 <div className="h-full bg-lime-500 rounded-full w-[80%]" />
//               </div>
//               <Link
//                 href="/dashboard/rewards"
//                 className="flex items-center justify-between text-xs font-bold text-lime-700 dark:text-lime-300 hover:text-lime-900 transition-colors relative z-10"
//               >
//                 {t("viewRewards")} <ChevronRight size={14} />
//               </Link>
//             </motion.div>

//             <motion.div
//               initial={{ opacity: 0, x: 20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: 0.2 }}
//               className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-5 shadow-xl"
//             >
//               <h3 className="font-bold text-lime-950 dark:text-white mb-4 flex items-center gap-2">
//                 <Newspaper size={18} className="text-blue-500" /> {t("marketNews")}
//               </h3>
//               <div className="space-y-4">
//                 {NEWS.map((news, i) => (
//                   <div key={i} className="group cursor-pointer">
//                     <p className="text-[10px] text-lime-600 dark:text-lime-400 font-bold mb-0.5">
//                       {news.time} • {news.source}
//                     </p>
//                     <h4 className="text-xs font-bold text-lime-950 dark:text-white leading-snug group-hover:text-lime-600 transition-colors">
//                       {news.title}
//                     </h4>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </div>

//       <AnimatePresence>
//         {showExitModal && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
//           >
//             <motion.div
//               initial={{ scale: 0.9, y: 20 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.9, y: 20 }}
//               className="relative w-full max-w-sm bg-[#f4fbf5] dark:bg-[#121A14] rounded-3xl p-6 shadow-2xl border border-lime-500/20 text-center"
//             >
//               <button
//                 onClick={() => setShowExitModal(false)}
//                 className="cursor-pointer absolute top-4 right-4 text-lime-600 hover:text-lime-800 transition-colors"
//               >
//                 <X size={20} />
//               </button>

//               <div className="w-16 h-16 mx-auto bg-lime-100 dark:bg-lime-900/50 rounded-full flex items-center justify-center mb-4">
//                 <LogOut className="text-lime-600 dark:text-lime-400" size={32} />
//               </div>

//               <h2 className="text-xl font-bold text-lime-950 dark:text-white mb-2">
//                 {t("readyToTrade")}
//               </h2>
//               <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mb-6 font-medium">
//                 {t("createAccountPrompt")}
//               </p>

//               <div className="space-y-3">
//                 <Link
//                   href="/login"
//                   className="w-full bg-lime-600 cursor-pointer hover:bg-lime-700 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2 transition-colors"
//                 >
//                   <LogIn size={18} /> {t("logIn")}
//                 </Link>
//                 <Link
//                   href="/login"
//                   className="w-full border border-lime-500/30 bg-white/50 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 text-lime-950 dark:text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2 transition-colors"
//                 >
//                   <UserPlus size={18} /> {t("signUp")}
//                 </Link>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }