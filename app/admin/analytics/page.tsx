// app/admin/analytics/page.tsx
import { getSiteAnalytics } from "@/app/actions/admin";
import { PieChart, ArrowUpRight, ArrowDownRight, Users, DollarSign } from "lucide-react";
import { connection } from "next/server";

export const instant = false;

export default async function AdminAnalyticsPage() {
  await connection();
  const { success, chartData } = await getSiteAnalytics();

  if (!success || !chartData) {
    return <div className="text-red-500">Failed to load analytics.</div>;
  }

  const totalUsers = chartData.reduce((acc, curr) => acc + curr.users, 0);
  const totalVolume = chartData.reduce((acc, curr) => acc + curr.volume, 0);
  const maxVolume = Math.max(...chartData.map(d => d.volume), 1); // Prevent divide by zero

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-lime-950 dark:text-white tracking-tight flex items-center gap-2">
          <PieChart size={24} className="text-lime-500" /> Site Analytics
        </h1>
        <p className="text-lime-800/70 dark:text-lime-200/50 text-sm mt-1 font-medium">Track user growth and platform volume over the last 7 days.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl border border-lime-500/20 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-lime-800/70 dark:text-lime-200/50 mb-1">New Users (7d)</p>
            <p className="text-3xl font-extrabold font-mono text-lime-950 dark:text-white">{totalUsers}</p>
          </div>
          <div className="p-4 rounded-2xl bg-lime-500/10 text-lime-500">
            <Users size={28} />
          </div>
        </div>
        
        <div className="p-6 rounded-3xl border border-lime-500/20 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-lime-800/70 dark:text-lime-200/50 mb-1">Volume (7d)</p>
            <p className="text-3xl font-extrabold font-mono text-lime-950 dark:text-white">
              ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-lime-500/10 text-lime-500">
            <DollarSign size={28} />
          </div>
        </div>
      </div>

      {/* CSS Bar Chart */}
      <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-lg font-bold text-lime-950 dark:text-white mb-8">Trading Volume (Last 7 Days)</h2>
        
        <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 relative">
          {/* Y-axis lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="border-b border-lime-500/10 w-full h-0"></div>
            <div className="border-b border-lime-500/10 w-full h-0"></div>
            <div className="border-b border-lime-500/10 w-full h-0"></div>
            <div className="border-b border-lime-500/10 w-full h-0"></div>
          </div>

          {chartData.map((day, i) => {
            const heightPercent = Math.max((day.volume / maxVolume) * 100, 2); // minimum 2% height
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative z-10">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-[#121A14] text-white text-[10px] font-mono py-1.5 px-2.5 rounded-lg border border-lime-500/30 whitespace-nowrap shadow-xl pointer-events-none z-20">
                  ${day.volume.toLocaleString()}
                </div>
                
                {/* Bar */}
                <div 
                  className="w-full max-w-[40px] bg-lime-500/20 group-hover:bg-lime-500/50 border-t-2 border-lime-500 rounded-t-sm transition-all duration-500"
                  style={{ height: `${heightPercent}%` }}
                ></div>
                
                {/* X-axis label */}
                <span className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/40 mt-3">{day.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}