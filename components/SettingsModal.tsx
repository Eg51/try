// components/SettingsModal.tsx
"use client";

import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Palette, DollarSign, Globe, Bell, Shield, Monitor, Moon, Sun, 
  Check, TrendingUp, AlertTriangle, Newspaper, UserX, Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { deleteKyc } from "@/app/actions/kyc";

// --- COMPREHENSIVE DATA LISTS ---
const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
];

const LANGUAGES = [
  "English (US)", "English (UK)", "Español (ES)", "Français (FR)", "Deutsch (DE)", 
  "中文 (ZH)", "日本語 (JA)", "한국어 (KO)", "Русский (RU)", "العربية (AR)", 
  "Português (PT)", "Italiano (IT)", "Türkçe (TR)", "हिन्दी (HI)", "Yoruba (YO)",
  "Igbo (IG)", "Hausa (HA)", "Swahili (SW)", "Nederlands (NL)", "Polski (PL)"
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { openModal } = useDevModal();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingKyc, setIsDeletingKyc] = useState(false);

  // State for all settings
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("English (US)");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [tradeExec, setTradeExec] = useState(true);
  const [marginCalls, setMarginCalls] = useState(true);
  const [newsFeed, setNewsFeed] = useState(false);
  
  // Trading specific
  const [oneClickTrade, setOneClickTrade] = useState(false);
  const [defaultOrderSize, setDefaultOrderSize] = useState("100");

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const handleSave = () => {
    setIsSaving(true);
    // Simulate saving to backend
    setTimeout(() => {
      setIsSaving(false);
      onClose();
      openModal("Settings Saved", "Your preferences have been updated successfully.", "success");
    }, 1000);
  };

  const handleDeleteKyc = async () => {
    if (!confirm("Are you sure you want to delete your data? Your account will be downgraded to Tier 0 and you will lose access to trading features.")) return;
    
    setIsDeletingKyc(true);
    const res = await deleteKyc();
    setIsDeletingKyc(false);

    if (res.success) {
      onClose();
      openModal("KYC Deleted", "Your identity verification data has been permanently removed.", "info");
      window.location.reload();
    } else {
      openModal("Error", res.error || "Failed to delete KYC data.", "error");
    }
  };

  // Toggle Component
  const Toggle = ({ label, desc, state, setState }: any) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <h4 className="text-sm font-bold text-lime-950 dark:text-white">{label}</h4>
        <p className="text-xs text-lime-800/60 dark:text-lime-200/50">{desc}</p>
      </div>
      <button 
        onClick={() => setState(!state)} 
        className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${state ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-700'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${state ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[95%] max-w-3xl max-h-[90vh] flex flex-col bg-white/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header (Sticky) */}
            <div className="flex items-center justify-between p-6 border-b border-lime-500/20 bg-white/50 dark:bg-[#0a0f0b]/50 backdrop-blur-md shrink-0">
              <div>
                <h2 className="text-2xl font-extrabold text-lime-950 dark:text-white">Configure experience</h2>
                <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium mt-1"></p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-red-500/10 text-lime-800 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thumb-lime-400 custom-scrollbar">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Appearance */}
                <div className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
                      <Palette size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lime-950 dark:text-white">Appearance</h3>
                      <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Choose your interface theme.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setTheme("light")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${theme === "light" ? "bg-lime-500 text-white border-lime-500" : "border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`}>
                      <Sun size={14} /> Light
                    </button>
                    <button onClick={() => setTheme("dark")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${theme === "dark" ? "bg-lime-500 text-white border-lime-500" : "border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`}>
                      <Moon size={14} /> Dark
                    </button>
                    <button onClick={() => setTheme("system")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${theme === "system" ? "bg-lime-500 text-white border-lime-500" : "border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`}>
                      <Monitor size={14} /> Auto
                    </button>
                  </div>
                </div>

                {/* 2. Display Currency */}
                <div className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lime-950 dark:text-white">Display Currency</h3>
                      <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Primary fiat for balances.</p>
                    </div>
                  </div>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-white dark:bg-[#0a0f0b] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-lime-500 cursor-pointer">
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name} ({c.symbol})</option>
                    ))}
                  </select>
                </div>

                {/* 3. Language */}
                <div className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lime-950 dark:text-white">Language</h3>
                      <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Select your native language.</p>
                    </div>
                  </div>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-white dark:bg-[#0a0f0b] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-lime-500 cursor-pointer">
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Trading Preferences */}
                <div className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lime-950 dark:text-white">Trading</h3>
                      <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Execution preferences.</p>
                    </div>
                  </div>
                  <Toggle label="One-Click Trading" desc="Fast execution directly from charts." state={oneClickTrade} setState={setOneClickTrade} />
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="text-sm font-bold text-lime-950 dark:text-white">Default Order Size</h4>
                      <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Base amount for quick buys.</p>
                    </div>
                    <input type="number" value={defaultOrderSize} onChange={(e) => setDefaultOrderSize(e.target.value)} className="w-20 bg-white dark:bg-[#0a0f0b] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-lg px-2 py-1 text-right outline-none focus:border-lime-500" />
                  </div>
                </div>
              </div>

              {/* Notifications Section */}
              <div className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lime-950 dark:text-white">Notifications & Alerts</h3>
                    <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Manage your alerts.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <Toggle label="Email Updates" desc="Account & security emails." state={emailNotifs} setState={setEmailNotifs} />
                  <Toggle label="Trade Execution" desc="When your orders fill." state={tradeExec} setState={setTradeExec} />
                  <Toggle label="Price Alerts" desc="When assets hit your targets." state={priceAlerts} setState={setPriceAlerts} />
                  <Toggle label="Margin Calls" desc="Risk management warnings." state={marginCalls} setState={setMarginCalls} />
                  <Toggle label="Market News" desc="Daily news & analysis feed." state={newsFeed} setState={setNewsFeed} />
                </div>
              </div>

              {/* Security & KYC Section */}
              <div className="group p-5 rounded-2xl border border-red-500/20 bg-red-500/5 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-xl text-red-500">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-500">KYC & Security Data</h3>
                      <p className="text-xs text-red-500/70">Manage or delete your verification data.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => { onClose(); window.location.href = "/dashboard/profile"; }}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white dark:bg-[#121A14] border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors"
                    >
                      View KYC
                    </button>
                    <button 
                      onClick={handleDeleteKyc}
                      disabled={isDeletingKyc}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                      {isDeletingKyc ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                      Delete KYC
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Sticky Footer (Save Button) */}
            <div className="p-4 border-t border-lime-500/20 bg-white/80 dark:bg-[#0a0f0b]/80 justify-center alig n-center shink-2 backdrop-blur-md flex">
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="px-8 py-3 rounded-xl bg-lime-600 text-white font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/20 flex items-center gap-2"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
// // components/SettingsModal.tsx
// "use client";

// import { useTheme } from "next-themes";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   X, Palette, DollarSign, Globe, Bell, Shield, Monitor, Moon, Sun, Check 
// } from "lucide-react";
// import { useEffect, useState } from "react";

// interface SettingsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
//   const { theme, setTheme } = useTheme();
//   const [mounted, setMounted] = useState(false);
//   const [currency, setCurrency] = useState("USD");
//   const [emailNotifs, setEmailNotifs] = useState(true);
//   const [tradeNotifs, setTradeNotifs] = useState(true);

//   useEffect(() => setMounted(true), []);

//   if (!mounted) return null;

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <>
//           {/* Backdrop */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={onClose}
//             className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
//           />

//           {/* Modal Container */}
//           <motion.div
//             initial={{ opacity: 0, scale: 0.95, y: 20 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.95, y: 20 }}
//             transition={{ type: "spring", stiffness: 300, damping: 25 }}
//             className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] p-6 sm:p-8"
//           >
//             {/* Header */}
//             <div className="flex items-center justify-between mb-8 border-b border-lime-500/20 pb-4">
//               <div>
//                 <h2 className="text-2xl font-extrabold text-lime-950 dark:text-white">Platform Settings</h2>
//                 <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium mt-1">Configure your Quantix experience.</p>
//               </div>
//               <button 
//                 onClick={onClose}
//                 className="p-2 rounded-full hover:bg-red-500/10 text-lime-800 hover:text-red-500 transition-colors"
//               >
//                 <X size={24} />
//               </button>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
//               {/* 1. Appearance */}
//               <div className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 hover:bg-lime-500/5 transition-all">
//                 <div className="flex items-center gap-3 mb-4">
//                   <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                     <Palette size={20} />
//                   </div>
//                   <div>
//                     <h3 className="font-bold text-lime-950 dark:text-white">Appearance</h3>
//                     <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Choose your interface theme.</p>
//                   </div>
//                 </div>
//                 <div className="flex gap-2">
//                   <button onClick={() => setTheme("light")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${theme === "light" ? "bg-lime-500 text-white border-lime-500" : "border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`}>
//                     <Sun size={14} /> Light
//                   </button>
//                   <button onClick={() => setTheme("dark")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${theme === "dark" ? "bg-lime-500 text-white border-lime-500" : "border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`}>
//                     <Moon size={14} /> Dark
//                   </button>
//                   <button onClick={() => setTheme("system")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${theme === "system" ? "bg-lime-500 text-white border-lime-500" : "border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`}>
//                     <Monitor size={14} /> Auto
//                   </button>
//                 </div>
//               </div>

//               {/* 2. Display Currency */}
//               <div className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 hover:bg-lime-500/5 transition-all">
//                 <div className="flex items-center gap-3 mb-4">
//                   <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                     <DollarSign size={20} />
//                   </div>
//                   <div>
//                     <h3 className="font-bold text-lime-950 dark:text-white">Display Currency</h3>
//                     <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Primary fiat for balances.</p>
//                   </div>
//                 </div>
//                 <select 
//                   value={currency} 
//                   onChange={(e) => setCurrency(e.target.value)}
//                   className="w-full bg-white dark:bg-[#0a0f0b] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-lime-500 cursor-pointer"
//                 >
//                   <option value="USD">USD - US Dollar ($)</option>
//                   <option value="EUR">EUR - Euro (€)</option>
//                   <option value="GBP">GBP - British Pound (£)</option>
//                   <option value="NGN">NGN - Nigerian Naira (₦)</option>
//                 </select>
//               </div>

//               {/* 3. Language */}
//               <div className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 hover:bg-lime-500/5 transition-all">
//                 <div className="flex items-center gap-3 mb-4">
//                   <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                     <Globe size={20} />
//                   </div>
//                   <div>
//                     <h3 className="font-bold text-lime-950 dark:text-white">Language</h3>
//                     <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Select your native language.</p>
//                   </div>
//                 </div>
//                 <select className="w-full bg-white dark:bg-[#0a0f0b] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-lime-500 cursor-pointer">
//                   <option>English (US)</option>
//                   <option>Spanish (ES)</option>
//                   <option>French (FR)</option>
//                   <option>Mandarin (ZH)</option>
//                 </select>
//               </div>

//               {/* 4. Notifications */}
//               <div className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 hover:bg-lime-500/5 transition-all">
//                 <div className="flex items-center gap-3 mb-4">
//                   <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                     <Bell size={20} />
//                   </div>
//                   <div>
//                     <h3 className="font-bold text-lime-950 dark:text-white">Notifications</h3>
//                     <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Manage your alerts.</p>
//                   </div>
//                 </div>
//                 <div className="space-y-3">
//                   <label className="flex items-center justify-between cursor-pointer">
//                     <span className="text-xs font-semibold text-lime-800 dark:text-lime-200">Email Updates</span>
//                     <div onClick={() => setEmailNotifs(!emailNotifs)} className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${emailNotifs ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
//                       <div className={`w-4 h-4 rounded-full bg-white transition-transform ${emailNotifs ? 'translate-x-5' : 'translate-x-0'}`}></div>
//                     </div>
//                   </label>
//                   <label className="flex items-center justify-between cursor-pointer">
//                     <span className="text-xs font-semibold text-lime-800 dark:text-lime-200">Trade Execution</span>
//                     <div onClick={() => setTradeNotifs(!tradeNotifs)} className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${tradeNotifs ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
//                       <div className={`w-4 h-4 rounded-full bg-white transition-transform ${tradeNotifs ? 'translate-x-5' : 'translate-x-0'}`}></div>
//                     </div>
//                   </label>
//                 </div>
//               </div>

//               {/* 5. Security (Full Width) */}
//               <div className="md:col-span-2 group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 hover:bg-lime-500/5 transition-all">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                       <Shield size={20} />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-lime-950 dark:text-white">Security & Privacy</h3>
//                       <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Manage your account protection.</p>
//                     </div>
//                   </div>
//                   <button 
//                     onClick={() => { onClose(); window.location.href = "/dashboard/profile"; }}
//                     className="px-4 py-2 rounded-xl bg-lime-600 text-white text-xs font-bold hover:bg-lime-700 transition-colors shadow-lg shadow-lime-600/20"
//                   >
//                     Manage Security
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// }