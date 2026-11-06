// components/dashboard/FavorablePairsCard.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, Activity, ChevronDown, Bitcoin, Hexagon, Sun, 
  DollarSign, Euro, PoundSterling, CircleDollarSign 
} from "lucide-react";
import { getMarketSettings } from "@/app/actions/admin-market"; // 👈 Imported Admin Action

const COLORS = ["#84cc16", "#3b82f6", "#f59e0b", "#ec4899"]; 

const ASSETS = [
  { id: "BTC", name: "Bitcoin", icon: Bitcoin },
  { id: "ETH", name: "Ethereum", icon: Hexagon },
  { id: "SOL", name: "Solana", icon: Sun },
  { id: "USD", name: "US Dollar", icon: DollarSign },
  { id: "EUR", name: "Euro", icon: Euro },
  { id: "GBP", name: "Pound", icon: PoundSterling },
  { id: "DOGE", name: "Dogecoin", icon: CircleDollarSign },
];

// 👇 Helper to get the correct SVG Icon
const getAssetIcon = (id: string) => {
  const asset = ASSETS.find(a => a.id === id);
  return asset ? asset.icon : CircleDollarSign;
};

export default function FavorablePairsCard() {
  const [baseAsset, setBaseAsset] = useState("BTC"); // Default BTC
  const [quoteAsset, setQuoteAsset] = useState("USD"); // Default USD
  
  const [colorIndex, setColorIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  
  // 👇 STATE FOR ADMIN TREND
  const [trend, setTrend] = useState<"bullish" | "bearish" | "consolidate">("consolidate");

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % COLORS.length);
      setAnimationKey((prev) => prev + 1); 
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 👇 FETCH ADMIN TREND ON MOUNT & INTERVAL
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
          
          setTrend(activeBlock.trend);
        }
      } catch (error) {
        console.error("Failed to fetch market settings", error);
      }
    }
    fetchTrend();
    const interval = setInterval(fetchTrend, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const activeColor = COLORS[colorIndex];
  const BaseIcon = getAssetIcon(baseAsset);
  const QuoteIcon = getAssetIcon(quoteAsset);

  // 👇 DYNAMIC SVG PATH BASED ON TREND
  let pathD = "M0,20 Q10,15 20,25 T40,20 T60,25 Q70,20 80,25 T100,20"; // Consolidate
  let gradientColor = activeColor;
  let percentText = "+0.3%";
  
  if (trend === "bullish") {
    pathD = "M0,35 Q10,30 20,32 T40,20 T60,15 Q70,10 80,5 T100,5";
    gradientColor = "#10b981";
    percentText = "+14.5%";
  } else if (trend === "bearish") {
    pathD = "M0,5 Q10,10 20,15 T40,25 T60,30 Q70,35 80,38 T100,40";
    gradientColor = "#ef4444";
    percentText = "-8.2%";
  }

  return (
    <div className="relative bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl w-full flex flex-col justify-between overflow-hidden h-full min-h-[220px]">
      
      {/* 👇 WATERMARK 👇 */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] overflow-hidden">
        <BaseIcon size={200} strokeWidth={1} />
      </div>

      <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-lime-400/10 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000" style={{ backgroundColor: `${gradientColor}20` }}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-lime-800/50 dark:text-lime-200/40 uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} /> Top Pair
          </span>
          <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
            trend === 'bullish' ? 'text-green-500 bg-green-500/10' : 
            trend === 'bearish' ? 'text-red-500 bg-red-500/10' : 
            'text-amber-500 bg-amber-500/10'
          }`}>
            <TrendingUp size={12} className={trend === 'bearish' ? 'rotate-180' : ''} /> 
            {percentText}
          </span>
        </div>

        {/* 👇 The Asset Selectors with SVG Icons 👇 */}
        <div className="flex items-center gap-2 mb-4 relative z-20">
          <div className="relative flex items-center">
            <BaseIcon size={18} className="absolute left-2 text-lime-600 dark:text-lime-400 pointer-events-none" />
            <select 
              value={baseAsset} 
              onChange={(e) => setBaseAsset(e.target.value)}
              className="appearance-none bg-white dark:bg-[#121A14] border border-lime-500/30 text-lime-950 dark:text-white text-lg font-extrabold font-mono rounded-xl pl-7 pr-6 py-1.5 focus:outline-none focus:border-lime-500 cursor-pointer shadow-sm"
            >
              {ASSETS.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={16} />
          </div>
          
          <span className="text-xl font-bold text-lime-800/50 dark:text-lime-200/40">/</span>

          <div className="relative flex items-center">
            <QuoteIcon size={18} className="absolute left-2 text-lime-600 dark:text-lime-400 pointer-events-none" />
            <select 
              value={quoteAsset} 
              onChange={(e) => setQuoteAsset(e.target.value)}
              className="appearance-none bg-white dark:bg-[#121A14] border border-lime-500/30 text-lime-950 dark:text-white text-lg font-extrabold font-mono rounded-xl pl-7 pr-6 py-1.5 focus:outline-none focus:border-lime-500 cursor-pointer shadow-sm"
            >
              {ASSETS.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={16} />
          </div>
        </div>
        
        <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Live chart tracking the most favorable pair.</p>
      </div>

      {/* The Looping SVG Chart */}
      <div className="relative h-20 w-full mt-4 z-10">
        <svg viewBox="-2 -2 104 44" className="w-full h-full preserve-3d" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path 
            d={`${pathD} L100,40 L0,40 Z`} 
            fill="url(#chartGradient)" 
            className="transition-all duration-1000"
          />
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
    </div>
  );
}
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