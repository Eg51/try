// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 w-full animate-pulse">
      
      {/* TOP ROW: User Card & Favorable Pairs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* User Card Skeleton */}
        <div className="relative flex flex-col justify-between bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl h-full min-h-[200px]">
          <div className="flex justify-between items-center w-full gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-lime-500/20"></div>
              <div className="space-y-2">
                <div className="h-3 w-24 bg-lime-500/20 rounded"></div>
                <div className="h-6 w-32 bg-lime-500/20 rounded"></div>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <div className="h-3 w-20 bg-lime-500/20 rounded ml-auto"></div>
              <div className="h-8 w-32 bg-lime-500/20 rounded ml-auto"></div>
            </div>
          </div>
          <div className="flex gap-3 mt-auto pt-6">
            <div className="h-12 w-full bg-lime-500/20 rounded-xl"></div>
            <div className="h-12 w-full bg-lime-500/20 rounded-xl"></div>
          </div>
        </div>

        {/* Favorable Pairs Skeleton */}
        <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl min-h-[220px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="h-4 w-24 bg-lime-500/20 rounded"></div>
            <div className="h-6 w-16 bg-lime-500/20 rounded"></div>
          </div>
          <div className="flex gap-2 mb-4">
            <div className="h-10 w-24 bg-lime-500/20 rounded-xl"></div>
            <div className="h-10 w-24 bg-lime-500/20 rounded-xl"></div>
          </div>
          <div className="h-20 w-full bg-lime-500/10 rounded-xl mt-4"></div>
        </div>
      </div>

      {/* BOTTOM ROW: Main Content & Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* LEFT COLUMN (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tier Banner */}
          <div className="h-24 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 border border-lime-500/20 rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-lime-500/20"></div>
              <div className="space-y-2">
                <div className="h-5 w-32 bg-lime-500/20 rounded"></div>
                <div className="h-3 w-48 bg-lime-500/10 rounded"></div>
              </div>
            </div>
            <div className="h-2 w-48 bg-lime-500/20 rounded-full hidden sm:block"></div>
          </div>

          {/* Active Positions Table */}
          <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
              <div className="h-6 w-40 bg-lime-500/20 rounded"></div>
              <div className="h-4 w-20 bg-lime-500/20 rounded"></div>
            </div>
            <div className="p-4 space-y-3">
              <div className="h-8 w-full bg-lime-500/10 rounded"></div>
              <div className="h-12 w-full bg-lime-500/10 rounded"></div>
              <div className="h-12 w-full bg-lime-500/10 rounded"></div>
              <div className="h-12 w-full bg-lime-500/10 rounded"></div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
              <div className="h-6 w-40 bg-lime-500/20 rounded"></div>
              <div className="h-4 w-20 bg-lime-500/20 rounded"></div>
            </div>
            <div className="p-4 space-y-3">
              <div className="h-8 w-full bg-lime-500/10 rounded"></div>
              <div className="h-12 w-full bg-lime-500/10 rounded"></div>
              <div className="h-12 w-full bg-lime-500/10 rounded"></div>
            </div>
          </div>

          {/* Asset Allocation & Risk Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="h-40 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 border border-lime-500/20 rounded-3xl p-6"></div>
            <div className="h-40 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 border border-lime-500/20 rounded-3xl p-6"></div>
          </div>
        </div>

        {/* RIGHT COLUMN (Span 1) */}
        <div className="space-y-6">
          {/* Quick Trade Card */}
          <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="h-6 w-32 bg-lime-500/20 rounded"></div>
            <div className="h-10 w-full bg-lime-500/10 rounded-xl"></div>
            <div className="space-y-3">
              <div className="h-12 w-full bg-lime-500/10 rounded-xl"></div>
              <div className="h-12 w-full bg-lime-500/10 rounded-xl"></div>
              <div className="flex gap-2">
                <div className="h-12 w-full bg-lime-500/10 rounded-xl"></div>
                <div className="h-12 w-full bg-lime-500/10 rounded-xl"></div>
              </div>
            </div>
            <div className="h-12 w-full bg-lime-500/20 rounded-xl mt-2"></div>
          </div>

          {/* Market Watch Card */}
          <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl shadow-xl p-4 space-y-4">
            <div className="h-6 w-32 bg-lime-500/20 rounded mb-4"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center p-2">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-lime-500/20"></div>
                  <div className="space-y-1">
                    <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
                    <div className="h-3 w-12 bg-lime-500/10 rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-16 bg-lime-500/20 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}