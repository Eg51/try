// app/admin/market-control/MarketControlCard.tsx
"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MarketControlCardProps {
  label: string;
  blockKey: "block1" | "block2" | "block3" | "block4";
  data: { trend: string; intensity: number };
  onChange: (key: string, field: string, value: any) => void;
}

export default function MarketControlCard({ label, blockKey, data, onChange }: MarketControlCardProps) {
  const trends = [
    { id: "bullish", label: "Bullish", icon: <TrendingUp size={16} />, color: "text-green-500" },
    { id: "consolidate", label: "Consolidate", icon: <Minus size={16} />, color: "text-amber-500" },
    { id: "bearish", label: "Bearish", icon: <TrendingDown size={16} />, color: "text-red-500" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl"
    >
      <h3 className="text-lg font-bold text-lime-950 dark:text-white mb-4">{label}</h3>
      
      <div className="space-y-3 mb-6">
        {trends.map((t) => (
          <label 
            key={t.id} 
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
              data.trend === t.id 
                ? "bg-lime-500/10 border-lime-500" 
                : "bg-white/50 dark:bg-[#121A14]/50 border-lime-500/20 hover:border-lime-500/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`${t.color} ${data.trend === t.id ? "opacity-100" : "opacity-50"}`}>
                {t.icon}
              </div>
              <span className={`text-sm font-bold ${data.trend === t.id ? "text-lime-950 dark:text-white" : "text-lime-800/60 dark:text-lime-200/50"}`}>
                {t.label}
              </span>
            </div>
            <input 
              type="radio" 
              name={`trend-${blockKey}`} 
              value={t.id}
              checked={data.trend === t.id}
              onChange={() => onChange(blockKey, "trend", t.id)}
              className="w-4 h-4 accent-lime-600 cursor-pointer"
            />
          </label>
        ))}
      </div>

      {/* Intensity Slider */}
      {data.trend !== "consolidate" && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: "auto" }}
          className="pt-4 border-t border-lime-500/10"
        >
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase">Intensity (1-10)</label>
            <span className="text-sm font-bold font-mono text-lime-600 dark:text-lime-400">{data.intensity}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={data.intensity}
            onChange={(e) => onChange(blockKey, "intensity", Number(e.target.value))}
            className="w-full accent-lime-600"
          />
        </motion.div>
      )}
    </motion.div>
  );
}