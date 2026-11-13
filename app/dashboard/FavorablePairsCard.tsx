// components/dashboard/FavorablePairsCard.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, Activity, ChevronDown, ArrowRight, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { getMarketSettings } from "@/app/actions/admin-market";
import { useDevModal } from "@/components/providers/DevModalProvider"; // 👈 ADDED

const COLORS = ["#84cc16", "#3b82f6", "#f59e0b", "#ec4899"]; 

export default function FavorablePairsCard({ 
  baseAsset = "", 
  quoteAsset = "",
  dbAssets = [],
  onSelectPair
}: { 
  baseAsset?: string;
  quoteAsset?: string;
  dbAssets?: any[];
  onSelectPair?: () => void;
}) {
  const t = useTranslations("FavorablePairsCard");
  const router = useRouter(); 
  const { openModal } = useDevModal(); // 👈 ADDED
  
  const [colorIndex, setColorIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  
  const [marketData, setMarketData] = useState<{
    trend: "bullish" | "bearish" | "consolidate";
    intensity: number;
  }>({ trend: "consolidate", intensity: 5 });

  const baseAssetData = useMemo(() => 
    dbAssets.find(a => a.symbol === baseAsset), 
  [dbAssets, baseAsset]);

  const quoteAssetData = useMemo(() => 
    dbAssets.find(a => a.symbol === quoteAsset), 
  [dbAssets, quoteAsset]);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % COLORS.length);
      setAnimationKey((prev) => prev + 1); 
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchTrend() {
      try {
        const settings = await getMarketSettings();
        if (settings) {
          const hour = new Date().getHours();
          let activeBlock = settings.block4;
          if (hour >= 0 && hour < 7) activeBlock = settings.block1;
          else if (hour >= 7 && hour < 12) activeBlock = settings.block2;
          else if (hour >= 12 && hour < 18) activeBlock = settings.block3;
          
          setMarketData({ 
            trend: activeBlock.trend, 
            intensity: activeBlock.intensity || 5 
          });
        }
      } catch (error) {
        console.error("Failed to fetch market settings", error);
      }
    }
    fetchTrend();
    const interval = setInterval(fetchTrend, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeColor = COLORS[colorIndex];

  const { pathD, gradientColor, percentText, isPositive } = useMemo(() => {
    if (!baseAsset || !quoteAsset) {
      return { pathD: "M0,20 L100,20", gradientColor: "#e2e8f0", percentText: "-", isPositive: true };
    }

    const intensity = marketData.intensity;
    let path = "M0,20 Q10,15 20,25 T40,20 T60,25 Q70,20 80,25 T100,20";
    let color = activeColor;
    let percent = "+0.3%";
    let positive = true;

    if (marketData.trend === "bullish") {
      const peak = 5 + (intensity * 1.5);
      path = `M0,35 Q10,30 20,32 T40,${35 - peak} T60,${35 - (peak * 1.5)} Q70,${35 - (peak * 2)} 80,${35 - (peak * 2.5)} T100,${35 - (peak * 3)}`;
      color = "#10b981";
      percent = `+${(intensity * 1.45).toFixed(1)}%`;
      positive = true;
    } else if (marketData.trend === "bearish") {
      const drop = 5 + (intensity * 1.2);
      path = `M0,5 Q10,10 20,15 T40,${5 + drop} T60,${5 + (drop * 1.5)} Q70,${5 + (drop * 2)} 80,${5 + (drop * 2.5)} T100,${5 + (drop * 3)}`;
      color = "#ef4444";
      percent = `-${(intensity * 1.2).toFixed(1)}%`;
      positive = false;
    }

    return { pathD: path, gradientColor: color, percentText: percent, isPositive: positive };
  }, [marketData, activeColor, baseAsset, quoteAsset]);

  const renderAssetIcon = (assetData: any, symbol: string) => {
    if (assetData?.image) {
      return <img src={assetData.image} alt={symbol} className="w-7 h-7 rounded-full object-cover shrink-0" />;
    }
    return (
      <div className="w-7 h-7 rounded-full bg-lime-500/20 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold text-xs shrink-0">
        {symbol.charAt(0).toUpperCase()}
      </div>
    );
  };

  // 👇 NEW: Handle the trade click with a safety check
  const handleTradeClick = () => {
    if (!baseAsset || !quoteAsset) {
      openModal(
        "Select Pair Required",
        "Please select a base and quote asset before proceeding to the terminal.",
        "warning",
        { label: "Select Pair", onClick: () => onSelectPair?.() }
      );
      return;
    }
    router.push(`/terminal?pair=${baseAsset}-${quoteAsset}`);
  };

  return (
    <div className="relative bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex flex-col justify-between overflow-hidden h-full min-h-[220px]">
      
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] overflow-hidden">
        {baseAssetData?.image ? (
          <img src={baseAssetData.image} alt="watermark" className="w-48 h-48 object-contain grayscale" />
        ) : (
          <span className="text-[150px] font-extrabold">{baseAsset ? baseAsset.charAt(0) : "?"}</span>
        )}
      </div>

      <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-lime-400/10 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000" style={{ backgroundColor: `${gradientColor}20` }}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} /> {t("topPair")}
          </span>
          <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
            isPositive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
          }`}>
            <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} /> 
            {percentText}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-4 relative z-20">
          <button 
            onClick={onSelectPair}
            className="flex items-center gap-2 px-2 py-1 bg-transparent hover:bg-lime-500/10 border border-transparent hover:border-lime-500/30 rounded-xl transition-all group"
            title={t("selectBase")}
          >
            {baseAsset ? renderAssetIcon(baseAssetData, baseAsset) : <div className="w-7 h-7 rounded-full bg-lime-500/10 shrink-0" />}
            <span className={`text-lg font-extrabold font-mono transition-colors ${baseAsset ? "text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400" : "text-lime-800/50 dark:text-lime-200/30"}`}>
              {baseAsset || t("selectBase")}
            </span>
            <ChevronDown size={14} className="text-lime-500 shrink-0" />
          </button>
          
          <span className="text-xl font-bold text-lime-800/50 dark:text-lime-200/40">/</span>

          <button 
            onClick={onSelectPair}
            className="flex items-center gap-2 px-2 py-1 bg-transparent hover:bg-lime-500/10 border border-transparent hover:border-lime-500/30 rounded-xl transition-all group"
            title={t("selectQuote")}
          >
            {quoteAsset ? renderAssetIcon(quoteAssetData, quoteAsset) : <div className="w-7 h-7 rounded-full bg-lime-500/10 shrink-0" />}
            <span className={`text-lg font-extrabold font-mono transition-colors ${quoteAsset ? "text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400" : "text-lime-800/50 dark:text-lime-200/30"}`}>
              {quoteAsset || t("selectQuote")}
            </span>
            <ChevronDown size={14} className="text-lime-500 shrink-0" />
          </button>
        </div>
        
        <p className="text-xs text-lime-800/60 dark:text-lime-200/50">{t("liveChart")}</p>
      </div>

      <div className="relative h-16 w-full mt-2 z-10">
        <svg viewBox="-2 -2 104 44" className="w-full h-full preserve-3d" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${pathD} L100,40 L0,40 Z`} fill="url(#chartGradient)" className="transition-all duration-1000" />
          <motion.path 
            key={animationKey}
            d={pathD} 
            fill="none" 
            stroke={gradientColor} 
            strokeWidth="2"
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      </div>

      <div className="relative z-10 mt-3">
        <button
          onClick={handleTradeClick} // 👈 USING THE NEW HANDLER
          className="w-full flex items-center justify-center gap-2 py-2 bg-lime-500 hover:bg-lime-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-lime-500/20 active:scale-95"
        >
          {baseAsset && quoteAsset ? `Trade ${baseAsset}/${quoteAsset}` : "View trade"} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}








// // components/dashboard/FavorablePairsCard.tsx
// "use client";

// import { useState, useEffect, useMemo } from "react";
// import { useRouter } from "next/navigation"; // 👈 ADDED
// import { motion } from "framer-motion";
// import { TrendingUp, Activity, ChevronDown, ArrowRight } from "lucide-react"; // 👈 ADDED ArrowRight
// import { useTranslations } from "next-intl";
// import { getMarketSettings } from "@/app/actions/admin-market";

// const COLORS = ["#84cc16", "#3b82f6", "#f59e0b", "#ec4899"]; 

// export default function FavorablePairsCard({ 
//   baseAsset = "BTC", 
//   quoteAsset = "USD",
//   dbAssets = [],
//   onSelectPair
// }: { 
//   baseAsset?: string;
//   quoteAsset?: string;
//   dbAssets?: any[];
//   onSelectPair?: () => void;
// }) {
//   const t = useTranslations("FavorablePairsCard");
//   const router = useRouter(); // 👈 ADDED
  
//   const [colorIndex, setColorIndex] = useState(0);
//   const [animationKey, setAnimationKey] = useState(0);
  
//   const [marketData, setMarketData] = useState<{
//     trend: "bullish" | "bearish" | "consolidate";
//     intensity: number;
//   }>({ trend: "consolidate", intensity: 5 });

//   const baseAssetData = useMemo(() => 
//     dbAssets.find(a => a.symbol === baseAsset), 
//   [dbAssets, baseAsset]);

//   const quoteAssetData = useMemo(() => 
//     dbAssets.find(a => a.symbol === quoteAsset), 
//   [dbAssets, quoteAsset]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setColorIndex((prev) => (prev + 1) % COLORS.length);
//       setAnimationKey((prev) => prev + 1); 
//     }, 5000);
//     return () => clearInterval(interval);
//   }, []);

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
          
//           setMarketData({ 
//             trend: activeBlock.trend, 
//             intensity: activeBlock.intensity || 5 
//           });
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchTrend();
//     const interval = setInterval(fetchTrend, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const activeColor = COLORS[colorIndex];

//   const { pathD, gradientColor, percentText, isPositive } = useMemo(() => {
//     if (!baseAsset || !quoteAsset) {
//       return { pathD: "M0,20 L100,20", gradientColor: "#e2e8f0", percentText: "-", isPositive: true };
//     }

//     const intensity = marketData.intensity;
//     let path = "M0,20 Q10,15 20,25 T40,20 T60,25 Q70,20 80,25 T100,20";
//     let color = activeColor;
//     let percent = "+0.3%";
//     let positive = true;

//     if (marketData.trend === "bullish") {
//       const peak = 5 + (intensity * 1.5);
//       path = `M0,35 Q10,30 20,32 T40,${35 - peak} T60,${35 - (peak * 1.5)} Q70,${35 - (peak * 2)} 80,${35 - (peak * 2.5)} T100,${35 - (peak * 3)}`;
//       color = "#10b981";
//       percent = `+${(intensity * 1.45).toFixed(1)}%`;
//       positive = true;
//     } else if (marketData.trend === "bearish") {
//       const drop = 5 + (intensity * 1.2);
//       path = `M0,5 Q10,10 20,15 T40,${5 + drop} T60,${5 + (drop * 1.5)} Q70,${5 + (drop * 2)} 80,${5 + (drop * 2.5)} T100,${5 + (drop * 3)}`;
//       color = "#ef4444";
//       percent = `-${(intensity * 1.2).toFixed(1)}%`;
//       positive = false;
//     }

//     return { pathD: path, gradientColor: color, percentText: percent, isPositive: positive };
//   }, [marketData, activeColor, baseAsset, quoteAsset]);

//   const renderAssetIcon = (assetData: any, symbol: string) => {
//     if (assetData?.image) {
//       return <img src={assetData.image} alt={symbol} className="w-7 h-7 rounded-full object-cover shrink-0" />;
//     }
//     return (
//       <div className="w-7 h-7 rounded-full bg-lime-500/20 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold text-xs shrink-0">
//         {symbol.charAt(0).toUpperCase()}
//       </div>
//     );
//   };

//   return (
//     <div className="relative bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex flex-col justify-between overflow-hidden h-full min-h-[220px]">
      
//       <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] overflow-hidden">
//         {baseAssetData?.image ? (
//           <img src={baseAssetData.image} alt="watermark" className="w-48 h-48 object-contain grayscale" />
//         ) : (
//           <span className="text-[150px] font-extrabold">{baseAsset.charAt(0) || "?"}</span>
//         )}
//       </div>

//       <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-lime-400/10 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000" style={{ backgroundColor: `${gradientColor}20` }}></div>
      
//       <div className="relative z-10">
//         <div className="flex items-center justify-between mb-4">
//           <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
//             <Activity size={14} /> {t("topPair")}
//           </span>
//           <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
//             isPositive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
//           }`}>
//             <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} /> 
//             {percentText}
//           </span>
//         </div>

//         <div className="flex items-center gap-2 mb-4 relative z-20">
//           <button 
//             onClick={onSelectPair}
//             className="flex items-center gap-2 px-2 py-1 bg-transparent hover:bg-lime-500/10 border border-transparent hover:border-lime-500/30 rounded-xl transition-all group"
//             title={t("selectBase")}
//           >
//             {baseAsset ? renderAssetIcon(baseAssetData, baseAsset) : <div className="w-7 h-7 rounded-full bg-lime-500/10 shrink-0" />}
//             <span className={`text-lg font-extrabold font-mono transition-colors ${baseAsset ? "text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400" : "text-lime-800/50 dark:text-lime-200/30"}`}>
//               {baseAsset || t("selectBase")}
//             </span>
//             <ChevronDown size={14} className="text-lime-500 shrink-0" />
//           </button>
          
//           <span className="text-xl font-bold text-lime-800/50 dark:text-lime-200/40">/</span>

//           <button 
//             onClick={onSelectPair}
//             className="flex items-center gap-2 px-2 py-1 bg-transparent hover:bg-lime-500/10 border border-transparent hover:border-lime-500/30 rounded-xl transition-all group"
//             title={t("selectQuote")}
//           >
//             {quoteAsset ? renderAssetIcon(quoteAssetData, quoteAsset) : <div className="w-7 h-7 rounded-full bg-lime-500/10 shrink-0" />}
//             <span className={`text-lg font-extrabold font-mono transition-colors ${quoteAsset ? "text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400" : "text-lime-800/50 dark:text-lime-200/30"}`}>
//               {quoteAsset || t("selectQuote")}
//             </span>
//             <ChevronDown size={14} className="text-lime-500 shrink-0" />
//           </button>
//         </div>
        
//         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">{t("liveChart")}</p>
//       </div>

//       <div className="relative h-16 w-full mt-2 z-10">
//         <svg viewBox="-2 -2 104 44" className="w-full h-full preserve-3d" preserveAspectRatio="none">
//           <defs>
//             <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
//               <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
//             </linearGradient>
//           </defs>
//           <path d={`${pathD} L100,40 L0,40 Z`} fill="url(#chartGradient)" className="transition-all duration-1000" />
//           <motion.path 
//             key={animationKey}
//             d={pathD} 
//             fill="none" 
//             stroke={gradientColor} 
//             strokeWidth="2"
//             initial={{ pathLength: 0 }} 
//             animate={{ pathLength: 1 }} 
//             transition={{ duration: 1.5, ease: "easeInOut" }}
//           />
//         </svg>
//       </div>

//       {/* 👇 NEW: ROUTE TO TERMINAL BUTTON */}
//       <div className="relative z-10 mt-3">
//         <button
//           onClick={() => router.push(`/terminal?pair=${baseAsset}-${quoteAsset}`)}
//           className="w-full flex items-center justify-center gap-2 py-2 bg-lime-500 hover:bg-lime-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-lime-500/20 active:scale-95"
//         >
//           Trade {baseAsset}/{quoteAsset} <ArrowRight size={14} />
//         </button>
//       </div>
//     </div>
//   );
// }













// // components/dashboard/FavorablePairsCard.tsx
// "use client";

// import { useState, useEffect, useMemo } from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { TrendingUp, Activity, ChevronDown } from "lucide-react";
// import { useTranslations } from "next-intl";
// import { getMarketSettings } from "@/app/actions/admin-market";

// const COLORS = ["#84cc16", "#3b82f6", "#f59e0b", "#ec4899"]; 

// export default function FavorablePairsCard({ 
//   baseAsset = "BTC", 
//   quoteAsset = "USD",
//   dbAssets = [],
//   onSelectPair
// }: { 
//   baseAsset?: string;
//   quoteAsset?: string;
//   dbAssets?: any[];
//   onSelectPair?: () => void;
// }) {
//   const t = useTranslations("FavorablePairsCard");
  
//   const [colorIndex, setColorIndex] = useState(0);
//   const [animationKey, setAnimationKey] = useState(0);
  
//   const [marketData, setMarketData] = useState<{
//     trend: "bullish" | "bearish" | "consolidate";
//     intensity: number;
//   }>({ trend: "consolidate", intensity: 5 });

//   const baseAssetData = useMemo(() => 
//     dbAssets.find(a => a.symbol === baseAsset), 
//   [dbAssets, baseAsset]);

//   const quoteAssetData = useMemo(() => 
//     dbAssets.find(a => a.symbol === quoteAsset), 
//   [dbAssets, quoteAsset]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setColorIndex((prev) => (prev + 1) % COLORS.length);
//       setAnimationKey((prev) => prev + 1); 
//     }, 5000);
//     return () => clearInterval(interval);
//   }, []);

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
          
//           setMarketData({ 
//             trend: activeBlock.trend, 
//             intensity: activeBlock.intensity || 5 
//           });
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchTrend();
//     const interval = setInterval(fetchTrend, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const activeColor = COLORS[colorIndex];

//   const { pathD, gradientColor, percentText, isPositive } = useMemo(() => {
//     if (!baseAsset || !quoteAsset) {
//       return { pathD: "M0,20 L100,20", gradientColor: "#e2e8f0", percentText: "-", isPositive: true };
//     }

//     const intensity = marketData.intensity;
//     let path = "M0,20 Q10,15 20,25 T40,20 T60,25 Q70,20 80,25 T100,20";
//     let color = activeColor;
//     let percent = "+0.3%";
//     let positive = true;

//     if (marketData.trend === "bullish") {
//       const peak = 5 + (intensity * 1.5);
//       path = `M0,35 Q10,30 20,32 T40,${35 - peak} T60,${35 - (peak * 1.5)} Q70,${35 - (peak * 2)} 80,${35 - (peak * 2.5)} T100,${35 - (peak * 3)}`;
//       color = "#10b981";
//       percent = `+${(intensity * 1.45).toFixed(1)}%`;
//       positive = true;
//     } else if (marketData.trend === "bearish") {
//       const drop = 5 + (intensity * 1.2);
//       path = `M0,5 Q10,10 20,15 T40,${5 + drop} T60,${5 + (drop * 1.5)} Q70,${5 + (drop * 2)} 80,${5 + (drop * 2.5)} T100,${5 + (drop * 3)}`;
//       color = "#ef4444";
//       percent = `-${(intensity * 1.2).toFixed(1)}%`;
//       positive = false;
//     }

//     return { pathD: path, gradientColor: color, percentText: percent, isPositive: positive };
//   }, [marketData, activeColor, baseAsset, quoteAsset]);

//   // 👇 FIXED: Increased icon size to w-7 h-7
//   const renderAssetIcon = (assetData: any, symbol: string) => {
//     if (assetData?.image) {
//       return <img src={assetData.image} alt={symbol} className="w-7 h-7 rounded-full object-cover shrink-0" />;
//     }
//     return (
//       <div className="w-7 h-7 rounded-full bg-lime-500/20 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold text-xs shrink-0">
//         {symbol.charAt(0).toUpperCase()}
//       </div>
//     );
//   };

//   return (
//     <div className="relative bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex flex-col justify-between overflow-hidden h-full min-h-[220px]">
      
//       <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] overflow-hidden">
//         {baseAssetData?.image ? (
//           <img src={baseAssetData.image} alt="watermark" className="w-48 h-48 object-contain grayscale" />
//         ) : (
//           <span className="text-[150px] font-extrabold">{baseAsset.charAt(0) || "?"}</span>
//         )}
//       </div>

//       <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-lime-400/10 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000" style={{ backgroundColor: `${gradientColor}20` }}></div>
      
//       <div className="relative z-10">
//         <div className="flex items-center justify-between mb-4">
//           <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
//             <Activity size={14} /> {t("topPair")}
//           </span>
//           <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
//             isPositive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
//           }`}>
//             <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} /> 
//             {percentText}
//           </span>
//         </div>

//         {/* 👇 FIXED: Removed white background, added transparent hover state */}
//         <div className="flex items-center gap-2 mb-4 relative z-20">
//           <button 
//             onClick={onSelectPair}
//             className="flex items-center gap-2 px-2 py-1 bg-transparent hover:bg-lime-500/10 border border-transparent hover:border-lime-500/30 rounded-xl transition-all group"
//             title={t("selectBase")}
//           >
//             {baseAsset ? renderAssetIcon(baseAssetData, baseAsset) : <div className="w-7 h-7 rounded-full bg-lime-500/10 shrink-0" />}
//             <span className={`text-lg font-extrabold font-mono transition-colors ${baseAsset ? "text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400" : "text-lime-800/50 dark:text-lime-200/30"}`}>
//               {baseAsset || t("selectBase")}
//             </span>
//             <ChevronDown size={14} className="text-lime-500 shrink-0" />
//           </button>
          
//           <span className="text-xl font-bold text-lime-800/50 dark:text-lime-200/40">/</span>

//           <button 
//             onClick={onSelectPair}
//             className="flex items-center gap-2 px-2 py-1 bg-transparent hover:bg-lime-500/10 border border-transparent hover:border-lime-500/30 rounded-xl transition-all group"
//             title={t("selectQuote")}
//           >
//             {quoteAsset ? renderAssetIcon(quoteAssetData, quoteAsset) : <div className="w-7 h-7 rounded-full bg-lime-500/10 shrink-0" />}
//             <span className={`text-lg font-extrabold font-mono transition-colors ${quoteAsset ? "text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400" : "text-lime-800/50 dark:text-lime-200/30"}`}>
//               {quoteAsset || t("selectQuote")}
//             </span>
//             <ChevronDown size={14} className="text-lime-500 shrink-0" />
//           </button>
//         </div>
        
//         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">{t("liveChart")}</p>
//       </div>

//       <div className="relative h-20 w-full mt-4 z-10">
//         <svg viewBox="-2 -2 104 44" className="w-full h-full preserve-3d" preserveAspectRatio="none">
//           <defs>
//             <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
//               <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
//             </linearGradient>
//           </defs>
//           <path 
//             d={`${pathD} L100,40 L0,40 Z`} 
//             fill="url(#chartGradient)" 
//             className="transition-all duration-1000"
//           />
//           <motion.path 
//             key={animationKey}
//             d={pathD} 
//             fill="none" 
//             stroke={gradientColor} 
//             strokeWidth="2"
//             initial={{ pathLength: 0 }} 
//             animate={{ pathLength: 1 }} 
//             transition={{ duration: 1.5, ease: "easeInOut" }}
//           />
//         </svg>
//       </div>
//     </div>
//   );
// }












// // components/dashboard/FavorablePairsCard.tsx
// "use client";

// import { useState, useEffect, useMemo } from "react";
// import { motion } from "framer-motion";
// import { TrendingUp, Activity, ChevronDown } from "lucide-react";
// import { useTranslations } from "next-intl";
// import { getMarketSettings } from "@/app/actions/admin-market";

// const COLORS = ["#84cc16", "#3b82f6", "#f59e0b", "#ec4899"]; 

// export default function FavorablePairsCard({ 
//   baseAsset = "", 
//   quoteAsset = "",
//   dbAssets = [],
//   onSelectPair
// }: { 
//   baseAsset?: string;
//   quoteAsset?: string;
//   dbAssets?: any[];
//   onSelectPair: () => void; // 👈 NEW PROP
// }) {
//   const t = useTranslations("FavorablePairsCard");
  
//   const [colorIndex, setColorIndex] = useState(0);
//   const [animationKey, setAnimationKey] = useState(0);
  
//   const [marketData, setMarketData] = useState<{
//     trend: "bullish" | "bearish" | "consolidate";
//     intensity: number;
//   }>({ trend: "consolidate", intensity: 5 });

//   const baseAssetData = useMemo(() => 
//     dbAssets.find(a => a.symbol === baseAsset), 
//   [dbAssets, baseAsset]);

//   const quoteAssetData = useMemo(() => 
//     dbAssets.find(a => a.symbol === quoteAsset), 
//   [dbAssets, quoteAsset]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setColorIndex((prev) => (prev + 1) % COLORS.length);
//       setAnimationKey((prev) => prev + 1); 
//     }, 5000);
//     return () => clearInterval(interval);
//   }, []);

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
          
//           setMarketData({ 
//             trend: activeBlock.trend, 
//             intensity: activeBlock.intensity || 5 
//           });
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchTrend();
//     const interval = setInterval(fetchTrend, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const activeColor = COLORS[colorIndex];

//   const { pathD, gradientColor, percentText, isPositive } = useMemo(() => {
//     if (!baseAsset || !quoteAsset) {
//       return { pathD: "M0,20 L100,20", gradientColor: "#e2e8f0", percentText: "-", isPositive: true };
//     }

//     const intensity = marketData.intensity;
//     let path = "M0,20 Q10,15 20,25 T40,20 T60,25 Q70,20 80,25 T100,20";
//     let color = activeColor;
//     let percent = "+0.3%";
//     let positive = true;

//     if (marketData.trend === "bullish") {
//       const peak = 5 + (intensity * 1.5);
//       path = `M0,35 Q10,30 20,32 T40,${35 - peak} T60,${35 - (peak * 1.5)} Q70,${35 - (peak * 2)} 80,${35 - (peak * 2.5)} T100,${35 - (peak * 3)}`;
//       color = "#10b981";
//       percent = `+${(intensity * 1.45).toFixed(1)}%`;
//       positive = true;
//     } else if (marketData.trend === "bearish") {
//       const drop = 5 + (intensity * 1.2);
//       path = `M0,5 Q10,10 20,15 T40,${5 + drop} T60,${5 + (drop * 1.5)} Q70,${5 + (drop * 2)} 80,${5 + (drop * 2.5)} T100,${5 + (drop * 3)}`;
//       color = "#ef4444";
//       percent = `-${(intensity * 1.2).toFixed(1)}%`;
//       positive = false;
//     }

//     return { pathD: path, gradientColor: color, percentText: percent, isPositive: positive };
//   }, [marketData, activeColor, baseAsset, quoteAsset]);

//   const renderAssetIcon = (assetData: any, symbol: string) => {
//     if (assetData?.image) {
//       return <img src={assetData.image} alt={symbol} className="w-5 h-5 rounded-full object-cover shrink-0" />;
//     }
//     return (
//       <div className="w-5 h-5 rounded-full bg-lime-500/20 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold text-[10px] shrink-0">
//         {symbol.charAt(0).toUpperCase()}
//       </div>
//     );
//   };

//   return (
//     <div className="relative bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex flex-col justify-between overflow-hidden h-full min-h-[220px]">
      
//       <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] overflow-hidden">
//         {baseAssetData?.image ? (
//           <img src={baseAssetData.image} alt="watermark" className="w-48 h-48 object-contain grayscale" />
//         ) : (
//           <span className="text-[150px] font-extrabold">{baseAsset.charAt(0) || "?"}</span>
//         )}
//       </div>

//       <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-lime-400/10 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000" style={{ backgroundColor: `${gradientColor}20` }}></div>
      
//       <div className="relative z-10">
//         <div className="flex items-center justify-between mb-4">
//           <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
//             <Activity size={14} /> {t("topPair")}
//           </span>
//           <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
//             isPositive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
//           }`}>
//             <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} /> 
//             {percentText}
//           </span>
//         </div>

//         {/* 👇 FIXED: Buttons that open the Modal */}
//         <div className="flex items-center gap-2 mb-4 relative z-20">
//           <button 
//             onClick={onSelectPair}
//             className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/30 rounded-xl hover:border-lime-500/50 transition-colors group shadow-sm"
//             title={t("selectBase")}
//           >
//             {baseAsset ? renderAssetIcon(baseAssetData, baseAsset) : <div className="w-5 h-5 rounded-full bg-lime-500/10 shrink-0" />}
//             <span className={`text-lg font-extrabold font-mono transition-colors ${baseAsset ? "text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400" : "text-lime-800/50 dark:text-lime-200/30"}`}>
//               {baseAsset || t("selectBase")}
//             </span>
//             <ChevronDown size={14} className="text-lime-500 shrink-0" />
//           </button>
          
//           <span className="text-xl font-bold text-lime-800/50 dark:text-lime-200/40">/</span>

//           <button 
//             onClick={onSelectPair}
//             className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/30 rounded-xl hover:border-lime-500/50 transition-colors group shadow-sm"
//             title={t("selectQuote")}
//           >
//             {quoteAsset ? renderAssetIcon(quoteAssetData, quoteAsset) : <div className="w-5 h-5 rounded-full bg-lime-500/10 shrink-0" />}
//             <span className={`text-lg font-extrabold font-mono transition-colors ${quoteAsset ? "text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400" : "text-lime-800/50 dark:text-lime-200/30"}`}>
//               {quoteAsset || t("selectQuote")}
//             </span>
//             <ChevronDown size={14} className="text-lime-500 shrink-0" />
//           </button>
//         </div>
        
//         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">{t("liveChart")}</p>
//       </div>

//       <div className="relative h-20 w-full mt-4 z-10">
//         <svg viewBox="-2 -2 104 44" className="w-full h-full preserve-3d" preserveAspectRatio="none">
//           <defs>
//             <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
//               <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
//             </linearGradient>
//           </defs>
//           <path 
//             d={`${pathD} L100,40 L0,40 Z`} 
//             fill="url(#chartGradient)" 
//             className="transition-all duration-1000"
//           />
//           <motion.path 
//             key={animationKey}
//             d={pathD} 
//             fill="none" 
//             stroke={gradientColor} 
//             strokeWidth="2"
//             initial={{ pathLength: 0 }} 
//             animate={{ pathLength: 1 }} 
//             transition={{ duration: 1.5, ease: "easeInOut" }}
//           />
//         </svg>
//       </div>
//     </div>
//   );
// }



// // components/dashboard/FavorablePairsCard.tsx
// "use client";

// import { useState, useEffect, useMemo } from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { 
//   TrendingUp, Activity, ChevronDown
// } from "lucide-react";
// import { useTranslations } from "next-intl";
// import { getMarketSettings } from "@/app/actions/admin-market";

// const COLORS = ["#84cc16", "#3b82f6", "#f59e0b", "#ec4899"]; 

// export default function FavorablePairsCard({ 
//   baseAsset = "BTC", 
//   quoteAsset = "USD",
//   dbAssets = [] 
// }: { 
//   baseAsset?: string;
//   quoteAsset?: string;
//   dbAssets?: any[];
// }) {
//   const t = useTranslations("FavorablePairsCard");
  
//   const [colorIndex, setColorIndex] = useState(0);
//   const [animationKey, setAnimationKey] = useState(0);
  
//   const [marketData, setMarketData] = useState<{
//     trend: "bullish" | "bearish" | "consolidate";
//     intensity: number;
//   }>({ trend: "consolidate", intensity: 5 });

//   // 👇 Find the active assets in the Feeder-Cache to get their images
//   const baseAssetData = useMemo(() => 
//     dbAssets.find(a => a.symbol === baseAsset), 
//   [dbAssets, baseAsset]);

//   const quoteAssetData = useMemo(() => 
//     dbAssets.find(a => a.symbol === quoteAsset), 
//   [dbAssets, quoteAsset]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setColorIndex((prev) => (prev + 1) % COLORS.length);
//       setAnimationKey((prev) => prev + 1); 
//     }, 5000);
//     return () => clearInterval(interval);
//   }, []);

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
          
//           setMarketData({ 
//             trend: activeBlock.trend, 
//             intensity: activeBlock.intensity || 5 
//           });
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchTrend();
//     const interval = setInterval(fetchTrend, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const activeColor = COLORS[colorIndex];

//   const { pathD, gradientColor, percentText, isPositive } = useMemo(() => {
//     const intensity = marketData.intensity;
//     let path = "M0,20 Q10,15 20,25 T40,20 T60,25 Q70,20 80,25 T100,20";
//     let color = activeColor;
//     let percent = "+0.3%";
//     let positive = true;

//     if (marketData.trend === "bullish") {
//       const peak = 5 + (intensity * 1.5);
//       path = `M0,35 Q10,30 20,32 T40,${35 - peak} T60,${35 - (peak * 1.5)} Q70,${35 - (peak * 2)} 80,${35 - (peak * 2.5)} T100,${35 - (peak * 3)}`;
//       color = "#10b981";
//       percent = `+${(intensity * 1.45).toFixed(1)}%`;
//       positive = true;
//     } else if (marketData.trend === "bearish") {
//       const drop = 5 + (intensity * 1.2);
//       path = `M0,5 Q10,10 20,15 T40,${5 + drop} T60,${5 + (drop * 1.5)} Q70,${5 + (drop * 2)} 80,${5 + (drop * 2.5)} T100,${5 + (drop * 3)}`;
//       color = "#ef4444";
//       percent = `-${(intensity * 1.2).toFixed(1)}%`;
//       positive = false;
//     }

//     return { pathD: path, gradientColor: color, percentText: percent, isPositive: positive };
//   }, [marketData, activeColor]);

//   // 👇 Helper for dynamic image or fallback
//   const renderAssetIcon = (assetData: any, symbol: string) => {
//     if (assetData?.image) {
//       return <img src={assetData.image} alt={symbol} className="w-5 h-5 rounded-full object-cover shrink-0" />;
//     }
//     return (
//       <div className="w-5 h-5 rounded-full bg-lime-500/20 flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold text-[10px] shrink-0">
//         {symbol.charAt(0).toUpperCase()}
//       </div>
//     );
//   };

//   return (
//     <div className="relative bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex flex-col justify-between overflow-hidden h-full min-h-[220px]">
      
//       {/* 👇 Dynamic Watermark based on Feeder-Cache Image */}
//       <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] overflow-hidden">
//         {baseAssetData?.image ? (
//           <img src={baseAssetData.image} alt="watermark" className="w-48 h-48 object-contain grayscale" />
//         ) : (
//           <span className="text-[150px] font-extrabold">{baseAsset.charAt(0)}</span>
//         )}
//       </div>

//       <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-lime-400/10 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000" style={{ backgroundColor: `${gradientColor}20` }}></div>
      
//       <div className="relative z-10">
//         <div className="flex items-center justify-between mb-4">
//           <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
//             <Activity size={14} /> {t("topPair")}
//           </span>
//           <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
//             isPositive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
//           }`}>
//             <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} /> 
//             {percentText}
//           </span>
//         </div>

//         <div className="flex items-center gap-2 mb-4 relative z-20">
//           <Link 
//             href="/markets?select=base&returnUrl=/dashboard"
//             className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/30 rounded-xl hover:border-lime-500/50 transition-colors group shadow-sm"
//             title={t("selectBase")}
//           >
//             {renderAssetIcon(baseAssetData, baseAsset)}
//             <span className="text-lg font-extrabold font-mono text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{baseAsset}</span>
//             <ChevronDown size={14} className="text-lime-500 shrink-0" />
//           </Link>
          
//           <span className="text-xl font-bold text-lime-800/50 dark:text-lime-200/40">/</span>

//           <Link 
//             href="/markets?select=quote&returnUrl=/dashboard"
//             className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/30 rounded-xl hover:border-lime-500/50 transition-colors group shadow-sm"
//             title={t("selectQuote")}
//           >
//             {renderAssetIcon(quoteAssetData, quoteAsset)}
//             <span className="text-lg font-extrabold font-mono text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{quoteAsset}</span>
//             <ChevronDown size={14} className="text-lime-500 shrink-0" />
//           </Link>
//         </div>
        
//         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">{t("liveChart")}</p>
//       </div>

//       <div className="relative h-20 w-full mt-4 z-10">
//         <svg viewBox="-2 -2 104 44" className="w-full h-full preserve-3d" preserveAspectRatio="none">
//           <defs>
//             <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
//               <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
//             </linearGradient>
//           </defs>
//           <path 
//             d={`${pathD} L100,40 L0,40 Z`} 
//             fill="url(#chartGradient)" 
//             className="transition-all duration-1000"
//           />
//           <motion.path 
//             key={animationKey}
//             d={pathD} 
//             fill="none" 
//             stroke={gradientColor} 
//             strokeWidth="2"
//             initial={{ pathLength: 0 }} 
//             animate={{ pathLength: 1 }} 
//             transition={{ duration: 1.5, ease: "easeInOut" }}
//           />
//         </svg>
//       </div>
//     </div>
//   );
// }

// // components/dashboard/FavorablePairsCard.tsx
// "use client";

// import { useState, useEffect, useMemo } from "react";
// import Link from "next/link"; // 👈 ADDED
// import { motion } from "framer-motion";
// import { 
//   TrendingUp, Activity, ChevronDown, Bitcoin, Hexagon, Sun, 
//   DollarSign, Euro, PoundSterling, CircleDollarSign 
// } from "lucide-react";
// import { useTranslations } from "next-intl";
// import { getMarketSettings } from "@/app/actions/admin-market";

// const COLORS = ["#84cc16", "#3b82f6", "#f59e0b", "#ec4899"]; 

// const DEFAULT_ASSETS = [
//   { id: "BTC", name: "Bitcoin", icon: Bitcoin },
//   { id: "ETH", name: "Ethereum", icon: Hexagon },
//   { id: "SOL", name: "Solana", icon: Sun },
//   { id: "USD", name: "US Dollar", icon: DollarSign },
//   { id: "EUR", name: "Euro", icon: Euro },
//   { id: "GBP", name: "Pound", icon: PoundSterling },
//   { id: "DOGE", name: "Dogecoin", icon: CircleDollarSign },
// ];

// export default function FavorablePairsCard({ 
//   baseAsset = "BTC", 
//   quoteAsset = "USD",
//   dbAssets = [] 
// }: { 
//   baseAsset?: string;
//   quoteAsset?: string;
//   dbAssets?: any[];
// }) {
//   const t = useTranslations("FavorablePairsCard");
  
//   const [colorIndex, setColorIndex] = useState(0);
//   const [animationKey, setAnimationKey] = useState(0);
  
//   const [marketData, setMarketData] = useState<{
//     trend: "bullish" | "bearish" | "consolidate";
//     intensity: number;
//   }>({ trend: "consolidate", intensity: 5 });

//   // 👇 Merge DB Assets for icon mapping only
//   const assets = useMemo(() => {
//     if (!dbAssets || dbAssets.length === 0) return DEFAULT_ASSETS;
//     return dbAssets.map((a: any) => {
//       const defaultAsset = DEFAULT_ASSETS.find(d => d.id === a.symbol);
//       return {
//         id: a.symbol,
//         name: a.name,
//         icon: defaultAsset ? defaultAsset.icon : CircleDollarSign,
//       };
//     });
//   }, [dbAssets]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setColorIndex((prev) => (prev + 1) % COLORS.length);
//       setAnimationKey((prev) => prev + 1); 
//     }, 5000);
//     return () => clearInterval(interval);
//   }, []);

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
          
//           setMarketData({ 
//             trend: activeBlock.trend, 
//             intensity: activeBlock.intensity || 5 
//           });
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchTrend();
//     const interval = setInterval(fetchTrend, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const activeColor = COLORS[colorIndex];
//   const BaseIcon = assets.find(a => a.id === baseAsset)?.icon || CircleDollarSign;
//   const QuoteIcon = assets.find(a => a.id === quoteAsset)?.icon || CircleDollarSign;

//   const { pathD, gradientColor, percentText, isPositive } = useMemo(() => {
//     const intensity = marketData.intensity;
//     let path = "M0,20 Q10,15 20,25 T40,20 T60,25 Q70,20 80,25 T100,20";
//     let color = activeColor;
//     let percent = "+0.3%";
//     let positive = true;

//     if (marketData.trend === "bullish") {
//       const peak = 5 + (intensity * 1.5);
//       path = `M0,35 Q10,30 20,32 T40,${35 - peak} T60,${35 - (peak * 1.5)} Q70,${35 - (peak * 2)} 80,${35 - (peak * 2.5)} T100,${35 - (peak * 3)}`;
//       color = "#10b981";
//       percent = `+${(intensity * 1.45).toFixed(1)}%`;
//       positive = true;
//     } else if (marketData.trend === "bearish") {
//       const drop = 5 + (intensity * 1.2);
//       path = `M0,5 Q10,10 20,15 T40,${5 + drop} T60,${5 + (drop * 1.5)} Q70,${5 + (drop * 2)} 80,${5 + (drop * 2.5)} T100,${5 + (drop * 3)}`;
//       color = "#ef4444";
//       percent = `-${(intensity * 1.2).toFixed(1)}%`;
//       positive = false;
//     }

//     return { pathD: path, gradientColor: color, percentText: percent, isPositive: positive };
//   }, [marketData, activeColor]);

//   return (
//     <div className="relative bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex flex-col justify-between overflow-hidden h-full min-h-[220px]">
      
//       <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] overflow-hidden">
//         <BaseIcon size={200} strokeWidth={1} />
//       </div>

//       <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-lime-400/10 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000" style={{ backgroundColor: `${gradientColor}20` }}></div>
      
//       <div className="relative z-10">
//         <div className="flex items-center justify-between mb-4">
//           <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
//             <Activity size={14} /> {t("topPair")}
//           </span>
//           <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
//             isPositive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
//           }`}>
//             <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} /> 
//             {percentText}
//           </span>
//         </div>

//         {/* 👇 FIXED: Uses Link to /markets instead of native select */}
//         <div className="flex items-center gap-2 mb-4 relative z-20">
//           <Link 
//             href="/markets?select=base&returnUrl=/dashboard"
//             className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/30 rounded-xl hover:border-lime-500/50 transition-colors group shadow-sm"
//             title={t("selectBase")}
//           >
//             <BaseIcon size={18} className="text-lime-600 dark:text-lime-400 shrink-0" />
//             <span className="text-lg font-extrabold font-mono text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{baseAsset}</span>
//             <ChevronDown size={14} className="text-lime-500 shrink-0" />
//           </Link>
          
//           <span className="text-xl font-bold text-lime-800/50 dark:text-lime-200/40">/</span>

//           <Link 
//             href="/markets?select=quote&returnUrl=/dashboard"
//             className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#121A14] border border-lime-500/30 rounded-xl hover:border-lime-500/50 transition-colors group shadow-sm"
//             title={t("selectQuote")}
//           >
//             <QuoteIcon size={18} className="text-lime-600 dark:text-lime-400 shrink-0" />
//             <span className="text-lg font-extrabold font-mono text-lime-950 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{quoteAsset}</span>
//             <ChevronDown size={14} className="text-lime-500 shrink-0" />
//           </Link>
//         </div>
        
//         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">{t("liveChart")}</p>
//       </div>

//       <div className="relative h-20 w-full mt-4 z-10">
//         <svg viewBox="-2 -2 104 44" className="w-full h-full preserve-3d" preserveAspectRatio="none">
//           <defs>
//             <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
//               <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
//             </linearGradient>
//           </defs>
//           <path 
//             d={`${pathD} L100,40 L0,40 Z`} 
//             fill="url(#chartGradient)" 
//             className="transition-all duration-1000"
//           />
//           <motion.path 
//             key={animationKey}
//             d={pathD} 
//             fill="none" 
//             stroke={gradientColor} 
//             strokeWidth="2"
//             initial={{ pathLength: 0 }} 
//             animate={{ pathLength: 1 }} 
//             transition={{ duration: 1.5, ease: "easeInOut" }}
//           />
//         </svg>
//       </div>
//     </div>
//   );
// }


// // components/dashboard/FavorablePairsCard.tsx
// "use client";

// import { useState, useEffect, useMemo } from "react";
// import { motion } from "framer-motion";
// import { 
//   TrendingUp, Activity, ChevronDown, Bitcoin, Hexagon, Sun, 
//   DollarSign, Euro, PoundSterling, CircleDollarSign 
// } from "lucide-react";
// import { useTranslations } from "next-intl"; // 👈 ADDED
// import { getMarketSettings } from "@/app/actions/admin-market";

// const COLORS = ["#84cc16", "#3b82f6", "#f59e0b", "#ec4899"]; 

// const DEFAULT_ASSETS = [
//   { id: "BTC", name: "Bitcoin", icon: Bitcoin },
//   { id: "ETH", name: "Ethereum", icon: Hexagon },
//   { id: "SOL", name: "Solana", icon: Sun },
//   { id: "USD", name: "US Dollar", icon: DollarSign },
//   { id: "EUR", name: "Euro", icon: Euro },
//   { id: "GBP", name: "Pound", icon: PoundSterling },
//   { id: "DOGE", name: "Dogecoin", icon: CircleDollarSign },
// ];

// export default function FavorablePairsCard({ dbAssets = [] }: { dbAssets?: any[] }) {
//   const t = useTranslations("FavorablePairsCard"); // 👈 ADDED
//   const [baseAsset, setBaseAsset] = useState("BTC");
//   const [quoteAsset, setQuoteAsset] = useState("USD");
  
//   const [colorIndex, setColorIndex] = useState(0);
//   const [animationKey, setAnimationKey] = useState(0);
  
//   const [marketData, setMarketData] = useState<{
//     trend: "bullish" | "bearish" | "consolidate";
//     intensity: number;
//   }>({ trend: "consolidate", intensity: 5 });

//   // 👇 Merge DB Assets with defaults (Feeder-Cache)
//   const assets = useMemo(() => {
//     if (!dbAssets || dbAssets.length === 0) return DEFAULT_ASSETS;
    
//     return dbAssets.map((a: any) => {
//       const defaultAsset = DEFAULT_ASSETS.find(d => d.id === a.symbol);
//       return {
//         id: a.symbol,
//         name: a.name,
//         icon: defaultAsset ? defaultAsset.icon : CircleDollarSign,
//       };
//     });
//   }, [dbAssets]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setColorIndex((prev) => (prev + 1) % COLORS.length);
//       setAnimationKey((prev) => prev + 1); 
//     }, 5000);
//     return () => clearInterval(interval);
//   }, []);

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
          
//           setMarketData({ 
//             trend: activeBlock.trend, 
//             intensity: activeBlock.intensity || 5 
//           });
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchTrend();
//     const interval = setInterval(fetchTrend, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const activeColor = COLORS[colorIndex];
//   const BaseIcon = assets.find(a => a.id === baseAsset)?.icon || CircleDollarSign;
//   const QuoteIcon = assets.find(a => a.id === quoteAsset)?.icon || CircleDollarSign;

//   // 👇 DYNAMIC PERCENTAGE & PATH BASED ON ADMIN INTENSITY
//   const { pathD, gradientColor, percentText, isPositive } = useMemo(() => {
//     const intensity = marketData.intensity;
//     let path = "M0,20 Q10,15 20,25 T40,20 T60,25 Q70,20 80,25 T100,20";
//     let color = activeColor;
//     let percent = "+0.3%";
//     let positive = true;

//     if (marketData.trend === "bullish") {
//       // Generate a steeper bullish curve based on intensity (0-10)
//       const peak = 5 + (intensity * 1.5);
//       path = `M0,35 Q10,30 20,32 T40,${35 - peak} T60,${35 - (peak * 1.5)} Q70,${35 - (peak * 2)} 80,${35 - (peak * 2.5)} T100,${35 - (peak * 3)}`;
//       color = "#10b981";
//       percent = `+${(intensity * 1.45).toFixed(1)}%`;
//       positive = true;
//     } else if (marketData.trend === "bearish") {
//       // Generate a steeper bearish curve
//       const drop = 5 + (intensity * 1.2);
//       path = `M0,5 Q10,10 20,15 T40,${5 + drop} T60,${5 + (drop * 1.5)} Q70,${5 + (drop * 2)} 80,${5 + (drop * 2.5)} T100,${5 + (drop * 3)}`;
//       color = "#ef4444";
//       percent = `-${(intensity * 1.2).toFixed(1)}%`;
//       positive = false;
//     }

//     return { pathD: path, gradientColor: color, percentText: percent, isPositive: positive };
//   }, [marketData, activeColor]);

//   return (
//     <div className="relative bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex flex-col justify-between overflow-hidden h-full min-h-[220px]">
      
//       <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] overflow-hidden">
//         <BaseIcon size={200} strokeWidth={1} />
//       </div>

//       <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-lime-400/10 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000" style={{ backgroundColor: `${gradientColor}20` }}></div>
      
//       <div className="relative z-10">
//         <div className="flex items-center justify-between mb-4">
//           <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
//             <Activity size={14} /> {t("topPair")} {/* 👈 TRANSLATED */}
//           </span>
//           <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
//             isPositive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
//           }`}>
//             <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} /> 
//             {percentText}
//           </span>
//         </div>

//         <div className="flex items-center gap-2 mb-4 relative z-20">
//           <div className="relative flex items-center">
//             <BaseIcon size={18} className="absolute left-2 text-lime-600 dark:text-lime-400 pointer-events-none" />
//             <select 
//               value={baseAsset} 
//               onChange={(e) => setBaseAsset(e.target.value)}
//               className="appearance-none bg-white dark:bg-[#121A14] border border-lime-500/30 text-lime-950 dark:text-white text-lg font-extrabold font-mono rounded-xl pl-7 pr-6 py-1.5 focus:outline-none focus:border-lime-500 cursor-pointer shadow-sm"
//             >
//               {assets.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
//             </select>
//             <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={16} />
//           </div>
          
//           <span className="text-xl font-bold text-lime-800/50 dark:text-lime-200/40">/</span>

//           <div className="relative flex items-center">
//             <QuoteIcon size={18} className="absolute left-2 text-lime-600 dark:text-lime-400 pointer-events-none" />
//             <select 
//               value={quoteAsset} 
//               onChange={(e) => setQuoteAsset(e.target.value)}
//               className="appearance-none bg-white dark:bg-[#121A14] border border-lime-500/30 text-lime-950 dark:text-white text-lg font-extrabold font-mono rounded-xl pl-7 pr-6 py-1.5 focus:outline-none focus:border-lime-500 cursor-pointer shadow-sm"
//             >
//               {assets.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
//             </select>
//             <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={16} />
//           </div>
//         </div>
        
//         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">{t("liveChart")}</p> {/* 👈 TRANSLATED */}
//       </div>

//       <div className="relative h-20 w-full mt-4 z-10">
//         <svg viewBox="-2 -2 104 44" className="w-full h-full preserve-3d" preserveAspectRatio="none">
//           <defs>
//             <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
//               <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
//             </linearGradient>
//           </defs>
//           <path 
//             d={`${pathD} L100,40 L0,40 Z`} 
//             fill="url(#chartGradient)" 
//             className="transition-all duration-1000"
//           />
//           <motion.path 
//             key={animationKey}
//             d={pathD} 
//             fill="none" 
//             stroke={gradientColor} 
//             strokeWidth="2"
//             initial={{ pathLength: 0 }} 
//             animate={{ pathLength: 1 }} 
//             transition={{ duration: 1.5, ease: "easeInOut" }}
//           />
//         </svg>
//       </div>
//     </div>
//   );
// }

// // components/dashboard/FavorablePairsCard.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import { 
//   TrendingUp, Activity, ChevronDown, Bitcoin, Hexagon, Sun, 
//   DollarSign, Euro, PoundSterling, CircleDollarSign 
// } from "lucide-react";
// import { getMarketSettings } from "@/app/actions/admin-market"; // 👈 Imported Admin Action

// const COLORS = ["#84cc16", "#3b82f6", "#f59e0b", "#ec4899"]; 

// const ASSETS = [
//   { id: "BTC", name: "Bitcoin", icon: Bitcoin },
//   { id: "ETH", name: "Ethereum", icon: Hexagon },
//   { id: "SOL", name: "Solana", icon: Sun },
//   { id: "USD", name: "US Dollar", icon: DollarSign },
//   { id: "EUR", name: "Euro", icon: Euro },
//   { id: "GBP", name: "Pound", icon: PoundSterling },
//   { id: "DOGE", name: "Dogecoin", icon: CircleDollarSign },
// ];

// // 👇 Helper to get the correct SVG Icon
// const getAssetIcon = (id: string) => {
//   const asset = ASSETS.find(a => a.id === id);
//   return asset ? asset.icon : CircleDollarSign;
// };

// export default function FavorablePairsCard() {
//   const [baseAsset, setBaseAsset] = useState("BTC"); // Default BTC
//   const [quoteAsset, setQuoteAsset] = useState("USD"); // Default USD
  
//   const [colorIndex, setColorIndex] = useState(0);
//   const [animationKey, setAnimationKey] = useState(0);
  
//   // 👇 STATE FOR ADMIN TREND
//   const [trend, setTrend] = useState<"bullish" | "bearish" | "consolidate">("consolidate");

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setColorIndex((prev) => (prev + 1) % COLORS.length);
//       setAnimationKey((prev) => prev + 1); 
//     }, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   // 👇 FETCH ADMIN TREND ON MOUNT & INTERVAL
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
          
//           setTrend(activeBlock.trend);
//         }
//       } catch (error) {
//         console.error("Failed to fetch market settings", error);
//       }
//     }
//     fetchTrend();
//     const interval = setInterval(fetchTrend, 60000); // Refresh every minute
//     return () => clearInterval(interval);
//   }, []);

//   const activeColor = COLORS[colorIndex];
//   const BaseIcon = getAssetIcon(baseAsset);
//   const QuoteIcon = getAssetIcon(quoteAsset);

//   // 👇 DYNAMIC SVG PATH BASED ON TREND
//   let pathD = "M0,20 Q10,15 20,25 T40,20 T60,25 Q70,20 80,25 T100,20"; // Consolidate
//   let gradientColor = activeColor;
//   let percentText = "+0.3%";
  
//   if (trend === "bullish") {
//     pathD = "M0,35 Q10,30 20,32 T40,20 T60,15 Q70,10 80,5 T100,5";
//     gradientColor = "#10b981";
//     percentText = "+14.5%";
//   } else if (trend === "bearish") {
//     pathD = "M0,5 Q10,10 20,15 T40,25 T60,30 Q70,35 80,38 T100,40";
//     gradientColor = "#ef4444";
//     percentText = "-8.2%";
//   }

//   return (
//     <div className="relative bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex flex-col justify-between overflow-hidden h-full min-h-[220px]">
      
//       {/* 👇 WATERMARK 👇 */}
//       <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] overflow-hidden">
//         <BaseIcon size={200} strokeWidth={1} />
//       </div>

//       <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-lime-400/10 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000" style={{ backgroundColor: `${gradientColor}20` }}></div>
      
//       <div className="relative z-10">
//         <div className="flex items-center justify-between mb-4">
//           <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
//             <Activity size={14} /> Top Pair
//           </span>
//           <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
//             trend === 'bullish' ? 'text-green-500 bg-green-500/10' : 
//             trend === 'bearish' ? 'text-red-500 bg-red-500/10' : 
//             'text-amber-500 bg-amber-500/10'
//           }`}>
//             <TrendingUp size={12} className={trend === 'bearish' ? 'rotate-180' : ''} /> 
//             {percentText}
//           </span>
//         </div>

//         {/* 👇 The Asset Selectors with SVG Icons 👇 */}
//         <div className="flex items-center gap-2 mb-4 relative z-20">
//           <div className="relative flex items-center">
//             <BaseIcon size={18} className="absolute left-2 text-lime-600 dark:text-lime-400 pointer-events-none" />
//             <select 
//               value={baseAsset} 
//               onChange={(e) => setBaseAsset(e.target.value)}
//               className="appearance-none bg-white dark:bg-[#121A14] border border-lime-500/30 text-lime-950 dark:text-white text-lg font-extrabold font-mono rounded-xl pl-7 pr-6 py-1.5 focus:outline-none focus:border-lime-500 cursor-pointer shadow-sm"
//             >
//               {ASSETS.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
//             </select>
//             <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={16} />
//           </div>
          
//           <span className="text-xl font-bold text-lime-800/50 dark:text-lime-200/40">/</span>

//           <div className="relative flex items-center">
//             <QuoteIcon size={18} className="absolute left-2 text-lime-600 dark:text-lime-400 pointer-events-none" />
//             <select 
//               value={quoteAsset} 
//               onChange={(e) => setQuoteAsset(e.target.value)}
//               className="appearance-none bg-white dark:bg-[#121A14] border border-lime-500/30 text-lime-950 dark:text-white text-lg font-extrabold font-mono rounded-xl pl-7 pr-6 py-1.5 focus:outline-none focus:border-lime-500 cursor-pointer shadow-sm"
//             >
//               {ASSETS.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
//             </select>
//             <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={16} />
//           </div>
//         </div>
        
//         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Live chart tracking the most favorable pair.</p>
//       </div>

//       {/* The Looping SVG Chart */}
//       <div className="relative h-20 w-full mt-4 z-10">
//         <svg viewBox="-2 -2 104 44" className="w-full h-full preserve-3d" preserveAspectRatio="none">
//           <defs>
//             <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
//               <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
//             </linearGradient>
//           </defs>
//           <path 
//             d={`${pathD} L100,40 L0,40 Z`} 
//             fill="url(#chartGradient)" 
//             className="transition-all duration-1000"
//           />
//           <motion.path 
//             key={animationKey}
//             d={pathD} 
//             fill="none" 
//             stroke={gradientColor} 
//             strokeWidth="2"
//             initial={{ pathLength: 0 }} 
//             animate={{ pathLength: 1 }} 
//             transition={{ duration: 1.5, ease: "easeInOut" }}
//           />
//         </svg>
//       </div>
//     </div>
//   );
// }
// // components/dashboard/FavorablePairsCard.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import { 
//   TrendingUp, Activity, ChevronDown, Bitcoin, Hexagon, Sun, 
//   DollarSign, Euro, PoundSterling, CircleDollarSign 
// } from "lucide-react";

// const COLORS = ["#84cc16", "#3b82f6", "#f59e0b", "#ec4899"]; 

// const ASSETS = [
//   { id: "BTC", name: "Bitcoin", icon: Bitcoin },
//   { id: "ETH", name: "Ethereum", icon: Hexagon },
//   { id: "SOL", name: "Solana", icon: Sun },
//   { id: "USD", name: "US Dollar", icon: DollarSign },
//   { id: "EUR", name: "Euro", icon: Euro },
//   { id: "GBP", name: "Pound", icon: PoundSterling },
//   { id: "DOGE", name: "Dogecoin", icon: CircleDollarSign },
// ];

// // 👇 Helper to get the correct SVG Icon
// const getAssetIcon = (id: string) => {
//   const asset = ASSETS.find(a => a.id === id);
//   return asset ? asset.icon : CircleDollarSign;
// };

// export default function FavorablePairsCard() {
//   const [baseAsset, setBaseAsset] = useState("BTC"); // Default BTC
//   const [quoteAsset, setQuoteAsset] = useState("USD"); // Default USD
  
//   const [colorIndex, setColorIndex] = useState(0);
//   const [animationKey, setAnimationKey] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setColorIndex((prev) => (prev + 1) % COLORS.length);
//       setAnimationKey((prev) => prev + 1); 
//     }, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   const activeColor = COLORS[colorIndex];
//   const BaseIcon = getAssetIcon(baseAsset);
//   const QuoteIcon = getAssetIcon(quoteAsset);

//   return (
//     <div className="relative bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex flex-col justify-between overflow-hidden h-full min-h-[220px]">
      
//       {/* 👇 WATERMARK 👇 */}
//       <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] overflow-hidden">
//         <BaseIcon size={200} strokeWidth={1} />
//       </div>

//       <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-lime-400/10 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000" style={{ backgroundColor: `${activeColor}20` }}></div>
      
//       <div className="relative z-10">
//         <div className="flex items-center justify-between mb-4">
//           <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
//             <Activity size={14} /> Top Pair
//           </span>
//           <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md flex items-center gap-1">
//             <TrendingUp size={12} /> +14.5%
//           </span>
//         </div>

//         {/* 👇 The Asset Selectors with SVG Icons 👇 */}
//         <div className="flex items-center gap-2 mb-4 relative z-20">
//           <div className="relative flex items-center">
//             <BaseIcon size={18} className="absolute left-2 text-lime-600 dark:text-lime-400 pointer-events-none" />
//             <select 
//               value={baseAsset} 
//               onChange={(e) => setBaseAsset(e.target.value)}
//               className="appearance-none bg-white dark:bg-[#121A14] border border-lime-500/30 text-lime-950 dark:text-white text-lg font-extrabold font-mono rounded-xl pl-7 pr-6 py-1.5 focus:outline-none focus:border-lime-500 cursor-pointer shadow-sm"
//             >
//               {ASSETS.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
//             </select>
//             <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={16} />
//           </div>
          
//           <span className="text-xl font-bold text-lime-800/50 dark:text-lime-200/40">/</span>

//           <div className="relative flex items-center">
//             <QuoteIcon size={18} className="absolute left-2 text-lime-600 dark:text-lime-400 pointer-events-none" />
//             <select 
//               value={quoteAsset} 
//               onChange={(e) => setQuoteAsset(e.target.value)}
//               className="appearance-none bg-white dark:bg-[#121A14] border border-lime-500/30 text-lime-950 dark:text-white text-lg font-extrabold font-mono rounded-xl pl-7 pr-6 py-1.5 focus:outline-none focus:border-lime-500 cursor-pointer shadow-sm"
//             >
//               {ASSETS.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
//             </select>
//             <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={16} />
//           </div>
//         </div>
        
//         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Live chart tracking the most favorable pair.</p>
//       </div>

//       {/* The Looping SVG Chart */}
//       <div className="relative h-20 w-full mt-4 z-10">
//         <svg viewBox="-2 -2 104 44" className="w-full h-full preserve-3d" preserveAspectRatio="none">
//           <defs>
//             <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="0%" stopColor={activeColor} stopOpacity="0.3" />
//               <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
//             </linearGradient>
//           </defs>
//           <path 
//             d="M0,35 Q10,30 20,32 T40,20 T60,25 Q70,10 80,5 T100,10 L100,40 L0,40 Z" 
//             fill="url(#chartGradient)" 
//             className="transition-all duration-1000"
//           />
//           <motion.path 
//             key={animationKey}
//             d="M0,35 Q10,30 20,32 T40,20 T60,25 Q70,10 80,5 T100,10" 
//             fill="none" 
//             stroke={activeColor} 
//             strokeWidth="2"
//             initial={{ pathLength: 0 }} 
//             animate={{ pathLength: 1 }} 
//             transition={{ duration: 1.5, ease: "easeInOut" }}
//           />
//         </svg>
//       </div>
//     </div>
//   );
// }
// // components/dashboard/FavorablePairsCard.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import { TrendingUp, Activity, ChevronDown } from "lucide-react";

// const COLORS = ["#84cc16", "#3b82f6", "#f59e0b", "#ec4899"]; // Lime, Blue, Amber, Pink

// const ASSETS = ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "EUR", "GBP", "JPY"];

// export default function FavorablePairsCard() {
//   const [baseAsset, setBaseAsset] = useState("BTC");
//   const [quoteAsset, setQuoteAsset] = useState("USD");
  
//   const [colorIndex, setColorIndex] = useState(0);
//   const [animationKey, setAnimationKey] = useState(0);

//   // 👇 The 5-second loop logic
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setColorIndex((prev) => (prev + 1) % COLORS.length);
//       setAnimationKey((prev) => prev + 1); // Forces the SVG to re-draw
//     }, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   const activeColor = COLORS[colorIndex];

//   return (
//     <div className="relative bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex flex-col justify-between overflow-hidden h-full min-h-[220px]">
//       <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-lime-400/10 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000" style={{ backgroundColor: `${activeColor}20` }}></div>
      
//       <div className="relative z-10">
//         <div className="flex items-center justify-between mb-4">
//           <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
//             <Activity size={14} /> Top Pair
//           </span>
//           <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md flex items-center gap-1">
//             <TrendingUp size={12} /> +14.5%
//           </span>
//         </div>

//         {/* 👇 The Asset Selectors 👇 */}
//         <div className="flex items-center gap-2 mb-4 relative z-20">
//           <div className="relative">
//             <select 
//               value={baseAsset} 
//               onChange={(e) => setBaseAsset(e.target.value)}
//               className="appearance-none bg-white dark:bg-[#121A14] border border-lime-500/30 text-lime-950 dark:text-white text-lg font-extrabold font-mono rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:border-lime-500 cursor-pointer shadow-sm"
//             >
//               {ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
//             </select>
//             <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={16} />
//           </div>
          
//           <span className="text-xl font-bold text-lime-800/50 dark:text-lime-200/40">/</span>

//           <div className="relative">
//             <select 
//               value={quoteAsset} 
//               onChange={(e) => setQuoteAsset(e.target.value)}
//               className="appearance-none bg-white dark:bg-[#121A14] border border-lime-500/30 text-lime-950 dark:text-white text-lg font-extrabold font-mono rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:border-lime-500 cursor-pointer shadow-sm"
//             >
//               {ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
//             </select>
//             <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={16} />
//           </div>
//         </div>
        
//         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Live chart tracking the most favorable pair.</p>
//       </div>

//       {/* 👇 The Looping SVG Chart 👇 */}
//       <div className="relative h-20 w-full mt-4">
//         <svg viewBox="-2 -2 104 44" className="w-full h-full preserve-3d" preserveAspectRatio="none">
//           <defs>
//             <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="0%" stopColor={activeColor} stopOpacity="0.3" />
//               <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
//             </linearGradient>
//           </defs>
//           <path 
//             d="M0,35 Q10,30 20,32 T40,20 T60,25 Q70,10 80,5 T100,10 L100,40 L0,40 Z" 
//             fill="url(#chartGradient)" 
//             className="transition-all duration-1000"
//           />
//           <motion.path 
//             key={animationKey}
//             d="M0,35 Q10,30 20,32 T40,20 T60,25 Q70,10 80,5 T100,10" 
//             fill="none" 
//             stroke={activeColor} 
//             strokeWidth="2"
//             initial={{ pathLength: 0 }} 
//             animate={{ pathLength: 1 }} 
//             transition={{ duration: 1.5, ease: "easeInOut" }}
//           />
//         </svg>
//       </div>
//     </div>
//   );
// }