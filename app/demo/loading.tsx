// app/demo/loading.tsx
export default function DemoLoading() {
  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden font-sans pb-12 transition-colors duration-300 w-full max-w-[100vw] animate-pulse">
      
      {/* Banner Skeleton */}
      <div className="relative z-50 h-9 bg-lime-600/20 w-full" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6 pb-12 pt-6 px-2 sm:px-6">
        
        {/* Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl h-48 flex flex-col justify-between">
            <div className="flex justify-between items-center w-full gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-lime-500/20"></div>
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-lime-500/20 rounded"></div>
                  <div className="h-5 w-32 bg-lime-500/20 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-32 bg-lime-500/20 rounded"></div>
            </div>
            <div className="flex gap-3 mt-auto">
              <div className="h-12 w-32 bg-lime-500/20 rounded-xl"></div>
              <div className="h-12 w-full bg-lime-500/20 rounded-xl"></div>
            </div>
          </div>
          <div className="bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl h-48 flex flex-col gap-4">
            <div className="h-6 w-32 bg-lime-500/20 rounded"></div>
            <div className="space-y-2">
              <div className="h-10 w-full bg-lime-500/10 rounded-xl"></div>
              <div className="h-10 w-full bg-lime-500/10 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-24 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 border border-lime-500/20 rounded-3xl"></div>
            
            <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 border border-lime-500/20 rounded-3xl overflow-hidden h-64">
              <div className="h-16 border-b border-lime-500/10 bg-white/50 dark:bg-[#121A14]/50 p-4">
                <div className="h-6 w-40 bg-lime-500/20 rounded"></div>
              </div>
              <div className="p-4 space-y-3">
                <div className="h-8 w-full bg-lime-500/10 rounded"></div>
                <div className="h-12 w-full bg-lime-500/10 rounded"></div>
                <div className="h-12 w-full bg-lime-500/10 rounded"></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="h-96 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 border border-lime-500/20 rounded-3xl p-6 flex flex-col gap-4">
              <div className="h-6 w-32 bg-lime-500/20 rounded"></div>
              <div className="h-10 w-full bg-lime-500/10 rounded-xl"></div>
              <div className="h-10 w-full bg-lime-500/10 rounded-xl"></div>
              <div className="h-12 w-full bg-lime-500/20 rounded-xl mt-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}