// components/SettingsModal.tsx
"use client";

import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Palette, DollarSign, Globe, Bell, Shield, Monitor, Moon, Sun, 
  Check, TrendingUp, UserX, Loader2, CheckCircle2, XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation"; 
import { deleteKyc } from "@/app/actions/kyc";
import { updateUserSettingsAction } from "@/app/actions/user";
import { useTour } from "@/components/providers/TourProvider";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
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
  initialCurrency?: string;
  initialLanguage?: string;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  initialCurrency = "USD", 
  initialLanguage = "English (US)" 
}: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter(); 
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const [isDeletingKyc, setIsDeletingKyc] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error", title: string, message: string } | null>(null);

  const [currency, setCurrency] = useState(initialCurrency);
  const [language, setLanguage] = useState(initialLanguage);
  
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [tradeExec, setTradeExec] = useState(true);
  const [marginCalls, setMarginCalls] = useState(true);
  const [newsFeed, setNewsFeed] = useState(false);
  
  const [oneClickTrade, setOneClickTrade] = useState(false);
  const [defaultOrderSize, setDefaultOrderSize] = useState("100");

  const { setSteps } = useTour();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setSteps([
        { id: "tour-settings-appearance", title: "Appearance", text: "Switch between Light, Dark, or System theme modes here." },
        { id: "tour-settings-currency", title: "Display Currency", text: "Choose your preferred fiat currency for balances and charts." },
        { id: "tour-settings-language", title: "Language", text: "Select your native language for the interface." },
        { id: "tour-settings-trading", title: "Trading Preferences", text: "Enable one-click trading or set a default order size." },
        { id: "tour-settings-notifications", title: "Notifications", text: "Manage what alerts and updates you receive." },
        { id: "tour-settings-security", title: "KYC & Security", text: "Manage your identity verification data here." },
        { id: "tour-settings-save", title: "Save Settings", text: "Click here to apply all your changes across the entire platform." },
      ]);
    } else {
      setSteps([]);
    }
  }, [isOpen, setSteps]);

  if (!mounted) return null;

  const getLocaleCode = (lang: string) => {
    if (lang.includes("ES") || lang.includes("Español")) return "es";
    if (lang.includes("FR") || lang.includes("Français")) return "fr";
    if (lang.includes("DE") || lang.includes("Deutsch")) return "de";
    if (lang.includes("ZH") || lang.includes("中文")) return "zh";
    if (lang.includes("JA") || lang.includes("日本語")) return "ja";
    if (lang.includes("KO") || lang.includes("한국어")) return "ko";
    if (lang.includes("RU") || lang.includes("Русский")) return "ru";
    if (lang.includes("AR") || lang.includes("العربية")) return "ar";
    if (lang.includes("PT") || lang.includes("Português")) return "pt";
    if (lang.includes("IT") || lang.includes("Italiano")) return "it";
    if (lang.includes("TR") || lang.includes("Türkçe")) return "tr";
    if (lang.includes("HI") || lang.includes("हिन्दी")) return "hi";
    if (lang.includes("YO") || lang.includes("Yoruba")) return "yo";
    if (lang.includes("IG") || lang.includes("Igbo")) return "ig";
    if (lang.includes("HA") || lang.includes("Hausa")) return "ha";
    if (lang.includes("SW") || lang.includes("Swahili")) return "sw";
    if (lang.includes("NL") || lang.includes("Nederlands")) return "nl";
    if (lang.includes("PL") || lang.includes("Polski")) return "pl";
    return "en"; 
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // 👇 Write the locale cookie so next-intl picks it up
    const localeCode = getLocaleCode(language);
    document.cookie = `locale=${localeCode}; path=/; max-age=31536000; SameSite=Lax`;

    const res = await updateUserSettingsAction({ currency, language });
    setIsSaving(false);

    if (res.success) {
      setNotification({ type: "success", title: "Settings Saved", message: "All preferences have been updated successfully." });
      setTimeout(() => {
        setNotification(null);
        onClose();
        // 👇 FORCE HARD RELOAD TO APPLY LANGUAGE CHANGES
        window.location.reload(); 
      }, 2000);
    } else {
      setNotification({ type: "error", title: "Save Failed", message: res.error || "Could not update settings." });
    }
  };

  const handleSaveCurrency = async () => {
    setIsSavingCurrency(true);
    const res = await updateUserSettingsAction({ currency, language });
    setIsSavingCurrency(false);

    if (res.success) {
      setNotification({ type: "success", title: "Currency Updated", message: "Your display currency has been saved." });
      setTimeout(() => {
        setNotification(null);
        router.refresh(); // Soft refresh is fine for currency
      }, 2500);
    } else {
      setNotification({ type: "error", title: "Update Failed", message: res.error || "Failed to update currency." });
    }
  };

  const handleDeleteKyc = async () => {
    if (!confirm("Are you sure you want to delete your data? Your account will be downgraded to Tier 0 and you will lose access to trading features.")) return;
    
    setIsDeletingKyc(true);
    const res = await deleteKyc();
    setIsDeletingKyc(false);

    if (res.success) {
      setNotification({ type: "success", title: "KYC Deleted", message: "Your verification data has been removed." });
      setTimeout(() => {
        setNotification(null);
        onClose();
        router.refresh(); 
      }, 2000);
    } else {
      setNotification({ type: "error", title: "Error", message: res.error || "Failed to delete KYC data." });
    }
  };

  const Toggle = ({ label, desc, state, setState }: { label: string, desc: string, state: boolean, setState: (v: boolean) => void }) => (
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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[95%] max-w-3xl max-h-[90vh] flex flex-col bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-lime-500/20 bg-white/50 dark:bg-[#0a0f0b]/50 backdrop-blur-md shrink-0">
              <div>
                <h2 className="text-2xl font-extrabold text-lime-950 dark:text-white">Configure experience</h2>
                <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium mt-1"></p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-red-500/10 text-lime-800 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thumb-lime-400 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div id="tour-settings-appearance" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
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

                <div id="tour-settings-currency" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lime-950 dark:text-white">Display Currency</h3>
                        <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Primary fiat for balances.</p>
                      </div>
                    </div>
                    
                    <div className="relative mb-4">
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)} 
                        className="w-full appearance-none bg-[#f4fbf5] dark:bg-[#0a0f0b] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3 outline-none focus:border-lime-500 cursor-pointer shadow-sm"
                      >
                        {CURRENCIES.map(c => (
                          <option key={c.code} value={c.code} className="bg-[#f4fbf5] dark:bg-[#0a0f0b] py-2">
                            {c.code} - {c.name} ({c.symbol})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lime-600 dark:text-lime-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveCurrency} 
                    disabled={isSavingCurrency}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-lime-600 hover:bg-lime-700 text-white rounded-xl font-bold text-xs transition-colors shadow-lg shadow-lime-600/20 disabled:opacity-50"
                  >
                    {isSavingCurrency ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {isSavingCurrency ? "Saving..." : "Save Currency"}
                  </button>
                </div>

                <div id="tour-settings-language" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
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

                <div id="tour-settings-trading" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
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

              <div id="tour-settings-notifications" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
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

              <div id="tour-settings-security" className="group p-5 rounded-2xl border border-red-500/20 bg-red-500/5 transition-all">
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

            <div className="p-4 border-t border-lime-500/20 bg-white/80 dark:bg-[#0a0f0b]/80 justify-center items-center shrink-0 backdrop-blur-md flex">
              <button 
                id="tour-settings-save"
                onClick={handleSave} 
                disabled={isSaving}
                className="px-8 py-3 rounded-xl bg-lime-600 text-white font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/20 flex items-center gap-2"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {isSaving ? "Saving..." : "Save All Settings"}
              </button>
            </div>

            <AnimatePresence>
              {notification && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[10000] flex items-center justify-center bg-[#0a0f0b]/80 backdrop-blur-sm rounded-3xl"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }} 
                    animate={{ scale: 1, y: 0 }} 
                    exit={{ scale: 0.9, y: 20 }}
                    className={`bg-[#f4fbf5] dark:bg-[#121A14] p-8 rounded-3xl shadow-2xl border flex flex-col items-center text-center max-w-sm mx-4 ${
                      notification.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'
                    }`}
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                      notification.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {notification.type === 'success' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                    </div>
                    
                    <h3 className="text-xl font-bold text-lime-950 dark:text-white mb-2">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-lime-800/70 dark:text-lime-200/60 mb-6">
                      {notification.message}
                    </p>

                    <button 
                      onClick={() => setNotification(null)}
                      className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
                        notification.type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      Got it
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
// // components/SettingsModal.tsx
// "use client";

// import { useTheme } from "next-themes";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   X, Palette, DollarSign, Globe, Bell, Shield, Monitor, Moon, Sun, 
//   Check, TrendingUp, UserX, Loader2, CheckCircle2, XCircle
// } from "lucide-react";
// import { useEffect, useState } from "react";
// import { createPortal } from "react-dom";
// import { useRouter } from "next/navigation"; // 👈 Imported useRouter
// import { deleteKyc } from "@/app/actions/kyc";
// import { updateUserSettingsAction } from "@/app/actions/user";
// import { useTour } from "@/components/providers/TourProvider";

// const CURRENCIES = [
//   { code: "USD", symbol: "$", name: "US Dollar" },
//   { code: "EUR", symbol: "€", name: "Euro" },
//   { code: "GBP", symbol: "£", name: "British Pound" },
//   { code: "JPY", symbol: "¥", name: "Japanese Yen" },
//   { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
// ];

// const LANGUAGES = [
//   "English (US)", "English (UK)", "Español (ES)", "Français (FR)", "Deutsch (DE)", 
//   "中文 (ZH)", "日本語 (JA)", "한국어 (KO)", "Русский (RU)", "العربية (AR)", 
//   "Português (PT)", "Italiano (IT)", "Türkçe (TR)", "हिन्दी (HI)", "Yoruba (YO)",
//   "Igbo (IG)", "Hausa (HA)", "Swahili (SW)", "Nederlands (NL)", "Polski (PL)"
// ];

// interface SettingsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   initialCurrency?: string;
//   initialLanguage?: string;
// }

// export default function SettingsModal({ 
//   isOpen, 
//   onClose, 
//   initialCurrency = "USD", 
//   initialLanguage = "English (US)" 
// }: SettingsModalProps) {
//   const { theme, setTheme } = useTheme();
//   const [mounted, setMounted] = useState(false);
//   const router = useRouter(); // 👈 Initialized Router
  
//   const [isSaving, setIsSaving] = useState(false);
//   const [isSavingCurrency, setIsSavingCurrency] = useState(false);
//   const [isDeletingKyc, setIsDeletingKyc] = useState(false);

//   const [notification, setNotification] = useState<{ type: "success" | "error", title: string, message: string } | null>(null);

//   const [currency, setCurrency] = useState(initialCurrency);
//   const [language, setLanguage] = useState(initialLanguage);
  
//   const [emailNotifs, setEmailNotifs] = useState(true);
//   const [priceAlerts, setPriceAlerts] = useState(true);
//   const [tradeExec, setTradeExec] = useState(true);
//   const [marginCalls, setMarginCalls] = useState(true);
//   const [newsFeed, setNewsFeed] = useState(false);
  
//   const [oneClickTrade, setOneClickTrade] = useState(false);
//   const [defaultOrderSize, setDefaultOrderSize] = useState("100");

//   const { setSteps } = useTour();

//   useEffect(() => setMounted(true), []);

//   useEffect(() => {
//     if (isOpen) {
//       setSteps([
//         { id: "tour-settings-appearance", title: "Appearance", text: "Switch between Light, Dark, or System theme modes here." },
//         { id: "tour-settings-currency", title: "Display Currency", text: "Choose your preferred fiat currency for balances and charts." },
//         { id: "tour-settings-language", title: "Language", text: "Select your native language for the interface." },
//         { id: "tour-settings-trading", title: "Trading Preferences", text: "Enable one-click trading or set a default order size." },
//         { id: "tour-settings-notifications", title: "Notifications", text: "Manage what alerts and updates you receive." },
//         { id: "tour-settings-security", title: "KYC & Security", text: "Manage your identity verification data here." },
//         { id: "tour-settings-save", title: "Save Settings", text: "Click here to apply all your changes across the entire platform." },
//       ]);
//     } else {
//       setSteps([]);
//     }
//   }, [isOpen, setSteps]);

//   if (!mounted) return null;

//   const getLocaleCode = (lang: string) => {
//     if (lang.includes("ES") || lang.includes("Español")) return "es";
//     if (lang.includes("FR") || lang.includes("Français")) return "fr";
//     if (lang.includes("DE") || lang.includes("Deutsch")) return "de";
//     if (lang.includes("ZH") || lang.includes("中文")) return "zh";
//     if (lang.includes("JA") || lang.includes("日本語")) return "ja";
//     if (lang.includes("KO") || lang.includes("한국어")) return "ko";
//     if (lang.includes("RU") || lang.includes("Русский")) return "ru";
//     if (lang.includes("AR") || lang.includes("العربية")) return "ar";
//     if (lang.includes("PT") || lang.includes("Português")) return "pt";
//     if (lang.includes("IT") || lang.includes("Italiano")) return "it";
//     if (lang.includes("TR") || lang.includes("Türkçe")) return "tr";
//     if (lang.includes("HI") || lang.includes("हिन्दी")) return "hi";
//     if (lang.includes("YO") || lang.includes("Yoruba")) return "yo";
//     if (lang.includes("IG") || lang.includes("Igbo")) return "ig";
//     if (lang.includes("HA") || lang.includes("Hausa")) return "ha";
//     if (lang.includes("SW") || lang.includes("Swahili")) return "sw";
//     if (lang.includes("NL") || lang.includes("Nederlands")) return "nl";
//     if (lang.includes("PL") || lang.includes("Polski")) return "pl";
//     return "en"; 
//   };

//   const handleSave = async () => {
//     setIsSaving(true);
    
//     const localeCode = getLocaleCode(language);
//     document.cookie = `locale=${localeCode}; path=/; max-age=31536000; SameSite=Lax`;

//     const res = await updateUserSettingsAction({ currency, language });
//     setIsSaving(false);

//     if (res.success) {
//       setNotification({ type: "success", title: "Settings Saved", message: "All preferences have been updated successfully." });
//       setTimeout(() => {
//         setNotification(null);
//         onClose();
//         router.refresh(); // 👈 Replaced window.location.reload()
//       }, 2000);
//     } else {
//       setNotification({ type: "error", title: "Save Failed", message: res.error || "Could not update settings." });
//     }
//   };

//   const handleSaveCurrency = async () => {
//     setIsSavingCurrency(true);
//     const res = await updateUserSettingsAction({ currency, language });
//     setIsSavingCurrency(false);

//     if (res.success) {
//       setNotification({ type: "success", title: "Currency Updated", message: "Your display currency has been saved." });
//       setTimeout(() => {
//         setNotification(null);
//         router.refresh(); // 👈 Update dynamically
//       }, 2500);
//     } else {
//       setNotification({ type: "error", title: "Update Failed", message: res.error || "Failed to update currency." });
//     }
//   };

//   const handleDeleteKyc = async () => {
//     if (!confirm("Are you sure you want to delete your data? Your account will be downgraded to Tier 0 and you will lose access to trading features.")) return;
    
//     setIsDeletingKyc(true);
//     const res = await deleteKyc();
//     setIsDeletingKyc(false);

//     if (res.success) {
//       setNotification({ type: "success", title: "KYC Deleted", message: "Your verification data has been removed." });
//       setTimeout(() => {
//         setNotification(null);
//         onClose();
//         router.refresh(); // 👈 Update dynamically
//       }, 2000);
//     } else {
//       setNotification({ type: "error", title: "Error", message: res.error || "Failed to delete KYC data." });
//     }
//   };

//   const Toggle = ({ label, desc, state, setState }: { label: string, desc: string, state: boolean, setState: (v: boolean) => void }) => (
//     <div className="flex items-center justify-between py-2">
//       <div>
//         <h4 className="text-sm font-bold text-lime-950 dark:text-white">{label}</h4>
//         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">{desc}</p>
//       </div>
//       <button 
//         onClick={() => setState(!state)} 
//         className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${state ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-700'}`}
//       >
//         <div className={`w-4 h-4 rounded-full bg-white transition-transform ${state ? 'translate-x-5' : 'translate-x-0'}`}></div>
//       </button>
//     </div>
//   );

//   return createPortal(
//     <AnimatePresence>
//       {isOpen && (
//         <>
//           <motion.div
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             onClick={onClose}
//             className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
//           />

//           <motion.div
//             initial={{ opacity: 0, scale: 0.95, y: 20 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.95, y: 20 }}
//             transition={{ type: "spring", stiffness: 300, damping: 25 }}
//             className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[95%] max-w-3xl max-h-[90vh] flex flex-col bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden"
//           >
//             <div className="flex items-center justify-between p-6 border-b border-lime-500/20 bg-white/50 dark:bg-[#0a0f0b]/50 backdrop-blur-md shrink-0">
//               <div>
//                 <h2 className="text-2xl font-extrabold text-lime-950 dark:text-white">Configure experience</h2>
//                 <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium mt-1"></p>
//               </div>
//               <button onClick={onClose} className="p-2 rounded-full hover:bg-red-500/10 text-lime-800 hover:text-red-500 transition-colors">
//                 <X size={24} />
//               </button>
//             </div>

//             <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thumb-lime-400 custom-scrollbar">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
//                 <div id="tour-settings-appearance" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
//                   <div className="flex items-center gap-3 mb-4">
//                     <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                       <Palette size={20} />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-lime-950 dark:text-white">Appearance</h3>
//                       <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Choose your interface theme.</p>
//                     </div>
//                   </div>
//                   <div className="flex gap-2">
//                     <button onClick={() => setTheme("light")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${theme === "light" ? "bg-lime-500 text-white border-lime-500" : "border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`}>
//                       <Sun size={14} /> Light
//                     </button>
//                     <button onClick={() => setTheme("dark")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${theme === "dark" ? "bg-lime-500 text-white border-lime-500" : "border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`}>
//                       <Moon size={14} /> Dark
//                     </button>
//                     <button onClick={() => setTheme("system")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${theme === "system" ? "bg-lime-500 text-white border-lime-500" : "border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`}>
//                       <Monitor size={14} /> Auto
//                     </button>
//                   </div>
//                 </div>

//                 <div id="tour-settings-currency" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all flex flex-col justify-between">
//                   <div>
//                     <div className="flex items-center gap-3 mb-4">
//                       <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                         <DollarSign size={20} />
//                       </div>
//                       <div>
//                         <h3 className="font-bold text-lime-950 dark:text-white">Display Currency</h3>
//                         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Primary fiat for balances.</p>
//                       </div>
//                     </div>
                    
//                     <div className="relative mb-4">
//                       <select 
//                         value={currency} 
//                         onChange={(e) => setCurrency(e.target.value)} 
//                         className="w-full appearance-none bg-[#f4fbf5] dark:bg-[#0a0f0b] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3 outline-none focus:border-lime-500 cursor-pointer shadow-sm"
//                       >
//                         {CURRENCIES.map(c => (
//                           <option key={c.code} value={c.code} className="bg-[#f4fbf5] dark:bg-[#0a0f0b] py-2">
//                             {c.code} - {c.name} ({c.symbol})
//                           </option>
//                         ))}
//                       </select>
//                       <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lime-600 dark:text-lime-400">
//                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
//                       </div>
//                     </div>
//                   </div>

//                   <button 
//                     onClick={handleSaveCurrency} 
//                     disabled={isSavingCurrency}
//                     className="w-full flex items-center justify-center gap-2 py-2.5 bg-lime-600 hover:bg-lime-700 text-white rounded-xl font-bold text-xs transition-colors shadow-lg shadow-lime-600/20 disabled:opacity-50"
//                   >
//                     {isSavingCurrency ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
//                     {isSavingCurrency ? "Saving..." : "Save Currency"}
//                   </button>
//                 </div>

//                 <div id="tour-settings-language" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
//                   <div className="flex items-center gap-3 mb-4">
//                     <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                       <Globe size={20} />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-lime-950 dark:text-white">Language</h3>
//                       <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Select your native language.</p>
//                     </div>
//                   </div>
//                   <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-white dark:bg-[#0a0f0b] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-lime-500 cursor-pointer">
//                     {LANGUAGES.map(lang => (
//                       <option key={lang} value={lang}>{lang}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div id="tour-settings-trading" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
//                   <div className="flex items-center gap-3 mb-2">
//                     <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                       <TrendingUp size={20} />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-lime-950 dark:text-white">Trading</h3>
//                       <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Execution preferences.</p>
//                     </div>
//                   </div>
//                   <Toggle label="One-Click Trading" desc="Fast execution directly from charts." state={oneClickTrade} setState={setOneClickTrade} />
//                   <div className="flex items-center justify-between py-2">
//                     <div>
//                       <h4 className="text-sm font-bold text-lime-950 dark:text-white">Default Order Size</h4>
//                       <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Base amount for quick buys.</p>
//                     </div>
//                     <input type="number" value={defaultOrderSize} onChange={(e) => setDefaultOrderSize(e.target.value)} className="w-20 bg-white dark:bg-[#0a0f0b] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-lg px-2 py-1 text-right outline-none focus:border-lime-500" />
//                   </div>
//                 </div>
//               </div>

//               <div id="tour-settings-notifications" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
//                 <div className="flex items-center gap-3 mb-2">
//                   <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                     <Bell size={20} />
//                   </div>
//                   <div>
//                     <h3 className="font-bold text-lime-950 dark:text-white">Notifications & Alerts</h3>
//                     <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Manage your alerts.</p>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
//                   <Toggle label="Email Updates" desc="Account & security emails." state={emailNotifs} setState={setEmailNotifs} />
//                   <Toggle label="Trade Execution" desc="When your orders fill." state={tradeExec} setState={setTradeExec} />
//                   <Toggle label="Price Alerts" desc="When assets hit your targets." state={priceAlerts} setState={setPriceAlerts} />
//                   <Toggle label="Margin Calls" desc="Risk management warnings." state={marginCalls} setState={setMarginCalls} />
//                   <Toggle label="Market News" desc="Daily news & analysis feed." state={newsFeed} setState={setNewsFeed} />
//                 </div>
//               </div>

//               <div id="tour-settings-security" className="group p-5 rounded-2xl border border-red-500/20 bg-red-500/5 transition-all">
//                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//                   <div className="flex items-center gap-3">
//                     <div className="p-2 bg-red-500/20 rounded-xl text-red-500">
//                       <Shield size={20} />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-red-500">KYC & Security Data</h3>
//                       <p className="text-xs text-red-500/70">Manage or delete your verification data.</p>
//                     </div>
//                   </div>
//                   <div className="flex gap-2 w-full sm:w-auto">
//                     <button 
//                       onClick={() => { onClose(); window.location.href = "/dashboard/profile"; }}
//                       className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white dark:bg-[#121A14] border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors"
//                     >
//                       View KYC
//                     </button>
//                     <button 
//                       onClick={handleDeleteKyc}
//                       disabled={isDeletingKyc}
//                       className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
//                     >
//                       {isDeletingKyc ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
//                       Delete KYC
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="p-4 border-t border-lime-500/20 bg-white/80 dark:bg-[#0a0f0b]/80 justify-center items-center shrink-0 backdrop-blur-md flex">
//               <button 
//                 id="tour-settings-save"
//                 onClick={handleSave} 
//                 disabled={isSaving}
//                 className="px-8 py-3 rounded-xl bg-lime-600 text-white font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/20 flex items-center gap-2"
//               >
//                 {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
//                 {isSaving ? "Saving..." : "Save All Settings"}
//               </button>
//             </div>

//             <AnimatePresence>
//               {notification && (
//                 <motion.div 
//                   initial={{ opacity: 0 }} 
//                   animate={{ opacity: 1 }} 
//                   exit={{ opacity: 0 }}
//                   className="absolute inset-0 z-[10000] flex items-center justify-center bg-[#0a0f0b]/80 backdrop-blur-sm rounded-3xl"
//                 >
//                   <motion.div 
//                     initial={{ scale: 0.9, y: 20 }} 
//                     animate={{ scale: 1, y: 0 }} 
//                     exit={{ scale: 0.9, y: 20 }}
//                     className={`bg-[#f4fbf5] dark:bg-[#121A14] p-8 rounded-3xl shadow-2xl border flex flex-col items-center text-center max-w-sm mx-4 ${
//                       notification.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'
//                     }`}
//                   >
//                     <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
//                       notification.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
//                     }`}>
//                       {notification.type === 'success' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
//                     </div>
                    
//                     <h3 className="text-xl font-bold text-lime-950 dark:text-white mb-2">
//                       {notification.title}
//                     </h3>
//                     <p className="text-sm text-lime-800/70 dark:text-lime-200/60 mb-6">
//                       {notification.message}
//                     </p>

//                     <button 
//                       onClick={() => setNotification(null)}
//                       className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
//                         notification.type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
//                       }`}
//                     >
//                       Got it
//                     </button>
//                   </motion.div>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>,
//     document.body
//   );
// }





// // components/SettingsModal.tsx
// "use client";

// import { useTheme } from "next-themes";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   X, Palette, DollarSign, Globe, Bell, Shield, Monitor, Moon, Sun, 
//   Check, TrendingUp, UserX, Loader2, CheckCircle2, XCircle
// } from "lucide-react";
// import { useEffect, useState } from "react";
// import { createPortal } from "react-dom";
// import { deleteKyc } from "@/app/actions/kyc";
// import { updateUserSettingsAction } from "@/app/actions/user";
// import { useTour } from "@/components/providers/TourProvider";

// const CURRENCIES = [
//   { code: "USD", symbol: "$", name: "US Dollar" },
//   { code: "EUR", symbol: "€", name: "Euro" },
//   { code: "GBP", symbol: "£", name: "British Pound" },
//   { code: "JPY", symbol: "¥", name: "Japanese Yen" },
//   { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
// ];

// const LANGUAGES = [
//   "English (US)", "English (UK)", "Español (ES)", "Français (FR)", "Deutsch (DE)", 
//   "中文 (ZH)", "日本語 (JA)", "한국어 (KO)", "Русский (RU)", "العربية (AR)", 
//   "Português (PT)", "Italiano (IT)", "Türkçe (TR)", "हिन्दी (HI)", "Yoruba (YO)",
//   "Igbo (IG)", "Hausa (HA)", "Swahili (SW)", "Nederlands (NL)", "Polski (PL)"
// ];

// interface SettingsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   initialCurrency?: string;
//   initialLanguage?: string;
// }

// export default function SettingsModal({ 
//   isOpen, 
//   onClose, 
//   initialCurrency = "USD", 
//   initialLanguage = "English (US)" 
// }: SettingsModalProps) {
//   const { theme, setTheme } = useTheme();
//   const [mounted, setMounted] = useState(false);
  
//   const [isSaving, setIsSaving] = useState(false);
//   const [isSavingCurrency, setIsSavingCurrency] = useState(false);
//   const [isDeletingKyc, setIsDeletingKyc] = useState(false);

//   const [notification, setNotification] = useState<{ type: "success" | "error", title: string, message: string } | null>(null);

//   const [currency, setCurrency] = useState(initialCurrency);
//   const [language, setLanguage] = useState(initialLanguage);
  
//   const [emailNotifs, setEmailNotifs] = useState(true);
//   const [priceAlerts, setPriceAlerts] = useState(true);
//   const [tradeExec, setTradeExec] = useState(true);
//   const [marginCalls, setMarginCalls] = useState(true);
//   const [newsFeed, setNewsFeed] = useState(false);
  
//   const [oneClickTrade, setOneClickTrade] = useState(false);
//   const [defaultOrderSize, setDefaultOrderSize] = useState("100");

//   const { setSteps } = useTour();

//   useEffect(() => setMounted(true), []);

//   useEffect(() => {
//     if (isOpen) {
//       setSteps([
//         { id: "tour-settings-appearance", title: "Appearance", text: "Switch between Light, Dark, or System theme modes here." },
//         { id: "tour-settings-currency", title: "Display Currency", text: "Choose your preferred fiat currency for balances and charts." },
//         { id: "tour-settings-language", title: "Language", text: "Select your native language for the interface." },
//         { id: "tour-settings-trading", title: "Trading Preferences", text: "Enable one-click trading or set a default order size." },
//         { id: "tour-settings-notifications", title: "Notifications", text: "Manage what alerts and updates you receive." },
//         { id: "tour-settings-security", title: "KYC & Security", text: "Manage your identity verification data here." },
//         { id: "tour-settings-save", title: "Save Settings", text: "Click here to apply all your changes across the entire platform." },
//       ]);
//     } else {
//       setSteps([]);
//     }
//   }, [isOpen, setSteps]);

//   if (!mounted) return null;

//   // 👇 Helper to map language string to code
//   const getLocaleCode = (lang: string) => {
//     if (lang.includes("ES") || lang.includes("Español")) return "es";
//     if (lang.includes("FR") || lang.includes("Français")) return "fr";
//     if (lang.includes("DE") || lang.includes("Deutsch")) return "de";
//     if (lang.includes("ZH") || lang.includes("中文")) return "zh";
//     if (lang.includes("JA") || lang.includes("日本語")) return "ja";
//     if (lang.includes("KO") || lang.includes("한국어")) return "ko";
//     if (lang.includes("RU") || lang.includes("Русский")) return "ru";
//     if (lang.includes("AR") || lang.includes("العربية")) return "ar";
//     if (lang.includes("PT") || lang.includes("Português")) return "pt";
//     if (lang.includes("IT") || lang.includes("Italiano")) return "it";
//     if (lang.includes("TR") || lang.includes("Türkçe")) return "tr";
//     if (lang.includes("HI") || lang.includes("हिन्दी")) return "hi";
//     if (lang.includes("YO") || lang.includes("Yoruba")) return "yo";
//     if (lang.includes("IG") || lang.includes("Igbo")) return "ig";
//     if (lang.includes("HA") || lang.includes("Hausa")) return "ha";
//     if (lang.includes("SW") || lang.includes("Swahili")) return "sw";
//     if (lang.includes("NL") || lang.includes("Nederlands")) return "nl";
//     if (lang.includes("PL") || lang.includes("Polski")) return "pl";
//     return "en"; // Default
//   };

//   const handleSave = async () => {
//     setIsSaving(true);
    
//     // 👇 Write the locale cookie so next-intl picks it up
//     const localeCode = getLocaleCode(language);
//     document.cookie = `locale=${localeCode}; path=/; max-age=31536000; SameSite=Lax`;

//     const res = await updateUserSettingsAction({ currency, language });
//     setIsSaving(false);

//     if (res.success) {
//       setNotification({ type: "success", title: "Settings Saved", message: "All preferences have been updated successfully." });
//       setTimeout(() => {
//         setNotification(null);
//         onClose();
//         window.location.reload();
//       }, 2000);
//     } else {
//       setNotification({ type: "error", title: "Save Failed", message: res.error || "Could not update settings." });
//     }
//   };

//   const handleSaveCurrency = async () => {
//     setIsSavingCurrency(true);
//     const res = await updateUserSettingsAction({ currency, language });
//     setIsSavingCurrency(false);

//     if (res.success) {
//       setNotification({ type: "success", title: "Currency Updated", message: "Your display currency has been saved." });
//       setTimeout(() => setNotification(null), 2500);
//     } else {
//       setNotification({ type: "error", title: "Update Failed", message: res.error || "Failed to update currency." });
//     }
//   };

//   const handleDeleteKyc = async () => {
//     if (!confirm("Are you sure you want to delete your data? Your account will be downgraded to Tier 0 and you will lose access to trading features.")) return;
    
//     setIsDeletingKyc(true);
//     const res = await deleteKyc();
//     setIsDeletingKyc(false);

//     if (res.success) {
//       setNotification({ type: "success", title: "KYC Deleted", message: "Your verification data has been removed." });
//       setTimeout(() => {
//         setNotification(null);
//         onClose();
//         window.location.reload();
//       }, 2000);
//     } else {
//       setNotification({ type: "error", title: "Error", message: res.error || "Failed to delete KYC data." });
//     }
//   };

//   const Toggle = ({ label, desc, state, setState }: { label: string, desc: string, state: boolean, setState: (v: boolean) => void }) => (
//     <div className="flex items-center justify-between py-2">
//       <div>
//         <h4 className="text-sm font-bold text-lime-950 dark:text-white">{label}</h4>
//         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">{desc}</p>
//       </div>
//       <button 
//         onClick={() => setState(!state)} 
//         className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${state ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-700'}`}
//       >
//         <div className={`w-4 h-4 rounded-full bg-white transition-transform ${state ? 'translate-x-5' : 'translate-x-0'}`}></div>
//       </button>
//     </div>
//   );

//   return createPortal(
//     <AnimatePresence>
//       {isOpen && (
//         <>
//           <motion.div
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             onClick={onClose}
//             className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
//           />

//           <motion.div
//             initial={{ opacity: 0, scale: 0.95, y: 20 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.95, y: 20 }}
//             transition={{ type: "spring", stiffness: 300, damping: 25 }}
//             className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[95%] max-w-3xl max-h-[90vh] flex flex-col bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden"
//           >
//             <div className="flex items-center justify-between p-6 border-b border-lime-500/20 bg-white/50 dark:bg-[#0a0f0b]/50 backdrop-blur-md shrink-0">
//               <div>
//                 <h2 className="text-2xl font-extrabold text-lime-950 dark:text-white">Configure experience</h2>
//                 <p className="text-sm text-lime-800/60 dark:text-lime-200/50 font-medium mt-1"></p>
//               </div>
//               <button onClick={onClose} className="p-2 rounded-full hover:bg-red-500/10 text-lime-800 hover:text-red-500 transition-colors">
//                 <X size={24} />
//               </button>
//             </div>

//             <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thumb-lime-400 custom-scrollbar">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
//                 <div id="tour-settings-appearance" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
//                   <div className="flex items-center gap-3 mb-4">
//                     <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                       <Palette size={20} />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-lime-950 dark:text-white">Appearance</h3>
//                       <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Choose your interface theme.</p>
//                     </div>
//                   </div>
//                   <div className="flex gap-2">
//                     <button onClick={() => setTheme("light")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${theme === "light" ? "bg-lime-500 text-white border-lime-500" : "border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`}>
//                       <Sun size={14} /> Light
//                     </button>
//                     <button onClick={() => setTheme("dark")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${theme === "dark" ? "bg-lime-500 text-white border-lime-500" : "border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`}>
//                       <Moon size={14} /> Dark
//                     </button>
//                     <button onClick={() => setTheme("system")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${theme === "system" ? "bg-lime-500 text-white border-lime-500" : "border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-lime-500/10"}`}>
//                       <Monitor size={14} /> Auto
//                     </button>
//                   </div>
//                 </div>

//                 <div id="tour-settings-currency" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all flex flex-col justify-between">
//                   <div>
//                     <div className="flex items-center gap-3 mb-4">
//                       <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                         <DollarSign size={20} />
//                       </div>
//                       <div>
//                         <h3 className="font-bold text-lime-950 dark:text-white">Display Currency</h3>
//                         <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Primary fiat for balances.</p>
//                       </div>
//                     </div>
                    
//                     <div className="relative mb-4">
//                       <select 
//                         value={currency} 
//                         onChange={(e) => setCurrency(e.target.value)} 
//                         className="w-full appearance-none bg-[#f4fbf5] dark:bg-[#0a0f0b] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3 outline-none focus:border-lime-500 cursor-pointer shadow-sm"
//                       >
//                         {CURRENCIES.map(c => (
//                           <option key={c.code} value={c.code} className="bg-[#f4fbf5] dark:bg-[#0a0f0b] py-2">
//                             {c.code} - {c.name} ({c.symbol})
//                           </option>
//                         ))}
//                       </select>
//                       <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lime-600 dark:text-lime-400">
//                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
//                       </div>
//                     </div>
//                   </div>

//                   <button 
//                     onClick={handleSaveCurrency} 
//                     disabled={isSavingCurrency}
//                     className="w-full flex items-center justify-center gap-2 py-2.5 bg-lime-600 hover:bg-lime-700 text-white rounded-xl font-bold text-xs transition-colors shadow-lg shadow-lime-600/20 disabled:opacity-50"
//                   >
//                     {isSavingCurrency ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
//                     {isSavingCurrency ? "Saving..." : "Save Currency"}
//                   </button>
//                 </div>

//                 <div id="tour-settings-language" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
//                   <div className="flex items-center gap-3 mb-4">
//                     <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                       <Globe size={20} />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-lime-950 dark:text-white">Language</h3>
//                       <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Select your native language.</p>
//                     </div>
//                   </div>
//                   <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-white dark:bg-[#0a0f0b] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-lime-500 cursor-pointer">
//                     {LANGUAGES.map(lang => (
//                       <option key={lang} value={lang}>{lang}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div id="tour-settings-trading" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
//                   <div className="flex items-center gap-3 mb-2">
//                     <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                       <TrendingUp size={20} />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-lime-950 dark:text-white">Trading</h3>
//                       <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Execution preferences.</p>
//                     </div>
//                   </div>
//                   <Toggle label="One-Click Trading" desc="Fast execution directly from charts." state={oneClickTrade} setState={setOneClickTrade} />
//                   <div className="flex items-center justify-between py-2">
//                     <div>
//                       <h4 className="text-sm font-bold text-lime-950 dark:text-white">Default Order Size</h4>
//                       <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Base amount for quick buys.</p>
//                     </div>
//                     <input type="number" value={defaultOrderSize} onChange={(e) => setDefaultOrderSize(e.target.value)} className="w-20 bg-white dark:bg-[#0a0f0b] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-lg px-2 py-1 text-right outline-none focus:border-lime-500" />
//                   </div>
//                 </div>
//               </div>

//               <div id="tour-settings-notifications" className="group p-5 rounded-2xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 hover:border-lime-500/50 transition-all">
//                 <div className="flex items-center gap-3 mb-2">
//                   <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400 group-hover:scale-110 transition-transform">
//                     <Bell size={20} />
//                   </div>
//                   <div>
//                     <h3 className="font-bold text-lime-950 dark:text-white">Notifications & Alerts</h3>
//                     <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Manage your alerts.</p>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
//                   <Toggle label="Email Updates" desc="Account & security emails." state={emailNotifs} setState={setEmailNotifs} />
//                   <Toggle label="Trade Execution" desc="When your orders fill." state={tradeExec} setState={setTradeExec} />
//                   <Toggle label="Price Alerts" desc="When assets hit your targets." state={priceAlerts} setState={setPriceAlerts} />
//                   <Toggle label="Margin Calls" desc="Risk management warnings." state={marginCalls} setState={setMarginCalls} />
//                   <Toggle label="Market News" desc="Daily news & analysis feed." state={newsFeed} setState={setNewsFeed} />
//                 </div>
//               </div>

//               <div id="tour-settings-security" className="group p-5 rounded-2xl border border-red-500/20 bg-red-500/5 transition-all">
//                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//                   <div className="flex items-center gap-3">
//                     <div className="p-2 bg-red-500/20 rounded-xl text-red-500">
//                       <Shield size={20} />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-red-500">KYC & Security Data</h3>
//                       <p className="text-xs text-red-500/70">Manage or delete your verification data.</p>
//                     </div>
//                   </div>
//                   <div className="flex gap-2 w-full sm:w-auto">
//                     <button 
//                       onClick={() => { onClose(); window.location.href = "/dashboard/profile"; }}
//                       className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white dark:bg-[#121A14] border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors"
//                     >
//                       View KYC
//                     </button>
//                     <button 
//                       onClick={handleDeleteKyc}
//                       disabled={isDeletingKyc}
//                       className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
//                     >
//                       {isDeletingKyc ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
//                       Delete KYC
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="p-4 border-t border-lime-500/20 bg-white/80 dark:bg-[#0a0f0b]/80 justify-center items-center shrink-0 backdrop-blur-md flex">
//               <button 
//                 id="tour-settings-save"
//                 onClick={handleSave} 
//                 disabled={isSaving}
//                 className="px-8 py-3 rounded-xl bg-lime-600 text-white font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/20 flex items-center gap-2"
//               >
//                 {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
//                 {isSaving ? "Saving..." : "Save All Settings"}
//               </button>
//             </div>

//             <AnimatePresence>
//               {notification && (
//                 <motion.div 
//                   initial={{ opacity: 0 }} 
//                   animate={{ opacity: 1 }} 
//                   exit={{ opacity: 0 }}
//                   className="absolute inset-0 z-[10000] flex items-center justify-center bg-[#0a0f0b]/80 backdrop-blur-sm rounded-3xl"
//                 >
//                   <motion.div 
//                     initial={{ scale: 0.9, y: 20 }} 
//                     animate={{ scale: 1, y: 0 }} 
//                     exit={{ scale: 0.9, y: 20 }}
//                     className={`bg-[#f4fbf5] dark:bg-[#121A14] p-8 rounded-3xl shadow-2xl border flex flex-col items-center text-center max-w-sm mx-4 ${
//                       notification.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'
//                     }`}
//                   >
//                     <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
//                       notification.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
//                     }`}>
//                       {notification.type === 'success' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
//                     </div>
                    
//                     <h3 className="text-xl font-bold text-lime-950 dark:text-white mb-2">
//                       {notification.title}
//                     </h3>
//                     <p className="text-sm text-lime-800/70 dark:text-lime-200/60 mb-6">
//                       {notification.message}
//                     </p>

//                     <button 
//                       onClick={() => setNotification(null)}
//                       className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
//                         notification.type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
//                       }`}
//                     >
//                       Got it
//                     </button>
//                   </motion.div>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>,
//     document.body
//   );
// }