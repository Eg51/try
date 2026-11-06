// app/admin/market-control/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getMarketSettings, updateMarketSettings } from "@/app/actions/admin-market";
import MarketControlCard from "./MarketControlCard";
import { Activity, Save, Loader2 } from "lucide-react";

export default function MarketControlPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      const data = await getMarketSettings();
      setSettings(data);
      setIsLoading(false);
    }
    fetchSettings();
  }, []);

  const handleChange = (blockKey: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [blockKey]: {
        ...prev[blockKey],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateMarketSettings(settings);
    setIsSaving(false);
    
    if (res.success) {
      alert("Market settings updated successfully!");
    } else {
      alert(res.error);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="animate-spin text-lime-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity size={24} className="text-lime-500" /> Market God-Mode
          </h1>
          <p className="text-gray-400 text-sm mt-1">Control the macro trend of the candlestick charts across the platform.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="flex items-center gap-2 bg-lime-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-lime-700 transition-colors shadow-lg shadow-lime-600/20"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MarketControlCard 
          label="12:00 AM - 7:00 AM" 
          blockKey="block1" 
          data={settings.block1} 
          onChange={handleChange} 
        />
        <MarketControlCard 
          label="7:01 AM - 12:00 PM" 
          blockKey="block2" 
          data={settings.block2} 
          onChange={handleChange} 
        />
        <MarketControlCard 
          label="12:01 PM - 6:00 PM" 
          blockKey="block3" 
          data={settings.block3} 
          onChange={handleChange} 
        />
        <MarketControlCard 
          label="6:01 PM - 11:59 PM" 
          blockKey="block4" 
          data={settings.block4} 
          onChange={handleChange} 
        />
      </div>
    </div>
  );
}