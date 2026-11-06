// app/markets/[id]/loading.tsx
export default function AssetViewLoading() {
  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans transition-colors duration-300 flex flex-col items-center justify-center p-1 sm:p-4 animate-pulse">
      
      {/* 👇 MAIN GLASS CONTAINER (Matches AssetView outer shell) */}
      <div className="relative z-10 w-full max-w-[1600px] h-[95vh] rounded-2xl sm:rounded-3xl border border-lime-500/20 dark:border-lime-500/10 bg-[#f4fbf5]/80 dark:bg-[#050806]/80 backdrop-blur-md flex flex-col overflow-hidden">
        
        {/* 👇 TOP BAR (Matches AssetView Top Bar) */}
        <div className="h-12 shrink-0 flex items-center justify-between px-2 sm:px-4 border-b border-lime-500/10 bg-white/50 dark:bg-[#121A14]/60 backdrop-blur-md gap-2">
          
          {/* Left: Open Trade Button */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 sm:w-28 bg-lime-500/20 rounded-lg"></div>
          </div>

          {/* Center: Pair Selector */}
          <div className="flex-1 flex items-center justify-center gap-2 px-4">
            <div className="h-5 w-16 bg-lime-500/20 rounded"></div>
            <div className="h-4 w-4 bg-lime-500/20 rounded-full"></div>
            <div className="h-5 w-12 bg-lime-500/20 rounded"></div>
          </div>

          {/* Right: Settings & Chart Buttons */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-lime-500/20 rounded-lg"></div>
            <div className="h-8 w-20 bg-lime-500/20 rounded-lg"></div>
          </div>
        </div>

        {/* 👇 TRADING TERMINAL SKELETON (Matches inner TradingTerminal) */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          
          {/* Toolbar (Tools & Timeframe) */}
          <div className="flex items-center justify-between gap-2 p-2 bg-white/30 dark:bg-[#121A14]/50 border-b border-lime-500/10">
            <div className="h-8 w-24 bg-lime-500/20 rounded-xl"></div>
            <div className="h-8 w-20 bg-lime-500/20 rounded-full"></div>
          </div>

          {/* Main Chart Area */}
          <div className="flex-1 w-full relative bg-lime-500/5 p-4 flex flex-col justify-end gap-4">
            
            {/* Simulated grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-8 opacity-30">
              <div className="w-full h-px bg-lime-500/20"></div>
              <div className="w-full h-px bg-lime-500/20"></div>
              <div className="w-full h-px bg-lime-500/20"></div>
              <div className="w-full h-px bg-lime-500/20"></div>
            </div>
            
            {/* Simulated candles */}
            <div className="relative z-10 flex items-end justify-around h-full pb-8 gap-1">
              {[40, 60, 30, 80, 50, 70, 90, 45, 65, 55, 75, 35, 85, 60, 40, 70, 90, 50].map((h, i) => (
                <div key={i} className={`w-2 sm:w-4 rounded-sm ${i % 2 === 0 ? 'bg-green-500/40' : 'bg-red-500/40'}`} style={{ height: `${h}%` }}></div>
              ))}
            </div>
            
            {/* Y-axis labels (Right side) */}
            <div className="absolute right-2 top-10 bottom-10 flex flex-col justify-between">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-3 w-12 bg-lime-500/20 rounded"></div>
              ))}
            </div>
          </div>

          {/* Bottom: Trade History Bar */}
          <div className="shrink-0 p-3 bg-white/40 dark:bg-[#121A14]/60 border-t border-lime-500/10">
            <div className="w-full h-12 bg-lime-500/10 border border-lime-500/20 rounded-xl flex items-center justify-between px-4">
              <div className="h-5 w-32 bg-lime-500/20 rounded"></div>
              <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}