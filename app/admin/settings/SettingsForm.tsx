"use client";

import { useState } from "react";
import { updatePlatformSettings } from "@/app/actions/admin-settings";
import { Save, Loader2, ShieldAlert } from "lucide-react";

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [formData, setFormData] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updatePlatformSettings(formData);
    setIsSaving(false);
    if (res.success) alert("Settings updated successfully!");
  };

  const Toggle = ({ label, desc, state, setState }: any) => (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
      <div>
        <h4 className="font-bold text-white">{label}</h4>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <button 
        onClick={() => setState(!state)} 
        className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${state ? 'bg-lime-500' : 'bg-gray-700'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${state ? 'translate-x-6' : 'translate-x-0'}`}></div>
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <Toggle 
          label="Maintenance Mode" 
          desc="Locks the trading terminal and dashboard for all non-admin users." 
          state={formData.maintenanceMode} 
          setState={(v: boolean) => setFormData({ ...formData, maintenanceMode: v })} 
        />
        <Toggle 
          label="Allow Registration" 
          desc="If disabled, new users cannot create accounts." 
          state={formData.allowRegistration} 
          setState={(v: boolean) => setFormData({ ...formData, allowRegistration: v })} 
        />
      </div>

      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
        <label className="block text-sm font-bold text-white mb-2">Platform Fee (%)</label>
        <input 
          type="number" 
          step="0.01" 
          value={formData.platformFeePercent} 
          onChange={(e) => setFormData({ ...formData, platformFeePercent: parseFloat(e.target.value) })}
          className="w-full bg-[#050806] border border-white/20 rounded-lg p-3 text-white focus:border-lime-500 outline-none font-mono" 
        />
      </div>

      <button 
        onClick={handleSave} 
        disabled={isSaving}
        className="flex items-center justify-center gap-2 w-full py-3 bg-lime-600 text-white rounded-xl font-bold hover:bg-lime-700 transition-colors"
      >
        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {isSaving ? "Saving..." : "Save Platform Settings"}
      </button>
    </div>
  );
}