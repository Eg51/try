// app/dashboard/settings/page.tsx
import { getServerSession } from "@/lib/session";
import { WebAuthnSetup } from "./WebAuthnSetup";
import { User, Shield, Settings2, ChevronRight } from "lucide-react";
import Link from "next/link";
import OpenSettingsButton from "./OpenSettingsButton"; // 👈 New Client Component

export const instant = false;

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 pt-4 sm:pt-8 px-2 sm:px-4">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight">Settings</h1>
        <p className="text-lime-800/70 dark:text-lime-200/50 mt-1 text-sm font-medium">
          Manage your account security and advanced preferences.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* 1. Profile Section (Read-Only Summary) */}
        <section className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-6 border-b border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 flex items-center gap-2">
            <User size={18} className="text-lime-500" />
            <h2 className="font-bold text-lime-950 dark:text-white">Profile Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block uppercase">Display Name</label>
                <div className="w-full bg-[#f4fbf5] dark:bg-[#121A14] border border-lime-500/20 rounded-xl p-3 text-lime-950 dark:text-white font-medium opacity-70 cursor-not-allowed">
                  {session.displayName}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 mb-1 block uppercase">Account Tier</label>
                <div className="w-full bg-[#f4fbf5] dark:bg-[#121A14] border border-lime-500/20 rounded-xl p-3 text-lime-500 font-bold opacity-70 cursor-not-allowed">
                  Tier {session.tier}
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Link href="/dashboard/profile" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline flex items-center gap-1">
                Edit Profile <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* 2. Preferences Section (Opens Global Modal) */}
        <section className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-6 border-b border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 flex items-center gap-2">
            <Settings2 size={18} className="text-lime-500" />
            <h2 className="font-bold text-lime-950 dark:text-white">App Preferences</h2>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-lime-950 dark:text-white">Theme, Currency, Language, & Notifications</h3>
              <p className="text-xs text-lime-800/60 dark:text-lime-200/50 mt-1 max-w-md">
                To change your display currency, select your preferred language, or manage notification alerts, please use the Global Settings panel.
              </p>
            </div>
            <OpenSettingsButton /> {/* 👈 Triggers the Global Modal */}
          </div>
        </section>

        {/* 3. Security Section (Biometrics) */}
        <section className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-6 border-b border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 flex items-center gap-2">
            <Shield size={18} className="text-lime-500" />
            <h2 className="font-bold text-lime-950 dark:text-white">Security & Authentication</h2>
          </div>
          <div className="p-6">
            <WebAuthnSetup />
          </div>
        </section>

      </div>
    </div>
  );
}