// app/markets/loading.tsx
export default function MarketsLoading() {
  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans pb-12 transition-colors duration-300">
      {/* Banner Skeleton */}
      <div className="relative z-50 h-10 bg-lime-600/20 w-full flex items-center justify-center">
        <div className="h-4 w-64 bg-lime-500/30 rounded animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 animate-pulse">
        <div className="mb-8 space-y-3">
          <div className="h-10 w-64 bg-lime-500/20 rounded-xl"></div>
          <div className="h-4 w-96 bg-lime-500/10 rounded-lg"></div>
        </div>

        <div className="rounded-3xl bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 overflow-hidden w-full max-w-full">
          {/* Header (Tabs & Search) */}
          <div className="p-4 sm:p-6 border-b border-lime-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-black/40">
            <div className="flex p-1 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 w-full md:w-80 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 h-8 bg-lime-500/20 rounded-full"></div>
              ))}
            </div>
            <div className="h-10 w-full md:w-72 bg-lime-500/20 rounded-full"></div>
          </div>

          {/* Table Headers */}
          <div className="flex items-center justify-between p-4 border-b border-lime-500/10 bg-lime-500/5">
            <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
            <div className="flex gap-4 sm:gap-8">
              <div className="h-4 w-12 bg-lime-500/20 rounded"></div>
              <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
              <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
              <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
              <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
            </div>
          </div>

          {/* Table Rows */}
          <div className="p-2 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-transparent">
                {/* Asset column */}
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-8 h-8 rounded-full bg-lime-500/20 shrink-0"></div>
                  <div className="space-y-2 w-full max-w-[120px]">
                    <div className="h-4 w-12 bg-lime-500/20 rounded"></div>
                    <div className="h-3 w-20 bg-lime-500/10 rounded"></div>
                  </div>
                </div>
                {/* Data columns */}
                <div className="flex gap-4 sm:gap-8 justify-end items-center w-2/3">
                  <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
                  <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
                  <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
                  <div className="h-4 w-16 bg-lime-500/20 rounded"></div>
                  <div className="h-8 w-16 bg-lime-500/20 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}