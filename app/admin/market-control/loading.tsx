// app/admin/market-control/loading.tsx
export default function MarketControlLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      
      {/* 👇 PAGE HEADER SKELETON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-lime-500/20"></div>
            <div className="h-8 w-56 bg-lime-500/20 rounded-lg"></div>
          </div>
          <div className="h-4 w-72 bg-lime-500/10 rounded"></div>
        </div>
        
        {/* Save Button */}
        <div className="h-11 w-40 bg-lime-500/20 rounded-xl shrink-0 mt-2 sm:mt-0"></div>
      </div>

      {/* 👇 4-CARD GRID SKELETON */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-xl flex flex-col gap-4"
          >
            {/* Card Title (e.g., "12:00 AM - 7:00 AM") */}
            <div className="h-6 w-48 bg-lime-500/20 rounded-lg mb-2"></div>
            
            {/* 3 Radio Options */}
            <div className="space-y-3 mb-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div 
                  key={j} 
                  className="flex items-center justify-between p-3 rounded-xl border border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 h-[52px]"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="w-4 h-4 bg-lime-500/20 rounded-sm"></div>
                    {/* Label */}
                    <div className="h-4 w-24 bg-lime-500/20 rounded"></div>
                  </div>
                  {/* Radio Circle */}
                  <div className="w-4 h-4 rounded-full border-2 border-lime-500/30"></div>
                </div>
              ))}
            </div>

            {/* Intensity Slider (Mocking the expanded state) */}
            <div className="pt-4 border-t border-lime-500/10 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-28 bg-lime-500/10 rounded"></div>
                <div className="h-4 w-6 bg-lime-500/20 rounded"></div>
              </div>
              {/* Slider Track */}
              <div className="h-2 w-full bg-lime-500/10 rounded-full relative">
                {/* Slider Thumb */}
                <div className="absolute top-1/2 -translate-y-1/2 left-1/2 w-4 h-4 rounded-full bg-lime-500/40"></div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}