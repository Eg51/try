// app/dashboard/settings/page.tsx
import { getServerSession } from "@/lib/session";
import { WebAuthnSetup } from "./WebAuthnSetup";
import { CurrencySelector } from "./CurrencySelector";
import { User, Shield, Palette } from "lucide-react";
export const instant = false;
export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your account preferences and security.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-surface-700 bg-surface-900/50 flex items-center gap-2">
            <User size={18} className="text-brand-500" />
            <h2 className="font-semibold text-text-primary">Profile Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Display Name</label>
                <input type="text" disabled value={session.displayName} className="w-full bg-surface-900 border border-surface-700 rounded-lg p-3 text-text-muted opacity-70 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Account Tier</label>
                <input type="text" disabled value={`Tier ${session.tier}`} className="w-full bg-surface-900 border border-surface-700 rounded-lg p-3 text-brand-500 font-bold opacity-70 cursor-not-allowed" />
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-surface-700 bg-surface-900/50 flex items-center gap-2">
            <Shield size={18} className="text-brand-500" />
            <h2 className="font-semibold text-text-primary">Security & Authentication</h2>
          </div>
          <div className="p-6">
            <WebAuthnSetup />
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-surface-700 bg-surface-900/50 flex items-center gap-2">
            <Palette size={18} className="text-brand-500" />
            <h2 className="font-semibold text-text-primary">Display Preferences</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">Display Currency</label>
              <p className="text-xs text-text-muted mb-4">Choose how your portfolio balance is displayed. This does not affect your actual USD holdings.</p>
              <CurrencySelector currentCurrency={session.displayCurrency} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}