// app/dashboard/profile/ProfileClient.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, Mail, Shield, ShieldCheck, ShieldAlert, Key, LogOut, 
  Camera, Check, Lock, Globe, CreditCard, ChevronRight
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { useDevModal } from "@/components/providers/DevModalProvider";
import Link from "next/link";

export default function ProfileClient({ session }: { session: any }) {
  const { openModal } = useDevModal();
  const [isUploading, setIsUploading] = useState(false);

  // Helper to color the tier badge
  const getTierBadge = (tier: number) => {
    if (tier >= 3) return { color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', label: 'Tier 3: Institutional', icon: <ShieldAlert size={16} /> };
    if (tier === 2) return { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', label: 'Tier 2: Advanced', icon: <ShieldCheck size={16} /> };
    if (tier === 1) return { color: 'text-lime-500 bg-lime-500/10 border-lime-500/30', label: 'Tier 1: Basic', icon: <Shield size={16} /> };
    return { color: 'text-red-400 bg-red-500/10 border-red-500/30', label: 'Unverified', icon: <Lock size={16} /> };
  };

  const tierInfo = getTierBadge(session.tier || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Page Title */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight">Account Settings</h1>
        <p className="text-lime-800/70 dark:text-lime-200/50 mt-1 text-sm font-medium">
          Manage your personal information, security, and preferences.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Identity Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="md:col-span-1 flex flex-col gap-6"
        >
          {/* Avatar & Basic Info */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-lime-500/20 to-transparent"></div>
            
            <div className="relative w-24 h-24 rounded-full bg-lime-100 dark:bg-[#121A14] border-4 border-white dark:border-[#0a0f0b] flex items-center justify-center text-4xl font-extrabold text-lime-600 shadow-xl mb-4 z-10">
              {session.displayName.charAt(0).toUpperCase()}
              
              <button 
                onClick={() => openModal("Avatar Upload", "Profile picture uploading is coming soon!", "info")}
                className="absolute bottom-0 right-0 p-2 bg-lime-600 text-white rounded-full hover:bg-lime-700 transition-colors shadow-lg"
              >
                <Camera size={16} />
              </button>
            </div>
            
            <h2 className="text-xl font-bold text-lime-950 dark:text-white mb-1">{session.displayName}</h2>
            <p className="text-sm text-lime-800/60 dark:text-lime-200/50 flex items-center gap-1.5 mb-6">
              <Mail size={14} /> {session.email}
            </p>

            <Link href="/dashboard/kyc" className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${tierInfo.color} hover:bg-opacity-80 transition-all cursor-pointer`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {tierInfo.icon} {tierInfo.label}
              </div>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-4 shadow-2xl flex flex-col gap-2">
            <button onClick={() => openModal("Security", "Password management coming soon.", "info")} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-lime-500/10 text-lime-950 dark:text-white font-semibold transition-colors">
              <Key size={18} className="text-lime-500" /> Change Password
            </button>
            <button onClick={() => openModal("Passkeys", "Passkey management coming soon.", "info")} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-lime-500/10 text-lime-950 dark:text-white font-semibold transition-colors">
              <ShieldCheck size={18} className="text-lime-500" /> Manage Passkeys
            </button>
            <form action={logout} className="w-full">
              <button type="submit" className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 text-red-500 font-semibold transition-colors">
                <LogOut size={18} /> Sign Out
              </button>
            </form>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Settings Forms */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="md:col-span-2 space-y-6"
        >
          {/* Personal Details */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-lime-950 dark:text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-lime-500" /> Personal Details
            </h3>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); openModal("Update Profile", "Profile updating coming soon.", "success"); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <input type="text" defaultValue={session.displayName} placeholder=" " className="peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:border-lime-500 transition-colors font-medium" />
                  <label className="absolute left-3 top-2 text-xs text-lime-600 dark:text-lime-400">Display Name</label>
                </div>
                <div className="relative">
                  <input type="email" defaultValue={session.email} disabled className="peer w-full bg-[#f4fbf5]/50 dark:bg-[#0a0f0b]/50 border-2 border-lime-500/10 rounded-xl px-4 pt-6 pb-2 text-lime-800/50 dark:text-white/50 cursor-not-allowed font-medium" />
                  <label className="absolute left-3 top-2 text-xs text-lime-600/50 dark:text-lime-400/50">Email (Locked)</label>
                </div>
              </div>
              <Button type="submit" className="mt-4 bg-lime-600 hover:bg-lime-700 text-white font-bold h-11 px-8 rounded-xl">
                Save Changes
              </Button>
            </form>
          </div>

          {/* Preferences */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-lime-950 dark:text-white mb-6 flex items-center gap-2">
              <Globe size={20} className="text-lime-500" /> Preferences
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-lime-500/20 bg-lime-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-lime-500/20 rounded-lg text-lime-600"><CreditCard size={18} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-lime-950 dark:text-white">Display Currency</h4>
                    <p className="text-xs text-lime-800/50 dark:text-lime-200/40">Used for all balances and charts.</p>
                  </div>
                </div>
                <select className="bg-white dark:bg-[#121A14] border border-lime-500/30 text-lime-950 dark:text-white text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-lime-500">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="NGN">NGN (₦)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-lime-950 dark:text-white mb-6 flex items-center gap-2">
              <Lock size={20} className="text-lime-500" /> Active Sessions
            </h3>
            <div className="flex items-center justify-between p-4 rounded-xl border border-lime-500/20 bg-lime-500/5 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <div>
                  <h4 className="text-sm font-bold text-lime-950 dark:text-white">Current Session</h4>
                  <p className="text-xs text-lime-800/50 dark:text-lime-200/40">Chrome on Windows • Localhost</p>
                </div>
              </div>
              <span className="text-xs font-bold text-green-500">Active</span>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}