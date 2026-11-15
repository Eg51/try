// components/dashboard/PairSelectionModal.tsx
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export default function PairSelectionModal({
  isOpen,
  onClose,
  onSave,
  dbAssets = [],
  initialBase = "",
  initialQuote = ""
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base: string, quote: string) => void;
  dbAssets: any[];
  initialBase?: string;
  initialQuote?: string;
}) {
  const t = useTranslations("PairSelection");
  const [step, setStep] = useState<"base" | "quote">("base");
  const [search, setSearch] = useState("");
  const [base, setBase] = useState(initialBase);
  const [quote, setQuote] = useState(initialQuote);

  // 👇 FIXED: Strictly divide the assets based on the active tab
  const availableAssets = useMemo(() => {
    return dbAssets.filter((a: any) => {
      const matchesSearch = 
        a.name.toLowerCase().includes(search.toLowerCase()) || 
        a.symbol.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      if (step === "base") {
        // Base Asset: Crypto and Memes ONLY (No Fiat)
        return a.category === "crypto" || a.category === "memes";
      } else {
        // Quote Asset: Fiat, Crypto, and Memes
        return true; 
      }
    });
  }, [dbAssets, search, step]);

  const handleSave = () => {
    if (base && quote) {
      onSave(base, quote);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        // 👇 FIXED: Added overflow-y-auto to the background overlay and items-start for small screens
        <div className="fixed inset-0 z-[1000] flex items-start sm:items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            // 👇 FIXED: Added my-auto to keep it centered but allow scrolling if it gets too tall
            className="relative w-full max-w-md my-auto bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/40 dark:bg-[#121A14]/60 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-lime-950 dark:text-white">
                  {t("title")}
                </h2>
                <p className="text-xs text-lime-800/60 dark:text-lime-200/50">
                  {t("desc")}
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-lime-500/10 text-lime-600 dark:text-lime-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* TABS */}
            <div className="flex px-4 py-3 gap-2 bg-white/20 dark:bg-black/20 border-b border-lime-500/10 shrink-0">
              <button 
                onClick={() => { setStep("base"); setSearch(""); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${step === "base" ? "bg-lime-500 text-white shadow-md" : "bg-white/50 dark:bg-black/30 text-lime-800 dark:text-lime-200"}`}
              >
                1. {base ? base : t("selectBase")}
              </button>
              <button 
                onClick={() => { setStep("quote"); setSearch(""); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${step === "quote" ? "bg-lime-500 text-white shadow-md" : "bg-white/50 dark:bg-black/30 text-lime-800 dark:text-lime-200"}`}
              >
                2. {quote ? quote : t("selectQuote")}
              </button>
            </div>

            {/* SEARCH BAR (Pinned under tabs) */}
            <div className="p-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50 dark:text-lime-400/50" size={16} />
                <input
                  type="text"
                  placeholder={step === "base" ? "Search Crypto..." : "Search Fiat or Crypto..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-full py-2 pl-9 pr-4 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors"
                />
              </div>
            </div>

            {/* LIST (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {availableAssets.length === 0 && (
                <p className="text-center text-xs text-lime-800/50 dark:text-lime-200/40 py-8 font-medium">
                  No assets found.
                </p>
              )}
              
              {availableAssets.map((asset: any) => {
                const isSelected = step === "base" ? base === asset.symbol : quote === asset.symbol;
                return (
                  <button
                    key={asset.id || asset._id || asset.symbol}
                    onClick={() => {
                      if (step === "base") {
                        setBase(asset.symbol);
                        setStep("quote");
                      } else {
                        if (asset.symbol === base) return;
                        setQuote(asset.symbol);
                      }
                      setSearch("");
                    }}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                      isSelected 
                        ? "border-lime-500 bg-lime-500/10" 
                        : "border-lime-500/20 dark:border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 hover:bg-white/80 dark:hover:bg-[#121A14]/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center overflow-hidden shrink-0">
                        {asset.image ? (
                          <img src={asset.image} alt={asset.symbol} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-lime-600 dark:text-lime-400">{asset.symbol.charAt(0)}</span>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-sm text-lime-950 dark:text-white uppercase">{asset.symbol}</div>
                        <div className="text-xs text-lime-800/60 dark:text-lime-200/50">{asset.name}</div>
                      </div>
                    </div>
                    {isSelected && <Check size={18} className="text-lime-500" />}
                  </button>
                );
              })}
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 shrink-0">
              <Button
                onClick={handleSave}
                disabled={!base || !quote}
                className="w-full h-11 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("save")}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


// // components/dashboard/PairSelectionModal.tsx
// "use client";

// import { useState, useMemo } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { X, Search, Check } from "lucide-react";
// import { useTranslations } from "next-intl";
// import { Button } from "@/components/ui/Button";

// export default function PairSelectionModal({
//   isOpen,
//   onClose,
//   onSave,
//   dbAssets = [],
//   initialBase = "",
//   initialQuote = ""
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (base: string, quote: string) => void;
//   dbAssets: any[];
//   initialBase?: string;
//   initialQuote?: string;
// }) {
//   const t = useTranslations("PairSelection");
//   const [step, setStep] = useState<"base" | "quote">("base");
//   const [search, setSearch] = useState("");
//   const [base, setBase] = useState(initialBase);
//   const [quote, setQuote] = useState(initialQuote);

//   // 👇 FIXED: Strictly divide the assets based on the active tab
//   const availableAssets = useMemo(() => {
//     return dbAssets.filter((a: any) => {
//       const matchesSearch = 
//         a.name.toLowerCase().includes(search.toLowerCase()) || 
//         a.symbol.toLowerCase().includes(search.toLowerCase());
      
//       if (!matchesSearch) return false;

//       if (step === "base") {
//         // Base Asset: Crypto and Memes ONLY (No Fiat)
//         return a.category === "crypto" || a.category === "memes";
//       } else {
//         // Quote Asset: Fiat, Crypto, and Memes
//         return true; 
//       }
//     });
//   }, [dbAssets, search, step]);

//   const handleSave = () => {
//     if (base && quote) {
//       onSave(base, quote);
//       onClose();
//     }
//   };

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
//           <motion.div
//             initial={{ opacity: 0, scale: 0.95, y: 20 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.95, y: 20 }}
//             className="relative w-full max-w-md bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
//           >
//             <div className="p-4 border-b border-lime-500/10 flex justify-between items-center bg-white/40 dark:bg-[#121A14]/60 shrink-0">
//               <div>
//                 <h2 className="text-lg font-bold text-lime-950 dark:text-white">
//                   {t("title")}
//                 </h2>
//                 <p className="text-xs text-lime-800/60 dark:text-lime-200/50">
//                   {t("desc")}
//                 </p>
//               </div>
//               <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-lime-500/10 text-lime-600 dark:text-lime-400 transition-colors">
//                 <X size={18} />
//               </button>
//             </div>

//             {/* 👇 TABS */}
//             <div className="flex px-4 py-3 gap-2 bg-white/20 dark:bg-black/20 border-b border-lime-500/10">
//               <button 
//                 onClick={() => { setStep("base"); setSearch(""); }}
//                 className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${step === "base" ? "bg-lime-500 text-white shadow-md" : "bg-white/50 dark:bg-black/30 text-lime-800 dark:text-lime-200"}`}
//               >
//                 1. {base ? base : t("selectBase")}
//               </button>
//               <button 
//                 onClick={() => { setStep("quote"); setSearch(""); }}
//                 className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${step === "quote" ? "bg-lime-500 text-white shadow-md" : "bg-white/50 dark:bg-black/30 text-lime-800 dark:text-lime-200"}`}
//               >
//                 2. {quote ? quote : t("selectQuote")}
//               </button>
//             </div>

//             <div className="p-3 shrink-0">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50 dark:text-lime-400/50" size={16} />
//                 <input
//                   type="text"
//                   placeholder={step === "base" ? "Search Crypto..." : "Search Fiat or Crypto..."}
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   className="w-full bg-white/50 dark:bg-[#050806]/80 border border-lime-500/20 rounded-full py-2 pl-9 pr-4 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors"
//                 />
//               </div>
//             </div>

//             {/* 👇 LIST */}
//             <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
//               {availableAssets.length === 0 && (
//                 <p className="text-center text-xs text-lime-800/50 dark:text-lime-200/40 py-8 font-medium">
//                   No assets found.
//                 </p>
//               )}
              
//               {availableAssets.map((asset: any) => {
//                 const isSelected = step === "base" ? base === asset.symbol : quote === asset.symbol;
//                 return (
//                   <button
//                     // key={asset._id}
//                     key={asset.id || asset._id || asset.symbol}
//                     onClick={() => {
//                       if (step === "base") {
//                         setBase(asset.symbol);
//                         setStep("quote");
//                       } else {
//                         if (asset.symbol === base) return;
//                         setQuote(asset.symbol);
//                       }
//                       setSearch("");
//                     }}
//                     className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-colors ${
//                       isSelected 
//                         ? "border-lime-500 bg-lime-500/10" 
//                         : "border-lime-500/20 dark:border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 hover:bg-white/80 dark:hover:bg-[#121A14]/80"
//                     }`}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-full bg-lime-500/10 flex items-center justify-center overflow-hidden shrink-0">
//                         {asset.image ? (
//                           <img src={asset.image} alt={asset.symbol} className="w-full h-full object-cover" />
//                         ) : (
//                           <span className="text-xs font-bold text-lime-600 dark:text-lime-400">{asset.symbol.charAt(0)}</span>
//                         )}
//                       </div>
//                       <div className="text-left">
//                         <div className="font-bold text-sm text-lime-950 dark:text-white uppercase">{asset.symbol}</div>
//                         <div className="text-xs text-lime-800/60 dark:text-lime-200/50">{asset.name}</div>
//                       </div>
//                     </div>
//                     {isSelected && <Check size={18} className="text-lime-500" />}
//                   </button>
//                 );
//               })}
//             </div>

//             <div className="p-4 border-t border-lime-500/10 bg-white/40 dark:bg-[#121A14]/60 shrink-0">
//               <Button
//                 onClick={handleSave}
//                 disabled={!base || !quote}
//                 className="w-full h-11 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {t("save")}
//               </Button>
//             </div>
//           </motion.div>
//         </div>
//       )}
//     </AnimatePresence>
//   );
// }